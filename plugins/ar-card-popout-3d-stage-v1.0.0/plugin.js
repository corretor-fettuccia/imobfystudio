(function(){
  'use strict';

  var SELECTOR = '[data-plugin="ar-card-popout-3d-stage"] .arst-root';
  var STRENGTH = { soft:.6, medium:1, strong:1.6 };

  function asBool(value, fallback){
    if(value == null || value === '') return !!fallback;
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  }
  function num(value, fallback){ var n = parseFloat(value); return isFinite(n) ? n : fallback; }

  function mount(root){
    if(!root || root.dataset.arstReady === 'true') return;
    var stage = root.querySelector('.arst-stage');
    var wrap = root.querySelector('.arst-scene-wrap');
    var scene = root.querySelector('.arst-scene');
    var card = root.querySelector('.arst-card');
    var phrases = root.querySelector('.arst-phrases');
    if(!stage || !wrap || !scene || !card) return;
    root.dataset.arstReady = 'true';

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var trigger = root.dataset.trigger || 'both';
    var clickEnabled = trigger !== 'scroll';
    var scrollEnabled = trigger !== 'click';
    var replay = asBool(root.dataset.replay, true);
    var pointerTilt = asBool(root.dataset.pointerTilt, true);
    var pulseMode = root.dataset.pulse || 'waves';
    var strength = STRENGTH[root.dataset.pulseStrength] || 1;
    var autoDelay = Math.max(0, num(root.dataset.autoDelay, 350));
    var animated = Array.prototype.slice.call(root.querySelectorAll('.arst-anim'));

    var hovering = false, visible = true, raf = 0, lastTime = 0, autoTimer = 0;
    var autoDone = false;
    var target = {baseRx:0,baseRy:0,projRx:0,projRy:0,projX:0,projY:0,lightX:50,lightY:28,px:0,py:0};
    var current = Object.assign({}, target);

    function isOpen(){ return root.dataset.state === 'open'; }
    function isWide(){ return stage.offsetHeight > 0 && getComputedStyle(wrap).position === 'absolute'; }

    /* Em telas estreitas o cartão fica centralizado no palco enquanto fechado
       e sobe ao abrir, abrindo espaço para as frases sem deslocar o layout da página. */
    function updateRestShift(){
      var shift = 0;
      if(!isWide() && phrases){ shift = Math.round(phrases.offsetHeight / 2); }
      stage.style.setProperty('--rest-shift', shift + 'px');
    }

    /* Mede o vetor de cada frase até o centro do cartão: é dali que elas saem. */
    function measureOrigins(){
      var c = scene.getBoundingClientRect();
      var cx = c.left + c.width / 2, cy = c.top + c.height * .55;
      animated.forEach(function(el){
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        var hx = r.left + r.width / 2, hy = r.top + r.height / 2;
        el.style.setProperty('--fx', (cx - hx).toFixed(1) + 'px');
        el.style.setProperty('--fy', (cy - hy).toFixed(1) + 'px');
      });
    }

    function setOpen(open, instant){
      open = !!open;
      if(open === isOpen()) return;
      if(instant) root.classList.add('arst-instant');
      measureOrigins();
      void root.offsetWidth;
      root.dataset.state = open ? 'open' : 'closed';
      card.setAttribute('aria-expanded', String(open));
      if(!open){ target.projX = target.projY = target.projRx = target.projRy = 0; }
      if(instant) requestAnimationFrame(function(){ requestAnimationFrame(function(){ root.classList.remove('arst-instant'); }); });
      kick();
    }

    if(clickEnabled){
      card.addEventListener('click', function(){ clearTimeout(autoTimer); autoDone = true; setOpen(!isOpen()); });
      card.addEventListener('keydown', function(event){
        if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); clearTimeout(autoTimer); autoDone = true; setOpen(!isOpen()); }
        if(event.key === 'Escape') setOpen(false);
      });
    } else {
      card.removeAttribute('role');
      card.removeAttribute('tabindex');
      card.style.cursor = 'default';
    }

    function updateFromPointer(clientX, clientY){
      var rect = stage.getBoundingClientRect();
      if(!rect.width || !rect.height) return;
      var s = scene.getBoundingClientRect();
      var x = Math.min(1, Math.max(0, (clientX - s.left) / s.width));
      var y = Math.min(1, Math.max(0, (clientY - s.top) / s.height));
      var nx = Math.min(.5, Math.max(-.5, (clientX - (rect.left + rect.width / 2)) / rect.width));
      var ny = Math.min(.5, Math.max(-.5, (clientY - (rect.top + rect.height / 2)) / rect.height));
      if(isOpen()){
        target.baseRy = nx * 10; target.baseRx = -ny * 5;
        target.projRy = nx * -12; target.projRx = ny * 5; target.projX = nx * 14; target.projY = ny * 6;
      } else {
        target.baseRy = nx * 16; target.baseRx = -ny * 11;
        target.projRy = target.projRx = target.projX = target.projY = 0;
      }
      target.px = nx * 2; target.py = ny * 2;
      target.lightX = x * 100; target.lightY = y * 100;
    }
    function resetPointer(){
      target.baseRx = target.baseRy = target.projRx = target.projRy = target.projX = target.projY = 0;
      target.px = target.py = 0; target.lightX = 50; target.lightY = 28;
    }

    if(pointerTilt && !reduced){
      stage.addEventListener('pointermove', function(event){
        if(event.pointerType === 'touch') return;
        hovering = true; updateFromPointer(event.clientX, event.clientY); kick();
      });
      stage.addEventListener('pointerleave', function(){ hovering = false; resetPointer(); });
    }

    function frame(time){
      raf = 0;
      if(!visible){ lastTime = 0; return; }
      var dt = lastTime ? Math.min(34, time - lastTime) : 16.67;
      lastTime = time;

      /* Sem mouse (toque/ocioso), uma deriva lenta mantém a projeção viva quando aberta. */
      if(!hovering && pointerTilt && !reduced && isOpen()){
        var t = time * .00045;
        target.baseRy = Math.sin(t) * 4; target.baseRx = Math.cos(t * .8) * 1.6;
        target.projRy = Math.sin(t) * -5; target.projX = Math.sin(t) * 5;
        target.px = Math.sin(t) * .6; target.py = Math.cos(t * .9) * .4;
      }

      var k = 1 - Math.exp(-dt / 70);
      for(var key in current){ current[key] += (target[key] - current[key]) * k; }
      var st = scene.style;
      st.setProperty('--base-rx', current.baseRx.toFixed(2) + 'deg');
      st.setProperty('--base-ry', current.baseRy.toFixed(2) + 'deg');
      st.setProperty('--proj-rx', current.projRx.toFixed(2) + 'deg');
      st.setProperty('--proj-ry', current.projRy.toFixed(2) + 'deg');
      st.setProperty('--proj-x', current.projX.toFixed(2) + 'px');
      st.setProperty('--proj-y', current.projY.toFixed(2) + 'px');
      st.setProperty('--light-x', current.lightX.toFixed(1) + '%');
      st.setProperty('--light-y', current.lightY.toFixed(1) + '%');
      stage.style.setProperty('--px', current.px.toFixed(3));
      stage.style.setProperty('--py', current.py.toFixed(3));

      /* Pulso contínuo do cartão fechado: respira como um batimento (duas batidas e pausa). */
      var ps = 1, py = 0, sh = 1;
      if(pulseMode !== 'off' && !reduced && !isOpen()){
        var phase = (time % 1600) / 1600;
        var beat = Math.exp(-Math.pow((phase - .12) / .07, 2)) + .55 * Math.exp(-Math.pow((phase - .34) / .08, 2));
        var breath = (Math.sin(time * .0021) + 1) * .5;
        var amp = strength * (hovering ? 1.35 : 1);
        ps = 1 + (beat * .018 + breath * .006) * amp;
        py = -(beat * 3 + breath * 1.2) * amp;
        sh = 1 + beat * .1 * amp;
      }
      st.setProperty('--pulse-scale', ps.toFixed(4));
      st.setProperty('--pulse-y', py.toFixed(2) + 'px');
      st.setProperty('--pulse-shadow', sh.toFixed(4));

      raf = requestAnimationFrame(frame);
    }
    function kick(){ if(visible && !raf) raf = requestAnimationFrame(frame); }

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        entries.forEach(function(entry){ visible = entry.isIntersecting; if(visible) kick(); });
      }, { rootMargin:'200px' }).observe(root);

      if(scrollEnabled){
        new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(entry.intersectionRatio >= .45){
              if(!autoDone && !isOpen()){
                clearTimeout(autoTimer);
                autoTimer = setTimeout(function(){ autoDone = true; setOpen(true); }, autoDelay);
              }
            } else if(!entry.isIntersecting){
              clearTimeout(autoTimer);
              if(replay){ autoDone = false; setOpen(false, true); }
            } else {
              clearTimeout(autoTimer);
            }
          });
        }, { threshold:[0, .45, .7] }).observe(stage);
      }
    } else if(scrollEnabled){
      setOpen(true, true);
    }

    function relayout(){ updateRestShift(); if(!isOpen()) measureOrigins(); }
    if('ResizeObserver' in window){ new ResizeObserver(relayout).observe(root); }
    else window.addEventListener('resize', relayout);
    relayout();

    if(asBool(root.dataset.openDefault, false)) setOpen(true, true);
    kick();
  }

  function init(){ document.querySelectorAll(SELECTOR).forEach(mount); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  if('MutationObserver' in window){
    new MutationObserver(function(){ init(); }).observe(document.documentElement, { childList:true, subtree:true });
  }
})();

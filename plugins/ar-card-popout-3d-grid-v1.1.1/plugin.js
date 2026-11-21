(function(){
  'use strict';

  function asBool(value, fallback){
    if(value == null || value === '') return !!fallback;
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  }

  function mountUnit(root, unit){
    if(!root || !unit || unit.dataset.arPopoutReady === 'true' || unit.hidden) return;
    const card = unit.querySelector('.ar-card');
    const scene = unit.querySelector('.ar-scene');
    const cta = unit.querySelector('.open-cta');
    if(!card || !scene) return;

    unit.dataset.arPopoutReady = 'true';
    let hovering = false;
    let raf = 0;
    let visible = true;
    const pointerTilt = asBool(root.dataset.pointerTilt, true);
    const pulseOnHover = asBool(root.dataset.pulseHover, true);

    const target = {baseRx:0,baseRy:0,projRx:0,projRy:0,projX:0,projY:0,lightX:50,lightY:28};
    const current = Object.assign({}, target);

    unit.querySelectorAll('.depth-text').forEach(function(el){
      const sync = function(){ el.dataset.text = (el.textContent || '').trim(); };
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(el,{childList:true,characterData:true,subtree:true});
    });

    function isOpen(){ return card.classList.contains('is-open'); }
    function setOpen(open){
      card.classList.toggle('is-open', !!open);
      card.setAttribute('aria-pressed', String(!!open));
      if(!open){ target.projX=0;target.projY=0;target.projRx=0;target.projRy=0; }
    }
    function toggleOpen(){ setOpen(!isOpen()); }

    card.addEventListener('click', function(event){
      if(event.target.closest('.open-cta')) return;
      toggleOpen();
    });
    card.addEventListener('keydown', function(event){
      if(event.key === 'Enter' || event.key === ' '){
        if(event.target.closest('.open-cta')) return;
        event.preventDefault();
        toggleOpen();
      }
      if(event.key === 'Escape') setOpen(false);
    });
    if(cta) cta.addEventListener('click', function(event){ event.stopPropagation(); });

    function updateFromPointer(clientX, clientY){
      if(!pointerTilt) return;
      const rect = scene.getBoundingClientRect();
      if(!rect.width || !rect.height) return;
      const x = Math.min(1,Math.max(0,(clientX-rect.left)/rect.width));
      const y = Math.min(1,Math.max(0,(clientY-rect.top)/rect.height));
      const nx=x-.5, ny=y-.5;
      if(isOpen()){
        target.baseRy=nx*8;target.baseRx=-ny*4.5;target.projRy=nx*-10;target.projRx=ny*4.5;target.projX=nx*12;target.projY=ny*5;
      }else{
        target.baseRy=nx*13;target.baseRx=-ny*9;target.projRy=0;target.projRx=0;target.projX=0;target.projY=0;
      }
      target.lightX=x*100;target.lightY=y*100;
    }

    function resetPointer(){
      target.baseRx=0;target.baseRy=0;target.projRx=0;target.projRy=0;target.projX=0;target.projY=0;target.lightX=50;target.lightY=28;
    }

    scene.addEventListener('pointerenter', function(event){ if(event.pointerType !== 'touch') hovering=true; });
    scene.addEventListener('pointermove', function(event){
      if(event.pointerType === 'touch' && event.buttons === 0) return;
      if(event.pointerType !== 'touch') hovering=true;
      updateFromPointer(event.clientX,event.clientY);
    });
    scene.addEventListener('pointerleave', function(){ hovering=false;resetPointer(); });
    scene.addEventListener('pointerdown', function(event){
      if(event.pointerType === 'touch'){
        if(pointerTilt) scene.setPointerCapture && scene.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX,event.clientY);
      }
    });
    scene.addEventListener('pointerup', function(event){ if(event.pointerType === 'touch') resetPointer(); });

    let lastTime = 0;
    function animate(time){
      raf=0;
      if(!visible){ lastTime=0; return; }
      const dt = lastTime ? Math.min(34, time-lastTime) : 16.67;
      lastTime = time;
      const smoothing = 1 - Math.exp(-dt / 62);
      Object.keys(current).forEach(function(key){ current[key]+=(target[key]-current[key])*smoothing; });
      scene.style.setProperty('--base-rx',current.baseRx.toFixed(2)+'deg');
      scene.style.setProperty('--base-ry',current.baseRy.toFixed(2)+'deg');
      scene.style.setProperty('--proj-rx',current.projRx.toFixed(2)+'deg');
      scene.style.setProperty('--proj-ry',current.projRy.toFixed(2)+'deg');
      scene.style.setProperty('--proj-x',current.projX.toFixed(2)+'px');
      scene.style.setProperty('--proj-y',current.projY.toFixed(2)+'px');
      scene.style.setProperty('--light-x',current.lightX.toFixed(1)+'%');
      scene.style.setProperty('--light-y',current.lightY.toFixed(1)+'%');

      let pulseScale=1,pulseY=0,pulseShadow=1;
      if(pulseOnHover && hovering && !isOpen()){
        const wave=(Math.sin(time*.0045)+1)*.5;
        pulseScale=1.006+wave*.015;pulseY=-(.6+wave*2.2);pulseShadow=1+wave*.08;
      }
      scene.style.setProperty('--pulse-scale',pulseScale.toFixed(4));
      scene.style.setProperty('--pulse-y',pulseY.toFixed(2)+'px');
      scene.style.setProperty('--pulse-shadow',pulseShadow.toFixed(4));
      if(visible) raf=requestAnimationFrame(animate);
    }

    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(function(entries){ entries.forEach(function(entry){
        if(entry.target!==unit) return;
        visible=entry.isIntersecting;
        if(visible && !raf) raf=requestAnimationFrame(animate);
      }); },{rootMargin:'200px'});
      io.observe(unit);
    }

    if(asBool(unit.dataset.openDefault,false)) setOpen(true);
    if(visible && !raf) raf=requestAnimationFrame(animate);
  }

  function mountRoot(root){
    if(!root) return;
    root.querySelectorAll('.ar-popout-unit').forEach(function(unit){ mountUnit(root,unit); });
  }

  function init(){ document.querySelectorAll('[data-plugin="ar-card-popout-3d"] .ar-popout-root').forEach(mountRoot); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

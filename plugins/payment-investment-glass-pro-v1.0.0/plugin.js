(function(){
  'use strict';

  function ensureFontAwesome(){
    if(document.querySelector('link[data-pit-fontawesome]') || document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="fontawesome"]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    link.setAttribute('data-pit-fontawesome','true');
    document.head.appendChild(link);
  }

  function initGlass(button){
    if(!button || button.dataset.pitGlassReady==='1') return;
    button.dataset.pitGlassReady='1';
    var cursorLight=button.querySelector('.glassButton__cursor-light');
    if(!cursorLight){
      cursorLight=document.createElement('div');
      cursorLight.className='glassButton__cursor-light';
      button.appendChild(cursorLight);
    }
    button.addEventListener('mousemove',function(e){
      var rect=button.getBoundingClientRect();
      var x=e.clientX-rect.left, y=e.clientY-rect.top;
      button.style.setProperty('--mouse-x',((x/Math.max(rect.width,1))*100)+'%');
      button.style.setProperty('--mouse-y',((y/Math.max(rect.height,1))*100)+'%');
      cursorLight.style.left=x+'px'; cursorLight.style.top=y+'px';
    });
    button.addEventListener('mouseenter',function(){cursorLight.style.opacity='1'});
    button.addEventListener('mouseleave',function(){
      button.style.setProperty('--mouse-x','50%');button.style.setProperty('--mouse-y','50%');cursorLight.style.opacity='0';
    });
  }

  function init(root){
    if(!root || root.dataset.pitReady==='1') return;
    root.dataset.pitReady='1';
    ensureFontAwesome();
    var button=root.querySelector('.pit-glass-cta');
    if(button){
      if(button.dataset.newTab==='true'){button.target='_blank';button.rel='noopener noreferrer'}
      initGlass(button);
    }
    var animated=[].slice.call(root.querySelectorAll('.pit-animate'));
    var wants=root.querySelector('.pit-section') && root.querySelector('.pit-section').dataset.animate==='true';
    if(!wants || !('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      animated.forEach(function(el){el.classList.add('pit-visible')});
      return;
    }
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('pit-visible');observer.unobserve(entry.target)}});
    },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    animated.forEach(function(el){observer.observe(el)});
  }

  function scan(){document.querySelectorAll('[data-plugin="payment-investment-glass-pro"]').forEach(init)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scan); else scan();
  var mo=new MutationObserver(scan); mo.observe(document.documentElement,{childList:true,subtree:true});
})();

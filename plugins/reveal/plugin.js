/* Imobify 6.0.4 — gatilho único de visibilidade para todos os efeitos. */
(function(){
  'use strict';
  var SELECTOR='[data-section-transition]';
  var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var items=new Set(), scheduled=false, observer=null;
  function thresholdOf(el){
    var raw=el.getAttribute('data-motion-threshold');
    if(raw===null||raw==='')return .20;
    var value=Number(raw);
    return Number.isFinite(value)?Math.max(0,Math.min(1,value)):.20;
  }
  function excluded(el){return el.matches('[data-plugin="parallax"], [data-plugin="scrollytelling-video-pro"]')||el.getAttribute('data-section-transition')==='none';}
  function clamp(value){return Math.min(1,Math.max(0,value));}
  function measure(el){
    var r=el.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||0;
    var vw=window.innerWidth||document.documentElement.clientWidth||0;
    var w=Math.max(0,Math.min(r.right,vw)-Math.max(0,r.left));
    var h=Math.max(0,Math.min(r.bottom,vh)-Math.max(0,r.top));
    var area=Math.max(1,r.width*r.height);
    return {ratio:clamp(w*h/area),visible:w>0&&h>0,rect:r,vh:vh};
  }
  function update(){
    scheduled=false;
    items.forEach(function(el){
      if(!el.isConnected){items.delete(el);return;}
      if(reduced||excluded(el)){el.classList.add('is-visible');return;}
      var m=measure(el), threshold=thresholdOf(el);
      var reached=m.visible&&(threshold===0||m.ratio+0.000001>=threshold);
      var started=el.dataset.motionTriggered==='true';
      var replay=el.dataset.motionReplay==='true';
      var type=el.getAttribute('data-section-transition');
      if(!reached){
        if(replay||!started){el.classList.remove('is-visible');}
        if(replay){el.dataset.motionTriggered='false';}
        if(type==='curtain-reveal'&&!started)el.style.setProperty('--imobify-curtain-side','50%');
        return;
      }
      if(!started){el.dataset.motionTriggered='true';el.classList.add('is-visible');el.dispatchEvent(new CustomEvent('imobify:section-visible',{bubbles:false}));}
      if(type==='curtain-reveal'){
        // Curtain begins only once the configured section visibility is reached.
        // Its completion is driven by additional travel through the viewport.
        var available=Math.max(1,m.vh*(1-threshold));
        var travel=Math.max(0,m.vh-m.rect.top-threshold*m.rect.height);
        var progress=clamp(travel/available);
        el.style.setProperty('--imobify-curtain-side',(50*(1-progress)).toFixed(3)+'%');
      }
    });
  }
  function schedule(){if(scheduled)return;scheduled=true;if(window.requestAnimationFrame)window.requestAnimationFrame(update);else update();}
  function register(root){
    if(root.matches&&root.matches(SELECTOR))items.add(root);
    if(root.querySelectorAll)root.querySelectorAll(SELECTOR).forEach(function(el){items.add(el);});
    schedule();
  }
  function init(){
    if(document.documentElement.dataset.imobifyMotionInit)return;
    document.documentElement.dataset.imobifyMotionInit='1';
    // Initial state is installed before the first visibility calculation.
    document.documentElement.classList.add('imobify-motion-ready');
    register(document);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('load',schedule);
    if('ResizeObserver' in window){observer=new ResizeObserver(schedule);items.forEach(function(el){observer.observe(el);});}
    if('MutationObserver' in window){
      new MutationObserver(function(changes){
        changes.forEach(function(change){
          change.addedNodes.forEach(function(node){if(node.nodeType!==1)return;register(node);if(observer){if(node.matches&&node.matches(SELECTOR))observer.observe(node);if(node.querySelectorAll)node.querySelectorAll(SELECTOR).forEach(function(el){observer.observe(el);});}});
          if(change.type==='attributes'){if(change.target.matches&&change.target.matches(SELECTOR))items.add(change.target);schedule();}
        });
      }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion-threshold','data-motion-replay','data-section-transition']});
    }
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

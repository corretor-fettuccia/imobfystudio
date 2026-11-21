(function(){
  "use strict";
  function init(scope=document){
    scope.querySelectorAll('[data-plugin="only-text-context"] .otc-root').forEach((root)=>{
      if(root.dataset.otcReady==='true')return;
      root.dataset.otcReady='true';
      const motion=(root.dataset.motion||'none').trim();
      if(motion==='none'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){root.classList.add('is-visible');return;}
      root.classList.add('otc-motion-ready');
      if(!('IntersectionObserver' in window)){root.classList.add('is-visible');return;}
      const io=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){root.classList.add('is-visible');io.disconnect();}});},{threshold:.18,rootMargin:'0px 0px -8% 0px'});
      io.observe(root);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});else init();
})();

(function(){
  "use strict";
  const SELECTOR='[data-plugin="magazine-text-pro"] .mtp-root';
  function init(scope=document){scope.querySelectorAll(SELECTOR).forEach((root)=>{
    if(root.dataset.mtpReady==='true')return;root.dataset.mtpReady='true';
    const img=root.querySelector('.mtp-image');if(img){const sync=()=>root.classList.toggle('mtp-image-unavailable',!img.currentSrc&&!img.getAttribute('src'));img.addEventListener('error',()=>root.classList.add('mtp-image-error'),{once:true});img.addEventListener('load',()=>root.classList.remove('mtp-image-error'));sync();}
    const motion=(root.dataset.motion||'none').trim();if(motion==='none'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){root.classList.add('is-visible');return;}
    root.classList.add('mtp-motion-ready');if(!('IntersectionObserver'in window)){root.classList.add('is-visible');return;}
    const io=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){root.classList.add('is-visible');io.disconnect();}});},{threshold:.16,rootMargin:'0px 0px -8% 0px'});io.observe(root);
  });}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});else init();
})();

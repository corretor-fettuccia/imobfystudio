(function(){
  'use strict';
  function installFallback(image){
    if(image.dataset.footerIconFallback==='true')return;
    image.dataset.footerIconFallback='true';
    image.addEventListener('error',()=>{
      const fallback=document.createElement('i');
      fallback.className='fa-solid fa-link';
      fallback.setAttribute('aria-hidden','true');
      image.replaceWith(fallback);
    },{once:true});
  }
  function init(scope=document){
    scope.querySelectorAll('[data-plugin="footer"] .footer-social-icon img').forEach(installFallback);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});
  else init();
})();

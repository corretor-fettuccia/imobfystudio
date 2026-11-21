(function(){'use strict';
function init(){document.querySelectorAll('[data-plugin="editorial-motion"] .edm').forEach(function(root){
 if(root.dataset.edmReady==='1')return;root.dataset.edmReady='1';
 root.querySelectorAll('[data-step]').forEach(function(item){item.style.setProperty('--edm-step',String(Number(item.dataset.step)||0));});
 var show=function(){root.classList.add('edm-visible');};
 if(root.dataset.motion==='none'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){show();return;}
 if(!('IntersectionObserver' in window)){show();return;}
 var threshold=Math.max(.05,Math.min(.7,(Number(root.dataset.threshold)||20)/100));
 var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){show();observer.disconnect();}});},{threshold:threshold});
 root.classList.add('edm-motion-ready');observer.observe(root);
 });}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 var mo=new MutationObserver(function(){init();});mo.observe(document.documentElement,{childList:true,subtree:true});
})();

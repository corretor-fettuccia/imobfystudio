(function(){
  document.querySelectorAll('[data-plugin="button-single"] .ibs-button').forEach(function(button){
    if(button.getAttribute('target')==='_blank') button.setAttribute('rel','noopener noreferrer');
    if(!button.textContent.trim()) button.setAttribute('aria-disabled','true');
  });
})();

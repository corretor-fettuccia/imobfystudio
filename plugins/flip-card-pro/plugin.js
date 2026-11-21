(function(){
  function init(){
    document.querySelectorAll('[data-plugin="flip-card-pro"] .pp-flip-card:not([data-ready])').forEach(function(card){
      card.dataset.ready='true';
      function toggle(event){if(event&&event.target.closest('.pp-flip-cta'))return;card.classList.toggle('is-flipped');card.setAttribute('aria-pressed',String(card.classList.contains('is-flipped')));}
      card.addEventListener('click',toggle);
      card.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(event);}});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

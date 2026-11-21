(function(){
  function init(){
    document.querySelectorAll('[data-plugin="gallery-big-four"]:not([data-ready])').forEach(function(root){
      root.dataset.ready='true';
      var items=root.querySelectorAll('.pp-big-four-item');
      items.forEach(function(item,index){
        item.setAttribute('role','button');
        item.setAttribute('aria-label',item.querySelector('strong')?.textContent||('Imagem '+(index+1)));
        function activate(){items.forEach(function(other){if(other!==item)other.classList.remove('is-active')});item.classList.toggle('is-active');}
        item.addEventListener('click',activate);
        item.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

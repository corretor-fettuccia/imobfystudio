(function(){
  document.querySelectorAll('[data-plugin="image-single"] .iis-image').forEach(function(image){
    image.addEventListener('error',function(){image.closest('.iis-figure')?.classList.add('is-image-error');},{once:true});
  });
})();

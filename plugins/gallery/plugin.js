(function(){document.querySelectorAll('[data-plugin="gallery"] img').forEach(image=>image.addEventListener('error',()=>image.closest('figure').classList.add('image-missing')));})();

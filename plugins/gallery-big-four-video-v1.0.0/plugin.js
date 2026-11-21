(function(){
  function safePlay(video){
    if(!video) return;
    var promise=video.play();
    if(promise&&typeof promise.catch==='function') promise.catch(function(){});
  }

  function resetHoverVideo(media){
    if(!media||media.dataset.videoBehavior!=='hover') return;
    var video=media.querySelector('video');
    if(!video) return;
    video.pause();
    try{video.currentTime=0;}catch(_e){}
  }

  function setupBoomerang(media,video){
    var raf=0;
    var reverse=false;
    var last=0;
    var running=true;

    function cancelReverse(){
      if(raf) cancelAnimationFrame(raf);
      raf=0;
      last=0;
    }

    function reverseFrame(now){
      if(!running||!reverse) return;
      if(!last) last=now;
      var delta=Math.min((now-last)/1000,.08);
      last=now;
      var next=Math.max(0,(video.currentTime||0)-delta);
      try{video.currentTime=next;}catch(_e){}
      if(next<=.02){
        reverse=false;
        cancelReverse();
        try{video.currentTime=0;}catch(_e){}
        safePlay(video);
        return;
      }
      raf=requestAnimationFrame(reverseFrame);
    }

    function startReverse(){
      if(!running) return;
      video.pause();
      reverse=true;
      cancelReverse();
      raf=requestAnimationFrame(reverseFrame);
    }

    video.loop=false;
    video.addEventListener('ended',startReverse);
    video.addEventListener('loadeddata',function(){
      media.classList.add('is-video-ready');
      if(!reverse) safePlay(video);
    });

    media._ppStop=function(){
      running=false;
      reverse=false;
      cancelReverse();
      video.pause();
    };
    media._ppResume=function(){
      running=true;
      if(reverse) raf=requestAnimationFrame(reverseFrame); else safePlay(video);
    };
  }

  function setupVideo(media,item){
    if(!media||media.dataset.mediaType!=='video') return;
    var video=media.querySelector('video');
    if(!video) return;
    var source=(video.dataset.src||'').trim();
    if(!source) return;

    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.src=source;

    video.addEventListener('loadeddata',function(){media.classList.add('is-video-ready');},{once:true});
    video.addEventListener('error',function(){media.classList.remove('is-video-ready');});

    var behavior=media.dataset.videoBehavior||'hover';
    if(behavior==='autoplay-loop'){
      video.loop=true;
      video.autoplay=true;
      video.addEventListener('canplay',function(){safePlay(video);},{once:true});
      safePlay(video);
    }else if(behavior==='autoplay-boomerang'){
      video.autoplay=true;
      setupBoomerang(media,video);
      safePlay(video);
    }else{
      video.loop=false;
      item.addEventListener('mouseenter',function(){
        try{video.currentTime=0;}catch(_e){}
        safePlay(video);
      });
      item.addEventListener('mouseleave',function(){resetHoverVideo(media);});
      item.addEventListener('focusin',function(){safePlay(video);});
      item.addEventListener('focusout',function(){if(!item.classList.contains('is-active'))resetHoverVideo(media);});
    }
  }

  function init(){
    document.querySelectorAll('[data-plugin="gallery-big-four-video"]:not([data-ready])').forEach(function(root){
      root.dataset.ready='true';
      var items=Array.prototype.slice.call(root.querySelectorAll('.pp-big-four-item'));

      items.forEach(function(item,index){
        var media=item.querySelector('.pp-big-four-media');
        item.setAttribute('role','button');
        item.setAttribute('aria-label',item.querySelector('strong')?.textContent||('Mídia '+(index+1)));
        setupVideo(media,item);

        function syncHoverVideos(){
          items.forEach(function(other){
            var otherMedia=other.querySelector('.pp-big-four-media');
            if(!otherMedia||otherMedia.dataset.videoBehavior!=='hover'||otherMedia.dataset.mediaType!=='video') return;
            var otherVideo=otherMedia.querySelector('video');
            if(!otherVideo) return;
            if(other.classList.contains('is-active')){
              try{otherVideo.currentTime=0;}catch(_e){}
              safePlay(otherVideo);
            }else{
              resetHoverVideo(otherMedia);
            }
          });
        }

        function activate(){
          var willActivate=!item.classList.contains('is-active');
          items.forEach(function(other){if(other!==item)other.classList.remove('is-active');});
          item.classList.toggle('is-active',willActivate);
          syncHoverVideos();
        }

        item.addEventListener('click',activate);
        item.addEventListener('keydown',function(event){
          if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}
        });
      });

      if('IntersectionObserver' in window){
        var observer=new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            root.querySelectorAll('.pp-big-four-media[data-media-type="video"]').forEach(function(media){
              var behavior=media.dataset.videoBehavior||'hover';
              if(behavior==='hover') return;
              var video=media.querySelector('video');
              if(!video) return;
              if(entry.isIntersecting){
                if(media._ppResume) media._ppResume(); else safePlay(video);
              }else{
                if(media._ppStop) media._ppStop(); else video.pause();
              }
            });
          });
        },{threshold:.08});
        observer.observe(root);
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

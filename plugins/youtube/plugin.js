(function(){
  "use strict";
  const ROOT_SELECTOR='[data-plugin="youtube"] .ytp-root';
  const OBSERVED_ATTRIBUTES=[
    'data-video-id','data-autoplay','data-controls','data-muted','data-loop','data-start','data-end',
    'data-fullscreen','data-keyboard-controls','data-plays-inline','data-captions','data-captions-language',
    'data-interface-language','data-related-videos','data-privacy-enhanced','data-lazy-load'
  ];
  const truthy=(value)=>value===true||value==='true'||value===1||value==='1';
  const seconds=(value)=>Math.max(0,Math.floor(Number(value)||0));

  function normalizeVideoId(value){
    const raw=String(value||'').trim();
    if(/^[A-Za-z0-9_-]{11}$/.test(raw))return raw;

    // Também aceita o conteúdo de src/href ou um iframe copiado do YouTube.
    const embedded=raw.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    if(embedded)return embedded[1];
    const watch=raw.match(/(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch[^\s"']*[?&]v=([A-Za-z0-9_-]{11})(?:[&#\"'\s]|$)/i);
    if(watch)return watch[1];

    let candidate=raw;
    if(/^www\./i.test(candidate))candidate=`https://${candidate}`;
    try{
      const url=new URL(candidate);
      const host=url.hostname.toLowerCase().replace(/^www\./,'');
      const isShort=host==='youtu.be';
      const isYouTube=host==='youtube.com'||host.endsWith('.youtube.com')||host==='youtube-nocookie.com'||host.endsWith('.youtube-nocookie.com');
      if(!isShort&&!isYouTube)return '';
      let id=isShort?url.pathname.split('/').filter(Boolean)[0]:url.searchParams.get('v');
      if(!id&&isYouTube){
        const parts=url.pathname.split('/').filter(Boolean);
        if(['embed','shorts','live','v'].includes(parts[0]))id=parts[1];
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';
    }catch(_){
      return '';
    }
  }

  function sync(root){
    const frame=root.querySelector('.ytp-frame');
    if(!frame)return;
    const id=normalizeVideoId(root.dataset.videoId);
    if(!id){
      root.dataset.playerState='invalid';
      frame.removeAttribute('src');
      return;
    }

    const autoplay=truthy(root.dataset.autoplay);
    const controls=truthy(root.dataset.controls);
    const muted=truthy(root.dataset.muted);
    const loop=truthy(root.dataset.loop);
    const fullscreen=truthy(root.dataset.fullscreen);
    const params=new URLSearchParams();
    if(!String(frame.getAttribute('title')||'').trim())frame.setAttribute('title','Vídeo incorporado do YouTube');
    params.set('autoplay',autoplay?'1':'0');
    params.set('controls',controls?'1':'0');
    params.set('playsinline',truthy(root.dataset.playsInline)?'1':'0');
    params.set('disablekb',truthy(root.dataset.keyboardControls)?'0':'1');
    params.set('fs',fullscreen?'1':'0');
    params.set('rel',truthy(root.dataset.relatedVideos)?'1':'0');
    params.set('hl',root.dataset.interfaceLanguage||'pt-BR');
    if(muted)params.set('mute','1');
    if(loop){
      params.set('loop','1');
      params.set('playlist',id);
    }
    const start=seconds(root.dataset.start);
    const end=seconds(root.dataset.end);
    if(start)params.set('start',String(start));
    if(end&&end>start)params.set('end',String(end));
    if(truthy(root.dataset.captions)){
      params.set('cc_load_policy','1');
      params.set('cc_lang_pref',root.dataset.captionsLanguage||'pt');
    }

    const host=truthy(root.dataset.privacyEnhanced)?'www.youtube-nocookie.com':'www.youtube.com';
    const source=`https://${host}/embed/${id}?${params.toString()}`;
    if(frame.getAttribute('src')!==source)frame.setAttribute('src',source);
    frame.setAttribute('loading',autoplay||!truthy(root.dataset.lazyLoad)?'eager':'lazy');
    const permissions=['accelerometer','autoplay','clipboard-write','encrypted-media','gyroscope','picture-in-picture','web-share'];
    if(fullscreen){
      permissions.push('fullscreen');
      frame.setAttribute('allowfullscreen','');
    }else frame.removeAttribute('allowfullscreen');
    frame.setAttribute('allow',permissions.join('; '));
    root.dataset.playerState='ready';
  }

  function init(scope=document){
    if(typeof Element!=='undefined'&&scope instanceof Element&&scope.matches?.(ROOT_SELECTOR))sync(scope);
    scope.querySelectorAll?.(ROOT_SELECTOR).forEach(sync);
  }

  function rootFromMutationTarget(target){
    if(typeof Element==='undefined'||!(target instanceof Element))return null;
    if(target.matches?.(ROOT_SELECTOR))return target;
    return target.closest?.(ROOT_SELECTOR)||null;
  }

  const observer=typeof MutationObserver!=='undefined'?new MutationObserver((mutations)=>{
    const roots=new Set();
    mutations.forEach((mutation)=>{
      const direct=rootFromMutationTarget(mutation.target);
      if(direct)roots.add(direct);
      mutation.addedNodes?.forEach((node)=>{
        if(!(node instanceof Element))return;
        if(node.matches?.(ROOT_SELECTOR))roots.add(node);
        node.querySelectorAll?.(ROOT_SELECTOR).forEach((root)=>roots.add(root));
      });
    });
    roots.forEach(sync);
  }):null;

  function start(){
    init();
    if(observer&&document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:OBSERVED_ATTRIBUTES});
  }

  if(typeof window!=='undefined')window.ImobifyYouTube={normalizeVideoId,sync,refresh:init};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

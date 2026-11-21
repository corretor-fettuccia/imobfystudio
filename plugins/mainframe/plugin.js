(function(){
  'use strict';
  const ROOT='[data-plugin="mainframe"] .mf-root';
  const attrs=['data-mf-mode','data-mf-url','data-mf-html','data-mf-lazy','data-mf-fullscreen','data-mf-autoplay','data-mf-clipboard','data-mf-html-scripts'];
  const yes=(value)=>value==='true';
  function safeURL(raw){
    try{
      const value=String(raw||'').trim();
      if(!/^https?:\/\//i.test(value))return '';
      const url=new URL(value);
      if(!['https:','http:'].includes(url.protocol)||!url.hostname)return '';
      return url.href;
    }catch(_){return '';}
  }
  function sync(root){
    const frame=root.querySelector('.mf-frame');if(!frame)return;
    const html=root.dataset.mfMode==='html';
    const address=safeURL(root.dataset.mfUrl);
    const content=root.dataset.mfHtml||'';
    const valid=html?!!content.trim():!!address;
    root.dataset.mfState=valid?'ready':'invalid';
    // 1.0.2 — A orientação técnica existe só no editor. Na página publicada,
    // um MainFrame sem conteúdo válido é ocultado (sem texto para o visitante).
    const editor=window.__IMOBIFY_EDITOR__===true;
    const section=root.closest('[data-plugin="mainframe"]')||root;
    const notice=root.querySelector('.mf-notice');
    if(notice){
      notice.textContent=(!valid&&editor)?'MainFrame sem conteúdo: informe uma URL HTTPS válida ou o HTML no inspetor. Na página publicada esta seção fica oculta.':'';
      notice.hidden=valid||!editor;
    }
    if(!editor){if(valid)section.removeAttribute('hidden');else section.setAttribute('hidden','');}
    if(!valid){frame.removeAttribute('src');frame.removeAttribute('srcdoc');return;}
    frame.setAttribute('loading',yes(root.dataset.mfLazy)?'lazy':'eager');
    frame.setAttribute('referrerpolicy','origin');
    const permissions=[];
    if(yes(root.dataset.mfFullscreen)){permissions.push('fullscreen *');frame.setAttribute('allowfullscreen','');}
    else frame.removeAttribute('allowfullscreen');
    permissions.push('geolocation *','accelerometer *','gyroscope *','magnetometer *','xr-spatial-tracking *','web-share *');
    if(yes(root.dataset.mfAutoplay))permissions.push('autoplay *');
    if(yes(root.dataset.mfClipboard))permissions.push('clipboard-read','clipboard-write');
    if(permissions.length)frame.setAttribute('allow',permissions.join('; '));else frame.removeAttribute('allow');
    if(html){
      // srcdoc is sandboxed with an opaque origin; no same-origin access to the parent.
      frame.setAttribute('sandbox',yes(root.dataset.mfHtmlScripts)?'allow-scripts':'');
      frame.removeAttribute('src');
      if(frame.getAttribute('srcdoc')!==content)frame.setAttribute('srcdoc',content);
    }else{
      frame.removeAttribute('sandbox');
      frame.removeAttribute('srcdoc');
      if(frame.getAttribute('src')!==address)frame.setAttribute('src',address);
    }
  }
  function start(){
    document.querySelectorAll(ROOT).forEach(sync);
    const obs=new MutationObserver((mutations)=>{
      const roots=new Set();
      mutations.forEach((mutation)=>{
        if(mutation.type==='attributes'){
          const root=mutation.target.closest?.(ROOT);if(root)roots.add(root);
        }
        mutation.addedNodes.forEach((node)=>{
          if(!(node instanceof Element))return;
          if(node.matches(ROOT))roots.add(node);
          node.querySelectorAll?.(ROOT).forEach((root)=>roots.add(root));
        });
      });
      roots.forEach(sync);
    });
    obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:attrs});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

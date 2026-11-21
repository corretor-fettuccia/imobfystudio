(function(){
  const layers = [...new Set(document.querySelectorAll('.ifcp-layer[data-ifcp-id], [data-plugin="floating-container-pro"] .ifcp-layer'))];
  if(!layers.length) return;

  const registry = new Map();
  let activeLayer = null;
  let lastTrigger = null;

  function cleanId(value){
    return String(value || '').trim().replace(/^#/, '').replace(/^floating:/i,'').replace(/^float:/i,'');
  }
  function truthy(value){ return value === true || String(value).toLowerCase() === 'true' || String(value) === '1'; }
  function layerId(layer){ return cleanId(layer.dataset.ifcpId) || cleanId(layer.dataset.ifcpSection) || cleanId(layer.id); }
  function focusables(layer){
    return [...layer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el=>!el.hidden && el.offsetParent!==null);
  }
  function syncScrollLock(){
    const shouldLock = activeLayer && truthy(activeLayer.dataset.lockScroll) && !window.__IMOBIFY_EDITOR__;
    document.documentElement.classList.toggle('ifcp-scroll-locked', !!shouldLock);
  }
  function positionPopover(layer, trigger){
    if(layer.dataset.mode !== 'popover' || !trigger || (matchMedia('(max-width:680px)').matches && layer.dataset.mobileMode !== 'inherit')) return;
    const panel = layer.querySelector('.ifcp-panel');
    if(!panel) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Number.parseFloat(getComputedStyle(layer).getPropertyValue('--ifcp-width')) || 480, innerWidth - 24);
    const estimatedHeight = Math.min(panel.scrollHeight || 360, innerHeight - 24);
    let left = rect.left;
    if(left + width > innerWidth - 12) left = Math.max(12, innerWidth - width - 12);
    let top = rect.bottom + 10;
    if(top + estimatedHeight > innerHeight - 12 && rect.top > estimatedHeight + 12) top = Math.max(12, rect.top - estimatedHeight - 10);
    layer.style.setProperty('--ifcp-popover-left', `${Math.max(12,left)}px`);
    layer.style.setProperty('--ifcp-popover-top', `${Math.max(12,top)}px`);
  }
  function close(layer, restoreFocus=true){
    if(!layer || !layer.classList.contains('is-open')) return false;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden','true');
    if(activeLayer===layer) activeLayer=null;
    syncScrollLock();
    document.dispatchEvent(new CustomEvent('imobify:floating-close',{detail:{id:layerId(layer),layer}}));
    if(restoreFocus && lastTrigger && typeof lastTrigger.focus==='function') setTimeout(()=>lastTrigger.focus({preventScroll:true}),0);
    return true;
  }
  function open(layer, trigger){
    if(!layer) return false;
    if(activeLayer && activeLayer!==layer) close(activeLayer,false);
    lastTrigger = trigger || document.activeElement;
    activeLayer = layer;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden','false');
    positionPopover(layer,trigger);
    syncScrollLock();
    const focusTarget = layer.querySelector('[data-ifcp-close]') || layer.querySelector('.ifcp-panel');
    if(focusTarget && !window.__IMOBIFY_EDITOR__) requestAnimationFrame(()=>focusTarget.focus({preventScroll:true}));
    document.dispatchEvent(new CustomEvent('imobify:floating-open',{detail:{id:layerId(layer),layer,trigger}}));
    return true;
  }
  function resolve(value){ return registry.get(cleanId(value)); }
  function targetFromTrigger(trigger){
    if(!trigger) return '';
    const explicit = trigger.getAttribute('data-floating-open') || trigger.getAttribute('data-ifcp-open');
    if(explicit) return cleanId(explicit);
    const target = trigger.getAttribute('data-target');
    if(target && registry.has(cleanId(target))) return cleanId(target);
    const href = trigger.getAttribute('href');
    if(href && href.trim().startsWith('#')) return cleanId(href);
    return '';
  }

  layers.forEach(layer=>{
    const id = layerId(layer);
    if(id){
      layer.dataset.ifcpResolvedId = id;
      layer.dataset.ifcpId = id;
      if(!layer.id) layer.id = id;
      if(!registry.has(id)) registry.set(id,layer);
      else console.warn(`[Floating Container Pro] ID duplicado: ${id}. Use IDs únicos para chamadas previsíveis.`);
    }

    const sectionRoot = layer.closest('[data-plugin="floating-container-pro"]');
    const editorOuter = sectionRoot?.closest('.imobify-editor-block');

    if(window.__IMOBIFY_EDITOR__){
      if(editorOuter?.classList.contains('is-selected') || sectionRoot?.querySelector('.imobify-editor-block.is-selected')){
        layer.classList.add('ifcp-editor-preview');
        layer.setAttribute('aria-hidden','false');
      }
    } else if(layer.parentElement !== document.body){
      // Portal real: remove o modal da árvore da section para que content-visibility,
      // transforms e animações de seções não alterem o referencial do position:fixed.
      layer.dataset.ifcpPortaled = 'true';
      document.body.appendChild(layer);
    }

    layer.querySelectorAll('[data-ifcp-close]').forEach(button=>button.addEventListener('click',event=>{
      event.preventDefault();
      close(layer);
    }));
    layer.querySelector('[data-ifcp-backdrop]')?.addEventListener('click',event=>{
      if(event.target!==event.currentTarget || !truthy(layer.dataset.closeBackdrop)) return;
      close(layer);
    });
  });

  // Compatibilidade direta com o padrão do framework: basta href="#ID".
  // O listener é delegado para funcionar em qualquer CTA renderizado depois.
  document.addEventListener('click',function(event){
    const trigger = event.target.closest?.('[data-floating-open],[data-ifcp-open],[data-target],[href^="#"]');
    const target = targetFromTrigger(trigger);
    const layer = resolve(target);
    if(!layer) return;
    event.preventDefault();
    event.__imobifyFloatingHandled = true;
    open(layer,trigger);
  },true);

  document.addEventListener('keydown',function(event){
    if(!activeLayer) return;
    if(event.key==='Escape' && truthy(activeLayer.dataset.closeEscape)){
      event.preventDefault(); close(activeLayer); return;
    }
    if(event.key!=='Tab') return;
    const list=focusables(activeLayer); if(!list.length) return;
    const first=list[0], last=list[list.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });

  addEventListener('resize',()=>{if(activeLayer) positionPopover(activeLayer,lastTrigger);},{passive:true});
  addEventListener('scroll',()=>{if(activeLayer) positionPopover(activeLayer,lastTrigger);},{passive:true});

  if(!window.__IMOBIFY_EDITOR__){
    const hashId=cleanId(location.hash);
    const hashLayer=resolve(hashId);
    if(hashLayer && truthy(hashLayer.dataset.openHash)) requestAnimationFrame(()=>open(hashLayer,null));
  }

  window.ImobifyFloating = Object.assign(window.ImobifyFloating || {},{
    open(id,trigger){return open(resolve(id),trigger||null);},
    close(id){const layer=id?resolve(id):activeLayer;return layer?close(layer):false;},
    toggle(id){const layer=resolve(id);if(!layer)return false;return layer.classList.contains('is-open')?(close(layer),false):open(layer,null);},
    get(id){return resolve(id)||null;}
  });
})();

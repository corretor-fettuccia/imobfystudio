/** Imobify Studio immersive 360 plugins — v1.0.2. Tour360 data model, Pannellum viewer. */
(function(){'use strict';
  const PLUGIN_ID='parallax360-tour';
  const CDN='https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/';
  let enginePromise;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const safeUrl=(raw)=>{if(!String(raw||'').trim())return '';try{const url=new URL(String(raw||''),document.baseURI);return ['https:','http:','mailto:','tel:'].includes(url.protocol)?url.href:''}catch(_){return ''}};
  function engine(){
    if(window.pannellum?.viewer)return Promise.resolve(window.pannellum);
    if(enginePromise)return enginePromise;
    enginePromise=new Promise((resolve,reject)=>{
      if(!document.querySelector('link[href*="pannellum@2.5.6/build/pannellum.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href=CDN+'pannellum.css';css.dataset.ims360Lib='1';document.head.append(css)}
      const existing=document.querySelector('script[src*="pannellum@2.5.6/build/pannellum.js"]');
      if(existing){existing.addEventListener('load',()=>resolve(window.pannellum),{once:true});existing.addEventListener('error',()=>reject(new Error('Biblioteca Pannellum não disponível')),{once:true});return}
      const script=document.createElement('script');script.src=CDN+'pannellum.js';script.async=true;script.dataset.ims360Lib='1';script.onload=()=>window.pannellum?.viewer?resolve(window.pannellum):reject(new Error('Biblioteca 360 inválida'));script.onerror=()=>reject(new Error('Falha no carregamento da biblioteca 360. Verifique a conexão.'));document.head.append(script);
    }).catch(e=>{enginePromise=null;throw e});return enginePromise;
  }
  function parse(el){try{const parsed=JSON.parse(el.querySelector('.ims360-config')?.value||'{}');return parsed&&typeof parsed==='object'?parsed:{}}catch(_){return {}}}
  function initialize(root){
    if(root.dataset.ims360Ready)return;root.dataset.ims360Ready='1';
    root.style.setProperty('--ims360-opacity',String(clamp(parseFloat(root.style.getPropertyValue('--ims360-overlay')),0,75)/100));
    const cfg=parse(root);const ordered=(Array.isArray(cfg.sceneOrder)?cfg.sceneOrder:Object.keys(cfg.scenes||{})).filter(id=>cfg.scenes?.[id]?.panorama);
    const stage=root.querySelector('.ims360-frame'),viewport=root.querySelector('.ims360-viewer'),banner=root.querySelector('.ims360-banner'),sceneLabel=root.querySelector('.ims360-scene-name'),nav=root.querySelector('.ims360-navigation'),prev=root.querySelector('.ims360-prev'),next=root.querySelector('.ims360-next'),counter=root.querySelector('.ims360-counter'),sceneToggle=root.querySelector('.ims360-scene-toggle'),sceneList=root.querySelector('.ims360-scene-list');
    const mode=root.dataset.mode==='hero'?'hero':'sequence',urls=[];
    const heroEyebrow=root.querySelector('.ims360-eyebrow'),heroHeadline=root.querySelector('.ims360-headline'),heroSubheadline=root.querySelector('.ims360-subheadline');
    const defaultHero={eyebrow:heroEyebrow?.textContent||'',headline:heroHeadline?.textContent||'',subheadline:heroSubheadline?.textContent||''};
    if(!ordered.length){root.querySelector('.ims360-empty').hidden=false;return}
    const heroCta=root.querySelector('[data-hero-cta]');if(heroCta){const resolved=safeUrl(heroCta.getAttribute('href'));if(resolved){heroCta.href=resolved}else{heroCta.hidden=true}}
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');let visible=true,viewer,activeScene=ordered[0],frameId=0,idleTimer=0,lastInput=performance.now(),motionOrigin=null,stop=false,stepIndex=0,navStamp=0,bannerOpened=false,observing=false;
    let observer;
    const idleSeconds=clamp(root.dataset.idle||10,5,60)*1000,swayYaw=clamp(root.dataset.swayYaw||7,0,16),swayPitch=clamp(root.dataset.swayPitch||0.8,0,3),cycle=clamp(root.dataset.swayCycle||19,8,35)*1000;
    function resetIdle(){lastInput=performance.now();motionOrigin=null;observing=false}
    function safeView(){try{return {yaw:viewer?.getYaw?.()||0,pitch:viewer?.getPitch?.()||0,hfov:viewer?.getHfov?.()||100}}catch(_){return{yaw:0,pitch:0,hfov:100}}}

function syncViewerSize(){try{viewer?.resize?.()}catch(_){} }
function scheduleViewerResize(){requestAnimationFrame(()=>{syncViewerSize();requestAnimationFrame(syncViewerSize)});setTimeout(syncViewerSize,120);setTimeout(syncViewerSize,420)}
function setHeroCopy(source,sceneId){
  if(mode!=='hero')return;
  const scene=cfg.scenes?.[sceneId]||{};
  const eyebrow=source?.bannerEyebrow||source?.heroEyebrow||source?.text||scene.title||defaultHero.eyebrow;
  const headline=source?.bannerHeadline||source?.heroHeadline||source?.text||defaultHero.headline;
  const subheadline=source?.bannerBody||source?.heroSubheadline||source?.info||defaultHero.subheadline;
  if(heroEyebrow)heroEyebrow.textContent=eyebrow||'';
  if(heroHeadline)heroHeadline.textContent=headline||'';
  if(heroSubheadline)heroSubheadline.textContent=subheadline||'';
}
function resetHeroCopy(){if(mode!=='hero')return;if(heroEyebrow)heroEyebrow.textContent=defaultHero.eyebrow;if(heroHeadline)heroHeadline.textContent=defaultHero.headline;if(heroSubheadline)heroSubheadline.textContent=defaultHero.subheadline}
function hotspotPerspective(h,pitch){const strength=clamp(h.perspectiveStrength??1,0,2);const userScale=clamp(h.scale??1,.5,2);const floorAmount=clamp((-Number(pitch||0))/48,0,1);const tilt=h.perspective===false?0:(6+floorAmount*70)*strength;const depthScale=h.perspective===false?1:1-floorAmount*.18*strength;const verticalScale=h.perspective===false?1:1-floorAmount*.22*strength;return {tilt,scale:userScale*depthScale,verticalScale}}
function applyHotspotPerspective(el,h,pitch){const p=el.querySelector('.hotspot-perspective');if(!p)return;const v=hotspotPerspective(h,pitch);p.style.transform=`perspective(220px) rotateX(${v.tilt}deg) scale(${v.scale}, ${v.scale*v.verticalScale})`}
function hotspotSvg(type){if(type==='info')return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><circle cx="32" cy="21" r="3.5" class="hs-fill"/><path d="M32 29v18" class="hs-stroke"/></svg>`;if(type==='external')return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><path d="M25 39 42 22M31 22h11v11" class="hs-stroke"/></svg>`;return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="18" ry="6" class="hs-shadow"/><path d="M32 8 49 33H39v18H25V33H15Z" class="hs-arrow"/><path d="M32 11 45 31H36v17h-8V31h-9Z" class="hs-highlight"/></svg>`}
function buildHotspotElement(el,h,sceneId){el.classList.add('ims360-hotspot-shell');el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',h.text||'Explorar ponto de interesse');el.title=h.text||'Explorar ponto';const scale=document.createElement('div');scale.className='hotspot-scale';const perspective=document.createElement('div');perspective.className='hotspot-perspective';const pulse=document.createElement('span');pulse.className='hotspot-pulse';perspective.appendChild(pulse);const rotate=document.createElement('div');rotate.className='hotspot-rotate';rotate.style.transform=`rotate(${Number(h.rotation||0)}deg)`;const icon=document.createElement('div');icon.className='hotspot-icon';icon.innerHTML=hotspotSvg(h.type);rotate.appendChild(icon);perspective.appendChild(rotate);scale.appendChild(perspective);el.appendChild(scale);if(h.text){const lbl=document.createElement('span');lbl.className='ims360-hotspot-tooltip';lbl.textContent=h.text;el.appendChild(lbl)}applyHotspotPerspective(el,h,h.pitch);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();handleHotspot(sceneId,h)}})}
    function showBanner(h,sceneId){
      if(!h)return;
      resetIdle();bannerOpened=true;
      const title=h.bannerHeadline||h.text||cfg.scenes[sceneId]?.title||'Descubra este espaço';
      const detail=h.bannerBody||h.info||'';
      banner.querySelector('.ims360-banner-kicker').textContent=h.bannerEyebrow||cfg.scenes[sceneId]?.title||'UM NOVO OLHAR';
      banner.querySelector('.ims360-banner-title').textContent=title;
      banner.querySelector('.ims360-banner-body').textContent=detail;
      const action=banner.querySelector('.ims360-banner-action'),link=banner.querySelector('.ims360-banner-link');
      action.hidden=!(h.type==='navigation'&&cfg.scenes[h.targetSceneId]);link.hidden=true;
      if(!action.hidden){action.querySelector('span').previousSibling.textContent=h.bannerCtaLabel||'Explorar ambiente ';action.onclick=()=>{hideBanner();jumpScene(h.targetSceneId,h.targetView)}}
      const url=safeUrl(h.bannerCtaUrl|| (h.type==='external'?h.url:''));
      if(url){link.href=url;link.textContent=h.bannerCtaLabel||'Saiba mais ↗';link.hidden=false}
      setHeroCopy(h,sceneId);
      banner.hidden=false;stage.classList.add('ims360-has-banner');
      if(mode==='hero')banner.querySelector('.ims360-banner-close')?.focus({preventScroll:true});
    }
    function hideBanner(){banner.hidden=true;bannerOpened=false;stage.classList.remove('ims360-has-banner');resetIdle();resetHeroCopy()}
    banner.querySelector('.ims360-banner-close').addEventListener('click',hideBanner);
    function changeScene(sceneId,view){if(!cfg.scenes[sceneId])return;activeScene=sceneId;hideBanner();resetIdle();sceneLabel.textContent=cfg.scenes[sceneId]?.title||'';resetHeroCopy();
      if(viewer){const v=view||cfg.scenes[sceneId].initialView||{};try{viewer.loadScene(sceneId,Number(v.pitch)||0,Number(v.yaw)||0,Number(v.hfov)||cfg.settings?.defaultHfov||100)}catch(e){console.warn('Imobify 360: mudança de cena',e)}}
    }
    function jumpScene(id,view){changeScene(id,view);if(mode==='sequence'){const idx=steps.findIndex(s=>s.scene===id);if(idx>=0){stepIndex=idx;renderStep()}}}
    function focusSpot(h){if(!viewer)return;const view=safeView();try{viewer.lookAt(Number(h.pitch)||0,Number(h.yaw)||0,Math.min(view.hfov,95),reduced?.matches?0:700)}catch(_){}}
    function handleHotspot(sceneId,h){resetIdle();if(mode==='hero'){showBanner(h,sceneId);return}
      const idx=steps.findIndex(s=>s.scene===sceneId&&s.hotspot===h);if(idx>=0){stepIndex=idx;renderStep()}
      showBanner(h,sceneId);
    }
    function makeHotspot(sceneId,h){return{id:h.id||`${sceneId}_${String(h.text||'spot').replace(/\W+/g,'_')}`,pitch:clamp(h.pitch,-89,89),yaw:clamp(h.yaw,-180,180),cssClass:`ims360-hotspot ${h.type||'navigation'}`,createTooltipFunc(el){buildHotspotElement(el,h,sceneId)},clickHandlerFunc:()=>handleHotspot(sceneId,h)}}
    const steps=[];
    for(const id of ordered){steps.push({scene:id,hotspot:null});for(const h of cfg.scenes[id]?.hotspots||[])steps.push({scene:id,hotspot:h})}
    function renderStep(){
      if(mode!=='sequence')return;
      const current=steps[stepIndex];if(!current)return;
      if(activeScene!==current.scene)changeScene(current.scene);
      const h=current.hotspot;
      if(h){focusSpot(h);showBanner(h,current.scene)}else hideBanner();
      counter.textContent=`${stepIndex+1} / ${steps.length}`;
      prev.disabled=stepIndex<=0;next.disabled=stepIndex>=steps.length-1;
      sceneLabel.textContent=cfg.scenes[current.scene]?.title||'Cena';
    }
    function advance(dir){if(mode!=='sequence')return;const index=clamp(stepIndex+dir,0,steps.length-1);if(index===stepIndex)return;stepIndex=index;renderStep()}
    prev.addEventListener('click',()=>advance(-1));next.addEventListener('click',()=>advance(1));
    if(mode==='sequence'){
      nav.hidden=false;
      root.addEventListener('keydown',e=>{if(e.target?.closest('input,textarea,select,a,button'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();advance(e.key==='ArrowRight'?1:-1)}});
      if(root.dataset.scroll!=='false'){
        stage.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<9||e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;const dir=e.deltaY>0?1:-1;
          if((dir===1&&stepIndex>=steps.length-1)||(dir===-1&&stepIndex<=0))return;
          if(!visible||Date.now()-navStamp<820){if(visible)e.preventDefault();return}
          e.preventDefault();navStamp=Date.now();advance(dir);
        },{passive:false});
      }
      if(root.dataset.progress==='false')counter.hidden=true;
    }else nav.hidden=true;
    sceneToggle.hidden=mode==='sequence'||root.dataset.scenesMenu==='false'||ordered.length<2;
    sceneList.id='ims360-scene-list-'+Math.random().toString(36).slice(2);sceneToggle.setAttribute('aria-controls',sceneList.id);
    function closeSceneMenu(){sceneList.hidden=true;sceneToggle.setAttribute('aria-expanded','false')}
    sceneToggle.addEventListener('click',()=>{sceneList.hidden=!sceneList.hidden;sceneToggle.setAttribute('aria-expanded',String(!sceneList.hidden));resetIdle()});
    ordered.forEach(id=>{const button=document.createElement('button');button.type='button';button.textContent=cfg.scenes[id]?.title||id;button.addEventListener('click',()=>{jumpScene(id);closeSceneMenu()});sceneList.append(button)});
    stage.addEventListener('pointerdown',resetIdle,{passive:true});stage.addEventListener('pointermove',e=>{if(e.isPrimary!==false)resetIdle()},{passive:true});
    stage.addEventListener('touchstart',resetIdle,{passive:true});stage.addEventListener('keydown',resetIdle);stage.addEventListener('wheel',resetIdle,{passive:true});
    stage.addEventListener('focusin',resetIdle);stage.addEventListener('click',e=>{if(!sceneList.hidden&&!sceneList.contains(e.target)&&!sceneToggle.contains(e.target))closeSceneMenu()});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)resetIdle()});
    if('IntersectionObserver'in window){observer=new IntersectionObserver(items=>{visible=!!items[0]?.isIntersecting;if(!visible)resetIdle()},{threshold:.12});observer.observe(stage)}
    function drift(time){if(stop||!root.isConnected){stop=true;return}
      // Observador natural: deslocamento oscilatório discreto, sem rotação contínua.
      if(mode==='hero'&&viewer&&visible&&!document.hidden&&!reduced?.matches&&!bannerOpened){
        const inactive=time-lastInput;
        if(inactive>=idleSeconds){
          if(!motionOrigin){motionOrigin={...safeView(),start:time};observing=true}
          const elapsed=time-motionOrigin.start;
          const t=elapsed/cycle*2*Math.PI;
          // Dois ritmos desacoplados produzem um olhar suave, não um giro robótico.
          const easing=Math.min(1,elapsed/1100);const k=easing*easing*(3-2*easing);
          const yaw=motionOrigin.yaw+swayYaw*k*(Math.sin(t)*.82+Math.sin(t*.53+.7)*.18-.116);
          const pitch=clamp(motionOrigin.pitch+swayPitch*k*(Math.sin(t*.73-.4)*.75+Math.sin(t*1.29)*.25+.292),-84,84);
          try{viewer.setYaw(yaw);viewer.setPitch(pitch)}catch(_){}
        }
      }
      // Sem movimento: apenas um check leve a cada 220ms; RAF em tempo real somente durante a oscilação.
      if(observing)frameId=requestAnimationFrame(drift);
      else idleTimer=setTimeout(()=>{frameId=requestAnimationFrame(drift)},220);
    }
    async function prepare(src){if(!/^data:/i.test(String(src||'')))return src;try{const res=await fetch(src);const object=URL.createObjectURL(await res.blob());urls.push(object);return object}catch(_){return src}}
    async function boot(){
      try{
        await engine();if(!root.isConnected)return;
        const scenes={};for(const id of ordered){const s=cfg.scenes[id];const panorama=await prepare(s.panorama);scenes[id]={type:'equirectangular',panorama,title:s.title||id,pitch:Number(s.initialView?.pitch)||0,yaw:Number(s.initialView?.yaw)||0,hfov:Number(s.initialView?.hfov)||cfg.settings?.defaultHfov||100,hotSpots:(s.hotspots||[]).map(h=>makeHotspot(id,h))}}
        const settings=cfg.settings||{};
        viewer=window.pannellum.viewer(viewport,{default:{firstScene:settings.firstSceneId&&scenes[settings.firstSceneId]?settings.firstSceneId:ordered[0],autoLoad:true,sceneFadeDuration:reduced?.matches?0:460,showZoomCtrl:settings.showZoomControls!==false,showFullscreenCtrl:settings.showFullscreenControl!==false,compass:settings.showCompass===true,mouseZoom:mode==='hero',minHfov:settings.minHfov||50,maxHfov:settings.maxHfov||120},scenes});
        viewer.on('scenechange',id=>{activeScene=id;sceneLabel.textContent=cfg.scenes[id]?.title||'';hideBanner();scheduleViewerResize();if(mode==='sequence'&&steps[stepIndex]?.scene!==id){const idx=steps.findIndex(s=>s.scene===id);if(idx>=0){stepIndex=idx;counter.textContent=`${stepIndex+1} / ${steps.length}`;prev.disabled=stepIndex===0;next.disabled=stepIndex>=steps.length-1}}});
        activeScene=viewer.getScene?.()||ordered[0];sceneLabel.textContent=cfg.scenes[activeScene]?.title||'';
        scheduleViewerResize();
        if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>syncViewerSize());observer.observe(stage);observer.observe(viewport)}
        window.addEventListener('resize',syncViewerSize,{passive:true});
        if(mode==='sequence')renderStep();
        if(mode==='hero')frameId=requestAnimationFrame(drift);
      }catch(e){const err=root.querySelector('.ims360-error');err.textContent=e.message||'Não foi possível abrir o tour 360';err.hidden=false;console.warn('[Imobify immersive360]',e)}
    }
    boot();
    // Clean up object URLs and GPU resources when removed from the page/editor preview.
    const cleanup=new MutationObserver(()=>{if(root.isConnected)return;stop=true;cancelAnimationFrame(frameId);clearTimeout(idleTimer);observer?.disconnect();window.removeEventListener('resize',syncViewerSize);try{viewer?.destroy?.()}catch(_){}urls.forEach(u=>URL.revokeObjectURL(u));cleanup.disconnect()});cleanup.observe(document.documentElement,{childList:true,subtree:true});
  }
  function scan(){document.querySelectorAll(`[data-plugin="${PLUGIN_ID}"] .ims360`).forEach(initialize)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();

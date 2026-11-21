(function(){
  // v6.0.39 — mantém o zoom nativo acessível. A navegação de componentes
  // interativos continua sob responsabilidade do respectivo plugin, não do documento.
  const CTA_SELECTOR = [
    '[data-design-role="cta"]',
    '.button-primary','.btn-primary','.opp-cta','.svp-hero-button','.formsenderCSS_button','.spp-cta','.pit-glass-cta','.pp-flip-cta','.btn-flip','.btn-flipFake',
    '.fsp-result a[data-fsp-cta]',
    'a[class*="__cta"]','button[class*="__cta"]','a[class*="-cta"]','button[class*="-cta"]','a[class*="_cta"]','button[class*="_cta"]',
    'a[class*="call-to-action"]','button[class*="call-to-action"]'
  ].join(',');
  function buttonEffect(){return cssVar(document.documentElement,'--action-button-effect','depth')||'depth'}
  function buttonClickEffect(){return cssVar(document.documentElement,'--action-button-click-effect','press')||'press'}
  function decorateCTA(el){
    if(!(el instanceof Element))return;
    el.classList.add('imobify-design-cta');
    el.dataset.imobifyEffect=buttonEffect();
  }
  function parseColor(value){
    const raw=String(value||'').trim();
    let m=raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(m){let hex=m[1];if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return {r:parseInt(hex.slice(0,2),16),g:parseInt(hex.slice(2,4),16),b:parseInt(hex.slice(4,6),16)}}
    m=raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if(m)return {r:+m[1],g:+m[2],b:+m[3]};
    return null;
  }
  function hex(rgb){const h=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');return '#'+h(rgb.r)+h(rgb.g)+h(rgb.b)}
  function lum(value){const rgb=parseColor(value);if(!rgb)return null;const c=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return c(rgb.r)*.2126+c(rgb.g)*.7152+c(rgb.b)*.0722}
  function ratio(a,b){const x=lum(a),y=lum(b);if(x==null||y==null)return 1;return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function mix(a,b,t){const x=parseColor(a),y=parseColor(b);if(!x||!y)return a;t=Math.max(0,Math.min(1,Number(t)||0));return hex({r:x.r+(y.r-x.r)*t,g:x.g+(y.g-x.g)*t,b:x.b+(y.b-x.b)*t})}
  function safest(background){return ratio('#ffffff',background)>=ratio('#000000',background)?'#ffffff':'#000000'}
  function ensureContrast(preferred,background,minimum){
    minimum=Number(minimum)||4.5;
    if(!parseColor(preferred)||!parseColor(background)||ratio(preferred,background)>=minimum)return preferred;
    const target=safest(background);
    for(let step=1;step<=20;step++){const candidate=mix(preferred,target,step/20);if(ratio(candidate,background)>=minimum)return candidate}
    return target;
  }
  function cssVar(el,name,fallback=''){return (getComputedStyle(el).getPropertyValue(name)||fallback).trim()}
  function contrastEnabled(){return cssVar(document.documentElement,'--contrast-enabled','1')!=='0'}
  function contrastMinimum(){return Number(cssVar(document.documentElement,'--contrast-min','4.5'))||4.5}
  function setSafe(el,name,preferred,background){if(!el||!contrastEnabled())return;el.style.setProperty(name,ensureContrast(preferred,background,contrastMinimum()))}
  function applyDesignSemantics(root){
    const scope=root&&root.querySelectorAll?root:document;
    const pluginRoots=[];
    if(scope instanceof Element){
      const owner=scope.closest('[data-plugin]');
      if(owner)pluginRoots.push(owner);
    }
    if(scope.querySelectorAll)scope.querySelectorAll('[data-plugin]').forEach(el=>pluginRoots.push(el));
    if(scope instanceof Element && scope.matches(CTA_SELECTOR))decorateCTA(scope);
    [...new Set(pluginRoots)].forEach(function(plugin){
      plugin.querySelectorAll('h1,h2,h3,h4,h5,h6,[data-design-role=\"title\"]').forEach(function(el){
        el.classList.add('imobify-design-title');
      });
      plugin.querySelectorAll('.hero-copy,.svp-hero-subtitle,[class$=\"__subtitle\"],[class$=\"-subtitle\"],[class$=\"_subtitle\"],[class$=\"__subheading\"],[class$=\"-subheading\"],[class$=\"_subheading\"],[data-design-role=\"subtitle\"]').forEach(function(el){
        el.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll('h1,h2').forEach(function(heading){
        const next=heading.nextElementSibling;
        if(next&&next.matches('p:not(.eyebrow):not(.legal)'))next.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
      plugin.querySelectorAll('.bbp[data-project-profile=\"true\"] .bbp__cta').forEach(decorateCTA);
    });
    scope.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
  }

  function applyContrastGuards(root){
    if(!contrastEnabled())return;
    const scope=root&&root.querySelectorAll?root:document;
    const include=(selector)=>{const out=[];if(scope instanceof Element&&scope.matches(selector))out.push(scope);scope.querySelectorAll(selector).forEach(el=>out.push(el));return out};

    include('.pit-section').forEach(el=>{
      const accent=cssVar(el,'--pit-accent',cssVar(document.documentElement,'--primary','#16a34a'));
      const surface=cssVar(document.documentElement,'--surface','#ffffff');
      setSafe(el,'--pit-accent-on-surface',accent,surface);
      setSafe(el,'--pit-accent-contrast',safest(accent),accent);
    });

    include('.iwfp-widget').forEach(el=>{
      const bg=cssVar(el,'--iwfp-bg','#25d366');
      setSafe(el,'--iwfp-icon-safe',cssVar(el,'--iwfp-icon','#ffffff'),bg);
      setSafe(el,'--iwfp-text-safe',cssVar(el,'--iwfp-text','#ffffff'),bg);
    });

    include('.imobify-menu-pro').forEach(el=>{
      const text=cssVar(el,'--imp-text','#ffffff'),accent=cssVar(el,'--imp-accent','#d4af37');
      const bg=cssVar(el,'--imp-bg','#0a1628'),scroll=cssVar(el,'--imp-bg-scroll',bg),mobile=cssVar(el,'--imp-mobile-bg',bg);
      setSafe(el,'--imp-text-safe',text,bg);setSafe(el,'--imp-text-scroll-safe',text,scroll);setSafe(el,'--imp-text-mobile-safe',text,mobile);
      setSafe(el,'--imp-accent-safe',accent,bg);setSafe(el,'--imp-accent-scroll-safe',accent,scroll);setSafe(el,'--imp-accent-mobile-safe',accent,mobile);
      setSafe(el,'--imp-accent-contrast',safest(accent),accent);
    });
  }

  function clearButtonMotion(el){if(!el)return;el.style.removeProperty('--imobify-button-x');el.style.removeProperty('--imobify-button-y')}
  const cursorEffects=new Set(['magnetic','magnet-orbit','tilt-3d','cursor-halo','liquid-follow','prism-shimmer','orbit-ring','neon-trace']);
  function motionAllowed(){return matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches}
  document.addEventListener('pointermove',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    const fx=buttonEffect();
    if(!el||!cursorEffects.has(fx)||!motionAllowed())return;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
    const nx=Math.max(-1,Math.min(1,2*(event.clientX-r.left)/r.width-1));
    const ny=Math.max(-1,Math.min(1,2*(event.clientY-r.top)/r.height-1));
    const strength=fx==='magnet-orbit'?23:fx==='magnetic'?5:0;
    el.style.setProperty('--imobify-button-x',(nx*strength).toFixed(2)+'px');
    el.style.setProperty('--imobify-button-y',(ny*strength*.76).toFixed(2)+'px');
    el.style.setProperty('--imobify-cursor-x',((nx+1)*50).toFixed(1)+'%');
    el.style.setProperty('--imobify-cursor-y',((ny+1)*50).toFixed(1)+'%');
    el.style.setProperty('--imobify-tilt-x',(-ny*12).toFixed(2)+'deg');
    el.style.setProperty('--imobify-tilt-y',(nx*12).toFixed(2)+'deg');
  },{passive:true});
  document.addEventListener('pointerout',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    if(el&&!el.contains(event.relatedTarget)){
      clearButtonMotion(el);
      ['--imobify-cursor-x','--imobify-cursor-y','--imobify-tilt-x','--imobify-tilt-y'].forEach(k=>el.style.removeProperty(k));
    }
  },{passive:true});
  document.addEventListener('click',function(event){
    const el=event.target.closest?.('.imobify-design-cta, [data-design-role="cta"]');
    if(!el||el.matches('[disabled],[aria-disabled="true"]'))return;
    const mode=buttonClickEffect();
    if(mode==='press'){
      el.classList.remove('imobify-click-press'); void el.offsetWidth;
      el.classList.add('imobify-click-press');
      setTimeout(()=>el.classList.remove('imobify-click-press'),380);
    }
    if(mode==='ripple'){
      const rect=el.getBoundingClientRect();
      const ripple=document.createElement('span');
      ripple.className='imobify-button-ripple';
      const restorePosition=getComputedStyle(el).position==='static';
      if(restorePosition)el.style.position='relative';
      el.classList.add('imobify-ripple-active');
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      ripple.style.left=cx+'px'; ripple.style.top=cy+'px';
      el.appendChild(ripple);setTimeout(()=>{ripple.remove();el.classList.remove('imobify-ripple-active');if(restorePosition)el.style.removeProperty('position')},650);
    }else if(['shockwave','confetti','sparks','rings','stamp','jelly','spin','flip','success','glow-burst','pixel-burst','shake'].includes(mode)){
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const rect=el.getBoundingClientRect();
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      const particleModes=['confetti','sparks','pixel-burst'];
      const ringModes=['shockwave','rings','glow-burst'];
      const active=['stamp','jelly','spin','flip','shake'].includes(mode)?mode:null;
      if(active){
        const cls='imobify-click-'+active;
        el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
        setTimeout(()=>el.classList.remove(cls),620);
      }
      if(mode==='success'){
        const mark=document.createElement('span');mark.className='imobify-click-success';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
        el.appendChild(mark);setTimeout(()=>mark.remove(),700);
      }
      if(particleModes.includes(mode)||ringModes.includes(mode)){
        const count=particleModes.includes(mode)?(mode==='confetti'?12:9):(mode==='rings'?3:2);
        const restorePosition=getComputedStyle(el).position==='static';if(restorePosition)el.style.position='relative';
        for(let i=0;i<count;i++){
          const part=document.createElement('span');part.setAttribute('aria-hidden','true');
          part.className='imobify-click-particle '+(particleModes.includes(mode)?'imobify-click-particle-'+mode:'imobify-click-ring '+ 'imobify-click-ring-'+mode);
          part.style.left=cx+'px';part.style.top=cy+'px';
          part.style.setProperty('--i',String(i));part.style.setProperty('--count',String(count));
          part.style.setProperty('--angle',(i*360/count)+'deg');part.style.setProperty('--delay',(i*65)+'ms');
          el.appendChild(part);setTimeout(()=>part.remove(),900);
        }
        if(restorePosition)setTimeout(()=>el.style.removeProperty('position'),920);
      }
    }else if(mode==='bounce'||mode==='flash'){
      const cls=mode==='bounce'?'imobify-button-click-bounce':'imobify-button-click-flash';
      el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),430);
    }
  },true);

  document.addEventListener('click',function(event){
    if(event.__imobifyFloatingHandled)return;
    const link=event.target.closest?.('[href^="#"]');
    if(!link)return;
    const href=String(link.getAttribute('href')||'').trim();
    if(!href||href==='#')return;
    const floating=window.ImobifyFloating?.get?.(href);
    if(floating){
      event.preventDefault();
      window.ImobifyFloating.open(href,link);
      return;
    }
    let target=null;
    try{target=document.querySelector(href)}catch(_error){return}
    if(target){
      event.preventDefault();
      // Alinhamento explícito ao início (não ao centro/fim de seções altas).
      target.scrollIntoView({block:'start',inline:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
  });
  window.Imobify={
    track:function(name,data){
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:name,...(data||{})});
    },
    contrastRatio:ratio,
    ensureContrast:ensureContrast,
    applyContrastGuards:applyContrastGuards,
    applyDesignSemantics:applyDesignSemantics,
    registerCTA:function(el){decorateCTA(el);return el},
    refreshDesign:function(root){applyDesignSemantics(root||document);applyContrastGuards(root||document)}
  };
  const scan=()=>{applyDesignSemantics(document);applyContrastGuards(document)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){if(node instanceof Element){applyDesignSemantics(node);applyContrastGuards(node)}})});
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-design-role']});
})();

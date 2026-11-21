/* ImobStudio 6.0.61 — element animation, synchronized with the existing section reveal. */
(function(){
 'use strict';
 const SELECTOR='h1,h2,h3,h4,h5,h6,p,img,button,a,[data-design-role="title"],[data-design-role="subtitle"],[data-design-role="cta"]';
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const clamp=(v,a,b,f)=>Number.isFinite(parseFloat(v))?Math.min(b,Math.max(a,parseFloat(v))):f;
 const processed=new WeakSet();
 function targets(root){return [...root.querySelectorAll(SELECTOR)].filter(el=>el.closest('[data-section-id]')===root)}
 function play(el,cfg,delay,scrollDriven=false){
   if(!el||reduced()||!el.animate||cfg?.preset==='none')return;
   const preset=cfg?.preset||'none';if(preset==='none')return;
   const duration=clamp(cfg.durationMs,200,2000,750), intensity=cfg.intensity==='balanced'?1:0.62;
   const y=24*intensity,x=25*intensity,blur=7*intensity;
   const frame={opacity:0,transform:`translate3d(0,${y}px,0)`};
   if(preset==='orthogonal-assemble'){frame.transform=`translate3d(${-x}px,${y}px,0) rotate(-3deg) scale(.985)`;frame.clipPath='inset(0 0 75% 0)'}
   else if(preset==='line-reveal'){frame.transform=`translateY(${y}px)`;frame.clipPath='inset(100% 0 0 0)'}
   else if(preset==='soft-focus'){frame.filter=`blur(${blur}px)`;frame.transform=`translateY(${y/2}px)`}
   else if(preset==='float-in'){frame.transform=`translate3d(0,${y}px,0)`}
   else if(preset==='layer-assemble'){frame.transform=`translate3d(${x}px,${-y}px,0) scale(.98)`}
   else if(preset==='mask-unveil'){frame.opacity=1;frame.transform='none';frame.clipPath='inset(0 100% 0 0)'}
   else if(preset==='subtle-scale'){frame.transform='scale(.963)'}

   else if(preset==='orbit-settle'){frame.transform=`translate3d(${-x*2}px,${y*1.4}px,0) rotate(-9deg) scale(.92)`;}
   else if(preset==='elastic-dock'){frame.transform=`translate3d(${x*2.4}px,0,0) scale(.92)`;}
   else if(preset==='diagonal-sweep'){frame.transform=`translate3d(${-x*1.8}px,${y*1.8}px,0)`;frame.clipPath='inset(0 70% 70% 0)';}
   else if(preset==='flip-reveal'){frame.transform='perspective(700px) rotateX(-48deg) translateY(16px)';}
   else if(preset==='arc-rise'){frame.transform=`translate3d(${x*1.5}px,${y*2}px,0) rotate(7deg)`;}
   else if(preset==='depth-arrival'){frame.transform='perspective(700px) translateZ(-180px) scale(.86)';frame.filter=`blur(${blur*.65}px)`;}
   else if(preset==='split-shift'){frame.transform=`translate3d(${-x*2}px,${-y*.5}px,0) skewX(-8deg)`;}
   else if(preset==='tilt-unfold'){frame.opacity=1;frame.transform='perspective(650px) rotateY(-35deg) scale(.94)';frame.clipPath='inset(0 85% 0 0)';}
   else if(preset==='bounce-fade'){frame.transform=`translate3d(0,${y*2}px,0) scale(.9)`;}
   else if(preset==='wave-glide'){frame.transform=`translate3d(${x*1.6}px,${y*.8}px,0) rotate(4deg)`;}
   else if(preset==='curtain-diagonal'){frame.opacity=1;frame.transform=`translate3d(0,${y*.5}px,0)`;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';}
   else if(preset==='magnetic-snap'){frame.transform=`translate3d(${-x*1.7}px,${y*.5}px,0) scale(.94) rotate(-4deg)`;}
   else if(preset==='architectural-curtain'){frame.opacity=1;frame.clipPath='inset(0 100% 0 0)';frame.transform=`scale(1.06) translateX(${x}px)`;}
   else if(preset==='kinetic-shear'){frame.transform=`translate3d(${-x*2}px,${y}px,0) skewX(13deg)`;frame.clipPath='inset(0 35% 0 0)';}
   else if(preset==='depth-parallax'){frame.transform=`perspective(900px) translate3d(0,${y*2}px,-120px) rotateX(9deg) scale(.88)`;}
   else if(preset==='light-sweep'){frame.filter=`brightness(1.8) blur(${blur}px)`;frame.transform=`translateX(${-x}px) scale(1.04)`;}
   else if(preset==='prism-unfold'){frame.opacity=1;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';frame.transform='perspective(950px) rotateY(-24deg)';}
   else if(preset==='liquid-mask'){frame.opacity=1;frame.clipPath='ellipse(0% 10% at 50% 50%)';frame.filter=`blur(${blur*.65}px)`;}
   else if(preset==='cinema-focus'){frame.filter=`blur(${blur*1.7}px) brightness(.7)`;frame.transform='scale(1.115)';}
   else if(preset==='stereo-drift'){frame.transform=`perspective(900px) translate3d(${x*2}px,${-y}px,-90px) rotateY(16deg)`;}
   else return;
   const end={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};

   const overshoot={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};
   let frames=[frame,end],easing='cubic-bezier(.22,1,.36,1)';
   if(preset==='elastic-dock'||preset==='magnetic-snap'||preset==='bounce-fade'){
     const offset=preset==='bounce-fade'?`translateY(${-y*.28}px) scale(1.035)`:`translateX(${-x*.25}px) scale(1.025)`;
     frames=[{...frame,offset:0},{...overshoot,transform:offset,offset:.72},{...end,offset:1}];easing='ease-out';
   }else if(preset==='orbit-settle'||preset==='arc-rise'||preset==='wave-glide'){
     frames=[{...frame,offset:0},{...overshoot,transform:`translate3d(${x*.35}px,${-y*.28}px,0) rotate(-2deg)`,offset:.68},{...end,offset:1}];
   }else if(preset==='curtain-diagonal'){
     frames=[{...frame,offset:0},{...overshoot,clipPath:'polygon(0 0,75% 0,100% 100%,0 100%)',offset:.62},{...end,clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',offset:1}];
   }
   try{el.getAnimations().filter(a=>a.id==='imobify-element-motion').forEach(a=>a.cancel());const a=el.animate(frames,{duration,delay:scrollDriven?0:Math.max(0,delay||0),fill:scrollDriven?'both':'backwards',easing:scrollDriven?'linear':easing});a.id='imobify-element-motion';if(scrollDriven){a.pause();a.currentTime=0;return a;}a.finished.then(()=>a.cancel()).catch(()=>{});}catch(_){}
 }
 const scrollSections=new Map();
 let scrollTick=false;
 function updateScroll(){scrollTick=false;if(reduced())return;const vh=window.innerHeight||800;scrollSections.forEach((animations,section)=>{if(!section.isConnected){animations.forEach(a=>a.cancel());scrollSections.delete(section);return;}const rect=section.getBoundingClientRect();const total=Math.max(1,vh+rect.height);const progress=Math.max(0,Math.min(1,(vh-rect.top)/total));animations.forEach(({a,start,end})=>{try{a.currentTime=Math.max(0,Math.min(1,(progress-start)/Math.max(.001,end-start)))*a.effect.getTiming().duration;}catch(_){}});});}
 function requestScroll(){if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScroll);}}
 window.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll,{passive:true});
 function run(section){
   if(!section||reduced())return;
   const cfg=section._imobifyElementMotion||{};
   const items=cfg.items||{};
   const list=targets(section).map((el,index)=>({el,index,c:items[String(index)]})).filter(o=>o.c&&o.c.preset&&o.c.preset!=='none');
   list.sort((a,b)=>clamp(a.c.order,0,99,a.index)-clamp(b.c.order,0,99,b.index)||a.index-b.index);
   const sectionDelay=section.getAttribute('data-section-transition')==='none'?0:clamp(getComputedStyle(section).getPropertyValue('--imobify-duration'),200,4000,800)+clamp(getComputedStyle(section).getPropertyValue('--imobify-delay'),0,2500,0);
   const base=clamp(cfg.baseDelayMs,0,2500,150),stagger=clamp(cfg.staggerMs,0,1000,100);
   if(cfg.scrollMode==='scrub'){if(scrollSections.has(section))return;const length=Math.max(1,list.length);const animations=list.map(({el,c},i)=>({a:play(el,c,0,true),start:.14+i*.32/length,end:.60+i*.32/length})).filter(x=>x.a);scrollSections.set(section,animations);requestScroll();return;}
   list.forEach(({el,c},i)=>play(el,c,sectionDelay+base+i*stagger+clamp(c.delayMs,0,2000,120)));
 }
 function prepare(section){
   if(processed.has(section))return;
   processed.add(section);
   try{section._imobifyElementMotion=JSON.parse(decodeURIComponent(section.getAttribute('data-element-motion')||'%7B%7D'));}catch(_){section._imobifyElementMotion={};}
   section.addEventListener('imobify:section-visible',()=>run(section));
   if(section._imobifyElementMotion?.scrollMode==='scrub')run(section);else if(section.dataset.motionTriggered==='true'||section.classList.contains('is-visible'))run(section);
 }
 function scan(root){if(root.matches?.('[data-element-motion]'))prepare(root);root.querySelectorAll?.('[data-element-motion]').forEach(prepare)}
 function init(){scan(document);new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.body,{childList:true,subtree:true});}
 window.ImobifyElementMotion={play,targets};
 window.addEventListener('message',e=>{
   if(e.data?.type!=='imobify-element-motion-preview-all')return;
   const root=document.querySelector(`[data-section-id="${String(e.data.sectionId||'').replace(/[^a-zA-Z0-9_-]/g,'')}"]`);
   if(!root)return;
   const cfg=e.data.config||{};const entries=targets(root).map((el,index)=>({el,index,c:cfg.items?.[String(index)]})).filter(o=>o.c?.preset&&o.c.preset!=='none');
   entries.sort((a,b)=>clamp(a.c.order,0,99,a.index)-clamp(b.c.order,0,99,b.index)||a.index-b.index);
   entries.forEach(({el,c},i)=>play(el,c,clamp(cfg.baseDelayMs,0,2500,0)+i*clamp(cfg.staggerMs,0,1000,100)+clamp(c.delayMs,0,2000,0)));
 });
 window.addEventListener('message',e=>{if(e.data?.type!=='imobify-element-motion-test')return;const root=document.querySelector(`[data-section-id="${String(e.data.sectionId||'').replace(/[^a-zA-Z0-9_-]/g,'')}"]`);if(root){const el=targets(root)[Number(e.data.index)];play(el,e.data.config||{},0);}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

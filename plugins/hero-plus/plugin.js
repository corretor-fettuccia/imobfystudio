(function(){
  const roots=[...document.querySelectorAll('[data-plugin="hero-plus"]')];
  if(!roots.length)return;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  function splitText(el,mode){
    if(!el||el.dataset.hpSplitDone||!['words-rise','chars-wave'].includes(mode))return;
    const text=el.textContent||'';el.textContent='';el.classList.add('hp-split');
    const parts=mode==='words-rise'?text.split(/(\s+)/):[...text];let index=0;
    parts.forEach(part=>{if(!part)return;if(/^\s+$/.test(part)){el.append(document.createTextNode(part));return;}const span=document.createElement('span');span.className='hp-split-token';span.style.setProperty('--hp-i',index++);span.textContent=part;el.append(span);});
    el.dataset.hpSplitDone='true';
  }
  // Troca de slides em duas camadas: nunca some com o slide anterior
  // antes que a imagem seguinte esteja pronta e totalmente sobreposta.
  function setupSlides(root){
    const slides=[...root.querySelectorAll('.hp-slide')];
    if(slides.length<2)return;
    const control=root.querySelector('.hp-slide-control');
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let index=Math.max(0,slides.findIndex(s=>s.classList.contains('is-active')));
    const transitionMs=Math.max(200,parseFloat(getComputedStyle(root).getPropertyValue('--hp-transition-duration'))||1200);
    const interval=Math.max(transitionMs+450,1800,Number(root.dataset.slideDuration)||6500);
    if(reduce&&control)control.hidden=true;
    let paused=reduce||root.dataset.slideAutoplay!=='true';
    let visible=true,locked=false,transitionTimer=0,disposed=false;
    const updateControl=()=>{
      if(!control)return;
      control.setAttribute('aria-pressed',String(paused));
      control.setAttribute('aria-label',paused?'Reproduzir apresentação de imagens':'Pausar apresentação de imagens');
      control.querySelector('span').textContent=paused?'▶':'Ⅱ';
    };
    const preload=(slide)=>{
      const img=slide?.querySelector('img');
      if(!img)return Promise.resolve(false);
      if(img.complete&&img.naturalWidth>0)return Promise.resolve(true);
      img.loading='eager';
      if(typeof img.decode==='function')return img.decode().then(()=>img.naturalWidth>0).catch(()=>false);
      return new Promise(resolve=>{
        img.addEventListener('load',()=>resolve(true),{once:true});
        img.addEventListener('error',()=>resolve(false),{once:true});
      });
    };
    const dispose=()=>{
      if(disposed)return;
      disposed=true;clearInterval(timer);clearTimeout(transitionTimer);
      observer?.disconnect();root.__hpSlideTimer=null;
    };
    async function tick(){
      if(!root.isConnected){dispose();return;}
      if(paused||!visible||document.hidden||locked)return;
      locked=true;
      const next=(index+1)%slides.length;
      const ready=await preload(slides[next]);
      if(!ready||disposed||!root.isConnected||paused||!visible||document.hidden){locked=false;return;}
      const current=slides[index];
      const incoming=slides[next];
      // Ordem importa: mantém cobertura enquanto o próximo entra.
      current.classList.add('is-leaving');
      current.classList.remove('is-active');
      incoming.classList.remove('is-leaving');
      incoming.classList.add('is-active');
      index=next;
      // A próxima imagem é pré-carregada antes de ser necessária.
      preload(slides[(index+1)%slides.length]);
      transitionTimer=setTimeout(()=>{
        current.classList.remove('is-leaving');locked=false;
      },reduce?0:transitionMs+90);
    }
    control?.addEventListener('click',()=>{
      paused=!paused;updateControl();
    });
    const observer=typeof IntersectionObserver==='function'
      ?new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;},{threshold:0.05})
      :null;
    observer?.observe(root);
    const timer=(!reduce&&root.dataset.slideAutoplay==='true')?setInterval(tick,interval):null;
    root.__hpSlideTimer=timer;
    updateControl();
    if(timer)preload(slides[(index+1)%slides.length]);
  }
  function setupPointer(root){
    if(reduce)return;let raf=0,px=70,py=35;
    root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();px=((e.clientX-r.left)/r.width)*100;py=((e.clientY-r.top)/r.height)*100;if(raf)return;raf=requestAnimationFrame(()=>{root.style.setProperty('--hp-pointer-x',px+'%');root.style.setProperty('--hp-pointer-y',py+'%');raf=0;});},{passive:true});
    if(root.dataset.magnetic==='true')root.querySelectorAll('.hp-actions .button').forEach(btn=>{btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.12;const y=(e.clientY-r.top-r.height/2)*.18;btn.style.transform=`translate3d(${x}px,${y}px,0)`;});btn.addEventListener('pointerleave',()=>btn.style.transform='');});
  }
  function setupParticles(root){
    const canvas=root.querySelector('.hp-particles');if(!canvas||root.dataset.particles!=='true'||reduce)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;let particles=[],raf=0,w=0,h=0,dpr=Math.min(2,window.devicePixelRatio||1);let mx=-9999,my=-9999;
    const density=Math.max(8,Math.min(110,Number(root.dataset.particleDensity)||38));const speed=(Math.max(1,Number(root.dataset.particleSpeed)||22)/100)*.55;const size=Math.max(.4,Number(root.dataset.particleSize)||1.6);const alpha=Math.max(.04,Math.min(.8,(Number(root.dataset.particleOpacity)||30)/100));const magnetic=root.dataset.particleMagnetic==='true';const strength=Math.max(0,Number(root.dataset.magneticStrength)||42)/100;const style=root.dataset.particleStyle||'dust';
    function resize(){const r=root.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:density},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*speed,vy:(Math.random()-.5)*speed,r:size*(.55+Math.random()*1.7),phase:Math.random()*Math.PI*2}));}
    function draw(p,t){if(style==='bokeh'){ctx.beginPath();ctx.arc(p.x,p.y,p.r*3.2,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${alpha*.34})`;ctx.fill();return;}if(style==='lines'){ctx.strokeStyle=`rgba(255,255,255,${alpha*.45})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*28,p.y-p.vy*28);ctx.stroke();return;}if(style==='spark'){const a=alpha*(.55+.45*Math.sin(t*.002+p.phase));ctx.fillStyle=`rgba(255,255,255,${Math.max(.03,a)})`;ctx.fillRect(p.x,p.y,p.r*1.7,p.r*.55);return;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.fill();}
    function frame(t){if(!root.isConnected){observer.disconnect();return;}ctx.clearRect(0,0,w,h);for(const p of particles){if(magnetic&&mx>-100){const dx=mx-p.x,dy=my-p.y,dist2=dx*dx+dy*dy;if(dist2<50000&&dist2>25){const f=(1-dist2/50000)*strength*.018;p.vx+=dx*f;p.vy+=dy*f;}}p.vx*=.992;p.vy*=.992;p.x+=p.vx;p.y+=p.vy;if(p.x<-20)p.x=w+20;if(p.x>w+20)p.x=-20;if(p.y<-20)p.y=h+20;if(p.y>h+20)p.y=-20;draw(p,t);}raf=requestAnimationFrame(frame);}
    root.addEventListener('pointermove',e=>{const r=root.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;},{passive:true});root.addEventListener('pointerleave',()=>{mx=my=-9999;});const observer=new ResizeObserver(resize);observer.observe(root);resize();raf=requestAnimationFrame(frame);root.__hpParticleRaf=raf;
  }
  roots.forEach(root=>{root.querySelectorAll('[data-hp-animate]').forEach(el=>{const mode=el.dataset.hpAnimate||'none';if(mode==='none')return;splitText(el,mode);if(!['words-rise','chars-wave'].includes(mode))el.classList.add('hp-anim');});setupSlides(root);setupPointer(root);setupParticles(root);root.querySelectorAll('.hp-actions .button').forEach(button=>button.addEventListener('click',()=>window.Imobify&&Imobify.track('hero_plus_cta',{label:button.textContent.trim()})));});
})();

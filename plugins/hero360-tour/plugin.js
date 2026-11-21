/** Hero360Tour v1.2.7 - panorama full viewport, WebGL native, no third-party runtime. */
(function () {
 'use strict';
 const ID = 'hero360-tour';
 const instances = new WeakMap();
 const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
 const rad = v => v * Math.PI / 180;
 const deg = v => v * 180 / Math.PI;
 const wrap = v => ((v + 180) % 360 + 360) % 360 - 180;
 const safeUrl = v => {try { const url = new URL(v,document.baseURI);return ['https:','http:','mailto:','tel:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }};
 function parse(el) { try { return JSON.parse(el.querySelector('.ims360-config')?.value || '{}') || {}; } catch {return {};}}
 function glyph(type) {
   if(type==='info')return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><circle cx="32" cy="21" r="3.5" class="hs-fill"/><path d="M32 29v18" class="hs-stroke"/></svg>';
   if(type==='external')return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><path d="M25 39 42 22M31 22h11v11" class="hs-stroke"/></svg>';
   return '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="18" ry="6" class="hs-shadow"/><path d="M32 8 49 33H39v18H25V33H15Z" class="hs-arrow"/><path d="M32 11 45 31H36v17h-8V31h-9Z" class="hs-highlight"/></svg>';
 }
 const VS = `attribute vec2 a;varying vec2 uv;void main(){uv=a;gl_Position=vec4(a,0.0,1.0);}`;
 const FS = `precision highp float;
 varying vec2 uv;uniform sampler2D pano;uniform vec2 resolution;uniform float yaw;uniform float pitch;uniform float tanHalf;
 const float PI=3.141592653589793;
 void main(){
  float aspect=resolution.x/resolution.y;
  vec3 d=normalize(vec3(uv.x*tanHalf,uv.y*tanHalf/aspect,1.0));
  float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
  vec3 p=vec3(d.x,cp*d.y+sp*d.z,cp*d.z-sp*d.y);
  vec3 world=vec3(cy*p.x+sy*p.z,p.y,cy*p.z-sy*p.x);
  float longitude=atan(world.x,world.z);
  float latitude=asin(clamp(world.y,-1.0,1.0));
  vec2 tex=vec2(fract(0.5+longitude/(2.0*PI)),clamp(0.5+latitude/PI,0.0,1.0));
  gl_FragColor=texture2D(pano,tex);
 }`;
 function createGL(canvas) {
   const gl = canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:false, powerPreference:'high-performance'}) || canvas.getContext('experimental-webgl');
   if(!gl)return null;
   function compile(type,src){const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader 360: '+gl.getShaderInfoLog(shader));return shader;}
   const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VS));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL 360: '+gl.getProgramInfoLog(program));
   gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   const uniforms={resolution:gl.getUniformLocation(program,'resolution'),yaw:gl.getUniformLocation(program,'yaw'),pitch:gl.getUniformLocation(program,'pitch'),tanHalf:gl.getUniformLocation(program,'tanHalf'),pano:gl.getUniformLocation(program,'pano')};
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);// The longitude mapping already wraps using fract(). WebGL1 requires CLAMP_TO_EDGE for NPOT images.
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.uniform1i(uniforms.pano,0);
   return {gl,program,buffer,tex,uniforms,textureReady:false,maxTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE),destroy(){gl.deleteTexture(tex);gl.deleteBuffer(buffer);gl.deleteProgram(program)}};
 }

 function createCPU(canvas){
   const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});if(!ctx)return null;
   return {gl:null,ctx,textureReady:false,src:null,sw:0,sh:0,maxTexture:2048,destroy(){this.src=null},lastDraw:0};
 }
 function drawCPU(canvas,engine,yaw,pitch,hfov){
   if(!engine.src)return;
   const ctx=engine.ctx,W=canvas.width,H=canvas.height,src=engine.src,sw=engine.sw,sh=engine.sh;
   const output=ctx.createImageData(W,H),pixels=output.data,aspect=W/H,tan=Math.tan(hfov*Math.PI/360);
   const ya=yaw*Math.PI/180,pa=pitch*Math.PI/180,cp=Math.cos(pa),sp=Math.sin(pa),cy=Math.cos(ya),sy=Math.sin(ya);
   let j=0;
   for(let row=0;row<H;row++){
     const v=(1-2*(row+.5)/H)*tan/aspect;
     for(let col=0;col<W;col++){
       const u=(2*(col+.5)/W-1)*tan;
       const inv=1/Math.sqrt(1+u*u+v*v),dx=u*inv,dy=v*inv,dz=inv;
       const yy=cp*dy+sp*dz,zz=cp*dz-sp*dy;
       const wx=cy*dx+sy*zz,wz=cy*zz-sy*dx;
       const lon=Math.atan2(wx,wz),lat=Math.asin(Math.max(-1,Math.min(1,yy)));
       const sx=((Math.floor((.5+lon/(2*Math.PI))*sw)%sw)+sw)%sw;
       const syy=Math.max(0,Math.min(sh-1,Math.floor((.5-lat/Math.PI)*sh)));
       const k=(syy*sw+sx)*4;
       pixels[j++]=src[k];pixels[j++]=src[k+1];pixels[j++]=src[k+2];pixels[j++]=255;
     }
   }
   ctx.putImageData(output,0,0);
 }
 function initialize(root) {
  if(instances.has(root))return;
  const cfg=parse(root),scenes=cfg.scenes||{};
  const order=(Array.isArray(cfg.sceneOrder)?cfg.sceneOrder:Object.keys(scenes)).filter(id=>scenes[id]?.panorama);
  const stage=root.querySelector('.ims360-frame'),view=root.querySelector('.ims360-viewer'),poster=root.querySelector('.ims360-poster'),err=root.querySelector('.ims360-error'),label=root.querySelector('.ims360-scene-name');
  if(!stage||!view)return;
  const hero={eyebrow:root.querySelector('.ims360-eyebrow'),headline:root.querySelector('.ims360-headline'),body:root.querySelector('.ims360-subheadline'),cta:root.querySelector('[data-hero-cta]')};
  const defaults={eyebrow:hero.eyebrow?.textContent||'',headline:hero.headline?.textContent||'',body:hero.body?.textContent||''};
  root.style.setProperty('--ims360-opacity',String(clamp(parseFloat(root.style.getPropertyValue('--ims360-overlay')),0,75)/100));
  if(hero.cta){const href=safeUrl(hero.cta.getAttribute('href'));hero.cta.hidden=!href;if(href)hero.cta.href=href;}
  if(!order.length){const empty=root.querySelector('.ims360-empty');if(empty)empty.hidden=false;root.dataset.ims360Loaded='empty';return;}
  let canvas=document.createElement('canvas');canvas.className='ims360-gl';canvas.setAttribute('aria-label','Panorama 360 interativo');
  view.replaceChildren(canvas);
  const hotspotLayer=document.createElement('div');hotspotLayer.className='ims360-hotspot-layer';view.appendChild(hotspotLayer);
  let engine;
  try{engine=createGL(canvas)}catch(e){console.warn('[Hero360Tour] WebGL indisponível:',e)}
  if(!engine){
    // Um contexto WebGL parcialmente inicializado não permite reabrir o MESMO canvas em 2D.
    // Substituir o elemento garante o fallback quando a compilação do shader falhar no preview.
    const fallback=document.createElement('canvas');fallback.className=canvas.className;
    fallback.setAttribute('aria-label',canvas.getAttribute('aria-label'));
    canvas.replaceWith(fallback);canvas=fallback;
    engine=createCPU(canvas);
    root.dataset.ims360Renderer='canvas2d';
  }else root.dataset.ims360Renderer='webgl';
  if(!engine){if(err){err.textContent='Canvas indisponível; mostrando imagem estática.';err.hidden=false;}if(poster){poster.hidden=false;poster.src=scenes[order[0]].panorama;}root.dataset.ims360Loaded='error';return;}
  let gl=engine.gl;
  let disposed=false,sceneId=cfg.settings?.firstSceneId&&scenes[cfg.settings.firstSceneId]?.panorama?cfg.settings.firstSceneId:order[0];
  let yaw=0,pitch=0,hfov=clamp(root.dataset.heroHfov||118,60,140);
  let frame=0,resizeObserver=null,visible=true,dirty=true,transition=null,sequence=0,interactionAt=performance.now(),idleAnchor=null,pointer=null,hotspots=[],lastLoadedImage=null,firstFramePending=false;
  // Hero copy state independent of autonomous idle camera movement.
  let heroActivityStart=0,heroLastActivity=0,heroCopyHidden=false;
  let heroSensorYaw=yaw,heroSensorPitch=pitch;
  const heroCopy=root.querySelector('.ims360-copy');
  // Configuração por instância, persistida no projeto e transportada ao HTML exportado.
  // Ausência do atributo em páginas antigas preserva o comportamento de 5 segundos.
  const configuredHideDelay=Number(root.dataset.heroHideDelay);
  const HERO_HIDE_MS=(Number.isFinite(configuredHideDelay) && configuredHideDelay>0 ? clamp(configuredHideDelay,2,10) : 5)*1000;
  const HERO_RESTORE_MS=10000,HERO_MIN_HIDDEN_MS=2000;
  let heroHiddenAt=0;
  function markHeroActivity(){const now=performance.now();if(!heroActivityStart)heroActivityStart=now;heroLastActivity=now;}
  function syncHeroVisibility(now){
    if(!heroActivityStart)return;
    // 10s é um valor válido de delay. Nessa extremidade, proteger o texto de
    // aparecer no mesmo frame em que foi ocultado (interação pontual/hotspot).
    if(!heroCopyHidden && now-heroActivityStart>=HERO_HIDE_MS){
      heroCopyHidden=true;heroHiddenAt=now;
      stage.classList.add('ims360-copy-hidden');
      if(heroCopy){heroCopy.inert=true;heroCopy.setAttribute('aria-hidden','true');}
    }
    if(heroCopyHidden && now-heroLastActivity>=HERO_RESTORE_MS && now-heroHiddenAt>=HERO_MIN_HIDDEN_MS){
      heroActivityStart=0;heroLastActivity=0;heroHiddenAt=0;heroCopyHidden=false;
      stage.classList.remove('ims360-copy-hidden');
      if(heroCopy){heroCopy.inert=false;heroCopy.removeAttribute('aria-hidden');}
    }
  }
  const idleMs=clamp(root.dataset.idle||10,5,60)*1000, swayYaw=clamp(root.dataset.swayYaw||7,0,16),swayPitch=clamp(root.dataset.swayPitch||.8,0,3),cycleMs=clamp(root.dataset.swayCycle||19,8,35)*1000;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Immersive Motion — use browser device orientation (gyroscope + accelerometer fusion).
  // DeviceOrientationEvent.requestPermission() must be invoked directly from a user gesture.
  const motionBox=root.querySelector('.ims360-motion');
  const motionButton=motionBox?.querySelector('.ims360-motion-toggle');
  const motionAllowed=root.dataset.motionEnabled==='true';
  const motionTouchEnabled=root.dataset.motionTouch!=='false';
  const motionSensitivity=clamp(root.dataset.motionSensitivity||50,10,100)/50;
  const motionSmoothing=clamp(root.dataset.motionSmoothing??65,0,100);
  const motionAuto=root.dataset.motionActivation==='auto';
  const coarse=window.matchMedia?.('(pointer: coarse)')?.matches||/Android|iPad|iPhone|Mobile/i.test(navigator.userAgent||'');
  // Use DeviceOrientation on Safari and Chrome; Chromium Generic Sensor API is the
  // fallback when orientation events are absent or return unusable readings.
  const sensorCapable=typeof window.DeviceOrientationEvent!=='undefined'||typeof window.DeviceMotionEvent!=='undefined'||typeof window.RelativeOrientationSensor==='function'||typeof window.AbsoluteOrientationSensor==='function';
  const motion={active:false,pending:false,hasReading:false,hasMovement:false,sample:null,anchor:null,base:null,target:null,sceneView:{yaw:0,pitch:0},lastTick:performance.now(),watchdog:null,fallbackTimer:null,generic:null,source:'',readings:0,relativeSeen:false,sources:Object.create(null),rateView:{yaw:0,pitch:0},rateAt:0,startedAt:0,calibration:null,outlier:null};
  const disposers=[];
  // Public UI intentionally has NO debug panel or telemetry overlay.
  // Gyroscope readings remain local to the browser and never leave the device.
  function beginCalibration(baseYaw=yaw,basePitch=pitch){
    // Every scene and every sensor-source change starts with the CURRENT view.
    // A brief warm-up averages the starting orientation instead of jumping on the
    // first noisy sensor frame, and then restores normal tracking automatically.
    motion.anchor=null; motion.base={yaw:baseYaw,pitch:basePitch};
    motion.target={yaw:baseYaw,pitch:basePitch};
    motion.calibration={started:performance.now(),count:0,sin:0,cos:0,pitch:0};
    motion.outlier=null;
  }
  function calibrateSample(sample){
    const c=motion.calibration;
    if(!c)return false;
    const now=performance.now();
    // Use short, bounded sampling. Never require visitors to stand still or
    // leave them in calibration forever on low-frequency devices.
    c.count++;c.sin+=Math.sin(rad(sample.yaw));c.cos+=Math.cos(rad(sample.yaw));c.pitch+=sample.pitch;
    if(c.count<4 && now-c.started<220)return true;
    motion.anchor={yaw:deg(Math.atan2(c.sin,c.cos)),pitch:c.pitch/c.count};
    motion.calibration=null;
    motion.target={...motion.base};
    return true;
  }
  function motionMessage(value){ /* A interface pública apresenta apenas o botão. */ }
  function motionState(state,message){root.dataset.motionState=state;if(message!==undefined)motionMessage(message);}
  function motionSync(){
    if(motionButton){motionButton.setAttribute('aria-pressed',String(motion.active));
      const title=motionButton.querySelector('span');if(title)title.textContent=motion.active?'Desativar movimento':'Explorar em 360°';
      motionButton.disabled=motion.pending;}

  }
  function multiplyQuat(a,b){return {x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z};}
  function quaternionView(q){
    // W3C DeviceOrientation -> WebGL camera frame, including screen portrait/landscape.
    q=multiplyQuat(q,{x:Math.sin(-Math.PI/4),y:0,z:0,w:Math.cos(-Math.PI/4)});
    const angle=rad(-(window.screen?.orientation?.angle??window.orientation??0));
    q=multiplyQuat(q,{x:0,y:0,z:Math.sin(angle/2),w:Math.cos(angle/2)});
    const fx=-2*(q.x*q.z+q.w*q.y),fy=-2*(q.y*q.z-q.w*q.x),fz=-(1-2*(q.x*q.x+q.y*q.y));
    return {yaw:wrap(deg(Math.atan2(-fx,-fz))),pitch:clamp(deg(Math.asin(clamp(fy,-1,1))),-89,89)};
  }
  function deviceAngles(alpha,beta,gamma){
    const x=rad(beta),y=rad(alpha),z=rad(-gamma),c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2),s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
    return quaternionView({x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,z:c1*c2*s3-s1*s2*c3,w:c1*c2*c3+s1*s2*s3});
  }
  function motionAnchor(baseYaw=yaw,basePitch=pitch){
    if(!motion.sample)return;
    motion.anchor={...motion.sample};motion.base={yaw:baseYaw,pitch:basePitch};motion.target={yaw:baseYaw,pitch:basePitch};motion.calibration=null;motion.outlier=null;
  }
  // Keep evidence from EACH sensor source. Android can emit frozen DeviceOrientation
  // values while Generic Sensor or DeviceMotion continues producing real readings.
  function motionSample(sample,source){
    if(!motion.active||document.hidden||!sample||![sample.yaw,sample.pitch].every(Number.isFinite))return;
    const now=performance.now();
    const entry=motion.sources[source]||(motion.sources[source]={sample:null,lastChanged:0,lastSeen:0,changes:0,readings:0});
    const prev=entry.sample;
    const deviation=prev?Math.max(Math.abs(wrap(sample.yaw-prev.yaw)),Math.abs(sample.pitch-prev.pitch)):0;
    const moving=!!prev&&deviation>.22;
    entry.sample={...sample};entry.lastSeen=now;entry.readings++;
    if(moving){entry.lastChanged=now;entry.changes++;}
    const chosen=motion.sources[motion.source];
    const chosenStale=!chosen||(!chosen.changes&&now-motion.startedAt>1300)||(chosen.lastChanged&&now-chosen.lastChanged>1800);
    const sourceRank={'deviceorientation':4,'deviceorientationabsolute':3,generic:2,rotationRate:1};
    // Only switch if the new source is demonstrably moving, or if nothing is active.
    // Prefer browser orientation fusion to raw angular velocity when both are alive.
    const use=!motion.source||source===motion.source||(moving&&(chosenStale||(sourceRank[source]>sourceRank[motion.source]&&now-(chosen.lastChanged||0)>400)));
    if(!use)return;
    if(motion.source!==source){
      motion.source=source;beginCalibration(yaw,pitch);
      root.dataset.motionSource=source;
    }
    motion.hasReading=true;motion.readings++;motion.sample={...sample};
    if(moving)motion.hasMovement=true;
    root.dataset.motionReadings=String(motion.readings);
    root.dataset.motionChanges=String(entry.changes);
    if(!motion.anchor){calibrateSample(sample);return;}
    // Only real movement cancels the fallback and no-motion diagnostics.
    if(moving){
      if(motion.watchdog){clearTimeout(motion.watchdog);motion.watchdog=null;}
      if(motion.fallbackTimer){clearTimeout(motion.fallbackTimer);motion.fallbackTimer=null;}
      if(root.dataset.motionState!=='connected')motionState('connected','Movimento detectado ('+source+').');
      // Report real sensor movement, not mere arrival of constant values.
    }else if(!motion.hasMovement && root.dataset.motionState!=='waiting'){
      motionState('waiting','Leitura recebida. Gire o aparelho para testar o movimento.');
    }
    if(pointer)return;
    const a=motion.anchor,b=motion.base;
    // Heading is mathematically unstable as the phone points almost vertically.
    // Preserve last valid heading near the pole to avoid 180° flips.
    const nearPole=Math.abs(sample.pitch)>76;
    const currentYaw=nearPole?(motion.lastSafeYaw??a.yaw):sample.yaw;
    if(!nearPole)motion.lastSafeYaw=sample.yaw;
    let targetYaw=wrap(b.yaw+wrap(currentYaw-a.yaw)*motionSensitivity);
    let targetPitch=clamp(b.pitch+(sample.pitch-a.pitch)*motionSensitivity,-80,80);
    // Reject one-frame glitches but accept a sustained real movement on the
    // following frame. This prevents camera snaps caused by sensor fusion.
    const prior=motion.target||{yaw,pitch};
    const jump=Math.max(Math.abs(wrap(targetYaw-prior.yaw)),Math.abs(targetPitch-prior.pitch));
    const elapsed=now-(motion.lastTargetAt||now);
    if(jump>42 && elapsed<160){
      if(!motion.outlier || Math.abs(wrap(motion.outlier.yaw-targetYaw))>12 || Math.abs(motion.outlier.pitch-targetPitch)>12){
        motion.outlier={yaw:targetYaw,pitch:targetPitch};return;
      }
    }
    motion.outlier=null;motion.lastTargetAt=now;
    // Sub-degree jitter does not need to trigger another re-render. Avoid
    // fighting genuine slow intentional motion by comparing with the last target.
    if(Math.abs(wrap(targetYaw-prior.yaw))<.16)targetYaw=prior.yaw;
    if(Math.abs(targetPitch-prior.pitch)<.16)targetPitch=prior.pitch;
    motion.target={yaw:targetYaw,pitch:targetPitch};
  }
  function motionRead(event){
    // Do not throw away Android readings with a null axis. Browsers may send
    // alpha but omit a tilt axis; preserve last known values, then calibrate.
    const a=Number.isFinite(event.alpha)?event.alpha:null;
    const b=Number.isFinite(event.beta)?event.beta:null;
    const g=Number.isFinite(event.gamma)?event.gamma:null;
    if(a===null&&b===null&&g===null)return;
    const cached=motion.lastAngles||{};
    const values={alpha:a??cached.alpha??0,beta:b??cached.beta??(Math.abs(window.screen?.orientation?.angle||0)%180===90?0:90),gamma:g??cached.gamma??0};
    motion.lastAngles=values;
    motionSample(deviceAngles(values.alpha,values.beta,values.gamma),event.type==='deviceorientationabsolute'?'deviceorientationabsolute':'deviceorientation');
  }
  function motionRateRead(event){
    if(!motion.active||!visible||document.hidden)return;
    const rate=event.rotationRate;
    if(!rate)return;
    const horizontal=Number(rate.gamma),vertical=Number(rate.beta);
    if(!Number.isFinite(horizontal)&&!Number.isFinite(vertical))return;
    const now=performance.now(),duration=motion.rateAt?Math.min(.08,Math.max(0,(now-motion.rateAt)/1000)):0;
    motion.rateAt=now;
    // RotationRate is an emergency fallback, not a compass. Device axes in
    // portrait correspond approximately to yaw around Y and pitch around X.
    // Integration drifts, so prefer a moving fused orientation when available.
    const screenAngle=Number(window.screen?.orientation?.angle??window.orientation??0);
    const landscape=Math.abs(screenAngle)%180===90;
    // Fallback when a rotation axis is absent: the third available axis can
    // still provide angular velocity, calibrated relative to the scene.
    const yawRate=landscape?(Number(rate.beta)||Number(rate.alpha)||0):(Number(rate.gamma)||Number(rate.alpha)||0);
    const pitchRate=landscape?(Number(rate.gamma)||0):(Number(rate.beta)||0);
    if(duration){
      motion.rateView.yaw=wrap(motion.rateView.yaw-yawRate*duration);
      motion.rateView.pitch=clamp(motion.rateView.pitch+pitchRate*duration,-80,80);
    }
    // Do not take over based on noise around 0 degrees/second.
    if(Math.max(Math.abs(yawRate),Math.abs(pitchRate))>1.2){
      motionSample(motion.rateView,'rotationRate');
    }
  }
  function motionGenericStop(){
    if(motion.generic){try{motion.generic.stop()}catch(_){ }motion.generic=null;}
  }
  function motionGenericStart(){
    if(!motion.active||motion.generic)return;
    const Sensor=typeof window.RelativeOrientationSensor==='function'?window.RelativeOrientationSensor:window.AbsoluteOrientationSensor;
    if(typeof Sensor!=='function')return;
    try{
      const sensor=new Sensor({frequency:30});motion.generic=sensor;
      sensor.addEventListener('reading',()=>{
        if(!sensor.quaternion||sensor.quaternion.length!==4)return;
        const [x,y,z,w]=sensor.quaternion;
        if(![x,y,z,w].every(Number.isFinite))return;
        motionSample(quaternionView({x,y,z,w}),'generic');
      });
      sensor.addEventListener('error',event=>{
        const name=event.error?.name||'Erro';console.warn('[Hero360Tour] Sensor API:',name);
        motionGenericStop();
        if(!motion.hasReading)motionState('waiting','Sensor alternativo indisponível. Aguardando orientação do navegador…');
      });
      sensor.start();
    }catch(error){console.warn('[Hero360Tour] Sensor alternativo:',error);motionGenericStop();}
  }
  function motionStop(message='',state='off'){
    motion.active=false;motion.pending=false;motion.anchor=null;motion.base=null;motion.target=null;motion.hasReading=false;motion.hasMovement=false;motion.sample=null;motion.relativeSeen=false;motion.source='';motion.sources=Object.create(null);motion.rateAt=0;motion.calibration=null;motion.outlier=null;
    if(motion.watchdog){clearTimeout(motion.watchdog);motion.watchdog=null;}
    if(motion.fallbackTimer){clearTimeout(motion.fallbackTimer);motion.fallbackTimer=null;}
    window.removeEventListener('deviceorientation',motionRead);
    window.removeEventListener('deviceorientationabsolute',motionRead);
    window.removeEventListener('devicemotion',motionRateRead);
    motionGenericStop();motionSync();motionState(state,message);stopIdle();
  }
  function motionPolicyBlocked(){
    const policy=document.permissionsPolicy||document.featurePolicy;
    if(!policy||typeof policy.allowsFeature!=='function')return false;
    try{return ['accelerometer','gyroscope'].some(feature=>policy.allowsFeature(feature)===false)}catch(_){return false}
  }
  async function motionStart(){
    if(!motionAllowed||!coarse)return;
    if(!window.isSecureContext){motionState('insecure','Sensores exigem HTTPS. Abra a página publicada em HTTPS.');return;}
    if(motionPolicyBlocked()){motionState('blocked','Sensores bloqueados pelo iframe ou pela política do site. Abra o tour na página pública.');return;}
    if(!sensorCapable){motionState('unsupported','Este navegador não disponibiliza sensores de orientação. Use o toque.');return;}
    motion.pending=true;motionSync();motionState('permission','Solicitando acesso aos sensores…');
    try{
      // Both permission requests are started INSIDE the original click gesture.
      // iOS may require separate permissions for DeviceOrientation and DeviceMotion.
      const requests=[];
      const orientationAPI=window.DeviceOrientationEvent;
      const motionAPI=window.DeviceMotionEvent;
      // Do not schedule permission requests through callbacks or timers.
      if(orientationAPI&&typeof orientationAPI.requestPermission==='function')requests.push(Promise.resolve(orientationAPI.requestPermission()));
      if(motionAPI&&typeof motionAPI.requestPermission==='function')requests.push(Promise.resolve(motionAPI.requestPermission()));
      if(requests.length){
        const results=await Promise.allSettled(requests);
        if(results.every(result=>result.status!=='fulfilled'||result.value!=='granted'))throw Error('Permissões de movimento negadas');
      }
      motion.active=true;motion.hasReading=false;motion.hasMovement=false;motion.relativeSeen=false;
      motion.anchor=null;motion.target=null;motion.sample=null;motion.readings=0;motion.lastSafeYaw=null;motion.lastTargetAt=0;
      motion.source='';motion.sources=Object.create(null);motion.lastAngles=null;motion.startedAt=performance.now();motion.rateAt=0;motion.rateView={yaw:0,pitch:0};motion.pending=false;
      root.dataset.motionSource='';root.dataset.motionReadings='0';root.dataset.motionChanges='0';
      window.addEventListener('deviceorientation',motionRead,{passive:true});
      window.addEventListener('deviceorientationabsolute',motionRead,{passive:true});
      window.addEventListener('devicemotion',motionRateRead,{passive:true});
      beginCalibration(yaw,pitch);motionSync();motionState('waiting','');
      // A fixed DeviceOrientation stream must NOT prevent Generic Sensor from
      // starting; this was the source starvation bug affecting some Androids.
      motion.fallbackTimer=setTimeout(()=>{if(motion.active&&!motion.hasMovement)motionGenericStart();},1500);
      motion.watchdog=setTimeout(()=>{
        if(!motion.active)return;
        if(!motion.hasReading)motionState('no-data','Nenhum dado recebido. Confira HTTPS, permissões e políticas de sensores do site.');
        else if(!motion.hasMovement)motionState('no-motion','Leituras sem mudança. Gire o aparelho; tente abrir fora do preview.');
      },7000);
    }catch(error){console.warn('[Hero360Tour] Acesso a movimento:',error);motionStop('Permissão de movimento não concedida. Verifique as permissões do navegador.','denied');}
  }
  if(motionBox){
    motionBox.hidden=!(motionAllowed&&coarse);
    if(motionAllowed&&coarse&&!window.isSecureContext)motionState('insecure','Abra a página em HTTPS para usar movimento.');
    else if(motionAllowed&&coarse&&motionPolicyBlocked())motionState('blocked','Preview com sensores bloqueados. Teste a página publicada em HTTPS.');
    else if(motionAllowed&&coarse&&!sensorCapable)motionState('unsupported','Sensor de orientação indisponível neste navegador.');
  }
  if(motionButton)motionButton.addEventListener('click',()=>{if(motion.active)motionStop();else motionStart();});
  function handleScreenRotation(){if(motion.active){beginCalibration(yaw,pitch);motion.rateView={yaw:0,pitch:0};motion.rateAt=0;dirty=true;}}
  on(window,'orientationchange',handleScreenRotation);
  if(window.screen?.orientation?.addEventListener)on(window.screen.orientation,'change',handleScreenRotation);
  motionSync();
  if(motionAllowed&&coarse&&sensorCapable&&motionAuto&&typeof window.DeviceOrientationEvent?.requestPermission!=='function')motionStart();

  function on(t,e,f,opt){t.addEventListener(e,f,opt);disposers.push(()=>t.removeEventListener(e,f,opt));}
  function resetHero(){if(hero.eyebrow)hero.eyebrow.textContent=defaults.eyebrow;if(hero.headline)hero.headline.textContent=defaults.headline;if(hero.body)hero.body.textContent=defaults.body;stage.classList.remove('ims360-spot-selected')}
  function setHero(h,s){if(hero.eyebrow)hero.eyebrow.textContent=h.bannerEyebrow||h.heroEyebrow||h.text||s.title||'';if(hero.headline)hero.headline.textContent=h.bannerHeadline||h.heroHeadline||h.text||s.title||'';if(hero.body)hero.body.textContent=h.bannerBody||h.heroSubheadline||h.info||'';stage.classList.add('ims360-spot-selected')}
  function stopIdle(){interactionAt=performance.now();idleAnchor=null}
  function animateTo(y,p,h=null){const start=performance.now();const orig={yaw,pitch,hfov};transition={start,from:orig,to:{yaw:yaw+wrap(y-yaw),pitch:clamp(p,-80,80),hfov:h||hfov},duration:reduced?.matches?0:750};stopIdle();dirty=true}
  function useCanvas2D(reason){
    if(!gl)return;
    console.warn('[Hero360Tour] Recuperação em Canvas 2D:',reason);
    try{engine.destroy()}catch(_){}
    const replacement=document.createElement('canvas');
    replacement.className=canvas.className;
    replacement.setAttribute('aria-label',canvas.getAttribute('aria-label')||'Panorama 360 interativo');
    canvas.replaceWith(replacement);canvas=replacement;
    engine=createCPU(canvas);gl=null;
    if(!engine)throw Error('O navegador não disponibilizou Canvas 2D');
    root.dataset.ims360Renderer='canvas2d';bindCanvasEvents();resize();
  }
  function revealFirstFrame(){
    if(!firstFramePending)return;
    firstFramePending=false;
    root.dataset.ims360Loaded='true';
    if(poster){
      // Keep the photograph displayed until the interactive panorama has actually painted.
      poster.classList.add('ims360-ready');
      window.setTimeout(()=>{if(!firstFramePending)poster.hidden=true;},360);
    }
    if(err)err.hidden=true;
  }
  function uploadImage(img){
    lastLoadedImage=img;
    const w=img.naturalWidth,h=img.naturalHeight;
    if(!w||!h)throw Error('Imagem sem dimensões');
    const max=Math.min(engine.maxTexture,gl?4096:2048);const outWidth=Math.max(256,Math.min(w,max));const outHeight=Math.max(128,Math.round(outWidth/2));
    const off=document.createElement('canvas');off.width=outWidth;off.height=outHeight;
    const ctx=off.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas de panorama indisponível');
    ctx.drawImage(img,0,0,outWidth,outHeight);
    if(gl){
      try {
        gl.bindTexture(gl.TEXTURE_2D,engine.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,off);
        const glError=gl.getError();
        if(glError!==gl.NO_ERROR)throw new Error('Falha na textura WebGL: '+glError);
      } catch(error) {
        useCanvas2D(error);
      }
    }
    if(!gl){
      const raw=ctx.getImageData(0,0,outWidth,outHeight);
      engine.src=raw.data;engine.sw=outWidth;engine.sh=outHeight;
    }
    engine.textureReady=true;dirty=true;firstFramePending=true;
    root.dataset.ims360Loaded='rendering';
  }
  function loadScene(id,targetView){
    if(!scenes[id]?.panorama)return;
    const serial=++sequence;
    const s=scenes[id];sceneId=id;label.textContent=s.title||id;
    resetHero();stopIdle();transition=null;
    const v=targetView||s.initialView||{};yaw=Number.isFinite(Number(v.yaw))?wrap(Number(v.yaw)):0;pitch=clamp(v.pitch??0,-80,80);hfov=clamp(v.hfov??root.dataset.heroHfov??118,50,140);
    motion.sceneView={yaw,pitch};if(motion.active)beginCalibration(yaw,pitch);else {motion.anchor=null;motion.target=null;}
    hotspots=[];hotspotLayer.replaceChildren();
    for(const spot of s.hotspots||[]){
      const el=document.createElement('div');el.className='ims360-hotspot-shell';el.dataset.hotspotId=spot.id||'';el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',spot.text||'Ponto de interesse');
      const scale=document.createElement('div');scale.className='hotspot-scale';const perspective=document.createElement('div');perspective.className='hotspot-perspective';const pulse=document.createElement('span');pulse.className='hotspot-pulse';perspective.appendChild(pulse);
      const rotate=document.createElement('div');rotate.className='hotspot-rotate';rotate.style.transform=`rotate(${Number(spot.rotation)||0}deg)`;
      const icon=document.createElement('div');icon.className='hotspot-icon';icon.innerHTML=glyph(spot.type);rotate.appendChild(icon);perspective.appendChild(rotate);scale.appendChild(perspective);el.appendChild(scale);
      const strength=clamp(spot.perspectiveStrength??1,0,2),floor=clamp(-Number(spot.pitch||0)/48,0,1),tilt=spot.perspective===false?0:(6+floor*70)*strength,depth=spot.perspective===false?1:1-floor*.18*strength,vertical=spot.perspective===false?1:1-floor*.22*strength,ss=clamp(spot.scale??1,.5,2)*depth;
      perspective.style.transform=`perspective(220px) rotateX(${tilt}deg) scale(${ss},${ss*vertical})`;
      if(spot.text){const name=document.createElement('span');name.className='ims360-hotspot-tooltip';name.textContent=spot.text;el.append(name)}
      function activate(e){e.preventDefault();e.stopPropagation();markHeroActivity();stopIdle();if(spot.type==='navigation'&&scenes[spot.targetSceneId]?.panorama){loadScene(spot.targetSceneId,spot.targetView);return;}if(spot.type==='info'){animateTo(Number(spot.yaw)||0,Number(spot.pitch)||0);setHero(spot,s);return;}if(spot.type==='external'){const url=safeUrl(spot.url);if(url)window.open(url,'_blank','noopener,noreferrer');}}
      el.addEventListener('click',activate);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')activate(e)});
      hotspotLayer.appendChild(el);hotspots.push({spot,el});
    }
    root.dataset.ims360Loaded='false';
    firstFramePending=false;lastLoadedImage=null;engine.textureReady=false;
    if(poster){poster.classList.remove('ims360-ready');poster.hidden=false;poster.src=s.panorama;}
    const image=new Image();image.decoding='async';
    if(/^https?:\/\//i.test(String(s.panorama)))image.crossOrigin='anonymous';
    image.onload=()=>{if(disposed||serial!==sequence)return;try{uploadImage(image);}catch(error){showError(error)}};
    image.onerror=()=>{if(!disposed&&serial===sequence)showError(new Error('Falha ao carregar panorama: '+s.panorama))};
    image.src=s.panorama;
    dirty=true;
  }
  function showError(error){
    console.warn('[Hero360Tour]',error);
    firstFramePending=false;
    root.dataset.ims360Loaded='error';
    if(poster){poster.classList.remove('ims360-ready');poster.hidden=false;}
    if(err){err.textContent='Não foi possível abrir o panorama interativo. Verifique a imagem 360 ou a permissão de acesso; a imagem original permanece visível.';err.hidden=false;}
  }
  function resize(){const w=Math.max(1,Math.floor(view.clientWidth)),h=Math.max(1,Math.floor(view.clientHeight));const dpr=Math.min(window.devicePixelRatio||1,1.5);const scale=gl?dpr:Math.min(1,560/w);const tw=Math.max(1,Math.round(w*scale)),th=Math.max(1,Math.round(h*scale));if(canvas.width!==tw||canvas.height!==th){canvas.width=tw;canvas.height=th;canvas.style.width=w+'px';canvas.style.height=h+'px';if(gl)gl.viewport(0,0,tw,th);dirty=true;} }
  function projectSpots(){
    const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
    const aspect=w/h,tanHalf=Math.tan(rad(hfov)/2),cy=Math.cos(rad(yaw)),sy=Math.sin(rad(yaw)),cp=Math.cos(rad(pitch)),sp=Math.sin(rad(pitch));
    for(const {spot,el} of hotspots){const a=rad(Number(spot.yaw)||0),b=rad(Number(spot.pitch)||0),worldX=Math.sin(a)*Math.cos(b),worldY=Math.sin(b),worldZ=Math.cos(a)*Math.cos(b);
      const x=cy*worldX-sy*worldZ,z0=sy*worldX+cy*worldZ,y=cp*worldY-sp*z0,z=sp*worldY+cp*z0;
      if(z<=.01){el.hidden=true;continue;}
      const u=(x/z)/tanHalf,v=(y/z)*aspect/tanHalf;
      el.hidden=Math.abs(u)>1.09||Math.abs(v)>1.09;
      if(!el.hidden){el.style.left=((u+1)*w/2)+'px';el.style.top=((1-v)*h/2)+'px';}
    }
  }
  function render(){
    if(!engine.textureReady)return;
    resize();
    if(gl){gl.useProgram(engine.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,engine.tex);
    gl.uniform2f(engine.uniforms.resolution,canvas.width,canvas.height);
    gl.uniform1f(engine.uniforms.yaw,rad(yaw));gl.uniform1f(engine.uniforms.pitch,rad(pitch));gl.uniform1f(engine.uniforms.tanHalf,Math.tan(rad(hfov)/2));
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    const error=gl.getError();
    if(error!==gl.NO_ERROR){
      try{useCanvas2D('Erro WebGL ao desenhar: '+error);if(lastLoadedImage)uploadImage(lastLoadedImage);}catch(e){showError(e)}
      return;
    }
    // An incomplete texture can return NO_ERROR and still paint a completely black frame.
    // Inspect four small samples only on the first frame. Avoid showing a black preview.
    if(firstFramePending){
      try{
        const pixel=new Uint8Array(4);
        let hasVisibleColor=false;
        for(const [x,y] of [[.25,.25],[.75,.25],[.25,.75],[.75,.75],[.5,.5]]){
          gl.readPixels(Math.min(canvas.width-1,Math.floor(canvas.width*x)),Math.min(canvas.height-1,Math.floor(canvas.height*y)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
          if(pixel[0]>7||pixel[1]>7||pixel[2]>7){hasVisibleColor=true;break;}
        }
        if(!hasVisibleColor || gl.getError()!==gl.NO_ERROR){
          useCanvas2D('O primeiro quadro WebGL permaneceu preto');
          if(lastLoadedImage)uploadImage(lastLoadedImage);
          return;
        }
      }catch(error){
        try{useCanvas2D(error);if(lastLoadedImage)uploadImage(lastLoadedImage);}catch(fallbackError){showError(fallbackError)}
        return;
      }
    }}
    else {drawCPU(canvas,engine,yaw,pitch,hfov);engine.lastDraw=performance.now();}
    revealFirstFrame();projectSpots();dirty=false;
  }
  function tick(t){if(disposed)return;
    const sensorTickTime=t;
    if(transition){const e=transition.duration?clamp((t-transition.start)/transition.duration,0,1):1,sm=e*e*(3-2*e);yaw=wrap(transition.from.yaw+(transition.to.yaw-transition.from.yaw)*sm);pitch=transition.from.pitch+(transition.to.pitch-transition.from.pitch)*sm;hfov=transition.from.hfov+(transition.to.hfov-transition.from.hfov)*sm;dirty=true;if(e>=1){transition=null;if(motion.active)motionAnchor(yaw,pitch);}}
    else if(motion.active&&motion.target&&visible&&!document.hidden&&!pointer){const dt=Math.min(80,Math.max(1,t-motion.lastTick));const errorSize=Math.max(Math.abs(wrap(motion.target.yaw-yaw)),Math.abs(motion.target.pitch-pitch));const tau=motionSmoothing===0?0:Math.max(16,(25+motionSmoothing*1.2)/(1+errorSize/12));const k=tau===0?1:1-Math.exp(-dt/tau);yaw=wrap(yaw+wrap(motion.target.yaw-yaw)*k);pitch=clamp(pitch+(motion.target.pitch-pitch)*k,-80,80);dirty=true;if(Math.abs(wrap(yaw-heroSensorYaw))+Math.abs(pitch-heroSensorPitch)>.5){heroSensorYaw=yaw;heroSensorPitch=pitch;markHeroActivity();}}
    else if(!motion.active&&!reduced?.matches&&visible&&t-interactionAt>=idleMs){if(!idleAnchor)idleAnchor={t,yaw,pitch};const dt=(t-idleAnchor.t)/cycleMs*Math.PI*2;yaw=wrap(idleAnchor.yaw+Math.sin(dt)*swayYaw);pitch=clamp(idleAnchor.pitch+Math.sin(dt*.63)*swayPitch,-80,80);dirty=true;}
    motion.lastTick=sensorTickTime;
    syncHeroVisibility(t);

    if(visible&&dirty&&(gl||t-engine.lastDraw>115))render();frame=requestAnimationFrame(tick);
  }
  // Gesture arbitration: page scrolling always wins over vertical touch gestures.
  // The camera uses at most 100px of vertical mouse drag; horizontal rotation remains unrestricted.
  const VERTICAL_DRAG_LIMIT=100;
  function pdown(e){
    if(e.button!==0 || (e.pointerType==='touch' && e.isPrimary===false))return;
    if(motion.active&&!motionTouchEnabled)return;
    const touch=e.pointerType==='touch';
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,touch,axis:touch?'pending':'drag'};
    transition=null;stopIdle();markHeroActivity();
    // Do not capture touch until a horizontal gesture is identified, so the browser can pan vertically.
    if(!touch)try{canvas.setPointerCapture?.(e.pointerId)}catch(_){}
  }
  function pmove(e){
    if(!pointer||pointer.id!==e.pointerId)return;
    const deltaX=e.clientX-pointer.x,deltaY=e.clientY-pointer.y;
    if(pointer.touch && pointer.axis==='pending'){
      if(Math.max(Math.abs(deltaX),Math.abs(deltaY))<8)return;
      if(Math.abs(deltaY)>Math.abs(deltaX)){
        // touch-action:pan-y gives the vertical gesture directly to native document scrolling.
        pointer=null;return;
      }
      pointer.axis='horizontal';
      try{canvas.setPointerCapture?.(e.pointerId)}catch(_){}
    }
    const gain=hfov/Math.max(200,view.clientWidth);
    yaw=wrap(pointer.yaw-deltaX*gain);
    // Never consume more than 100px on the vertical axis while dragging the panorama.
    pitch=clamp(pointer.pitch+clamp(deltaY,-VERTICAL_DRAG_LIMIT,VERTICAL_DRAG_LIMIT)*gain,-80,80);
    dirty=true;stopIdle();markHeroActivity();
  }
  function pup(e){
    if(pointer?.id!==e.pointerId)return;
    pointer=null;stopIdle();markHeroActivity();
    if(motion.active){motionAnchor(yaw,pitch);}
    try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch(_){}
  }
  function zoom(delta){hfov=clamp(hfov+delta,50,140);dirty=true;stopIdle();markHeroActivity();}
  function bindCanvasEvents(){on(canvas,'pointerdown',pdown);on(canvas,'pointermove',pmove);on(canvas,'pointerup',pup);on(canvas,'pointercancel',pup);on(canvas,'keydown',keyControl);canvas.tabIndex=0;}
  // No wheel handler: wheel / trackpad scroll the landing page, not the panorama.
  const navigationPanelEnabled=root.dataset.navigationPanel==='true';
  function keyControl(e){let handled=true;if(e.key==='ArrowLeft')yaw=wrap(yaw-5);else if(e.key==='ArrowRight')yaw=wrap(yaw+5);else if(e.key==='ArrowUp')pitch=clamp(pitch+5,-80,80);else if(e.key==='ArrowDown')pitch=clamp(pitch-5,-80,80);else if(navigationPanelEnabled&&(e.key==='+'||e.key==='='))zoom(-5);else if(navigationPanelEnabled&&e.key==='-')zoom(5);else handled=false;if(handled){e.preventDefault();stopIdle();markHeroActivity();dirty=true;if(motion.active)motionAnchor(yaw,pitch)}}
  bindCanvasEvents();
  on(canvas,'webglcontextlost',e=>{
    e.preventDefault();
    try{
      useCanvas2D('Contexto gráfico perdido');
      if(lastLoadedImage)uploadImage(lastLoadedImage);
    }catch(error){showError(error)}
  });
  // Navigation toolbar is opt-in. Legacy sections without this prop stay uncluttered.
  if(navigationPanelEnabled){
    const controls=document.createElement('div');
    controls.className='ims360-controls';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Painel de navegação do panorama');
    controls.innerHTML='<button type="button" data-action="zoom-in" aria-label="Aproximar">+</button><button type="button" data-action="zoom-out" aria-label="Afastar">−</button><button type="button" data-action="fullscreen" aria-label="Tela cheia">⛶</button>';
    view.appendChild(controls);
    controls.querySelector('[data-action="zoom-in"]').addEventListener('click',()=>zoom(-7));
    controls.querySelector('[data-action="zoom-out"]').addEventListener('click',()=>zoom(7));
    controls.querySelector('[data-action="fullscreen"]').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else stage.requestFullscreen?.()});
  }
  const toggle=root.querySelector('.ims360-scene-toggle'),menu=root.querySelector('.ims360-scene-list');
  if(toggle&&menu){const enabled=root.dataset.scenesMenu==='true';toggle.hidden=!enabled;menu.hidden=true;if(enabled){const id='ims360-scene-menu-'+Math.random().toString(36).slice(2);menu.id=id;toggle.setAttribute('aria-controls',id);toggle.addEventListener('click',()=>{markHeroActivity();menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))});for(const id of order){const btn=document.createElement('button');btn.type='button';btn.textContent=scenes[id].title||id;btn.addEventListener('click',()=>{markHeroActivity();loadScene(id);menu.hidden=true;toggle.setAttribute('aria-expanded','false')});menu.append(btn)}}}
  const oldNav=root.querySelector('.ims360-navigation');if(oldNav)oldNav.hidden=true;
  if('ResizeObserver' in window){resizeObserver=new ResizeObserver(()=>{resize();dirty=true});resizeObserver.observe(stage);resizeObserver.observe(view);}
  on(window,'resize',()=>{resize();dirty=true});
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)dirty=true},{threshold:.01});observer.observe(stage);disposers.push(()=>observer.disconnect())}
  const removal=new MutationObserver(()=>{if(!root.isConnected){disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();motionStop();for(const f of disposers)f();engine.destroy();removal.disconnect();instances.delete(root)}});removal.observe(document.documentElement,{childList:true,subtree:true});
  instances.set(root,{getView:()=>({yaw,pitch,hfov}),loadScene,gl:engine.gl});
  loadScene(sceneId);resize();frame=requestAnimationFrame(tick);
 }
 function scan(){document.querySelectorAll(`[data-plugin="${ID}"] .ims360`).forEach(initialize)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
 new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();

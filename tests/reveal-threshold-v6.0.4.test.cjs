const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../plugins/reveal/plugin.js'),'utf8');
function scenario(type, limit, replay=false){
  let rect={top:1000,bottom:1500,left:0,right:1000,width:1000,height:500};
  const classes=new Set();const vars={};
  const el={isConnected:true,dataset:{motionReplay:String(replay)},matches:()=>false,getAttribute(k){return {'data-motion-threshold':String(limit),'data-section-transition':type}[k]??null;},getBoundingClientRect:()=>rect,classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},style:{setProperty:(k,v)=>vars[k]=v},dispatchEvent(){} };
  const document={readyState:'complete',documentElement:{dataset:{},classList:{add(){}},clientWidth:1000,clientHeight:1000},querySelectorAll:()=>[el],body:{}};
  const window={innerHeight:1000,innerWidth:1000,requestAnimationFrame:fn=>fn(),addEventListener(){},matchMedia:()=>({matches:false})};
  vm.runInNewContext(source,{document,window,Set,Number,Math,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail;}}});
  const check=(top)=>{rect={top,bottom:top+500,left:0,right:1000,width:1000,height:500}; window._scroll?.();return classes.has('is-visible');};
  // Captures scroll callback via a second clean scenario, without DOM dependency.
  return {el,classes,vars,update:()=>{const scriptCtx=globalThis;},document,window};
}
function run(type){
  let scroll;let y=950;const classes=new Set(),styles={};
  const el={isConnected:true,dataset:{motionReplay:'true'},matches:()=>false,getAttribute:k=>({'data-motion-threshold':'0.20','data-section-transition':type}[k]??null),getBoundingClientRect:()=>({top:y,bottom:y+500,left:0,right:1000,width:1000,height:500}),classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},style:{setProperty:(k,v)=>styles[k]=v},dispatchEvent(){} };
  const document={readyState:'complete',documentElement:{dataset:{},classList:{add(){}},clientWidth:1000,clientHeight:1000},querySelectorAll:()=>[el],body:{}};
  const window={innerHeight:1000,innerWidth:1000,requestAnimationFrame:f=>f(),addEventListener:(ev,fn)=>{if(ev==='scroll')scroll=fn;},matchMedia:()=>({matches:false})};
  vm.runInNewContext(source,{document,window,Set,Number,Math,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail;}}});
  assert.equal(classes.has('is-visible'),false,`${type}: 10% should not trigger`);
  y=900;scroll();assert.equal(classes.has('is-visible'),true,`${type}: 20% should trigger`);
  if(type==='curtain-reveal')assert.equal(styles['--imobify-curtain-side'],'50.000%');
  y=950;scroll();assert.equal(classes.has('is-visible'),false,`${type}: replay should reset below 20%`);
}
for(const effect of ['default','fade','scroll-reveal','mask-reveal','curtain-reveal','scroll-triggered','liquid-blur','ripple-reveal','soft-focus'])run(effect);
console.log('9 effects: threshold 10% blocked, 20% triggered, replay reset. PASS');

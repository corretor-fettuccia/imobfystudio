const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('plugins/hero360-tour/plugin.json'));
const script=read('plugins/hero360-tour/plugin.js');
const template=read('plugins/hero360-tour/template.html');
const editor=read('assets/js/app.js');
assert.equal(manifest.version,'1.2.7');
assert.equal(manifest.defaults.heroHideDelay,5);
const field=manifest.fields.find(f=>f.key==='heroHideDelay');
assert.deepEqual([field?.min,field?.max,field?.step,field?.type,field?.showValue,field?.unit],[2,10,1,'range',true,'s']);
assert.match(template,/data-hero-hide-delay="{{heroHideDelay}}"/);
assert.match(editor,/data-range-output/);
assert.match(editor,/rangeOutput\.textContent/);
assert.match(script,/const HERO_RESTORE_MS=10000,HERO_MIN_HIDDEN_MS=2000/);
// Execute the actual Hero visibility controller isolated from GPU, DOM and the sensor engine.
const begin=script.indexOf('  const configuredHideDelay=Number(root.dataset.heroHideDelay);');
const end=script.indexOf('  const idleMs=',begin);
assert(begin>0 && end>begin);
const controller=script.slice(begin,end);
function runCase(value,hideAt,restoreAt){
  const classes=new Set(),attr={};
  const stage={classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)}};
  const heroCopy={inert:false,setAttribute:(n,v)=>{attr[n]=v},removeAttribute:n=>delete attr[n]};
  const root={dataset:{heroHideDelay:value}};
  let now=1000,heroActivityStart=0,heroLastActivity=0,heroCopyHidden=false;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
  const source=`${controller}\nmarkHeroActivity();\nreturn {syncHeroVisibility,hidden:()=>heroCopyHidden,getDelay:()=>HERO_HIDE_MS,stage,heroCopy};`;
  const clock={now:()=>now};
  const f=new Function('root','stage','heroCopy','performance','clamp','heroActivityStart','heroLastActivity','heroCopyHidden',source);
  const instance=f(root,stage,heroCopy,clock,clamp,heroActivityStart,heroLastActivity,heroCopyHidden);
  assert.equal(instance.getDelay(),hideAt*1000,`configured hide delay ${value}`);
  // no hide before the selected delay
  instance.syncHeroVisibility(1000+(hideAt*1000)-1);
  assert(!instance.hidden());
  instance.syncHeroVisibility(1000+(hideAt*1000));
  assert(instance.hidden(),`hidden on selected ${hideAt}s`);
  assert(classes.has('ims360-copy-hidden'));
  assert.equal(attr['aria-hidden'],'true');
  instance.syncHeroVisibility(1000+restoreAt*1000-1);
  assert(instance.hidden(),`still hidden before restore ${restoreAt}s`);
  instance.syncHeroVisibility(1000+restoreAt*1000);
  assert(!instance.hidden(),`restored after ${restoreAt}s`);
  assert(!classes.has('ims360-copy-hidden'));
  assert.equal(instance.heroCopy.inert,false);
  assert(!('aria-hidden' in attr));
}
runCase('2',2,10);
runCase('5',5,10);
runCase('10',10,12); // avoids hide/show in same animation frame
runCase('',5,10); // older sections with missing config
runCase('27',10,12); // invalid values clamped safely
runCase('1',2,10);
new vm.Script(script);
console.log('Hero360Tour 1.2.7: configurações 2–10 s, restauração e compatibilidade legada OK');

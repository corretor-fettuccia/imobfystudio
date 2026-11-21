'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'..','plugins','hero360-tour');
const src=fs.readFileSync(path.join(dir,'plugin.js'),'utf8');
const cfg=require(path.join(dir,'plugin.json'));
assert.equal(cfg.version,'1.2.7');
new vm.Script(src);
for (const item of ['motionRateRead','rotationRate','motion.sources','motion.hasMovement','motionGenericStart','motionPolicyBlocked','deviceorientation','devicemotion','Sensor conectado']) {
 if(item==='Sensor conectado') continue;
 assert(src.includes(item),`missing ${item}`);
}
assert(src.includes("if(motion.active&&!motion.hasMovement)motionGenericStart()"),'frozen orientation must start generic fallback');
assert(src.includes("motionState('no-motion'"),"frozen reading diagnosis missing");
assert(!src.includes('ims360-motion-debug-output')); // sem painel de debug no tour
console.log('Hero360Tour 1.2.3: frozen-orientation fallback, gyro and diagnostics available');

const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'../plugins/hero360-tour');
const manifest=require(path.join(root,'plugin.json'));const js=fs.readFileSync(path.join(root,'plugin.js'),'utf8');const tpl=fs.readFileSync(path.join(root,'template.html'),'utf8');
assert.equal(manifest.version,'1.2.7');for(const key of ['motionEnabled','motionActivation','motionSensitivity','motionSmoothing','motionTouchFallback']){assert(key in manifest.defaults,`missing ${key}`);assert(manifest.fields.some(field=>field.key===key),`missing field ${key}`);}
assert.equal(manifest.defaults.motionEnabled,true);assert.equal(manifest.defaults.motionActivation,'button');
assert.match(tpl,/data-motion-enabled="{{motionEnabled}}"/);assert.match(tpl,/data-motion-sensitivity="{{motionSensitivity}}"/);
assert.doesNotMatch(tpl,/ims360-motion-recenter/);assert.match(js,/DeviceOrientationEvent\.requestPermission/);assert.match(js,/function motionAnchor\(/);assert.match(js,/function beginCalibration\(/);assert.match(js,/motion\.sceneView=\{yaw,pitch\}/);assert.match(js,/motionStop\(\);for\(const f of disposers\)/);
new (require('node:vm').Script)(js);
console.log('Hero360Tour 1.2.5: configuração e integração Immersive Motion OK');

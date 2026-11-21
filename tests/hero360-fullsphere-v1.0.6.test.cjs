const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');const js=read('plugins/hero360-tour/plugin.js'),css=read('plugins/hero360-tour/plugin.css');const manifest=JSON.parse(read('plugins/hero360-tour/plugin.json'));
assert.equal(manifest.version,'1.2.7');for(const k of ['fullSphere','normalizeSphere','heroHfov'])assert(manifest.fields.some(f=>f.key===k));
assert.equal(manifest.defaults.heroHfov,118);assert.equal(manifest.defaults.fullSphere,true);
for(const source of ['atan(world.x,world.z)','asin(clamp(world.y','gl_FragColor=texture2D','gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE','drawCPU(canvas,engine,yaw,pitch,hfov)','loadScene(sceneId)'])assert(js.includes(source),source);
assert.match(css,/width:100vw!important/);assert.match(css,/ims360-gl/);
console.log('Hero360 esfera: longitude e latitude equiretangular e fill viewport OK');

const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('plugins/hero360-tour/plugin.js'),css=read('plugins/hero360-tour/plugin.css'),meta=JSON.parse(read('plugins/hero360-tour/plugin.json'));
assert.equal(meta.version,'1.2.7');new vm.Script(js);
for(const fragment of ['function createGL','function createCPU','function drawCPU','gl.drawArrays','putImageData','gl.texImage2D','UNPACK_FLIP_Y_WEBGL','MAX_TEXTURE_SIZE','ResizeObserver'])assert(js.includes(fragment),fragment+' ausente');
assert.doesNotMatch(js,/pannellum\.viewer|cdn\.jsdelivr/, 'Hero runtime público não deve depender de CDN');
assert.match(css,/\.ims360-gl/);assert.match(css,/\.ims360-hotspot-layer/);
console.log('Hero360 native: WebGL + Canvas 2D + resize + texture handling OK');

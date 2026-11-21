const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('plugins/hero360-tour/plugin.js'),tpl=read('plugins/hero360-tour/template.html'),css=read('plugins/hero360-tour/plugin.css');
assert.match(tpl,/ims360-poster/);assert.match(js,/loadScene\(spot\.targetSceneId,spot\.targetView\)/);
assert.match(js,/if\(spot\.type==='info'\)/);assert.match(js,/setHero\(spot,s\)/);
assert.match(js,/resetHero\(\)/);assert.match(js,/requestAnimationFrame\(tick\)/);
assert.doesNotMatch(tpl,/ims360-banner|ims360-banner-action|ims360-banner-link/);
assert.match(css,/\.ims360-hotspot-layer/);assert.match(js,/function glyph/);
console.log('Hero360 runtime: hotspots de navegação, info no Hero, observador, fallback e sem banners OK');

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const JSZip = require(path.join(ROOT, 'vendor/jszip.min.js'));
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const context = {
  console, Blob, TextEncoder, TextDecoder, URL, JSZip,
  window:{JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}},
  fetch:async source => {
    const full=path.resolve(ROOT,String(source).replace(/^\.\//,'').split(/[?#]/,1)[0]);
    if(!full.startsWith(ROOT + path.sep)||!fs.existsSync(full))return {ok:false,status:404};
    const b=fs.readFileSync(full);
    return {ok:true,status:200,headers:{get:()=>null},text:async()=>b.toString(),json:async()=>JSON.parse(b.toString()),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};
  }
};
vm.createContext(context);
(async()=>{
  for(const f of ['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js','assets/js/renderer.js','assets/js/compiler.js'])vm.runInContext(read(f),context,{filename:f});
  await context.window.ImobifyPluginLoader.ready;
  const state=context.window.ImobifyCatalog.defaultState();
  const ids=['hero360-tour','parallax360-tour'];
  state.sections=ids.map(id=>context.window.ImobifyCatalog.createSection(id));
  state.seo.sitemapEnabled='no';
  for(const id of ids){
    const data=JSON.parse(read(`plugins/${id}/plugin.json`));
    assert.equal(data.version,id==='hero360-tour'?'1.2.7':'1.0.2');
    assert(!data.fields.some(x=>['radius','maxWidth','paddingY'].includes(x.key)),`${id}: controls obsoletos`);
    assert.equal(data.defaults.heightMobile,630);
    const css=read(`plugins/${id}/plugin.css`);
    assert.match(css,id==='hero360-tour'?/(?:inline-size|width):100vw/:/width:100vw/);
    assert.match(css,id==='hero360-tour'?/left:50%/:/margin-left:-50vw/);
    assert.match(css,/content-visibility:visible!important/);
    assert.match(css,/padding:0!important/);
    assert.match(css,/border-radius:0/);
    assert.doesNotMatch(css,/max-width:min\(100%,var\(--ims360-max/);
    assert.doesNotMatch(css,/border-radius:min\(var\(--ims360-radius/);
    assert.doesNotMatch(read(`plugins/${id}/template.html`),/--ims360-(?:max|radius|py):/);
  }
  const result=await context.window.ImobifyCompiler.compile(state);
  const zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
  const html=await zip.file('index.html').async('string');
  const css=await zip.file('assets/css/site.css').async('string');
  for(const id of ids){
    assert(html.includes(`data-plugin="${id}"`));
    assert(css.includes(`section.plugin-play-section[data-plugin="${id}"]`));
    assert(css.includes(`[data-plugin="${id}"] .ims360`));
    assert(zip.file(`assets/js/site.js`));
    const version=id==='hero360-tour'?'1.2.7':'1.0.2';
    const standalone=path.join(ROOT,'plugin-packs',`${id}-v${version}.zip`);
    assert(fs.existsSync(standalone));
    const pluginZip=await JSZip.loadAsync(fs.readFileSync(standalone));
    assert.equal(JSON.parse(await pluginZip.file('plugin.json').async('string')).version,version);
  }
  console.log('Full Bleed 360: 2 plugins, compilação, CSS, template e pacotes standalone OK');
})().catch(e=>{console.error(e);process.exitCode=1});

const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),JSZip=require(path.join(root,'vendor/jszip.min.js'));
global.JSZip=JSZip;global.window={JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}};
global.fetch=async url=>{const f=path.resolve(root,String(url).split(/[?#]/)[0]);if(!f.startsWith(root+path.sep)||!fs.existsSync(f))return{ok:false,status:404};const b=fs.readFileSync(f);return{ok:true,status:200,headers:{get:()=>null},text:async()=>b.toString(),json:async()=>JSON.parse(b),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
function load(file){vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});}
(async()=>{
  for(const file of ['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js'])load(file);
  await window.ImobifyPluginLoader.ready;
  for(const file of ['assets/js/typography-system.js','assets/js/renderer.js','assets/js/compiler.js'])load(file);
  const plugin=window.ImobifyCatalog.plugins['hero360-tour'];
  assert.equal(plugin.defaults.heroHideDelay,5);
  for (const delay of [2,5,10]) {
    const state=window.ImobifyCatalog.defaultState();state.seo.sitemapEnabled='no';
    const section=window.ImobifyCatalog.createSection('hero360-tour');
    section.props.heroHideDelay=delay;
    state.sections=[section];
    const htmlPreview=plugin.render(section.props,state,section.id);
    assert.match(htmlPreview,new RegExp(`data-hero-hide-delay="${delay}"`));
    const built=await window.ImobifyCompiler.compile(state);
    const zip=await JSZip.loadAsync(await built.blob.arrayBuffer());
    const html=await zip.file('index.html').async('text');
    const js=await zip.file('assets/js/site.js').async('text');
    const project=JSON.parse(await zip.file('content/project.json').async('text'));
    assert.match(html,new RegExp(`data-hero-hide-delay="${delay}"`));
    assert.equal(project.sections[0].props.heroHideDelay,delay);
    assert.match(js,/heroHideDelay/);
  }
  console.log('Hero360Tour: os valores 2, 5 e 10 s são salvos, renderizados e exportados sem alterações.');
})().catch(e=>{console.error(e);process.exitCode=1});

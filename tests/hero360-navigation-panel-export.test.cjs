const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const JSZip = require(path.join(ROOT, 'vendor/jszip.min.js'));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const load = f => vm.runInThisContext(read(f), { filename:f });
global.JSZip = JSZip;
global.window = {JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}};
global.fetch=async resource=>{
  const src=String(resource);
  if(/^https?:\/\//.test(src))return {ok:false,status:404};
  const absolute=path.resolve(ROOT,src.replace(/^\.\//,'').split(/[?#]/,1)[0]);
  if(!absolute.startsWith(ROOT+path.sep)||!fs.existsSync(absolute))return {ok:false,status:404};
  const buf=fs.readFileSync(absolute);
  return {ok:true,status:200,headers:{get:()=>null},text:async()=>buf.toString('utf8'),json:async()=>JSON.parse(buf.toString('utf8')),arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)};
};
(async()=>{
  for(const file of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js']) load(file);
  await window.ImobifyPluginLoader.ready;
  load('assets/js/renderer.js');load('assets/js/compiler.js');
  const widget = window.ImobifyCatalog.plugins['hero360-tour'];
  assert.equal(widget.defaults.showNavigationPanel,false);
  assert.ok(widget.fields.some(f=>f.key==='showNavigationPanel'&&f.type==='toggle'));
  for(const enabled of [false,true]){
    const state=window.ImobifyCatalog.defaultState();
    const section=window.ImobifyCatalog.createSection('hero360-tour');
    assert.equal(section.props.showNavigationPanel,false,'novo HeroTour precisa nascer sem toolbar');
    section.props.showNavigationPanel=enabled;
    state.sections=[section];state.seo.sitemapEnabled='no';
    const output=await window.ImobifyCompiler.compile(state);
    const zip=await JSZip.loadAsync(await output.blob.arrayBuffer());
    const html=await zip.file('index.html').async('text');
    assert.match(html,new RegExp('data-navigation-panel="'+enabled+'"'), 'atributo da exportação precisa refletir o inspetor');
    const script=await zip.file('assets/js/site.js').async('text');
    assert.match(script,/navigationPanelEnabled=root\.dataset\.navigationPanel==='true'/);
    assert.match(script,/if\(navigationPanelEnabled\)\{/);
    console.log(`Hero360 export: painel ${enabled?'ativo':'oculto'} preservado no HTML compilado`);
  }
})().catch(e=>{console.error(e);process.exitCode=1});

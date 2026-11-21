const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path'); const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'); const JSZip=require(path.join(ROOT,'vendor/jszip.min.js'));
global.JSZip=JSZip; global.window={JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}};
const localFetch=async(resource)=>{ const source=String(resource); if(/^https?:\/\//.test(source)) return {ok:false,status:404,headers:{get:()=>null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(0)}; const full=path.resolve(ROOT,source.replace(/^\.\//,'')); if(!full.startsWith(ROOT)||!fs.existsSync(full)) return {ok:false,status:404,headers:{get:()=>null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(0)}; const b=fs.readFileSync(full); return {ok:true,status:200,headers:{get:()=>null},text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString('utf8')),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}; };
global.fetch=localFetch;
function load(p){vm.runInThisContext(fs.readFileSync(path.join(ROOT,p),'utf8'),{filename:p});}
(async()=>{
  for(const p of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js']) load(p);
  await window.ImobifyPluginLoader.ready;
  for(const p of ['assets/js/renderer.js','assets/js/compiler.js']) load(p);
  const state=window.ImobifyCatalog.defaultState(); state.seo.sitemapEnabled=false; state.behaviorPlugins=[]; state.sections=[window.ImobifyCatalog.createSection('parallax')];
  const section=state.sections[0]; section.props.videoSrc=''; section.props.bannerFontFamily='Montserrat, sans-serif';
  section.props.heroPoints=JSON.stringify([{id:'font-test',startTime:2,endTime:5,enabled:true,cinematicStop:true,title:'Título',text:'Texto',eyebrow:'Eyebrow',fontFamily:'DM Sans',titleFontFamily:'Playfair Display',textFontFamily:'Source Sans 3',eyebrowFontFamily:'Josefin Sans',titleWeight:900,textWeight:300}]);
  const result=await window.ImobifyCompiler.compile(state); const zip=await JSZip.loadAsync(await result.blob.arrayBuffer()); const html=await zip.file('index.html').async('text');
  for(const family of ['Montserrat','DM+Sans','Playfair+Display','Source+Sans+3','Josefin+Sans']) assert.ok(html.includes(`family=${family}:wght@300;400;500;600;700;800;900`),`fonte ${family} deve ser carregada na exportação`);
  assert.match(html,/data-banner-font-family="Montserrat, sans-serif"/,'fonte global do banner deve permanecer no markup');
  assert.match(html,/titleFontFamily&quot;:&quot;Playfair Display&quot;/,'fonte individual do título deve permanecer em heroPoints');
  assert.match(html,/textFontFamily&quot;:&quot;Source Sans 3&quot;/,'fonte individual do texto deve permanecer em heroPoints');
  assert.match(html,/eyebrowFontFamily&quot;:&quot;Josefin Sans&quot;/,'fonte individual do eyebrow deve permanecer em heroPoints');
  console.log('Parallax export typography OK');
})().catch(e=>{console.error(e);process.exitCode=1});

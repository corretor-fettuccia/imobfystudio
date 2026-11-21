const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path'); const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'); const JSZip=require(path.join(ROOT,'vendor/jszip.min.js'));
global.JSZip=JSZip; global.window={JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}};
const localFetch=async(resource)=>{ const source=String(resource); const full=path.resolve(ROOT,source.replace(/^\.\//,'')); if(!full.startsWith(ROOT)||!fs.existsSync(full)) return {ok:false,status:404,headers:{get:()=>null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(0)}; const b=fs.readFileSync(full); return {ok:true,status:200,headers:{get:()=>null},text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString('utf8')),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}; };
global.fetch=localFetch;
function load(p){vm.runInThisContext(fs.readFileSync(path.join(ROOT,p),'utf8'),{filename:p});}
(async()=>{
  for(const p of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js']) load(p);
  await window.ImobifyPluginLoader.ready;
  for(const p of ['assets/js/renderer.js','assets/js/compiler.js']) load(p);
  const catalog=window.ImobifyCatalog;
  const state=catalog.defaultState(); state.seo.sitemapEnabled=false; state.sections=[catalog.createSection('parallax')]; state.behaviorPlugins=[];
  const github='https://github.com/corretor-fettuccia/media/raw/refs/heads/main/newedition/NewEd.48.parallax.mp4';
  const raw='https://raw.githubusercontent.com/corretor-fettuccia/media/refs/heads/main/newedition/NewEd.48.parallax.mp4';
  state.sections[0].props.videoSrc=github;
  const originalFetch=global.fetch;
  global.fetch=async(resource,opts)=>{
    if(String(resource)===raw){ const b=Buffer.from([0,0,0,24,102,116,121,112,105,115,111,109]); return {ok:true,status:200,headers:{get:(k)=>k.toLowerCase()==='content-type'?'video/mp4':k.toLowerCase()==='content-length'?String(b.length):null},arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}; }
    return originalFetch(resource,opts);
  };
  let result=await window.ImobifyCompiler.compile(state); let zip=await JSZip.loadAsync(await result.blob.arrayBuffer()); let packaged=JSON.parse(await zip.file('content/project.json').async('text')); const src=packaged.sections[0].props.videoSrc;
  assert.match(src,/^assets\/video\/parallax-videosrc-\d+\.mp4$/); assert.ok(zip.file(src),'vídeo remoto deve entrar no ZIP');
  global.fetch=originalFetch;
  result=await window.ImobifyCompiler.compile(state); zip=await JSZip.loadAsync(await result.blob.arrayBuffer()); packaged=JSON.parse(await zip.file('content/project.json').async('text'));
  assert.equal(packaged.sections[0].props.videoSrc,raw,'fallback deve publicar URL raw normalizada quando CORS/download falhar');
  console.log('Parallax remote export OK');
})().catch(e=>{console.error(e);process.exitCode=1});

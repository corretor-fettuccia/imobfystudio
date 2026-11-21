const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');const ROOT=path.resolve(__dirname,'..');process.chdir(ROOT);
const JSZip=require(path.join(ROOT,'vendor/jszip.min.js')); global.JSZip=JSZip;
global.window={JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}};
global.fetch=async(resource)=>{const raw=String(resource);if(/^https?:/.test(raw))return {ok:false,status:404,headers:{get:()=>null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(0)};const f=path.resolve(ROOT,raw.replace(/^\.\//,''));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f))return {ok:false,status:404,headers:{get:()=>null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(0)};const b=fs.readFileSync(f);return {ok:true,status:200,headers:{get:(k)=>({'.jpg':'image/jpeg','.png':'image/png','.css':'text/css','.js':'application/javascript'}[path.extname(f)]||'application/octet-stream')},text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString()),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
function load(f){vm.runInThisContext(fs.readFileSync(path.join(ROOT,f),'utf8'),{filename:f});}
(async()=>{
for(const f of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js'])load(f);
await window.ImobifyPluginLoader.ready;
for(const f of ['assets/js/renderer.js','assets/js/compiler.js'])load(f);
let rows=[];const p=window.ImobifyCatalog.plugins;
for(const [id,plugin] of Object.entries(p)){
 let state=window.ImobifyCatalog.defaultState();state.seo.sitemapEnabled='no';state.sections=[];state.behaviorPlugins=[];
 if(plugin.kind==='behavior')state.behaviorPlugins=[id];else {const s=window.ImobifyCatalog.createSection(id); if(!s){rows.push({id,status:'NO_SECTION'});continue;}state.sections=[s];}
 try{
  const out=await window.ImobifyCompiler.compile(state);
  const z=await JSZip.loadAsync(await out.blob.arrayBuffer());const html=await z.file('index.html').async('string');
  const expected=plugin.kind==='behavior'?'':`data-plugin="${id}"`;
  const files=['index.html','assets/css/site.css','assets/js/site.js'];const miss=files.filter(f=>!z.file(f));
  const status=miss.length?'MISSING_FILES':(expected&&!html.includes(expected)?'MISSING_MARKUP':'OK');
  rows.push({id,status,files:Object.keys(z.files).filter(f=>!f.endsWith('/')).length,html:html.length,kind:plugin.kind});
 }catch(e){rows.push({id,status:'ERROR',error:String(e?.message||e).slice(0,350)});}
}
const bad=rows.filter(r=>r.status!=='OK' && !(r.id==='tag-installer-pro' && r.status==='MISSING_MARKUP'));
console.log(JSON.stringify({summary:rows.reduce((a,b)=>(a[b.status]=(a[b.status]||0)+1,a),{}),rows},null,2));
assert.equal(rows.length,Object.keys(p).length,'Todos os plugins ativos devem ser verificados');
assert.equal(bad.length,0,`Falha na compilação dos plugins: ${JSON.stringify(bad)}`);
})().catch(e=>{console.error(e);process.exitCode=1});

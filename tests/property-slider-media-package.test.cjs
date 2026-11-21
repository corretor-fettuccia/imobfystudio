const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path'); const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'); const JSZip=require(path.join(ROOT,'vendor/jszip.min.js'));
global.JSZip=JSZip; global.window={JSZip,indexedDB:null,confirm:()=>true,location:{href:'http://localhost/'}};
const remoteBytes=Buffer.from('fake-image-bytes');
global.fetch=async(resource)=>{
  const source=String(resource);
  if(source==='https://cdn.example.test/slide.jpg') return {ok:true,status:200,headers:{get:(k)=>k.toLowerCase()==='content-type'?'image/jpeg':null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>remoteBytes.buffer.slice(remoteBytes.byteOffset,remoteBytes.byteOffset+remoteBytes.byteLength)};
  const full=path.resolve(ROOT,source.replace(/^\.\//,''));
  if(!full.startsWith(ROOT)||!fs.existsSync(full)) return {ok:false,status:404,headers:{get:()=>null},text:async()=>'',json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(0)};
  const b=fs.readFileSync(full);
  return {ok:true,status:200,headers:{get:(k)=>k.toLowerCase()==='content-type'?({'.jpg':'image/jpeg','.css':'text/css','.js':'text/javascript','.json':'application/json'}[path.extname(full)]||'application/octet-stream'):null},text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString('utf8')),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};
};
function load(p){vm.runInThisContext(fs.readFileSync(path.join(ROOT,p),'utf8'),{filename:p});}
(async()=>{
  for(const p of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js']) load(p);
  await window.ImobifyPluginLoader.ready;
  for(const p of ['assets/js/renderer.js','assets/js/compiler.js']) load(p);
  const catalog=window.ImobifyCatalog;
  const state=catalog.defaultState(); state.seo.sitemapEnabled=false; state.sections=[catalog.createSection('property-slider')];
  const section=state.sections[0];
  section.props.slides=JSON.stringify([
    {id:'local',image:'data:image/png;base64,aGVsbG8=',imageAlt:'local',title:'Local',text:'',eyebrow:'',showButton:false,buttonText:'',buttonLink:'#'},
    {id:'remote',image:'https://cdn.example.test/slide.jpg',imageAlt:'remote',title:'Remote',text:'',eyebrow:'',showButton:false,buttonText:'',buttonLink:'#'}
  ]);
  const result=await window.ImobifyCompiler.compile(state);
  const zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
  const project=JSON.parse(await zip.file('content/project.json').async('text'));
  const slides=JSON.parse(project.sections[0].props.slides);
  assert.match(slides[0].image,/^assets\/images\/property-slider-slide-1-image-/);
  assert.match(slides[1].image,/^assets\/images\/property-slider-slide-2-image-/);
  assert.ok(zip.file(slides[0].image),'local slide image must be packaged');
  assert.ok(zip.file(slides[1].image),'remote slide image must be packaged');
  const app=fs.readFileSync(path.join(ROOT,'assets/js/app.js'),'utf8');
  assert.match(app,/data-property-slide-media/,'slider editor must expose image upload');
  console.log('Property Slider media upload/package OK');
})().catch(e=>{console.error(e);process.exitCode=1});

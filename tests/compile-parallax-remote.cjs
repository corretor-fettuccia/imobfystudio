const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const JSZip=require(path.join(ROOT,'vendor/jszip.min.js'));
global.JSZip=JSZip; global.window={JSZip,indexedDB:null,confirm:()=>true};
global.fetch=async(resource)=>{ const source=String(resource); if(/^https?:\/\//.test(source)) return {ok:false,status:404,text:async()=>'',json:async()=>({})}; const full=path.resolve(ROOT,source.replace(/^\.\//,'')); if(!full.startsWith(ROOT)||!fs.existsSync(full)) return {ok:false,status:404,text:async()=>'',json:async()=>({})}; const b=fs.readFileSync(full); return {ok:true,status:200,headers:{get:(k)=> k.toLowerCase()==='content-type' ? ({'.jpg':'image/jpeg','.css':'text/css','.js':'text/javascript','.json':'application/json'}[path.extname(full)]||'application/octet-stream'):null},text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString()),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}; };
function load(p){vm.runInThisContext(fs.readFileSync(path.join(ROOT,p),'utf8'),{filename:p});}
(async()=>{
 for(const p of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js']) load(p);
 await window.ImobifyPluginLoader.ready;
 for(const p of ['assets/js/renderer.js','assets/js/compiler.js']) load(p);
 const c=window.ImobifyCatalog; const state=c.defaultState();
 state.projectName='Parallax remote test'; state.seo.sitemapEnabled=false; state.sections=[c.createSection('parallax')]; state.behaviorPlugins=[];
 const p=state.sections[0]; p.props.videoSrc='https://github.com/corretor-fettuccia/media/raw/refs/heads/main/newedition/NewEd.48.parallax.mp4'; p.props.videoDuration=48.7; p.props.endTime=37.16; p.props.endTimeAuto=false; p.props.heroPoints='[]';
 const result=await window.ImobifyCompiler.compile(state); const ab=await result.blob.arrayBuffer(); const z=await JSZip.loadAsync(ab); const out='/mnt/data/parallax-export-test'; fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
 for(const [name,obj] of Object.entries(z.files)){ if(obj.dir){fs.mkdirSync(path.join(out,name),{recursive:true});continue;} const b=Buffer.from(await obj.async('uint8array')); const f=path.join(out,name); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,b); }
 console.log('files',Object.keys(z.files));
 const html=await z.file('index.html').async('text'); console.log(html.match(/data-video-src="[^"]+"/)?.[0]);
})();

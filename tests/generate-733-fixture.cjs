'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');const JSZip=require('../vendor/jszip.min.js');
const ctx=vm.createContext({console,URL,Blob,FormData,JSZip,setTimeout,clearTimeout,window:{},document:{createElement(){return {innerHTML:'',content:{cloneNode(){return {}}}}}},location:{href:'http://localhost/'} });
ctx.window=ctx;ctx.window.location=ctx.location;ctx.window.JSZip=JSZip;
ctx.fetch=async u=>{const p=path.resolve(root,String(u));if(!p.startsWith(root)||!fs.existsSync(p))return {ok:false,status:404};const b=fs.readFileSync(p);return {ok:true,status:200,text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString('utf8')),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),headers:{get:()=>null}}};
function load(f){vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}
(async()=>{
['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js'].forEach(load);await ctx.ImobifyPluginLoader.ready;load('assets/js/renderer.js');load('assets/js/compiler.js');
const c=ctx.ImobifyCatalog,s=c.defaultState(), sp=c.createSection('smart-plant'), v4=c.createSection('form-sender-v4'), ag=c.createSection('agendamento-sender'), ag2=c.createSection('agendamento-sender');
sp.props.actionMode='form';sp.props.formAnchor='agendar';sp.props.formDestination='auto';sp.props.plants=JSON.stringify([{id:'p100',title:'Planta Aurora',code:'A-101',area:'68 m²',description:'Planta teste'},{id:'p200',title:'Planta Horizonte',code:'B-202',area:'84 m²',description:'Planta teste'}]);
sp.props.formContextMessage='Interesse na planta {planta}, com {metragem}, do {empreendimento}';
v4.settings.anchorId='contato';ag.settings.anchorId='agendar';ag2.settings.anchorId='agendar-dois';
ag.props.product='Empreendimento Teste';ag2.props.product='Outro agendamento';
s.sections=[sp,v4,ag,ag2];s.seo.canonical='https://www.example.org/teste/';s.seo.title='Teste Imobify';s.seo.description='Teste dos formulários';
s.selectedSectionId=sp.id;const editorHtml=await ctx.ImobifyRenderer.buildInlineDocument(s,{editor:true,focusSelected:true});fs.writeFileSync(path.join(__dirname,'fixture-733-editor.html'),editorHtml); console.log('editor fixture',editorHtml.length);const result=await ctx.ImobifyCompiler.compile(s);const z=await JSZip.loadAsync(await result.blob.arrayBuffer());
for(const [file,out] of [['index.html','fixture-732.html'],['assets/js/site.js','fixture-732.js'],['assets/css/site.css','fixture-732.css']]){
 const data=await z.file(file).async('text');fs.writeFileSync(path.join(__dirname,out),data);console.log(out,data.length);}
})();

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const JSZip=require(path.join(root,'vendor/jszip.min.js'));
global.JSZip=JSZip;
global.window={JSZip,location:{href:'http://localhost:8765/'}};
global.fetch=async url=>{const full=path.resolve(root,String(url).split(/[?#]/)[0]);if(!full.startsWith(root+path.sep)||!fs.existsSync(full))return{ok:false,status:404};const b=fs.readFileSync(full);return{ok:true,headers:{get:()=>null},text:async()=>b.toString(),json:async()=>JSON.parse(b.toString()),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
const load=f=>vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
(async()=>{
  for(const x of ['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js'])load(x);
  await window.ImobifyPluginLoader.ready;
  for(const x of ['assets/js/typography-system.js','assets/js/renderer.js','assets/js/compiler.js'])load(x);
  const state=window.ImobifyCatalog.defaultState();
  state.projectName='Exportação sem documentos privados';
  state.seo.canonical='https://exemplo.com.br/';
  state.aiReferences=[{id:'privado',name:'memorial-confidencial.md',category:'memorial',enabled:true,content:'SEGREDO_DE_TESTE_MD_711'}];
  const hero=window.ImobifyCatalog.createSection('hero');hero.props.title='Conteúdo público';state.sections=[hero];
  const out=await window.ImobifyCompiler.compile(state);
  assert.equal(out.outputState.version,'7.3.3');
  assert.equal(state.aiReferences[0].content,'SEGREDO_DE_TESTE_MD_711','entrada original preservada');
  assert.ok(!Object.prototype.hasOwnProperty.call(out.outputState,'aiReferences'));
  const zip=await JSZip.loadAsync(await out.blob.arrayBuffer());
  for(const name of ['index.html','content/project.json','llms.txt','llms-full.txt','content/agentic-audit.json','content/seo-readiness.json','README.txt']){
    const str=await zip.file(name).async('text');
    assert.ok(!str.includes('SEGREDO_DE_TESTE_MD_711'),`${name}: conteúdo privado vazou`);
    assert.ok(!str.includes('memorial-confidencial.md'),`${name}: nome privado vazou`);
    assert.ok(!str.includes('aiReferences'),`${name}: estrutura privada vazou`);
  }
  assert.ok(zip.file('ai-catalog.json'));
  console.log('Exportação 7.1.1: referências privadas ausentes do ZIP e projeto de origem intacto');
})().catch(err=>{console.error(err);process.exitCode=1});

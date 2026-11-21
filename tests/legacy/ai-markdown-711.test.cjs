'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const state={projectName:'Mezzano',seo:{title:'Mezzano',description:'Em lançamento'},brand:{headingFont:'Inter'},
  sections:[{id:'sec1',type:'hero',settings:{visible:true},props:{title:'Um novo começo'}}],
  aiReferences:[
    {id:'a',name:'SinteseMemorial_Mezzano.md',category:'memorial',enabled:true,content:'# Memorial\nÁrea de 50 m2.\n'+('M'.repeat(40000))},
    {id:'b',name:'COPY_Engeneer.md',category:'copy',enabled:true,content:'# Copy\nComunicação ética.\n'+('C'.repeat(40000))},
    {id:'c',name:'NaoCompartilhar.md',category:'commercial',enabled:false,content:'NAO_COMPARTILHAR_TESTE_SECRET'}
  ]};
const fields={aiAgentTask:{value:'copy'},aiAgentInstruction:{value:''},aiAgentBudget:{value:'12000'}};
const ctx={window:{ImobifyCatalog:{plugins:{hero:{name:'Hero',fields:[{key:'title',type:'text',label:'Título'}]}}},ImobifyEditorAPI:{getState:()=>state}},document:{querySelector:()=>null,getElementById:id=>fields[id]||null,readyState:'loading',addEventListener:()=>{}},console,Math,JSON,Set,Map,Array,String,Number,Object,Error};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/ai-agent.js'),'utf8'),ctx,{filename:'ai-agent.js'});
const a=ctx.window.ImobifyAIAgent;
const result=a.mdContext(state.aiReferences,12000);
assert.equal(result.selected,2);assert.equal(result.included,12000);assert.equal(result.truncated,true);
assert.equal(result.documents[0].includedCharacters,6000);assert.equal(result.documents[1].includedCharacters,6000);
const manual=a.buildPrompt();
assert.match(manual,/SinteseMemorial_Mezzano.md/);assert.match(manual,/COPY_Engeneer.md/);
assert.doesNotMatch(manual,/NAO_COMPARTILHAR_TESTE_SECRET/);
assert.match(manual,/AVISO: um ou mais Markdown foram cortados/);
assert.match(manual,/NÃO CONFIÁVEL/);
assert.ok(manual.length<130000);
const distribution=a.mdContext([
{id:'1',name:'a.md',content:'a'.repeat(100),enabled:true},
{id:'2',name:'b.md',content:'b'.repeat(20000),enabled:true}],12000);
assert.equal(distribution.included,12000,'redistribuir saldo de arquivo curto');
assert.equal(distribution.documents[0].includedCharacters,100);
assert.equal(distribution.documents[1].includedCharacters,11900);
assert.equal(a.guessCategory('COPY_modelo.md'),'copy');
assert.equal(a.guessCategory('SinteseMemorial_Mezzano.md'),'memorial');
console.log('Markdown 7.1.1: anexos, classificação, seleção, orçamento, aviso e prompt OK');

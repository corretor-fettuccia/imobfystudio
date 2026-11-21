'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const body={};
const state={projectName:'Imóvel de teste',seo:{title:'Titulo original',description:'Descrição original',canonical:'https://teste.example/',sourceNotes:'documento interno'},brand:{headingFont:'Inter',bodyFont:'Inter'},sections:[{id:'section1',type:'hero',settings:{visible:true},props:{title:'Apartamento ensolarado',subtitle:'Descritivo anterior',image:'data:image/png;base64,AAA',target:'https://link.example'}},{id:'secHidden',type:'hero',settings:{visible:false},props:{title:'Privado'}}]};
const context={
 window:{ImobifyCatalog:{plugins:{hero:{name:'Hero',fields:[{key:'title',type:'text',label:'Título'},{key:'subtitle',type:'textarea',label:'Subtítulo'},{key:'image',type:'image',label:'Imagem'},{key:'target',type:'url',label:'Destino'}]}}},ImobifyEditorAPI:{getState:()=>state}},
 document:{readyState:'loading',addEventListener:()=>{},querySelector:()=>null,getElementById:()=>null},
 navigator:{},console,Math,JSON,Set,Map,Array,String,Number,Error,Object,RegExp
};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/ai-agent.js'),'utf8'),context);
const agent=context.window.ImobifyAIAgent;
const limited=agent.payload(state);
assert.equal(limited.sections.length,1,'não enviar seção oculta');
assert.equal(limited.sections[0].fields.some(f=>f.key==='image'),false,'não incluir mídia');
assert.equal(limited.sections[0].fields.some(f=>f.key==='target'),false,'não incluir URL de plugin');
const result=agent.validate({operations:[
  {target:'seo',key:'title',value:'Título novo'},
  {target:'section',sectionId:'section1',key:'title',value:'Apartamento com sol da manhã'},
  {target:'section',sectionId:'section1',key:'image',value:'https://attacker.example/pic'},
  {target:'section',sectionId:'secHidden',key:'title',value:'Mudança oculta'},
  {target:'seo',key:'canonical',value:'https://other.example'},
  {target:'section',sectionId:'section1',key:'subtitle',value:'<script>alert(1)</script>'}
],notes:['Revisado']},state);
assert.equal(result.valid.length,2,'somente duas operações seguras');
assert.equal(result.refused.length,4,'quatro recusas: mídia, seção oculta, URL e script');
const extracted=agent.extractJSON('```json\n{"operations":[],"notes":[]}\n```');
assert.equal(extracted.operations.length,0);
console.log('Agente 7.1: whitelist, diff, dados públicos e parser OK');

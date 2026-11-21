'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const JSZip=require(path.join(root,'vendor/jszip.min.js'));
global.JSZip=JSZip;
global.window={JSZip,indexedDB:null,location:{href:'http://localhost:8765/'}};
global.fetch=async url=>{
  const resolved=path.resolve(root,String(url).replace(/^\.\//,'').split(/[?#]/)[0]);
  if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved))return {ok:false,status:404};
  const b=fs.readFileSync(resolved);
  return {ok:true,status:200,headers:{get:()=>null},text:async()=>b.toString('utf8'),json:async()=>JSON.parse(b.toString('utf8')),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};
};
const load=f=>vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
(async()=>{
  ['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js'].forEach(load);
  await window.ImobifyPluginLoader.ready;
  load('assets/js/renderer.js');
  load('assets/js/compiler.js');
  const c=window.ImobifyCatalog,r=window.ImobifyRenderer;
  const registry=JSON.parse(fs.readFileSync(path.join(root,'plugins/registry.json'),'utf8'));
  const sectionPlugins=registry.packages.map(x=>JSON.parse(fs.readFileSync(path.join(root,x.manifest),'utf8'))).filter(x=>x.type==='section');
  const corePlugins=registry.corePlugins.filter(x=>c.plugins[x]?.kind==='section');
  const all=[...new Set([...sectionPlugins.map(x=>x.id),...corePlugins])];
  let count=0;
  for(const type of all){
    const s=c.defaultState(),section=c.createSection(type);
    assert.ok(section,`componente ${type} precisa ser instanciável`);
    section.settings.anchorId=`topo-${type}`;
    // Evitar layout composto capturar a próxima seção durante teste isolado.
    if('itemCount' in (section.props||{}))section.props.itemCount=0;
    s.sections=[section];
    const markerId=`topo-${type}`;
    const published=r.bodyMarkup(s);
    // Plugins que injetam tags de documento não criam seção pública.
    if(c.plugins[type]?.manifest?.output==='document-tag'){
      assert.equal(published,'',`${type}: tag documental não cria âncora pública`);
      assert.match(r.bodyMarkup(s,{editor:true}),new RegExp(`<span id="${markerId}" class="imobify-anchor-start"`));
      count++;
      continue;
    }
    assert.equal((published.match(new RegExp(`id="${markerId}"`,'g'))||[]).length,1,`${type}: âncora única`);
    assert.match(published,new RegExp(`^<(?:section|div|footer|article|nav)[^>]*>\\s*<span id="${markerId}" class="imobify-anchor-start" data-imobify-anchor-start`),`${type}: âncora deve ser PRIMEIRO filho da section`);
    const editor=r.bodyMarkup(s,{editor:true});
    assert.match(editor,new RegExp(`data-editor-block-id="${section.id}"[\\s\\S]*?<span id="${markerId}" class="imobify-anchor-start"`),`${type}: editor deve manter âncora`);
    count++;
  }
  // IDs históricos do núcleo NÃO devem desaparecer quando se define outra âncora.
  for(const type of ['highlights','gallery']){
    const s=c.defaultState(),x=c.createSection(type);
    x.settings.anchorId='novo-destino';s.sections=[x];
    const out=r.bodyMarkup(s);
    assert.match(out,new RegExp(`^<section id="${type==='gallery'?'galeria':'destaques'}"`));
    assert.match(out,/^<section[^>]*><span id="novo-destino" class="imobify-anchor-start"/);
  }
  // Mesmo ID de um âncora nativa não pode gerar duas ocorrências.
  {
    const s=c.defaultState(),x=c.createSection('gallery');
    x.settings.anchorId='galeria';s.sections=[x];
    assert.equal((r.bodyMarkup(s).match(/id="galeria"/g)||[]).length,1);
  }
  // Filho de layout/segmento mantém sua âncora no início, não no final da seção mãe.
  for(const type of ['section-layout-pro','segment-layout']){
    const s=c.defaultState();
    const layout=c.createSection(type),child=c.createSection('only-text-context'),after=c.createSection('faq');
    layout.props.itemCount=1;child.settings.anchorId='ancora-filho';after.settings.anchorId='ancora-depois';
    s.sections=[layout,child,after];
    const html=r.bodyMarkup(s);
    assert.equal((html.match(/id="ancora-filho"/g)||[]).length,1);
    assert.equal((html.match(/id="ancora-depois"/g)||[]).length,1);
    assert.match(html,/<section[^>]*data-plugin="only-text-context"[^>]*><span id="ancora-filho" class="imobify-anchor-start"/);
    assert.ok(html.indexOf('id="ancora-filho"') < html.indexOf('id="ancora-depois"'));
  }
  // Exportação usa exatamente o mesmo renderizador que o editor.
  {
    const s=c.defaultState(),a=c.createSection('hero'),b=c.createSection('form-sender-v4');
    a.settings.anchorId='inicio-hero';b.settings.anchorId='contato';s.sections=[a,b];
    s.seo.canonical='https://www.example.org/imovel/';s.seo.title='Imóvel Teste';s.seo.description='Uma landing page de teste.';
    const result=await window.ImobifyCompiler.compile(s);
    const zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
    const html=await zip.file('index.html').async('text');
    assert.match(html,/<span id="inicio-hero" class="imobify-anchor-start"/);
    assert.match(html,/<span id="contato" class="imobify-anchor-start"/);
    assert.equal(result.outputState.version,'7.3.6');
  }
  const style=fs.readFileSync(path.join(root,'core/base.css'),'utf8');
  assert.match(style,/\.imobify-anchor-start\[data-imobify-anchor-start\]\{position:absolute!important/);
  const runtime=fs.readFileSync(path.join(root,'core/runtime.js'),'utf8');
  assert.match(runtime,/target\.scrollIntoView\(\{block:'start'/);
  console.log(`PASS: ${count} plugins de seção + âncoras nativas + layouts compostos + editor + exportação 7.3.3`);
})().catch(e=>{console.error(e);process.exitCode=1});

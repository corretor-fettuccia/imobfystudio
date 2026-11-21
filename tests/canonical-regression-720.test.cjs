'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const JSZip=require(path.join(root,'vendor/jszip.min.js'));
global.JSZip=JSZip;
global.window={JSZip,indexedDB:null,location:{href:'http://localhost:8000/'}};
global.fetch=async resource=>{
  const relative=String(resource).split(/[?#]/,1)[0].replace(/^\.\//,'');
  const full=path.resolve(root,relative);
  if (!full.startsWith(root+path.sep) || !fs.existsSync(full)) return {ok:false,status:404};
  const buffer=fs.readFileSync(full);
  return {ok:true,status:200,headers:{get:()=>null},text:async()=>buffer.toString('utf8'),json:async()=>JSON.parse(buffer.toString('utf8')),arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)};
};
const load=file=>vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
const xmlEsc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const htmlEsc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
(async()=>{
  for (const file of ['assets/js/util.js','assets/js/catalog.js','assets/js/plugin-loader.js']) load(file);
  await window.ImobifyPluginLoader.ready;
  for (const file of ['assets/js/typography-system.js','assets/js/renderer.js','assets/js/compiler.js']) load(file);
  const values=[
    'https://EXEMPLO.com.br',
    '  https://exemplo.com.br/  ',
    'https://exemplo.com.br:443',
    'https://EXEMPLO.com.br/imovel?campanha=1&origem=site',
    'https://exemplo.com.br/lançamento apartamentos',
    'https://exemplo.com.br/empreendimentos/ora'
  ];
  for (const value of values) {
    const state=window.ImobifyCatalog.defaultState();
    state.projectName='Teste canonical regressão';
    state.seo.title='Canonical teste';
    state.seo.description='Teste de URL e integridade no HTML.';
    state.seo.canonical=value;
    state.seo.sitemapEnabled='yes';
    state.sections=[];
    const expected=new URL(value.trim()).href;
    const output=await window.ImobifyCompiler.compile(state);
    assert.equal(output.exportValidation.passed,true,`Compilação válida: ${value}`);
    const zip=await JSZip.loadAsync(await output.blob.arrayBuffer());
    const html=await zip.file('index.html').async('text');
    const sitemap=await zip.file('sitemap.xml').async('text');
    const report=JSON.parse(await zip.file('content/export-validation.json').async('text'));
    assert.ok(html.includes(`<link rel="canonical" href="${htmlEsc(expected)}">`),`link canonical correto: ${value}`);
    assert.ok(html.includes(`<meta property="og:url" content="${htmlEsc(expected)}">`),`og:url correto: ${value}`);
    assert.ok(sitemap.includes(`<loc>${xmlEsc(expected)}</loc>`),`sitemap correto: ${value}`);
    assert.equal(report.checks.find(x=>x.id==='canonical-match').ok,true);
    // Mismatch real deve continuar bloqueando uma exportação quebrada.
    const tampered=html.replace(/(<link rel="canonical" href=")[^"]*/, '$1https://errado.exemplo.com/');
    const corrupted=window.ImobifyCompiler.validateAgenticExport(zip,output.outputState,tampered,sitemap,[]);
    assert.equal(corrupted.passed,false,'canonical adulterada precisa continuar reprovando');
    assert.ok(corrupted.errors.includes('Canonical HTML não corresponde à URL configurada.'));
    const noTag=html.replace(/<link rel="canonical" href="[^"]*">/,'');
    assert.equal(window.ImobifyCompiler.validateAgenticExport(zip,output.outputState,noTag,sitemap,[]).passed,false,'canonical removida precisa reprovar');
    const duplicated=html.replace('</head>',`<link rel="canonical" href="${htmlEsc(expected)}"></head>`);
    assert.equal(window.ImobifyCompiler.validateAgenticExport(zip,output.outputState,duplicated,sitemap,[]).passed,false,'canonical duplicada precisa reprovar');
  }
  console.log(`Canonical 7.2.0 correção: ${values.length} variações exportadas; HTML, og:url, sitemap e detecção de erros OK`);
})().catch(err=>{console.error(err);process.exitCode=1});

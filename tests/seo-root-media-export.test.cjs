const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const JSZip = require(path.join(root,'vendor/jszip.min.js'));
global.JSZip = JSZip;
global.window = {JSZip,indexedDB:null,location:{href:'http://localhost/'},confirm:()=>true};
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+pUbcAAAAASUVORK5CYII=', 'base64');
const tinyJpeg = Buffer.from([0xff,0xd8,0xff,0xd9]);
global.fetch=async resource => {
 const name=String(resource).split(/[?#]/,1)[0].replace(/^\.\//,'');
 const full=path.resolve(root,name);
 if (!full.startsWith(root+path.sep) || !fs.existsSync(full)) return {ok:false,status:404};
 const buffer=fs.readFileSync(full);
 return {ok:true,status:200,headers:{get:()=>null},text:async()=>buffer.toString(),json:async()=>JSON.parse(buffer),arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)};
};
function load(relative) { vm.runInThisContext(fs.readFileSync(path.join(root,relative),'utf8'),{filename:relative}); }
(async()=>{
 for (const script of ['assets/js/util.js','assets/js/catalog.js','assets/js/icon-library.js','assets/js/plugin-loader.js']) load(script);
 await window.ImobifyPluginLoader.ready;
 for (const script of ['assets/js/typography-system.js','assets/js/renderer.js','assets/js/compiler.js']) load(script);
 const original=window.ImobifyCatalog.defaultState();
 original.sections=[];original.seo.sitemapEnabled='no';
 original.seo.canonical='https://imoveis.exemplo.br/lancamento/';
 const pngData='data:image/png;base64,'+tinyPng.toString('base64');
 const jpegData='data:image/jpeg;base64,'+tinyJpeg.toString('base64');
 original.seo.favicon=pngData;
 original.seo.ogImage=jpegData;
 const {blob,outputState,assets}=await window.ImobifyCompiler.compile(original);
 const zip=await JSZip.loadAsync(await blob.arrayBuffer());
 assert.equal(outputState.seo.favicon,'./icon.png');
 assert.equal(outputState.seo.ogImage,'./share.jpg');
 assert.equal(original.seo.favicon,pngData,'Não alterar projeto original');
 assert.equal(original.seo.ogImage,jpegData,'Não alterar projeto original');
 assert.ok(assets.includes('icon.png') && assets.includes('share.jpg'));
 assert.deepEqual(Buffer.from(await zip.file('icon.png').async('uint8array')),tinyPng);
 assert.deepEqual(Buffer.from(await zip.file('share.jpg').async('uint8array')),tinyJpeg);
 assert.ok(!zip.file('assets/images/seo-favicon-1.png'));
 const html=await zip.file('index.html').async('text');
 assert.match(html,/<link rel="icon" href="https:\/\/imoveis\.exemplo\.br\/lancamento\/icon\.png" type="image\/png">/);
 assert.match(html,/<meta property="og:image" content="https:\/\/imoveis\.exemplo\.br\/lancamento\/share\.jpg">/);
 assert.match(html,/<meta name="twitter:image" content="https:\/\/imoveis\.exemplo\.br\/lancamento\/share\.jpg">/);
 assert.match(html, /"primaryImageOfPage":\{"@type":"ImageObject","url":"https:\/\/imoveis\.exemplo\.br\/lancamento\/share\.jpg"\}/);
 const stored=JSON.parse(await zip.file('content/project.json').async('text'));
 assert.equal(stored.seo.favicon,'./icon.png');assert.equal(stored.seo.ogImage,'./share.jpg');
 // Inversão de formatos: nomes devem vir do MIME, nunca ser fixos.
 const reverse=window.ImobifyCatalog.defaultState();reverse.sections=[];reverse.seo.sitemapEnabled='no';reverse.seo.canonical='';
 reverse.seo.favicon=jpegData;reverse.seo.ogImage=pngData;
 const z2=await JSZip.loadAsync(await (await window.ImobifyCompiler.compile(reverse)).blob.arrayBuffer());
 assert.ok(z2.file('icon.jpg') && z2.file('share.png'));
 const h2=await z2.file('index.html').async('text');
 assert.match(h2, /<link rel="icon" href="\.\/icon\.jpg">/);
 assert.match(h2, /<meta property="og:image" content="\.\/share\.png">/);
 // Entrada de caminho local PNG/JPEG migrada, suportando projetos anteriores.
 const local=window.ImobifyCatalog.defaultState();local.sections=[];local.seo.sitemapEnabled='no';
 local.seo.favicon='assets/images/icon-test.png';local.seo.ogImage='assets/images/share-test.jpg';
 // Arquivos reais temporários no diretório fonte para simular projeto importado.
 const a=path.join(root,'assets/images/icon-test.png');const b=path.join(root,'assets/images/share-test.jpg');
 try {
  fs.mkdirSync(path.dirname(a),{recursive:true});fs.writeFileSync(a,tinyPng);fs.writeFileSync(b,tinyJpeg);
  const z3=await JSZip.loadAsync(await (await window.ImobifyCompiler.compile(local)).blob.arrayBuffer());
  assert.ok(z3.file('icon.png') && z3.file('share.jpg'));
 } finally {fs.rmSync(a,{force:true});fs.rmSync(b,{force:true});}
 // URL remota informada manualmente fica preservada para não exigir CORS.
 const remote=window.ImobifyCatalog.defaultState();remote.sections=[];remote.seo.sitemapEnabled='no';
 remote.seo.favicon='https://cdn.example.org/icon.png';remote.seo.ogImage='https://cdn.example.org/share.jpg';
 const rz=(await window.ImobifyCompiler.compile(remote)).outputState;
 assert.equal(rz.seo.favicon,remote.seo.favicon);assert.equal(rz.seo.ogImage,remote.seo.ogImage);
 // Nunca publicar uma imagem social que exceda o limite rígido de 300 KB.
 const oversized=window.ImobifyCatalog.defaultState();oversized.sections=[];oversized.seo.sitemapEnabled='no';
 oversized.seo.ogImage='data:image/jpeg;base64,'+Buffer.alloc(300*1024,1).toString('base64');
 await assert.rejects(()=>window.ImobifyCompiler.compile(oversized), /excede 300 KB/);
 const editor=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(editor,/id="seoShareInput"/);assert.match(editor,/id="openSeoVectorizer"/);
 const app=fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
 assert.match(app,/SEO_SHARE_MAX = 300 \* 1024/);
 console.log('SEO root assets: PNG/JPEG, canonical URL, Twitter, JSON-LD, legacy paths, remote compatibility, UI OK');
})().catch(err=>{console.error(err);process.exitCode=1});

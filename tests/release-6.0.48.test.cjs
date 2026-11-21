const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const JSZip = require(path.join(ROOT, 'vendor/jszip.min.js'));

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const load = file => vm.runInThisContext(read(file), { filename:file });
const requests = [];
global.JSZip = JSZip;
global.window = { JSZip, indexedDB:null, confirm:()=>true, location:{ href:'http://localhost/' } };
global.fetch = async resource => {
  const source = String(resource);
  requests.push(source);
  if (/^https?:\/\//.test(source)) return { ok:false, status:404 };
  const full = path.resolve(ROOT, source.replace(/^\.\//, '').split(/[?#]/,1)[0]);
  if (!full.startsWith(ROOT + path.sep) || !fs.existsSync(full)) return { ok:false, status:404 };
  const buffer = fs.readFileSync(full);
  return {
    ok:true, status:200, headers:{ get:()=>null },
    text:async()=>buffer.toString('utf8'),
    json:async()=>JSON.parse(buffer.toString('utf8')),
    arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  };
};

(async () => {
  load('assets/js/util.js');
  load('assets/js/catalog.js');
  load('assets/js/icon-library.js');
  load('assets/js/plugin-loader.js');
  await window.ImobifyPluginLoader.ready;
  load('assets/js/renderer.js');
  load('assets/js/compiler.js');

  const state = window.ImobifyCatalog.defaultState();
  state.seo.sitemapEnabled = 'no';
  state.sections = [window.ImobifyCatalog.createSection('hero')];
  // PNG 1x1 como dado local, verifica incorporação ao pacote final.
  state.sections[0].props.image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2f0AAAAASUVORK5CYII=';
  const before = JSON.stringify(state);
  const result = await window.ImobifyCompiler.compile(state);
  assert.equal(JSON.stringify(state), before, 'compilador não pode alterar os dados originais');
  const output = await JSZip.loadAsync(await result.blob.arrayBuffer());
  const html = await output.file('index.html').async('text');
  const readme = await output.file('README.txt').async('text');
  const project = JSON.parse(await output.file('content/project.json').async('text'));
  const audit = JSON.parse(await output.file('content/seo-readiness.json').async('text'));
  assert.match(html, /src="assets\/js\/site\.js\?v=\d+"/);
  assert.ok(output.file('assets/js/site.js'));
  assert.ok(output.file('assets/css/site.css'));
  assert.equal(project.version, '6.0.83');
  assert.equal(audit.version, '6.0.83');
  assert.match(readme, /IMOBIFY STUDIO 6\.0\.83/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1|minimum-scale=1/);
  assert.ok(output.file(project.sections[0].props.image), 'hero com mídia data: deve publicar arquivo próprio');
  assert.ok(!requests.some(url => /assets\/js\/site\.js\?v=/.test(url)), 'asset já presente no ZIP não deve ser buscado com ?v');
  assert.equal(JSON.parse(read('project.json')).version, '6.0.83');
  assert.match(read('index.html'), /Studio 6\.0\.83/);
  console.log('release 6.0.48: versão, ZIP, cache-busting, mídia, zoom e input imutável OK');
})().catch(error => { console.error(error); process.exitCode = 1; });

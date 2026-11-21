const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');

function loadScript(context, rel) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel });
}

test('export hydrates quick-complement defaults for legacy Form Sender sections', async () => {
  const JSZip = require(path.join(ROOT, 'vendor/jszip.min.js'));
  const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    URL,
    Blob,
    FormData,
    JSZip,
    fetch: async (url) => {
      const file = path.join(ROOT, String(url));
      if (!fs.existsSync(file)) return { ok:false, status:404, text:async()=>'', arrayBuffer:async()=>new ArrayBuffer(0), headers:{get:()=>null} };
      const buf = fs.readFileSync(file);
      return { ok:true, status:200, text:async()=>buf.toString('utf8'), json:async()=>JSON.parse(buf.toString('utf8')), arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength), headers:{get:()=>null} };
    },
    window: {},
    document: { createElement(){ return { innerHTML:'', content:{ cloneNode(){ return {}; } } }; } },
    location: { href:'http://localhost/' }
  });
  context.window = context;
  context.window.location = context.location;
  context.window.JSZip = JSZip;

  loadScript(context, 'assets/js/util.js');
  loadScript(context, 'assets/js/catalog.js');
  loadScript(context, 'assets/js/plugin-loader.js');
  await context.ImobifyPluginLoader.ready;
  loadScript(context, 'assets/js/renderer.js');
  loadScript(context, 'assets/js/compiler.js');

  const catalog = context.ImobifyCatalog;
  const state = catalog.defaultState();
  const form = catalog.createSection('form-sender-v4');
  // Simula uma seção criada antes da 4.3.x: nenhum campo quick* foi persistido.
  Object.keys(form.props).filter(k => k.startsWith('quick')).forEach(k => delete form.props[k]);
  state.sections = [form];
  state.behaviorPlugins = [];

  const result = await context.ImobifyCompiler.compile(state);
  const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
  const html = await zip.file('index.html').async('text');
  const js = await zip.file('assets/js/site.js').async('text');
  const project = JSON.parse(await zip.file('content/project.json').async('text'));

  assert.match(html, /data-quick-complement="true"/);
  assert.match(html, /data-field-autocomplete="true"/);
  assert.match(html, /data-quick-q1-label="Qual é o seu objetivo\?"/);
  assert.match(html, /data-quick-q2-label="Em qual momento está a sua procura\?"/);
  assert.match(html, /data-quick-q3-label="O que é mais importante para você agora\?"/);
  assert.match(js, /openQuickComplement/);
  assert.equal(project.sections[0].props.quickComplement, true);
  assert.equal(project.sections[0].props.fieldAutocomplete, true);
  assert.equal(project.sections[0].props.quickQ3Enabled, true);
});

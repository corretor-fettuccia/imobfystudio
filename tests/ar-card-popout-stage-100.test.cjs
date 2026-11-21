// AR Card Popout 3D Stage 1.0.0 — manifesto, render, pacote ZIP e independência do Single 1.2.0.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const JSZip = require(path.join(ROOT, 'vendor/jszip.min.js'));
global.JSZip = JSZip;
global.window = { JSZip, indexedDB: null, confirm: () => true };
global.fetch = async (resource) => {
  const full = path.resolve(ROOT, String(resource).replace(/^\.\//, ''));
  if (!full.startsWith(ROOT) || !fs.existsSync(full)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
  const buf = fs.readFileSync(full);
  return { ok: true, status: 200, text: async () => buf.toString('utf8'), json: async () => JSON.parse(buf.toString('utf8')), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
};
const load = (rel) => vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
(async () => {
  ['assets/js/util.js', 'assets/js/catalog.js', 'assets/js/icon-library.js', 'assets/js/plugin-loader.js', 'assets/js/component-state.js'].forEach(load);
  await window.ImobifyPluginLoader.ready;
  const plugin = window.ImobifyCatalog.plugins['ar-card-popout-3d-stage'];
  assert.ok(plugin, 'plugin Stage deve estar registrado');
  assert.equal(plugin.pluginSource, 'bundled');
  assert.equal(plugin.manifest.version, '1.0.0');
  assert.equal(plugin.compositionRole, 'both');
  assert.equal(plugin.compositionCardinality, 'single');
  assert.equal(window.ImobifyCatalog.plugins['ar-card-popout-3d'].manifest.version, '1.2.0', 'Single original deve continuar intacto');

  const keys = plugin.fields.map((f) => f.key);
  assert.deepEqual(new Set(keys), new Set(Object.keys(plugin.manifest.defaults)), 'todo campo tem default e vice-versa');
  assert.ok(!keys.some((k) => /^cta/i.test(k) || k === 'showCta'), 'Stage não tem CTA');
  for (const k of ['headline', 'block1Text', 'block2Text', 'block3Text', 'blocksLayout', 'openTrigger', 'pulseMode', 'stageHeight', 'mobileCardWidth']) assert.ok(keys.includes(k), `campo ${k}`);

  const html = plugin.render({ ...plugin.defaults }, {}, 'stage-test');
  assert.match(html, /data-plugin="ar-card-popout-3d-stage"/);
  assert.equal((html.match(/class="arst-root"/g) || []).length, 1);
  assert.equal((html.match(/class="arst-block"/g) || []).length, 3);
  assert.match(html, /É assim que vai ficar sua nova casa/);
  assert.doesNotMatch(html, /<a [^>]*class="[^"]*cta/i, 'sem botão');
  assert.doesNotMatch(html, /\{\{|\}\}/, 'sem placeholders sobrando');

  const two = plugin.render({ ...plugin.defaults, block3Text: '' }, {}, 'stage-test-2');
  assert.equal((two.match(/class="arst-block"/g) || []).length, 2, 'bloco vazio não é renderizado');

  const css = fs.readFileSync(path.join(ROOT, 'plugins/ar-card-popout-3d-stage-v1.0.0/plugin.css'), 'utf8');
  assert.match(css, /container-type:inline-size/);
  assert.match(css, /@container arst \(min-width:560px\)/);
  assert.match(css, /@container arst \(min-width:980px\)/);
  assert.match(css, /prefers-reduced-motion/);

  const buffer = fs.readFileSync(path.join(ROOT, 'plugin-packs/ar-card-popout-3d-stage-v1.0.0.zip'));
  Object.defineProperty(buffer, 'size', { value: buffer.length });
  const parsed = await window.ImobifyPluginLoader.packageFromZip(buffer);
  assert.equal(parsed.id, 'ar-card-popout-3d-stage');
  assert.match(parsed.manifest.defaults.projectionImage, /^data:image\/png;base64,/);
  console.log('ar-card-popout-stage-100: OK');
})().catch((error) => { console.error(error); process.exit(1); });

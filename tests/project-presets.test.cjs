const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

const registry = JSON.parse(read('presets/presets.json'));
assert.equal(registry.schemaVersion, 1);
assert.ok(Array.isArray(registry.presets));
assert.equal(registry.presets.length, 18);

const expected = [
  'Loteamento','Empreendimento vertical','Empreendimento horizontal','Investimento','Casa individual','Sobrado individual',
  'Minha Casa Minha Vida — imóvel na planta','Minha Casa Minha Vida — 100% financiado','Minha Casa Minha Vida — pela parcela (atender dor)',
  'Exclusividade e público seleto','Foco na oportunidade','Foco no rendimento','Foco na segurança e comodidade',
  'Foco no retorno do investimento','Foco no posicionamento de mercado','Foco na estratégia','Foco no nicho de mercado','Foco na demanda'
];
assert.deepEqual(registry.presets.map((item) => item.name), expected);

for (const entry of registry.presets) {
  assert.ok(entry.id && entry.directory && entry.file);
  const presetPath = path.join(ROOT, entry.directory, entry.file);
  assert.ok(fs.existsSync(presetPath), `preset ausente: ${presetPath}`);
  const payload = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
  assert.equal(payload.id, entry.id);
  assert.ok(payload.baseBlueprint || payload.project);
}

const index = read('index.html');
assert.match(index, /id="newProjectDialog"/);
assert.match(index, /Novo projeto em branco/);
assert.match(index, /id="projectPresetLibrary"/);
assert.match(index, /id="saveProjectAsPresetBtn"/);
assert.match(index, /assets\/js\/preset-loader\.js/);

const app = read('assets/js/app.js');
assert.match(app, /newProjectBtn'\)\.addEventListener\('click', openNewProjectDialog\)/);
assert.match(app, /createNewProjectFromPreset/);
assert.match(app, /applyProjectPreset/);
assert.match(app, /saveCurrentProjectPresetToStudio/);
assert.match(app, /exportCurrentProjectPresetZip/);
assert.match(app, /await window\.ImobifyPresetLoader\.ready/);

const loader = read('assets/js/preset-loader.js');
assert.match(loader, /presets\/presets\.json/);
assert.match(loader, /showDirectoryPicker/);
assert.match(loader, /getDirectoryHandle\('presets'/);
assert.match(loader, /writeTextFile\(presetsHandle, 'presets\.json'/);
assert.match(loader, /exportZip/);

console.log(`Project Presets OK: ${registry.presets.length} presets registrados.`);

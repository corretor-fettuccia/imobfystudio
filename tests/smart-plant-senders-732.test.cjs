'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const get = file => fs.readFileSync(path.join(root,file),'utf8');
const JSZip = require('../vendor/jszip.min.js');

test('Smart Plant tem destino automático, V4 e Agendamento e preserva configuração anterior',()=>{
 const script = get('plugins/smart-plant-v1.4.2/plugin.js');
 const manifest=JSON.parse(get('plugins/smart-plant-v1.4.2/plugin.json'));
 assert.equal(manifest.version,'1.5.0');
 assert.equal(manifest.defaults.formDestination,'auto');
 assert.ok(manifest.fields.find(f=>f.key==='formDestination').options.some(o=>o.value==='agendamento-sender'));
 assert.match(get('plugins/smart-plant-v1.4.2/template.html'),/data-form-destination="{{formDestination}}"/);
 assert.match(script,/agendamento-sender':pluginFor\(anchorElement/);
 assert.match(script,/imobify:smart-plant-select/);
 assert.match(script,/writeFormSenderV4Context\(chosen.mount\)/);
 assert.match(script,/chosen\.mount\.dataset\.agsReady !== 'true'/);
 assert.match(script,/chosen\.mount\.dispatchEvent/);
 assert.match(script,/chosen = firstAvailable\('form-sender-v4'\) \|\| firstAvailable\('agendamento-sender'\)/);
});

test('Agendamento Sender transfere a planta apenas ao mount selecionado e ao POST',()=>{
 const manifest=JSON.parse(get('plugins/agendamento-sender/plugin.json'));
 assert.equal(manifest.version,'1.4.1');
 const script=get('plugins/agendamento-sender/plugin.js');
 const template=get('plugins/agendamento-sender/template.html');
 assert.match(script,/mount\.addEventListener\('imobify:smart-plant-select'/);
 assert.match(script,/smartPlantContext = \{/);
 assert.match(script,/summary\+='\\n\\n'\+plantLines/);
 assert.match(script,/payload\.append\('smartPlantId',smartPlantContext\.plantId\)/);
 assert.match(script,/payload\.append\('smartPlantCode',smartPlantContext\.plantCode\)/);
 assert.match(script,/payload\.append\('smartPlant',smartPlantContext\.plantTitle\)/);
 assert.match(script,/payload\.append\('smartPlantArea',smartPlantContext\.area\)/);
 assert.match(script,/smartPlantContext=null/);
 assert.match(template,/data-ags-selected-plant hidden/);
});

test('Pacotes importáveis Smart Plant e Agendamento Sender estão atualizados',async()=>{
 for (const [name,version] of [['smart-plant-v1.5.0.zip','1.5.0'],['agendamento-sender-v1.4.1.zip','1.4.1']]) {
  const zip=await JSZip.loadAsync(fs.readFileSync(path.join(root,'plugin-packs',name)));
  const manifest=JSON.parse(await zip.file('plugin.json').async('text'));
  assert.equal(manifest.version,version);
  assert.ok(zip.file('plugin.js'));
  assert.ok(zip.file('template.html'));
 }
});

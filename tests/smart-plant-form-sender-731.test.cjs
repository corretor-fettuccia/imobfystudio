'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const get=x=>fs.readFileSync(path.join(root,x),'utf8');
const JSZip=require(path.join(root,'vendor/jszip.min.js'));

test('Smart Plant 1.4.5 mantém destino por âncora e contexto único',()=>{
 const js=get('plugins/smart-plant-v1.4.2/plugin.js');
 const html=get('plugins/smart-plant-v1.4.2/template.html');
 const manifest=JSON.parse(get('plugins/smart-plant-v1.4.2/plugin.json'));
 assert.equal(manifest.version,'1.5.0');
 assert.match(js,/pluginFor\(anchorElement, 'form-sender-v4'\)/);
 assert.match(js,/pluginFor\(anchorElement, 'form-sender-popup'\)/);
 assert.match(js,/chosen\.type === 'form-sender-v4'/);
 assert.match(js,/writeFormSenderV4Context\(chosen.mount\)/);
 assert.match(js,/form\.dataset\.smartPlantMessage = block/);
 assert.match(js,/previous && current\.indexOf\(previous\) >= 0/);
 assert.match(js,/data-smart-plant-action-status/);
 assert.match(html,/role="status" aria-live="polite"/);
 assert.doesNotMatch(js,/document\.querySelector\('\[data-plugin="form-sender-popup"\]'\) \? null/);
});

test('Form Sender Popup 1.4.1 abre por clique, respeita destino e não duplica contexto',()=>{
 const js=get('plugins/form-sender-popup/plugin.js');
 const manifest=JSON.parse(get('plugins/form-sender-popup/plugin.json'));
 assert.equal(manifest.version,'1.4.1');
 assert.match(js,/function open\(force\)\{if\(!force&&!canOpen\(\)\)return;/);
 assert.match(js,/d\.targetPopupMount&&d\.targetPopupMount!==root/);
 assert.match(js,/if\(!instance\)open\(!!d\.explicitAction\)/);
 assert.doesNotMatch(js,/instance\.querySelector\('textarea\[name=msg\]'\)\.value=\[instance\.querySelector/);
});

test('pacotes de plugins atualizados estão disponíveis para importação',async()=>{
 for(const [name,expected] of [['smart-plant-v1.5.0.zip','1.5.0'],['form-sender-popup-v1.4.1.zip','1.4.1']]){
   const zip=await JSZip.loadAsync(fs.readFileSync(path.join(root,'plugin-packs',name)));
   const manifest=JSON.parse(await zip.file('plugin.json').async('text'));
   assert.equal(manifest.version,expected);
   assert.ok(zip.file('plugin.js'));
   assert.ok(zip.file('template.html'));
 }
});

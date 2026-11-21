const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=(rel)=>fs.readFileSync(path.join(ROOT,rel),'utf8');

test('element style exposes independent title/body alignment including justify and mobile overrides',()=>{
  const app=read('assets/js/app.js');
  const catalog=read('assets/js/catalog.js');
  const renderer=read('assets/js/renderer.js');
  assert.match(app,/Alinhamento dos títulos/);
  assert.match(app,/Alinhamento dos títulos · mobile/);
  assert.match(app,/headingAlignMobile/);
  assert.match(app,/Alinhamento do corpo/);
  assert.match(app,/\['justify','Justificado'\]/);
  assert.match(app,/bodyAlignMobile/);
  assert.match(catalog,/bodyAlign:'inherit'/);
  assert.match(renderer,/bodyAlignSelector/);
  assert.match(renderer,/text-justify:inter-word/);
  assert.match(renderer,/hyphens:auto/);
});

test('Lifestyle 1.2.1 exposes independent title and narrative alignment including justify',()=>{
  const manifest=JSON.parse(read('plugins/lifestyle/plugin.json'));
  const catalog=read('assets/js/catalog.js');
  const css=read('plugins/lifestyle/plugin.css');
  assert.equal(manifest.version,'1.2.2');
  assert.match(catalog,/titleAlign: 'left'/);
  assert.match(catalog,/titleAlignMobile: 'inherit'/);
  assert.match(catalog,/Alinhamento do título/);
  assert.match(catalog,/copyAlign: 'left'/);
  assert.match(catalog,/\['justify','Justificado'\]/);
  assert.match(catalog,/Alinhamento da narrativa/);
  assert.match(css,/data-title-align="justify"/);
  assert.match(css,/data-copy-align="justify"/);
  assert.match(css,/text-align:justify/);
});

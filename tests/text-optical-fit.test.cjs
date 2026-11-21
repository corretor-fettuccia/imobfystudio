const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const manifest=(p)=>JSON.parse(read(p));

test('Studio 5.8.2 exposes editorial/balanced line composition without forced word spacing',()=>{
  const app=read('assets/js/app.js');
  const renderer=read('assets/js/renderer.js');
  assert.match(app,/Balanceado · recomendado/);
  assert.match(renderer,/bodyLineFit === 'balanced'/);
  assert.match(renderer,/word-spacing:normal/);
  assert.match(renderer,/hyphens:none/);
});

test('Lifestyle 1.2.1 defaults to left + balanced, not justified',()=>{
  const m=manifest('plugins/lifestyle/plugin.json');
  const css=read('plugins/lifestyle/plugin.css');
  const catalog=read('assets/js/catalog.js');
  assert.equal(m.version,'1.2.2');
  assert.match(catalog,/copyAlign: 'left', lineFit: 'balanced'/);
  assert.match(catalog,/Balanceado · recomendado/);
  assert.match(css,/data-line-fit="balanced"/);
  assert.match(css,/text-wrap:balance/);
  assert.match(css,/word-spacing:normal/);
});

test('Only TEXT 1.2.1 and Magazine 1.3.1 expose balanced preset without iterative fitting',()=>{
  const only=manifest('plugins/only-text-context/plugin.json');
  const mag=manifest('plugins/magazine-text-pro-v1.3.1/plugin.json');
  assert.equal(only.version,'1.2.1');
  assert.equal(mag.version,'1.3.1');
  for(const m of [only,mag]){
    assert.equal(m.defaults.lineFit,'balanced');
    const f=m.fields.find(x=>x.key==='lineFit');
    assert.deepEqual(f.options.map(x=>x.value),['normal','editorial','balanced']);
  }
  for(const p of ['plugins/only-text-context/plugin.js','plugins/magazine-text-pro-v1.3.1/plugin.js']){
    const js=read(p);assert.doesNotMatch(js,/opticalFit|ResizeObserver/);
  }
});

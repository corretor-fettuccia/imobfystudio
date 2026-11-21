const fs=require('fs'), assert=require('assert');
const meta=JSON.parse(fs.readFileSync('plugins/gallery-big-four/plugin.json','utf8'));
const tpl=fs.readFileSync('plugins/gallery-big-four/template.html','utf8');
const css=fs.readFileSync('plugins/gallery-big-four/plugin.css','utf8');
assert.equal(meta.version,'2.3.0');
for(const k of ['eyebrowSize','sectionTitleSize','panelTitleSize','verticalTextSize','mobileTextScale']){
  assert(meta.fields.some(f=>f.key===k),`campo ${k} ausente`);
  assert(Object.hasOwn(meta.defaults,k),`default ${k} ausente`);
}
for(const v of ['--pp-eyebrow-size','--pp-section-title-size','--pp-panel-title-size','--pp-vertical-text-size','--pp-mobile-text-scale']){
  assert(tpl.includes(v),`variável ${v} ausente do template`);
  assert(css.includes(v),`variável ${v} ausente do CSS`);
}
console.log('Gallery Big Four typography attributes OK');

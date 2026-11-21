const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const f=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=f('plugins/smart-plant-v1.4.2/plugin.css');
const js=f('plugins/smart-plant-v1.4.2/plugin.js');
const tpl=f('plugins/smart-plant-v1.4.2/template.html');
const admin=f('assets/js/app.js');
const core=f('core/design-system.css');
assert.equal(JSON.parse(f('plugins/smart-plant-v1.4.2/plugin.json')).version,'1.4.5');
for(const varname of ['--section-space','--content-gap','--element-gap','--component-padding','--heading-weight','--heading-line','--heading-tracking','--body-size','--body-line','--h3-max','--radius','--surface','--action-button-bg','--action-button-text','--ib-headline-font','--ib-subheadline-font','--ib-body-font','--ib-cta-font']) {
  assert(css.includes(`var(${varname}`),`${varname} not bridged to Smart Plant`);
}
assert.match(tpl,/data-design-role="title"/);
assert.match(tpl,/data-design-role="subtitle"/);
assert.match(tpl,/data-design-role="cta"/);
assert.match(js,/data-design-role=\\"cta\\"|data-design-role="cta"/);
for(const value of ['data-section-id','data-ib-type-mode','--component-title-color','--component-muted-color','--action-button-bg','--ib-headline-size','--ib-subheadline-weight']){
  assert(js.includes(value)||value.startsWith('--ib-')&&js.includes("'--ib-' + role + '-' + suffix"),`modal lost: ${value}`);
}
assert.match(admin,/const wizard = brand\.typographyWizardEnabled/);
assert.match(admin,/const surface = String\(b\.surface/);
assert.match(core,/--component-title-color/);
assert.match(css,/smart-plant\[data-local-theme="true"\]/);
assert.match(css,/background:transparent/);
// A classe injetada pelo core em h3 não deve promovê-lo para o papel 'headline'.
const typeSystem=f('assets/js/typography-system.js');
assert.match(typeSystem,/\[class\$=\"-title\"\]:not\(\.imobify-design-title\)/);
assert.match(typeSystem,/subheadline:':where\(h3/);
console.log('Smart Plant 1.4.5 · tokens, wizard, portal de modal, CTA, herança e aparências locais OK');

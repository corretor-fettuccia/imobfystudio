const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8')}
function manifest(rel){return JSON.parse(read(rel))}
function field(m,key){return m.fields.find((x)=>x.key===key)}

test('Only TEXT Context 1.2.1 exposes typography, justify, fractional spacing and cinematic presets',()=>{
 const m=manifest('plugins/only-text-context/plugin.json');
 assert.equal(m.version,'1.2.1');
 assert.ok(field(m,'blockAlign'));
 assert.equal(field(m,'paddingX').step,0.25);
 assert.ok(field(m,'textAlign').options.some((x)=>x.value==='justify'));
 assert.ok(field(m,'motionPreset').options.some((x)=>x.value==='blur-focus'));
 assert.ok(field(m,'motionPreset').options.some((x)=>x.value==='mask-reveal'));
 const css=read('plugins/only-text-context/plugin.css');
 assert.match(css,/text-align:justify/);
 assert.match(css,/filter:blur\(14px\)/);
 assert.match(css,/clip-path:inset/);
 const js=read('plugins/only-text-context/plugin.js');
 assert.match(js,/IntersectionObserver/);
});

test('Magazine Text Pro 1.3.1 exposes complete typography, alignment, mobile scale and cinematic presets',()=>{
 const m=manifest('plugins/magazine-text-pro-v1.3.1/plugin.json');
 assert.equal(m.version,'1.3.1');
 for(const key of ['headingTypeface','bodyTypeface','headerAlign','bodyAlign','titleSize','titleWeight','titleLineHeight','titleTracking','subtitleSize','leadSize','bodyFontSize','bodyTracking','quoteSize','mobileTypographyScale','motionPreset']) assert.ok(field(m,key),`missing ${key}`);
 assert.ok(field(m,'bodyAlign').options.some((x)=>x.value==='justify'));
 assert.equal(field(m,'desktopPaddingX').step,0.25);
 const css=read('plugins/magazine-text-pro-v1.3.1/plugin.css');
 assert.match(css,/data-body-align="justify"/);
 assert.match(css,/filter:blur\(16px\)/);
 assert.match(css,/mtp-mobile-type-scale/);
 const js=read('plugins/magazine-text-pro-v1.3.1/plugin.js');
 assert.match(js,/IntersectionObserver/);
});

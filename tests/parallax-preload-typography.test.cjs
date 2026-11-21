const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const pluginRoot = path.join(ROOT, 'plugins/parallax');
const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'));
const template = fs.readFileSync(path.join(pluginRoot, 'template.html'), 'utf8');
const js = fs.readFileSync(path.join(pluginRoot, 'plugin.js'), 'utf8');
const css = fs.readFileSync(path.join(pluginRoot, 'plugin.css'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');

assert.equal(manifest.version, '2.10.3');
assert.equal(manifest.defaults.preloadMode, 'complete');
assert.equal(manifest.defaults.experienceProfile, 'cinema-smooth');
assert.ok(manifest.fields.find(f => f.key === 'experienceProfile'));
assert.ok(manifest.fields.find(f => f.key === 'preloadMode'));
for (const key of ['cinematicAccelMs','cinematicDecelMs','cinematicMaxRate','wheelThreshold','gestureCooldown']) {
  assert.equal(manifest.fields.find(f => f.key === key)?.panel, 'advanced', `${key} should be advanced`);
}
assert.match(template, /data-preload-mode="\{\{preloadMode\}\}"/);
assert.match(js, /async function preloadCompleteVideo/);
assert.match(js, /response\.body\?\.getReader/);
assert.match(js, /URL\.createObjectURL\(blob\)/);
assert.match(js, /URL\.revokeObjectURL\(preloadObjectUrl\)/);
assert.match(js, /PROFILE_PRESETS/);
assert.match(js, /applyExperienceProfile/);
assert.match(template, /data-banner-title-size=/);
assert.match(css, /--svp-title-line-height/);
assert.match(css, /--svp-point-title-weight/);
// Os ajustes por banner foram movidos para o modal avançado; a timeline
// não deve expor duplicações antigas, mas deve orientar onde editar.
assert.match(app, /Tipografia e animações: configure exclusivamente no modal/);
assert.match(app, /Configuração avançada do layout/);
assert.match(js, /point\.titleSize/);
assert.match(js, /point\.fontFamily/);
assert.match(css, /svp-hero\[data-position="center-left"\]/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*svp-hero\[data-position="center-right"\]/);

console.log('Parallax preload/profile/typography behavior OK');

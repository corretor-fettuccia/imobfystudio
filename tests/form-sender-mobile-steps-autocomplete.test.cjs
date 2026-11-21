const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');

test('Form Sender mobile advances on answer, auto-sends last answer and keeps autocomplete flag', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT,'plugins/form-sender-v4/plugin.json'),'utf8'));
  const runtime = fs.readFileSync(path.join(ROOT,'plugins/form-sender-v4/adapter.js'),'utf8');
  const css = fs.readFileSync(path.join(ROOT,'plugins/form-sender-v4/adapter.css'),'utf8');
  const template = fs.readFileSync(path.join(ROOT,'plugins/form-sender-v4/template.html'),'utf8');

  assert.equal(manifest.version, '4.5.0');
  assert.equal(manifest.defaults.fieldAutocomplete, true);
  assert.ok(manifest.fields.some(f => f.key === 'fieldAutocomplete' && f.type === 'toggle'));
  assert.match(template, /data-field-autocomplete="\{\{fieldAutocomplete\}\}"/);

  assert.match(runtime, /matchMedia\('\(max-width: 640px\)'\)/);
  assert.match(runtime, /showStep\(/);
  assert.match(runtime, /data-quick-current/);
  assert.doesNotMatch(runtime, /confirmButton\.textContent = 'Próxima'/);
  assert.match(runtime, /setTimeout\(function \(\) \{ showStep\(index \+ 1, false\); \}, 110\)/);
  assert.match(runtime, /if \(result\.valid\) finish\(result\.answers\)/);
  assert.match(runtime, /needsAction = q && \(q\.type \|\| 'single'\) === 'multiple'/);
  assert.match(css, /formsenderQuickFadeIn/);
  assert.match(css, /formsenderQuickFadeOut/);
  assert.match(css, /place-items:center/);
  assert.match(css, /--formsender-mobile-scale/);
  assert.match(css, /min-height:0/);
  assert.doesNotMatch(runtime, /questionsWrap\.style\.height =/);
  assert.match(runtime, /questionsWrap\.style\.removeProperty\('height'\)/);
  assert.match(runtime, /fitMobileCard/);
  assert.match(runtime, /window\.visualViewport/);
  assert.match(runtime, /event\.target === overlay/);

  assert.doesNotMatch(runtime, /formsenderCSS_quick-close/);
  assert.doesNotMatch(runtime, /formsenderCSS_quick-skip/);
  assert.doesNotMatch(runtime, /Pular e enviar/);
  assert.match(runtime, /document\.addEventListener\('keydown', blockEscape, true\)/);
  assert.match(runtime, /event\.key === 'Escape'/);

  assert.match(runtime, /autocomplete', shouldEnable \? item\.token : 'off'/);
  assert.match(runtime, /name:'nome', token:'name'/);
  assert.match(runtime, /name:'email', token:'email'/);
  assert.match(runtime, /name:'telefone', token:'tel'/);
});

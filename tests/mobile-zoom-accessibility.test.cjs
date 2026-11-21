const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const editor = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(ROOT, 'assets/js/renderer.js'), 'utf8');
const runtime = fs.readFileSync(path.join(ROOT, 'core/runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'core/design-system.css'), 'utf8');
// O zoom deve funcionar no editor e na landing page gerada.
for (const source of [editor, renderer]) {
  assert.match(source, /width=device-width, initial-scale=1(?:\.0)?, viewport-fit=cover/);
  assert.doesNotMatch(source, /user-scalable=no|maximum-scale=1|minimum-scale=1/);
}
// Nenhuma interceptação global de pinch/gestures/double-click no runtime.
assert.doesNotMatch(runtime, /['"]gesturestart['"]|touches\.length\s*>\s*1|addEventListener\(['"]dblclick/);
assert.match(css, /touch-action:\s*manipulation/);
console.log('zoom accessível no editor e no HTML exportado: OK');

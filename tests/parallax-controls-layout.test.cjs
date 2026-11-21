const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/parallax/plugin.json'), 'utf8'));
const template = fs.readFileSync(path.join(ROOT, 'plugins/parallax/template.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'plugins/parallax/plugin.css'), 'utf8');

assert.equal(manifest.version, '2.10.3');
assert.equal(manifest.defaults.showSkip, true, 'novos Parallax devem oferecer Pular intro por padrão');
assert.match(template, /svp-toolbar svp-toolbar-primary[\s\S]*svp-skip[\s\S]*svp-restart/, 'Pular e Reiniciar devem compartilhar o grupo primário');
assert.match(template, /svp-toolbar svp-toolbar-secondary[\s\S]*svp-sound/, 'Som deve permanecer em grupo separado');
assert.match(css, /\.svp-toolbar-primary\s*\{[^}]*left:[^;}]+;[^}]*bottom:/s, 'grupo primário deve ficar no canto inferior esquerdo');
assert.match(css, /\.svp-toolbar-secondary\s*\{[^}]*top:[^;}]+;[^}]*right:/s, 'som deve permanecer no canto superior direito');
assert.match(css, /\.svp-scroll-hint\s*\{[^}]*left:\s*50%[^}]*bottom:/s, 'hint deve permanecer centralizado e independente');
assert.match(css, /@media[\s\S]*\.svp-toolbar-primary\s*\{[^}]*flex-direction:\s*column/s, 'mobile deve empilhar os controles primários');
assert.match(css, /safe-area-inset-left/, 'controles devem respeitar safe-area lateral');
assert.match(css, /safe-area-inset-bottom/, 'controles devem respeitar safe-area inferior');
console.log('Parallax controls layout OK');

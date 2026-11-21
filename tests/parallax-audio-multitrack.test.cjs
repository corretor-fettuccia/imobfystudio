const assert = require('node:assert/strict');
const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync('plugins/parallax/plugin.json','utf8'));
const tpl = fs.readFileSync('plugins/parallax/template.html','utf8');
const runtime = fs.readFileSync('plugins/parallax/plugin.js','utf8');
const editor = fs.readFileSync('assets/js/app.js','utf8');
for(const k of ['audioMuted','backgroundAudio','backgroundVolume','narrationVolume','audioDucking','duckingVolume','backgroundLoop','videoAudio']){
 assert.ok(k in manifest.defaults,`missing default ${k}`);
 assert.ok(manifest.fields.some(f=>f.key===k),`missing field ${k}`);
 const attribute = `data-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="{{${k}}}"`;
 assert.ok(tpl.includes(attribute), `missing exported attribute ${attribute}`);
}
for(const s of ['changeNarration(current)','narrationTrack','backgroundTrack','duckVolume','audioUnlocked'])assert.ok(runtime.includes(s));
for(const s of ['data-parallax-narration-upload','narrationDelay','narrationEnabled','narrationLoop'])assert.ok(editor.includes(s));
console.log('parallax multitrack schema/editor/runtime: ok');

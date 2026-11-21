const fs = require('fs');
const assert = require('assert');
const path=require('path'); const app=fs.readFileSync(path.join(__dirname,'../assets/js/app.js'),'utf8');

assert(app.includes("const js64 = btoa(binary)"), 'editor modal deve transportar JS em base64');
assert(!app.includes('<script type="module">${js}</scr'), 'não deve injetar JS cru no srcdoc');
const editor = fs.readFileSync(path.join(__dirname,'../plugins/tour360-pro/editor/app.js'),'utf8');
assert(editor.includes('if (!this.embedMode) {'), 'embed não pode restaurar autosave por cima da section');
assert(editor.includes('if (this.embedMode) return;'), 'embed não deve persistir autosave local');
assert(editor.includes('pendingHostConfig'), 'load do host deve ser tolerante à inicialização');
console.log('tour360 modal regression: ok');

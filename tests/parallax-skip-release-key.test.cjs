const fs=require('fs'); const assert=require('assert');
const js=fs.readFileSync('plugins/parallax/plugin.js','utf8');
assert.match(js, /const releasePoint = points\.find\(\(point\) => bool\(point\.releaseScroll\)\)/, 'Pular deve procurar a chave marcada para liberar scroll');
assert.match(js, /jumpToTimePaused\(t, \{ intent:"control-skip-release" \}\)/, 'Pular deve saltar pausado para a chave de liberação');
assert.match(js, /releaseAtMarkedBanner\(t, "control-skip-release"\)/, 'Pular deve aplicar a mesma liberação da chave marcada');
assert.match(js, /sem chave de liberação configurada[\s\S]*boundaryTimeForPageDirection\(1\)/i, 'Sem chave marcada deve manter fallback para OUT');
console.log('Parallax skip -> release key OK');

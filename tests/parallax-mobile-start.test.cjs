const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', 'plugins', 'parallax');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'template.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'plugin.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'plugin.js'), 'utf8');
const app = fs.readFileSync(path.resolve(__dirname, '..', 'assets/js/app.js'), 'utf8');

assert.equal(manifest.version, '2.10.3');
assert.equal(manifest.defaults.restartOnReturnStart, true);
assert.match(template, /data-restart-on-return-start=/);
assert.match(template, /svp-scroll-hint-icon/);
assert.match(css, /@keyframes svp-swipe-up/);
assert.match(js, /isMobile \? "Deslize para cima" : "Rolar para explorar"/);
assert.match(js, /function scheduleRestartFromTimelineStart/);
assert.doesNotMatch(js, /if \(direction < 0 && isAtPageBoundary\(direction, displayTime\)\) parkAtTimelineStart/, 'wheel/touch must not freeze at IN');
assert.doesNotMatch(app, /data-parallax-add-start-banner/, 'IN must not expose banner creation');
assert.doesNotMatch(app, /Criar\/editar chave IN/);
assert.match(app, /INICIAR<\/b> define o primeiro frame do vídeo/);
assert.match(js, /arrivalIntent === "gesture"/);
assert.match(js, /filter\(\(point\) => number\(point.startTime, config.start\) > config.start \+ startBoundaryTolerance\)/);
assert.match(js, /jumpToTimePaused\(number\(point.startTime, config.start\), \{ intent:"chapter-marker" \}\)/);

const skipStart = js.indexOf('skipButton.addEventListener');
const restartStart = js.indexOf('restartButton.addEventListener');
const soundStart = js.indexOf('soundButton.addEventListener');
assert(skipStart >= 0 && restartStart > skipStart && soundStart > restartStart);
const skipBody = js.slice(skipStart, restartStart);
assert.match(skipBody, /cancelReturnRestart\(\)/);
assert.match(skipBody, /handoffPastStickyBoundary\(1\)/);
assert.doesNotMatch(skipBody, /scheduleRestartFromTimelineStart/, 'skip must never relaunch the timeline');
const restartBody = js.slice(restartStart, soundStart);
assert.match(restartBody, /scheduleRestartFromTimelineStart\(\)/, 'restart is allowed to relaunch the first stage');

console.log('Parallax mobile/start/control state machine OK');

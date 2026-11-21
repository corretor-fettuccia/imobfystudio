const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', 'plugins', 'parallax');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const js = fs.readFileSync(path.join(root, 'plugin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'plugin.css'), 'utf8');

assert.equal(manifest.version, '2.10.3');
assert.match(js, /const nativeRateFloor = mobileQuery\.matches \? 0\.62 : 0\.55/);
assert.match(js, /getVideoPlaybackQuality/);
assert.match(js, /smoothedRate \+= \(desiredRate - smoothedRate\) \* 0\.42/);
assert.match(js, /now - lastRateAt >= 72/);
assert.match(js, /rawProgressForTime\(displayTime\)/);
assert.match(css, /contain: paint/);
assert.match(css, /translateZ\(0\) scale\(var\(--svp-scale\)\)/);

const seekStart = js.indexOf('function runSeekTransition');
const nativeStart = js.indexOf('function runNativeForwardTransition');
const animateStart = js.indexOf('function animateToTime');
assert(seekStart >= 0 && nativeStart > seekStart && animateStart > nativeStart);
const seekBody = js.slice(seekStart, nativeStart);
const nativeBody = js.slice(nativeStart, animateStart);
assert.doesNotMatch(seekBody, /scrollToProgress\(/, 'reverse cinematic transition must not force physical scroll each frame');
assert.doesNotMatch(nativeBody, /scrollToProgress\(/, 'forward cinematic transition must not force physical scroll each video frame');

console.log('Parallax cinematic performance behavior OK');

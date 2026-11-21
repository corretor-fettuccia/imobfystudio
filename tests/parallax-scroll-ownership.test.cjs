const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/parallax/plugin.json'), 'utf8'));
const js = fs.readFileSync(path.join(ROOT, 'plugins/parallax/plugin.js'), 'utf8');

assert.equal(manifest.version, '2.10.3');
assert.match(js, /let ownsScroll = true/);
assert.match(js, /root\.dataset\.scrollControl = "owned"/);
assert.match(js, /function releaseScrollControl\(reason = "external"\)/);
assert.match(js, /function acquireScrollControl\(reason = "reentry"\)/);
assert.match(js, /function updateScrollOwnershipFromPosition\(\)/);
assert.match(js, /releaseScrollControl\(direction > 0 \? "terminal-out" : "terminal-before"\)/, 'OUT/handoff must release scroll ownership');
assert.match(js, /function anchorTargetsThisComponent\(anchor\)/);
assert.match(js, /function onDocumentAnchorClick\(event\)/);
assert.match(js, /releaseScrollControl\("external-anchor"\)/, 'external anchors must release before navigation');
assert.match(js, /document\.addEventListener\("click", onDocumentAnchorClick, true\)/, 'anchor release must run in capture phase');
assert.match(js, /document\.removeEventListener\("click", onDocumentAnchorClick, true\)/);
assert.match(js, /function onWheel\(event\) \{\s*if \(!ownsScroll\)/s, 'wheel must stop capturing after release');
assert.match(js, /function onTouchMove\(event\) \{\s*if \(!ownsScroll\) return/s, 'touchmove must stop capturing after release');
assert.match(js, /function onKeyDown\(event\) \{\s*if \(!ownsScroll\)/s, 'keyboard must stop capturing after release');
assert.match(js, /if \(!ownsScroll \|\| !config\.restartOnReturnStart/, 'return-to-IN must not restart after release');
assert.match(js, /if \(!ownsScroll \|\| config\.interactionMode !== "cinematic"/, 'auto-start must not schedule after release');
assert.match(js, /if \(!sectionVisible && !ownsScroll && scrollReleaseLatch\) scrollReleaseLatch = false/);

console.log('Parallax scroll ownership / external anchor behavior OK');

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'plugins/smart-plant-v1.4.2/plugin.js'),'utf8');

test('CTA do formulário fecha modal sem scroll de retorno às plantas',()=>{
 assert.match(script,/function unlockPage\(restorePlantPosition\)/);
 assert.match(script,/if \(restorePlantPosition\) \{[\s\S]*?window\.scrollTo\(0, lockedScrollY \|\| 0\)/);
 assert.match(script,/unlockPage\(!navigateToForm\)/);
 assert.match(script,/closeModal\(true\);[\s\S]*?writeFormSenderV4Context\(chosen\.mount\)/);
 assert.match(script,/chosen\.mount\.dispatchEvent\(new CustomEvent\('imobify:smart-plant-select'/);
 assert.match(script,/function jumpToAnchor\(\)/);
});

const fs=require('fs'), assert=require('assert');
const css=fs.readFileSync('plugins/parallax/plugin.css','utf8');
const js=fs.readFileSync('plugins/parallax/plugin.js','utf8');
assert(css.includes('var(--svp-banner-font,var(--heading,inherit))'), 'título deve cair para --heading');
assert(css.includes('var(--svp-banner-font,var(--body,inherit))'), 'texto deve cair para --body');
assert(js.includes('root.style.removeProperty("--svp-banner-font")'), 'inherit deve remover override de banner');
assert(!css.includes('--svp-banner-font: inherit;'), 'CSS não pode mascarar tokens globais com inherit explícito');
console.log('parallax typography inheritance OK');

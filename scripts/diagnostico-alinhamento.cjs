// Uso: python3 -m http.server 8765 (na pasta do Studio) e depois:
//   node scripts/diagnostico-alinhamento.cjs http://localhost:8765 relatorio.json [tipo1,tipo2]
// Mede a posição REAL das linhas de texto de cada componente com alinhamento esquerda/centro/direita/justificado, no desktop (1280) e no celular (390).
// Diagnóstico de alinhamento: mede a posição real das linhas de texto por componente.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8765';
const OUT = process.argv[3];
const ONLY = (process.argv[4] || '').split(',').filter(Boolean);
const SKIP = new Set(['reveal','lightbox','content-protection','segment-layout','section-layout-pro','spacer-divider-pro','tag-installer-pro','floating-container-pro','scheduled-popup-pro','form-sender-popup','whatsapp-flutuante-pro','menu-fixo-adaptavel-pro','image-single','youtube','mainframe','anti-ia-copy-policy','button-single','gallery-big-four','gallery-big-four-video','tour360-pro','parallax360-tour','hero360-tour','implantacao-tiles-pro','editorial-motion','parallax','gallery','property-slider','flip-card-pro','flipcard-3d-video-v1','ar-card-popout-3d','hotspot-plant-pro']);
(async () => {
  const b = await chromium.launch();
  const ed = await b.newPage(); ed.on('dialog', d => d.accept());
  await ed.goto(BASE + '/index.html'); await ed.waitForTimeout(3000);
  const types = (await ed.evaluate(() => Object.entries(ImobifyCatalog.plugins).filter(([k, v]) => v.kind !== 'behavior').map(([k]) => k))).filter(t => !SKIP.has(t) && (!ONLY.length || ONLY.includes(t)));
  const report = {};
  for (const type of types) {
    report[type] = {};
    for (const vp of [{ w: 1280, h: 900, label: 'desktop' }, { w: 390, h: 844, label: 'mobile' }]) {
      for (const mode of ['left', 'center', 'right', 'justify']) {
        const html = await ed.evaluate(async ([type, mode]) => {
          const st = JSON.parse(JSON.stringify(ImobifyCatalog.defaultState()));
          const s = ImobifyCatalog.createSection(type);
          s.settings = Object.assign({}, s.settings, { visible: true, style: Object.assign({}, ImobifyCatalog.sectionStyleDefaults?.() || {}, { enabled: true, headingAlign: mode, headingAlignMobile: 'inherit', bodyAlign: mode, bodyAlignMobile: 'inherit' }) });
          st.sections = [s]; st.behaviorPlugins = [];
          return ImobifyRenderer.buildInlineDocument(st, {});
        }, [type, mode]);
        const p = await b.newPage({ viewport: { width: vp.w, height: vp.h } });
        await p.route(BASE + '/__a.html', r => r.fulfill({ contentType: 'text/html', body: html }));
        await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
        await p.goto(BASE + '/__a.html'); await p.waitForTimeout(900);
        await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important} [data-reveal],.reveal,[class*="reveal"]{opacity:1!important;transform:none!important}' });
        await p.waitForTimeout(150);
        const res = await p.evaluate((mode) => {
          const out = [];
          const sec = document.querySelector('[data-plugin]');
          if (!sec) return [{ err: 'sem seção' }];
          const skipAnc = 'a,button,label,input,select,textarea,nav,svg,[role="button"],.button,[class*="badge"],[class*="chip"],[class*="tag"],[class*="price"],[class*="value"],[class*="icon"],[class*="number"],[class*="counter"],[aria-hidden="true"],[hidden],dialog,[role="dialog"],[aria-modal="true"]';
          const els = [...sec.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,dd,dt,small,span,div,strong,em,figcaption')];
          for (const el of els) {
            const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
            if (own.length < 4) continue;
            if (el.closest(skipAnc)) continue;
            const cs = getComputedStyle(el);
            if (cs.display.startsWith('inline') && el.parentElement && getComputedStyle(el.parentElement).display !== 'flex' && getComputedStyle(el.parentElement).display !== 'grid') continue;
            const r = el.getBoundingClientRect();
            if (r.width < 20 || r.height < 6 || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            // linhas reais do texto
            const range = document.createRange(); range.selectNodeContents(el);
            const rects = [...range.getClientRects()].filter(x => x.width > 2);
            if (!rects.length) continue;
            const lines = []; for (const q of rects) { const L = lines.find(l => Math.abs(l.top - q.top) < 4); if (L) { L.left = Math.min(L.left, q.left); L.right = Math.max(L.right, q.right); } else lines.push({ top: q.top, left: q.left, right: q.right }); }
            lines.sort((a, b) => a.top - b.top);
            // Referência: sobe enquanto o pai tem a mesma largura; se o pai for grid/flex em linha, a célula é a referência.
            let col = el, pc = el.parentElement;
            while (pc && pc !== sec.parentElement && Math.abs(pc.getBoundingClientRect().width - col.getBoundingClientRect().width) < 3) { col = pc; pc = pc.parentElement; }
            let refEl = pc || sec;
            const pd = pc ? getComputedStyle(pc) : null;
            const rowLayout = pd && ((pd.display.includes('grid') && pd.gridTemplateColumns.split(' ').filter(Boolean).length > 1) || (pd.display.includes('flex') && !pd.flexDirection.startsWith('column') && pc.children.length > 1));
            if (rowLayout) refEl = col;
            const ref = refEl.getBoundingClientRect(); const rcs = getComputedStyle(refEl);
            const refL = ref.left + (refEl === el ? parseFloat(rcs.paddingLeft) : (refEl === col ? 0 : parseFloat(rcs.paddingLeft))), refR = ref.right - (refEl === el ? parseFloat(rcs.paddingRight) : (refEl === col ? 0 : parseFloat(rcs.paddingRight)));
            const first = lines[0];
            const gl = first.left - refL, gr = refR - first.right, W = refR - refL;
            const tol = Math.max(16, W * 0.025);
            let seen;
            if (Math.abs(gl - gr) < tol && gl > tol) seen = 'center';
            else if (gr < tol && gl > tol) seen = 'right';
            else if (gl < tol && gr < tol) seen = 'full';
            else if (gl < tol) seen = 'left';
            else seen = 'offset';
            const elBox = el.getBoundingClientRect(); const ecs = getComputedStyle(el);
            const innerW = elBox.width - parseFloat(ecs.paddingLeft) - parseFloat(ecs.paddingRight);
            const fillsOwn = lines.length > 1 ? (first.right - first.left) >= innerW * 0.94 : true;
            let ok;
            if (mode === 'justify') ok = (seen === 'left' || seen === 'full') && fillsOwn;
            else if (mode === 'left') ok = seen === 'left' || seen === 'full';
            else ok = seen === mode || seen === 'full' || (W - (first.right - first.left) < tol);
            const expect = mode;
            const cls = (el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
            out.push({ el: el.tagName.toLowerCase() + (cls ? '.' + cls : ''), text: own.slice(0, 40), ta: cs.textAlign, seen, expect, ok, fillsOwn, lines: lines.length, gl: Math.round(gl), gr: Math.round(gr) });
          }
          return out;
        }, mode);
        report[type][vp.label + ':' + mode] = res;
        await p.close();
      }
    }
    const fails = Object.entries(report[type]).flatMap(([k, arr]) => arr.filter(x => x.ok === false).map(x => k + ' ' + x.el));
    console.log(type.padEnd(32), 'falhas:', fails.length);
  }
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  await b.close();
})();

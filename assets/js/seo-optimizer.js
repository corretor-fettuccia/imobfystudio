/*!
 * Imobify Studio — Otimizador de Nota SEO 1.0.0
 * Complemento do editor (não é Plugin Play: roda no Studio, não na landing page).
 *
 * O que faz
 *  - Lê a nota que o próprio Studio calcula (#seoChecklist e #readinessMetrics).
 *  - Destaca em âmbar cada campo que está tirando ponto, com a meta exata.
 *  - Mostra um painel "Otimizador de nota" com as pendências ordenadas por impacto.
 *  - Clique em uma pendência para ir direto ao campo (troca de aba se preciso).
 *  - Oferece "Aplicar sugestão" quando dá para corrigir sem inventar dados
 *    (encurtar título, ajustar descrição). O texto aplicado passa pelo mesmo
 *    fluxo de edição do Studio (evento input), então desfazer/salvar funcionam.
 *
 * Não altera app.js, a fórmula da nota nem a exportação.
 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  const seoInput = (key) => $(`#seoControls [data-seo="${key}"]`);
  const siteInput = (key) => $(`[data-site-data="${key}"]`);
  const val = (key) => norm(seoInput(key)?.value);
  const siteVal = (key) => norm(siteInput(key)?.value);

  /* ---------- Sugestões seguras (só reorganizam o que já existe) ---------- */
  const TITLE_RULES = [
    [/^(Residencial|Condom[ií]nio|Edif[ií]cio)\s+/i, ''],
    [/\bDormit[óo]rios\b/g, 'Quartos'],
    [/\s+\|\s+/g, ' | '],
    [/\bApartamentos\b/g, 'Aptos'],
  ];
  function suggestTitle(current) {
    let t = norm(current);
    if (t.length >= 35 && t.length <= 60) return null;
    if (t.length > 60) {
      for (const [re, rep] of TITLE_RULES) {
        if (t.length <= 60) break;
        t = norm(t.replace(re, rep));
      }
      if (t.length > 60) t = t.slice(0, 61).replace(/\s+\S*$/, '').replace(/[\s|,·-]+$/, '');
      return t.length >= 35 ? t : null;
    }
    const name = val('propertyName'), city = val('city');
    const extra = [name && !t.includes(name) ? name : '', city && !t.includes(city) ? city : ''].filter(Boolean).join(' ');
    const longer = norm(`${t}${extra ? ' | ' + extra : ''}`);
    return longer.length >= 35 && longer.length <= 60 ? longer : null;
  }
  function suggestDescription(current) {
    const d = norm(current);
    if (d.length <= 160) return null;
    // 1) Enxuga uma enumeração ("A, B e C" -> "A e C"), mantendo todas as frases e a chamada final.
    const lean = norm(d.replace(/,\s*([^,]+?),?\s+e\s+/, ' e '));
    if (lean.length <= 160 && lean.length >= 120) return lean;
    // 2) Mantém frases inteiras; só divide em ponto seguido de espaço + maiúscula (preserva "R$ 189.990").
    const sentences = d.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
    let out = '';
    for (const s of sentences) { const next = norm(out + ' ' + s); if (next.length <= 160) out = next; else break; }
    if (out.length >= 120) return out;
    const cut = d.slice(0, 158).replace(/\s+\S*$/, '').replace(/[,;:\s]+$/, '') + '.';
    return cut.length >= 120 ? cut : null;
  }

  /* ---------- Mapa: verificação do Studio → campo e orientação ---------- */
  const CHECKS = {
    'Título entre 35 e 60 caracteres': { tab: 'seo', key: 'title', tip: () => {
      const n = val('title').length;
      return n > 60 ? `Tem ${n} caracteres: corte ${n - 60}. O Google trunca acima de ~60.` : `Tem ${n} caracteres: faltam ${35 - n}. Inclua empreendimento + cidade + tipo.`;
    }, suggest: () => suggestTitle(val('title')) },
    'Descrição entre 120 e 160 caracteres': { tab: 'seo', key: 'description', tip: () => {
      const n = val('description').length;
      return n > 160 ? `Tem ${n} caracteres: corte ${n - 160}.` : `Tem ${n} caracteres: faltam ${120 - n}. Cite diferencial, preço de referência e chamada.`;
    }, suggest: () => suggestDescription(val('description')) },
    'URL canônica HTTPS válida': { tab: 'seo', key: 'canonical', tip: () => 'Use o endereço final publicado, começando por https://.' },
    'Sitemap XML automático configurado': { tab: 'seo', key: 'canonical', tip: () => 'O sitemap depende de uma URL canônica https://.' },
    'Imagem social configurada': { tab: 'seo', key: 'ogImage', tip: () => 'Carregue uma imagem 1200 × 630 px (PNG/JPEG).' },
    'Ícone do site configurado': { tab: 'seo', key: 'favicon', tip: () => 'Prepare o ícone no vetorizador.' },
    'Hero com texto alternativo': { tab: 'structure', key: null, tip: () => 'Selecione o Hero e preencha o texto alternativo da imagem (mín. 12 caracteres, descritivo).' },
    'Localização completa': { tab: 'seo', key: ['address', 'city', 'region'].find((k) => !val(k)) || 'address', tip: () => 'Preencha endereço, cidade e estado.' },
    'Dados estruturados imobiliários': { tab: 'seo', key: val('propertyName') ? 'city' : 'propertyName', tip: () => 'Nome do empreendimento + cidade ou endereço.' },
    'Autor e especialidade identificados': { tab: 'seo', key: val('authorName') ? 'authorRole' : 'authorName', tip: () => 'Nome do responsável e função (ex.: corretor, CRECI).' },
    'CRECI/credencial informado': { tab: 'project', site: 'license', tip: () => 'Informe o CRECI em Projeto → Dados globais.' },
    'Data de revisão informada': { tab: 'seo', key: 'lastReviewed', tip: () => 'Data da última conferência das informações.' },
    'Fontes das informações registradas': { tab: 'seo', key: 'sourceNotes', tip: () => {
      const n = val('sourceNotes').length;
      return `Tem ${n} caracteres: mínimo 30. Cite as fontes reais (tabela comercial, memorial, site da incorporadora, data). Também soma em E-E-A-T, IA e Escala.`;
    } },
    'Contexto local/exclusivo registrado': { tab: 'seo', key: 'localInsight', tip: () => `Tem ${val('localInsight').length} caracteres: mínimo 40. Escreva algo específico deste imóvel e deste bairro.` },
    'Descoberta por IA configurada': { tab: 'seo', key: 'aiSearch', tip: () => 'Escolha permitir ou bloquear a descoberta por IA.' },
  };

  /* ---------- Pontos extras da Qualidade do resultado (Readiness) ---------- */
  const BOOSTS = [
    { key: 'sourceNotes', ok: () => val('sourceNotes').length >= 30, gain: '+1,5 (E-E-A-T, IA e Escala)' },
    { key: 'localInsight', ok: () => val('localInsight').length >= 40, gain: '+1,3 (IA e Escala)' },
    { key: 'aiSearch', ok: () => val('aiSearch') === 'allow', gain: '+0,8 (Descoberta por IA)' },
    { key: 'authorName', ok: () => !!val('authorName'), gain: '+1,0 (E-E-A-T e IA)' },
    { key: 'authorRole', ok: () => !!val('authorRole'), gain: '+0,5 (E-E-A-T)' },
    { key: 'organizationName', ok: () => !!val('organizationName'), gain: '+0,4 (E-E-A-T)' },
    { key: 'lastReviewed', ok: () => !!val('lastReviewed'), gain: '+0,4 (E-E-A-T)' },
    { key: 'robots', ok: () => val('robots') === 'index, follow', gain: '+0,6 (Rastreamento)' },
  ];
  const TETO = 9.2; // teto da média de Readiness na fórmula do Studio 7.3.x

  /* ---------- Painel ---------- */
  function ensurePanel() {
    let panel = $('#seoOptimizer');
    if (panel) return panel;
    const heading = $('#tab-seo .section-heading');
    if (!heading) return null;
    panel = document.createElement('div');
    panel.id = 'seoOptimizer';
    panel.className = 'seo-opt';
    panel.setAttribute('aria-live', 'polite');
    heading.insertAdjacentElement('afterend', panel);
    panel.addEventListener('click', onPanelClick);
    return panel;
  }

  function goTo(item) {
    const tabBtn = $(`.panel-tab[data-tab="${item.tab}"]`);
    if (tabBtn && !tabBtn.classList.contains('is-active')) tabBtn.click();
    const input = item.site ? siteInput(item.site) : item.key ? seoInput(item.key) : null;
    if (!input) return;
    requestAnimationFrame(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus({ preventScroll: true });
      const label = input.closest('label') || input.parentElement;
      label?.classList.remove('seo-opt-pulse'); void label?.offsetWidth; label?.classList.add('seo-opt-pulse');
    });
  }

  function apply(key, text) {
    const input = seoInput(key);
    if (!input) return;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  let current = [];
  function onPanelClick(event) {
    const applyBtn = event.target.closest('[data-opt-apply]');
    if (applyBtn) {
      const it = current[+applyBtn.dataset.optApply];
      if (it?.suggestion) apply(it.key, it.suggestion);
      return;
    }
    const row = event.target.closest('[data-opt-go]');
    if (row) goTo(current[+row.dataset.optGo]);
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function clearMarks() {
    $$('.seo-opt-flag').forEach((el) => el.classList.remove('seo-opt-flag'));
    $$('.seo-opt-hint').forEach((el) => el.remove());
  }
  function mark(input, text) {
    if (!input) return;
    const label = input.closest('label') || input.parentElement;
    if (!label) return;
    label.classList.add('seo-opt-flag');
    if (!label.querySelector('.seo-opt-hint')) {
      const hint = document.createElement('small');
      hint.className = 'seo-opt-hint';
      hint.textContent = text;
      label.append(hint);
    }
  }

  function update() {
    const panel = ensurePanel();
    if (!panel) return;
    clearMarks();
    const items = $$('#seoChecklist .check-item');
    const total = items.length || 1;
    const failing = items.filter((el) => !el.classList.contains('ok')).map((el) => norm(el.textContent));
    const score = Math.round((total - failing.length) / total * 100);
    const metrics = $$('#readinessMetrics .check-item').map((el) => [norm(el.querySelector('strong')?.textContent), parseFloat(el.querySelector('span')?.textContent) || 0]);
    const avg = metrics.length ? metrics.reduce((s, [, v]) => s + v, 0) / metrics.length : 0;

    current = [];
    for (const label of failing) {
      const rule = CHECKS[label];
      if (!rule) { current.push({ label, tip: 'Verificação nova do Studio: confira o campo correspondente.', tab: 'seo' }); continue; }
      const suggestion = rule.suggest ? rule.suggest() : null;
      const it = { label, tab: rule.tab, key: rule.key, site: rule.site, tip: rule.tip(), suggestion, weight: 'nota' };
      current.push(it);
      mark(rule.site ? siteInput(rule.site) : rule.key ? seoInput(rule.key) : null, it.tip);
    }
    for (const b of BOOSTS) {
      if (b.ok() || current.some((c) => c.key === b.key)) continue;
      const lbl = norm(seoInput(b.key)?.closest('label')?.firstChild?.textContent) || b.key;
      const it = { label: `${lbl}: ${b.gain} na Qualidade`, tab: 'seo', key: b.key, tip: 'Não muda a % de SEO, mas sobe a nota de Qualidade do resultado.', weight: 'qualidade' };
      current.push(it);
      mark(seoInput(b.key), it.tip);
    }
    const cwv = metrics.find(([l]) => /Core Web Vitals/i.test(l));
    if (cwv && cwv[1] < 8.5) current.push({ label: `Core Web Vitals ${cwv[1].toFixed(1)}/10`, tab: 'structure', tip: 'Seções de vídeo/parallax pesam; Hero sem imagem tira 1,2. Avalie se todas são necessárias.', weight: 'qualidade' });

    const done = !current.length;
    panel.classList.toggle('is-done', done);
    panel.innerHTML = `
      <div class="seo-opt-head">
        <strong>Otimizador de nota</strong>
        <span>${score}% SEO · Qualidade ${avg.toFixed(1)} <em>(teto do Studio ≈ ${TETO.toFixed(1)})</em></span>
      </div>
      ${done ? '<p class="seo-opt-ok">Tudo no máximo. Nenhum campo está tirando ponto.</p>' : `
      <p class="seo-opt-sub">${failing.length} item(ns) tiram % da nota SEO${current.length > failing.length ? ` · ${current.length - failing.length} podem subir a Qualidade` : ''}. Clique para ir ao campo.</p>
      <ol class="seo-opt-list">${current.map((it, i) => `
        <li class="seo-opt-item is-${it.weight || 'nota'}" data-opt-go="${i}" tabindex="0" role="button">
          <b>${esc(it.label)}</b>
          <span>${esc(it.tip)}</span>
          ${it.suggestion ? `<span class="seo-opt-sug">Sugestão (${it.suggestion.length} car.): “${esc(it.suggestion)}”</span><button type="button" class="btn seo-opt-apply" data-opt-apply="${i}">Aplicar sugestão</button>` : ''}
        </li>`).join('')}</ol>`}`;
  }

  let timer = 0;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 60); };

  function init() {
    const list = $('#seoChecklist');
    if (!list) return setTimeout(init, 300);
    new MutationObserver(schedule).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    const metrics = $('#readinessMetrics');
    if (metrics) new MutationObserver(schedule).observe(metrics, { childList: true, subtree: true });
    document.addEventListener('input', (e) => { if (e.target.closest('#seoControls, #siteDataControls')) schedule(); }, true);
    document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-opt-go]')) { e.preventDefault(); goTo(current[+e.target.dataset.optGo]); } });
    schedule();
  }
  window.ImobifySeoOptimizer = { version: '1.0.0', update, suggestTitle, suggestDescription };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

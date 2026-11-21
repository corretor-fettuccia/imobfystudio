/*!
 * Imobify Studio 7.4.0 — Auditoria de seções 1.0.0
 * Aba "Auditoria" no painel esquerdo: percorre cada seção visível, aponta o que
 * precisa de atenção e leva direto ao campo no inspetor. Correções seguras têm
 * botão de um clique e passam pelo commit do Studio (desfazer/refazer funcionam).
 *
 * Regras técnicas valem para qualquer projeto. As regras comerciais da
 * Engenharia de Conversão MCMV-RS 3.1 só são aplicadas em projetos MCMV.
 * Nunca inventa conteúdo: o que exige dado real fica como orientação.
 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const fold = (s) => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const isBlob = (v) => typeof v === 'string' && (v.startsWith('data:') || v.startsWith('<svg') || v.length > 6000);
  const SEV = { alta: { w: 8, label: 'Alta' }, media: { w: 4, label: 'Média' }, baixa: { w: 1.5, label: 'Baixa' } };

  /* ---------------- Coleta de textos ---------------- */
  function parseJsonList(v) {
    if (typeof v !== 'string' || !/^\s*\[/.test(v)) return null;
    try { const a = JSON.parse(v); return Array.isArray(a) ? a : null; } catch { return null; }
  }
  function texts(section) {
    const out = [];
    for (const [key, v] of Object.entries(section.props || {})) {
      if (typeof v !== 'string' || !v) continue;
      const list = parseJsonList(v);
      if (list) {
        list.forEach((item, i) => {
          if (!item || typeof item !== 'object') return;
          const sub = norm(item.title || item.label || item.id || `item ${i + 1}`);
          for (const [k, t] of Object.entries(item)) if (typeof t === 'string' && t && !isBlob(t) && /\s/.test(t)) out.push({ key, sub, field: k, text: t });
        });
        continue;
      }
      if (isBlob(v)) continue;
      out.push({ key, text: v });
    }
    return out;
  }
  const HEADLINE_KEY = /^(title\d*|sectionTitle|headline|eyebrow\d*|badge)$/i;
  const CTA_KEY = /^(primaryCta|secondaryCta|cta\d*|ctaLabel|label|buttonText|cardButtonText|quickConfirmText)$/i;
  const LINK_KEY = /(link\d*|href|ctaHref)$/i;

  /* ---------------- Regras ---------------- */
  const PLACEHOLDER = /\b(inserir|adicionar)\s+(a\s+|uma\s+)?(foto|imagem|fotografia|renderiza)|imagem pendente|placeholder|lorem ipsum|aguardando material|substituir pel[ao]|a ser adicionad/i;
  const OPEN_VAR = /\[[A-ZÁÉÍÓÚÇ0-9 _]{1,30}\]|\{\{\s*[\w.]+\s*\}\}/;
  const FORBIDDEN = [
    [/\baprovad[oa]s?\b/i, 'Promete aprovação'], [/\bgarantid[oa]s?\b/i, 'Promete garantia'],
    [/cr[ée]dito liberado/i, 'Promete crédito'], [/sem consulta (ao |a )?(spc|serasa)/i, 'Afirmação enganosa'],
    [/sem burocracia/i, 'Afirmação enganosa'], [/\bgr[áa]tis\b/i, 'Afirmação enganosa'],
    [/[úu]ltima chance|s[óo] hoje/i, 'Urgência sem prazo real'],
    [/\bdo governo\b|programa do governo federal/i, 'Sugere vínculo oficial'],
  ];
  const NEGATION = /\b(n[ãa]o|nem|nunca|sem garantia de)\b[^.]{0,40}$/i;
  const WEAK = /\b(talvez|possivelmente|eventualmente|sujeit[oa] [àa] an[áa]lise|mediante aprova[çc][ãa]o|conforme tabela|consulte|verifique (sua )?elegibilidade|dependendo do enquadramento)\b/i;
  const GENERIC_CTA = /^(saiba mais|clique aqui|enviar|ver mais|confira|mais informa[çc][õo]es|quero aproveitar essa oportunidade)$/i;
  const MANDATORY = [
    { test: (t) => t === 'hero' || t === 'hero-plus', key: 'primaryCta', allowed: ['QUERO MEU APARTAMENTO', 'QUERO ME CANDIDATAR'], value: 'QUERO MEU APARTAMENTO', where: 'Hero' },
    { test: (t) => /^smart-plant/.test(t), key: 'cardButtonText', allowed: ['QUERO ESCOLHER MINHA PLANTA'], value: 'QUERO ESCOLHER MINHA PLANTA', where: 'Plantas' },
    { test: (t) => t === 'payment', key: 'cta', allowed: ['QUERO MINHA PROPOSTA'], value: 'QUERO MINHA PROPOSTA', where: 'Financiamento' },
    { test: (t) => /^form-sender/.test(t), key: 'buttonText', allowed: ['GARANTIR MEU CADASTRO'], value: 'GARANTIR MEU CADASTRO', where: 'Formulário' },
  ];
  const matchCase = (orig, next) => (orig && orig === orig.toUpperCase() ? next.toUpperCase() : next.charAt(0) + next.slice(1).toLowerCase());
  const setProp = (sectionId, key, value) => (draft) => { const s = draft.sections.find((x) => x.id === sectionId); if (s) s.props[key] = value; };
  const hide = (sectionId) => (draft) => { const s = draft.sections.find((x) => x.id === sectionId); if (s) (s.settings ||= {}).visible = false; };

  function audit(state) {
    const issues = [];
    const visible = state.sections.filter((s) => s.settings?.visible !== false);
    const mcmv = !!state.calibracao || /mcmv/i.test(`${state.strategy?.method} ${state.templateMeta?.presetId} ${state.templateMeta?.category} ${state.projectName}`);
    const anchors = new Set(visible.map((s) => norm(s.settings?.anchorId)).filter(Boolean));
    const owners = window.ImobifyRenderer?.computeAnchorOwners ? window.ImobifyRenderer.computeAnchorOwners(visible) : new Map();
    const add = (o) => issues.push({ ...o, id: `${o.rule}:${o.sectionId || 'projeto'}:${o.key || ''}:${o.sub || ''}` });
    const lastLabel = new Map();

    visible.forEach((s, index) => {
      const p = s.props || {};
      const id = s.id;
      for (const t of texts(s)) {
        const where = t.sub ? `${t.sub} · ${t.field}` : null;
        if (PLACEHOLDER.test(t.text)) add({ rule: 'placeholder', sectionId: id, key: t.key, sub: where, sev: 'alta', title: 'Texto provisório visível', detail: `“${norm(t.text).slice(0, 90)}” — instrução editorial não pode ir para a página publicada.` });
        const v = OPEN_VAR.exec(t.text);
        if (v) add({ rule: 'variavel', sectionId: id, key: t.key, sub: where, sev: 'alta', title: `Variável não preenchida ${v[0]}`, detail: 'Substitua pelo dado real ou remova o trecho.' });
        if (mcmv) for (const [re, why] of FORBIDDEN) {
          const m = re.exec(t.text);
          if (m && !NEGATION.test(t.text.slice(0, m.index))) add({ rule: 'proibido', sectionId: id, key: t.key, sub: where, sev: 'alta', title: `Termo proibido: “${m[0]}”`, detail: `${why} (EC 3.1, seção 2.7). Reescreva sem prometer resultado.` });
        }
        if (!t.sub && (HEADLINE_KEY.test(t.key) || CTA_KEY.test(t.key))) {
          const w = WEAK.exec(t.text);
          if (w) add({ rule: 'fraco', sectionId: id, key: t.key, sev: 'media', title: `Linguagem que enfraquece: “${w[0]}”`, detail: 'Mantenha a ressalva na nota ou no FAQ; título e botão devem ser afirmativos (EC 2.6).' });
          if (mcmv && /realize o sonho/i.test(t.text)) add({ rule: 'cliche', sectionId: id, key: t.key, sev: 'media', title: 'Clichê no título', detail: '“Realize o sonho da casa própria” perdeu força; nunca no headline (EC 2.7).' });
        }
        if (!t.sub && /^(title\d*|sectionTitle|headline)$/i.test(t.key)) {
          const words = norm(t.text).split(' ').length;
          if (words > 12) add({ rule: 'longo', sectionId: id, key: t.key, sev: 'baixa', title: `Título com ${words} palavras`, detail: 'Até ~12 palavras e uma ideia por título (EC 2.8).' });
          if (mcmv && /R\$\s?\d/.test(t.text) && !/\*/.test(t.text)) add({ rule: 'valor', sectionId: id, key: t.key, sev: 'media', title: 'Valor sem nota vinculada', detail: 'Coloque * no valor e mantenha a nota com condições e data de referência (EC 3.9).' });
        }
        if (!t.sub && t.key === 'badge' && mcmv && /R\$\s?\d/.test(t.text) && !/\*/.test(t.text)) add({ rule: 'valor', sectionId: id, key: t.key, sev: 'media', title: 'Valor sem nota vinculada', detail: 'Coloque * no valor e mantenha a nota com condições e data.' });
      }

      // CTAs
      if (mcmv) for (const m of MANDATORY) {
        if (!m.test(s.type) || typeof p[m.key] !== 'string') continue;
        if (!m.allowed.includes(fold(p[m.key]))) {
          const next = matchCase(p[m.key], m.value);
          add({ rule: 'cta', sectionId: id, key: m.key, sev: 'media', title: `CTA do ${m.where} fora do padrão`, detail: `Atual: “${p[m.key] || 'vazio'}”. Obrigatório: “${m.allowed.join('” ou “')}” (EC 5).`, fix: { label: `Usar “${next}”`, apply: setProp(id, m.key, next) } });
        }
      }
      for (const [key, v] of Object.entries(p)) {
        if (typeof v !== 'string' || !CTA_KEY.test(key)) continue;
        if (GENERIC_CTA.test(norm(v))) {
          const next = matchCase(v, 'QUERO MEU APARTAMENTO');
          add({ rule: 'generico', sectionId: id, key, sev: 'baixa', title: `CTA genérico: “${norm(v)}”`, detail: 'Prefira primeira pessoa e intenção clara (EC 2.8).', fix: mcmv ? { label: `Usar “${next}”`, apply: setProp(id, key, next) } : null });
        }
      }

      // Links e âncoras
      for (const [key, v] of Object.entries(p)) {
        if (typeof v !== 'string' || !LINK_KEY.test(key)) continue;
        const href = norm(v);
        const ctaKey = key.replace(/Link(\d*)$/, 'Cta$1').replace(/^link(\d+)$/, 'cta$1').replace(/^ctaHref$/, 'ctaLabel').replace(/^href$/, 'label');
        const hasText = !!norm(p[ctaKey]);
        if (href.startsWith('#') && href.length > 1 && !href.startsWith('#floating-box') && !anchors.has(href.slice(1))) {
          add({ rule: 'ancora', sectionId: id, key, sev: 'alta', title: `Âncora quebrada: ${href}`, detail: 'Nenhuma seção visível tem essa âncora; o clique não leva a lugar nenhum.', fix: anchors.has('contato') ? { label: 'Apontar para #contato', apply: setProp(id, key, '#contato') } : null });
        } else if ((href === '#' || !href) && hasText && ctaKey !== key) {
          add({ rule: 'semdestino', sectionId: id, key, sev: 'media', title: 'Botão sem destino', detail: `“${norm(p[ctaKey])}” não leva a lugar nenhum.`, fix: anchors.has('contato') ? { label: 'Apontar para #contato', apply: setProp(id, key, '#contato') } : null });
        }
      }

      // Âncora repetida (7.4.1): na publicação, só um dono fica com o ID.
      const myAnchor = norm(s.settings?.anchorId).replace(/^#/, '');
      if (myAnchor && owners.has(myAnchor) && owners.get(myAnchor) !== id) {
        const owner = visible.find((x) => x.id === owners.get(myAnchor));
        add({ rule: 'ancoradup', sectionId: id, key: null, sev: 'media', title: `Âncora #${myAnchor} repetida`, detail: `Outra seção (${catalogName(owner?.type)}) também usa #${myAnchor}. Na página publicada a âncora fica só com ela; nesta seção é ignorada. Para um botão levar ao formulário, use o Link do botão (#${myAnchor}), não a âncora da seção.`, fix: { label: 'Remover âncora desta seção', apply: (d) => { const x = d.sections.find((y) => y.id === id); if (x) (x.settings ||= {}).anchorId = ''; } } });
      }

      // Texto e posicionamento (7.5.0): títulos justificados em tela estreita abrem "rios".
      const st7 = s.settings?.style || {};
      if (st7.enabled === true) {
        const hMob = ['left','center','right','justify'].includes(st7.headingAlignMobile) ? st7.headingAlignMobile : st7.headingAlign;
        if (hMob === 'justify') add({ rule: 'titulojustificado', sectionId: id, key: null, sev: 'baixa', title: 'Título justificado no celular', detail: 'Com poucas palavras por linha, o justificado abre espaços grandes entre as palavras. Boa prática: títulos à esquerda (ou centro) no celular; justificado só no corpo.', fix: { label: 'Títulos à esquerda no celular', apply: (d) => { const x = d.sections.find((y) => y.id === id); if (x) x.settings.style = { ...(x.settings.style || {}), headingAlignMobile: 'left' }; } } });
        const bMob = ['left','center','right','justify'].includes(st7.bodyAlignMobile) ? st7.bodyAlignMobile : st7.bodyAlign;
        if (bMob === 'justify' && st7.justifyHyphens === 'none') add({ rule: 'justificadosemhifen', sectionId: id, key: null, sev: 'baixa', title: 'Justificado sem hifenização', detail: 'Sem hífen, o justificado em coluna estreita cria “rios” de espaço. Ative a hifenização automática.', fix: { label: 'Ativar hifenização', apply: (d) => { const x = d.sections.find((y) => y.id === id); if (x) x.settings.style = { ...(x.settings.style || {}), justifyHyphens: 'auto' }; } } });
      }

      // Imagens e texto alternativo
      const imgKeys = Object.keys(p).filter((k) => /^image\d*$/.test(k));
      const hasImg = imgKeys.some((k) => norm(p[k]));
      const altKey = 'imageAlt' in p ? 'imageAlt' : 'alt' in p ? 'alt' : null;
      if (s.type === 'image-single' && !norm(p.image)) add({ rule: 'semimagem', sectionId: id, key: 'image', sev: 'alta', title: 'Imagem vazia', detail: 'Sem imagem válida, oculte o componente (EC 10.3).', fix: { label: 'Ocultar seção', apply: hide(id) } });
      if (hasImg && altKey) {
        const alt = norm(p[altKey]);
        if (!alt) add({ rule: 'alt', sectionId: id, key: altKey, sev: 'alta', title: 'Imagem sem texto alternativo', detail: 'Descreva o que aparece (ex.: “Fachada do Residencial X em Canoas”). Conta para SEO e acessibilidade.' });
        else if (alt.length < 12) add({ rule: 'alt', sectionId: id, key: altKey, sev: 'media', title: 'Texto alternativo curto', detail: `“${alt}” — descreva melhor (mín. 12 caracteres).` });
      }
      for (const [key, v] of Object.entries(p)) {
        const list = parseJsonList(v);
        if (!list) continue;
        list.forEach((item, i) => {
          if (!item || typeof item !== 'object' || !norm(item.image) || !('imageAlt' in item)) return;
          const alt = norm(item.imageAlt), sub = norm(item.title || item.id || `item ${i + 1}`);
          if (!alt) add({ rule: 'alt', sectionId: id, key, sub, sev: 'alta', title: `Slide “${sub}” sem texto alternativo`, detail: 'Preencha o texto alternativo deste slide (no inspetor, use Editar).' });
          else if (alt === alt.toUpperCase() && /[A-Z]{4}/.test(alt)) add({ rule: 'altcaps', sectionId: id, key, sub, sev: 'baixa', title: `Texto alternativo em CAIXA ALTA (${sub})`, detail: `“${alt}” — leitores de tela soletram; use frase descritiva normal (no inspetor, use Editar).` });
        });
      }

      // Botões repetidos em sequência
      if (s.type === 'button-single') {
        const label = fold(p.label);
        const prev = lastLabel.get(label);
        if (label && prev !== undefined && index - prev <= 3) add({ rule: 'duplicado', sectionId: id, key: 'label', sev: 'baixa', title: `Botão repetido: “${norm(p.label)}”`, detail: 'O mesmo botão aparece logo acima. Repetição em excesso dilui a intenção.', fix: { label: 'Ocultar este botão', apply: hide(id) } });
        lastLabel.set(label, index);
      }

      // Localização × SEO
      if (s.type === 'location' && /\d+\s*min/i.test(p.places || '') && /n[ãa]o verificad/i.test(state.seo?.localInsight || '')) add({ rule: 'tempos', sectionId: id, key: 'places', sev: 'media', title: 'Tempos de deslocamento sem fonte', detail: 'O SEO informa “tempos não verificados”, mas a seção mostra minutos. Confirme a fonte (ex.: Google Maps, de carro) e atualize o contexto local no SEO (EC 11).' });
    });

    // Projeto
    const allText = visible.flatMap(texts).map((t) => t.text).join(' ');
    if (mcmv && !visible.some((s) => /^form-sender|agendamento/.test(s.type))) add({ rule: 'semform', sectionId: null, sev: 'alta', title: 'Página sem formulário visível', detail: 'Todos os CTAs devem terminar em um cadastro (EC 12).' });
    if (state.calibracao?.estagio === 'lancamento' && !/ilustrativ/i.test(allText)) add({ rule: 'ilustrativa', sectionId: null, sev: 'media', title: 'Lançamento sem aviso de imagens ilustrativas', detail: 'Renderizações devem ser identificadas como ilustrativas (EC 10.4).' });
    if (visible.some((s) => /anti-ia/.test(s.type)) && state.seo?.aiTraining === 'allow') add({ rule: 'aitraining', sectionId: null, tab: 'seo', seoKey: 'aiTraining', sev: 'media', title: 'Treinamento por IA liberado', detail: 'A seção de proteção proíbe uso para IA, mas o SEO permite o GPTBot. Não muda a nota de SEO.', fix: { label: 'Bloquear GPTBot', apply: (d) => { d.seo.aiTraining = 'disallow'; } } });
    const seoScore = parseInt($('#seoScore')?.textContent, 10);
    if (Number.isFinite(seoScore) && seoScore < 100) add({ rule: 'seo', sectionId: null, tab: 'seo', sev: seoScore < 70 ? 'alta' : 'media', title: `Nota SEO ${seoScore}%`, detail: 'Abra a aba SEO: o Otimizador de nota mostra o que corrigir.' });
    return { issues, mcmv };
  }

  /* ---------------- Ignorados (por projeto, neste navegador) ---------------- */
  const ignoredKey = (st) => `imobify-audit-ignored:${st?.projectId || 'projeto'}`;
  function getIgnored(st) { try { return new Set(JSON.parse(localStorage.getItem(ignoredKey(st)) || '[]')); } catch { return new Set(); } }
  function setIgnored(st, set) { try { localStorage.setItem(ignoredKey(st), JSON.stringify([...set])); } catch {} }

  /* ---------------- Interface ---------------- */
  let bridge = null, last = { issues: [] }, filter = 'todas', showIgnored = false, sig = '';
  const catalogName = (type) => window.ImobifyCatalog?.plugins?.[type]?.name || type;
  const fieldLabel = (type, key) => window.ImobifyCatalog?.plugins?.[type]?.fields?.find?.((f) => f.key === key)?.label || key;
  function sectionCaption(s) {
    const p = s.props || {};
    const t = norm(p.title || p.sectionTitle || p.label || p.eyebrow || p.brand || '');
    return t ? t.slice(0, 48) + (t.length > 48 ? '…' : '') : (s.settings?.anchorId ? `#${s.settings.anchorId}` : '');
  }

  function revealField(key) {
    const root = $('#inspectorContent');
    const input = key && root?.querySelector(`[data-prop="${CSS.escape(key)}"]`);
    if (!input) return false;
    const body = input.closest('.imobify-fold-body');
    if (body?.hidden) body.parentElement?.querySelector(':scope > .imobify-fold-trigger')?.click();
    for (let d = input.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
    const field = input.closest('.inspector-field') || input.parentElement;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus({ preventScroll: true });
    field?.classList.remove('audit-pulse'); void field?.offsetWidth; field?.classList.add('audit-pulse');
    return true;
  }
  function goTo(issue) {
    if (!issue) return;
    if (!issue.sectionId) {
      if (issue.tab) bridge.activateTab(issue.tab);
      const input = issue.seoKey && $(`[data-seo="${issue.seoKey}"]`);
      if (input) requestAnimationFrame(() => { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus({ preventScroll: true }); const f = input.closest('label'); f?.classList.remove('audit-pulse'); void f?.offsetWidth; f?.classList.add('audit-pulse'); });
      return;
    }
    if (bridge.getState().selectedSectionId !== issue.sectionId) bridge.selectSection(issue.sectionId);
    let tries = 0;
    const attempt = () => { if (!revealField(issue.key) && ++tries < 8) setTimeout(attempt, 80); };
    requestAnimationFrame(attempt);
  }

  function render(force) {
    const panel = $('#auditPanel');
    if (!panel || !bridge) return;
    const st = bridge.getState();
    if (!st) return;
    last = audit(st);
    const ignored = getIgnored(st);
    const active = last.issues.filter((i) => !ignored.has(i.id));
    const penalty = active.reduce((sum, i) => sum + SEV[i.sev].w, 0);
    const score = Math.max(0, Math.round(100 - penalty));
    const counts = { alta: 0, media: 0, baixa: 0 };
    active.forEach((i) => counts[i.sev]++);
    const nextSig = JSON.stringify([last.issues.map((i) => i.id + i.detail), [...ignored], filter, showIgnored, st.selectedSectionId]);
    $('#auditScore').textContent = `${score}`;
    $('#auditScore').classList.toggle('is-ok', score >= 90);
    const badge = $('.panel-tab[data-tab="audit"] .audit-tab-count');
    if (badge) { badge.textContent = active.length ? String(active.length) : '✓'; badge.classList.toggle('is-ok', !active.length); }
    if (!force && nextSig === sig) return;
    sig = nextSig;

    const shown = last.issues.filter((i) => (showIgnored || !ignored.has(i.id)) && (filter === 'todas' || i.sev === filter));
    const order = new Map(st.sections.map((s, i) => [s.id, i]));
    const groups = new Map();
    for (const i of shown) { const k = i.sectionId || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); }
    const keys = [...groups.keys()].sort((a, b) => (a ? order.get(a) : -1) - (b ? order.get(b) : -1));
    const scroller = panel.closest('.panel-content');
    const keepScroll = scroller?.scrollTop;

    panel.innerHTML = `
      <div class="audit-summary">
        <span class="audit-chip is-alta">${counts.alta} alta</span><span class="audit-chip is-media">${counts.media} média</span><span class="audit-chip is-baixa">${counts.baixa} baixa</span>
        ${last.mcmv ? '<span class="audit-mode" title="Regras comerciais da Engenharia de Conversão 3.1 ativas">EC 3.1</span>' : ''}
      </div>
      <div class="audit-filters" role="group" aria-label="Filtrar por prioridade">
        ${['todas', 'alta', 'media', 'baixa'].map((f) => `<button type="button" class="audit-filter ${filter === f ? 'is-active' : ''}" data-audit-filter="${f}">${f === 'todas' ? 'Todas' : SEV[f].label}</button>`).join('')}
        <label class="audit-toggle"><input type="checkbox" data-audit-show-ignored ${showIgnored ? 'checked' : ''}> ignorados (${ignored.size})</label>
      </div>
      ${!shown.length ? `<div class="audit-empty">${active.length ? 'Nada neste filtro.' : 'Página otimizada. Nenhuma seção precisa de atenção.'}</div>` : keys.map((k) => {
        const s = k ? st.sections.find((x) => x.id === k) : null;
        const list = groups.get(k);
        return `<div class="audit-group ${s && st.selectedSectionId === s.id ? 'is-selected' : ''}">
          <button type="button" class="audit-group-head" ${s ? `data-audit-section="${esc(s.id)}"` : ''}>
            <strong>${esc(s ? catalogName(s.type) : 'Projeto')}</strong><span>${esc(s ? sectionCaption(s) : 'Ajustes gerais da página')}</span><em>${list.length}</em>
          </button>
          <ul>${list.map((i) => {
            const n = last.issues.indexOf(i), ign = ignored.has(i.id);
            const field = s && i.key ? fieldLabel(s.type, i.key) + (i.sub ? ` · ${i.sub}` : '') : '';
            return `<li class="audit-item is-${i.sev} ${ign ? 'is-ignored' : ''}" data-audit-go="${n}" tabindex="0" role="button" aria-label="${esc(i.title)}">
              <b>${esc(i.title)}</b>${field ? `<small>${esc(field)}</small>` : ''}<span>${esc(i.detail)}</span>
              <div class="audit-actions">${i.fix && !ign ? `<button type="button" class="btn audit-fix" data-audit-fix="${n}">${esc(i.fix.label)}</button>` : ''}<button type="button" class="audit-ignore" data-audit-ignore="${n}">${ign ? 'Reativar' : 'Ignorar'}</button></div>
            </li>`;
          }).join('')}</ul></div>`;
      }).join('')}`;
    if (scroller && keepScroll != null) scroller.scrollTop = keepScroll;
  }

  let timer = 0;
  const schedule = (force) => { clearTimeout(timer); timer = setTimeout(() => render(force), 250); };

  function onClick(e) {
    const st = bridge.getState();
    const f = e.target.closest('[data-audit-filter]');
    if (f) { filter = f.dataset.auditFilter; return render(true); }
    const fix = e.target.closest('[data-audit-fix]');
    if (fix) {
      const issue = last.issues[+fix.dataset.auditFix];
      if (issue?.fix) { bridge.commit(issue.fix.apply); bridge.toast?.(`Ajustado: ${issue.title}`); schedule(true); }
      return;
    }
    const ign = e.target.closest('[data-audit-ignore]');
    if (ign) {
      const issue = last.issues[+ign.dataset.auditIgnore], set = getIgnored(st);
      if (issue) { set.has(issue.id) ? set.delete(issue.id) : set.add(issue.id); setIgnored(st, set); render(true); }
      return;
    }
    const head = e.target.closest('[data-audit-section]');
    if (head) { bridge.selectSection(head.dataset.auditSection); return; }
    const item = e.target.closest('[data-audit-go]');
    if (item) goTo(last.issues[+item.dataset.auditGo]);
  }

  function init() {
    bridge = window.ImobifyStudioBridge;
    const panel = $('#auditPanel');
    if (!bridge || !panel || !bridge.getState()) return setTimeout(init, 300);
    panel.addEventListener('click', onClick);
    panel.addEventListener('change', (e) => { if (e.target.matches('[data-audit-show-ignored]')) { showIgnored = e.target.checked; render(true); } });
    panel.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-audit-go]')) { e.preventDefault(); goTo(last.issues[+e.target.dataset.auditGo]); } });
    $('.panel-tab[data-tab="audit"]')?.addEventListener('click', () => schedule(true));
    bridge.onChange(() => schedule(false));
    const seo = $('#seoScore');
    if (seo) new MutationObserver(() => schedule(false)).observe(seo, { childList: true, characterData: true, subtree: true });
    render(true);
  }
  window.ImobifySectionAudit = { version: '1.0.0', audit, refresh: () => render(true) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

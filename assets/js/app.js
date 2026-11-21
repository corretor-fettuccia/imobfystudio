(function () {
  const catalog = window.ImobifyCatalog;
  const renderer = window.ImobifyRenderer;
  const compiler = window.ImobifyCompiler;
  const componentState = window.ImobifyComponentState;
  const projectPresets = window.ImobifyPresetLoader;
  const BLOCK_LIBRARY_KEY = 'imobify-studio-block-library-v5';
  const LEGACY_BLOCK_LIBRARY_KEYS = ['imobify-studio-block-library-v4','imobify-studio-block-library-v3'];
  const MAX_HISTORY = 40;
  const PANEL_LAYOUT_KEY = 'imobify-studio-panel-layout-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let state = null;
  let undoStack = [];
  let redoStack = [];
  // Controle independente por iframe: uma prévia não cancela a outra.
  const renderTokens = new WeakMap();
  let previewTimer;
  let pendingInsertIndex = null;
  let pendingSegmentTarget = null;
  let sectionPointerDrag = null;
  let suppressSectionClick = false;
  let previewViewport = { scrollY:0, selectedId:null };
  const projectMemoryStore = new Map();
  let currentProjectFileHandle = null;
  let projectDiskDirty = true;
  const parallaxEditorPlayheads = new Map();
  const parallaxEditorSelection = new Map();
  const propertySliderEditorSelection = new Map();
  const benefitsModalEditorSelection = new Map();
  let benefitsIconPickerContext = null;
  let propertySliderDrag = null;
  let parallaxEditorDrag = null;
  let parallaxSuppressClickUntil = 0;

  // Editor de efeitos por componente: persistência em section.settings.motion.
  const motionFields = [
    ['duration','Duração','number',200,4000,50,'ms'],
    ['delay','Atraso','number',0,2500,50,'ms'],
    ['distance','Deslocamento','number',0,250,1,'px'],
    ['blur','Desfoque','number',0,50,1,'px'],
    ['scale','Escala inicial','number',0.5,1.5,.01,'×'],
    ['threshold','Iniciar quando a section estiver visível','number',0,100,1,'%'],
    ['easing','Curva de animação','select',0,0,0,''],
    ['direction','Direção da máscara','select',0,0,0,''],
    ['originX','Centro horizontal','number',0,100,1,'%'],
    ['originY','Centro vertical','number',0,100,1,'%'],
    ['replay','Repetir ao voltar ao scroll','checkbox',0,0,0,'']
  ];
  function motionDefaults(type) {
    return {duration:type==='curtain-reveal'?1150:800,delay:0,distance:type==='scroll-reveal'?70:46,blur:type==='liquid-blur'?19:type==='soft-focus'?15:5,scale:type==='zoom'?.92:1.025,threshold:.20,easing:'cubic-bezier(.22,1,.36,1)',direction:'bottom',originX:50,originY:50,replay:false};
  }
  function motionModalOpen() {
    const section=state.sections.find(x=>x.id===state.selectedSectionId);
    if(!section)return;
    document.getElementById('imobify-motion-modal')?.remove();
    const type=section.settings?.transition||'default';
    const values={...motionDefaults(type),...(section.settings?.motion||{})};
    const controls=motionFields.map(([key,label,kind,min,max,step,unit])=>{
      const value=key==='threshold'?Math.round((Number(values[key])||0)*100):values[key];
      const input=kind==='select'?(key==='easing'?`<select data-motion-field="${key}"><option value="cubic-bezier(.22,1,.36,1)">Suave cinematográfico</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in-out</option><option value="linear">Linear</option><option value="cubic-bezier(.34,1.56,.64,1)">Elasticidade suave</option></select>`:`<select data-motion-field="${key}"><option value="bottom">De baixo para cima</option><option value="top">De cima para baixo</option><option value="left">Da esquerda</option><option value="right">Da direita</option></select>`):kind==='checkbox'?`<input type="checkbox" data-motion-field="${key}" ${value?'checked':''}>`:`<input type="number" data-motion-field="${key}" min="${min}" max="${max}" step="${step}" value="${value}"><small>${unit}</small>`;
      return `<label class="motion-modal-field"><span>${label}</span>${input}</label>`;
    }).join('');
    const overlay=document.createElement('div'); overlay.id='imobify-motion-modal';
    overlay.innerHTML=`<div class="motion-modal-card" role="dialog" aria-modal="true" aria-label="Configuração de efeitos"><header><div><strong>Configuração avançada de entrada</strong><small>Componente: ${catalog.esc(section.type)} · Efeito: ${catalog.esc(type)}</small></div><button type="button" data-motion-close aria-label="Fechar">✕</button></header><div class="motion-modal-grid">${controls}</div><p style="margin:8px 0;font-size:12px;opacity:.8">Exemplo: 20% significa que a animação começa quando 20% da área da section estiver visível na tela. O gatilho é independente da duração e do atraso.</p><div class="motion-modal-preview"><div class="motion-preview-tile">Prévia do efeito</div></div><footer><button type="button" data-motion-test>▶ Reproduzir prévia</button><button type="button" data-motion-reset>Restaurar padrão</button><button type="button" data-motion-save class="motion-primary">Aplicar configurações</button></footer></div>`;
    document.body.append(overlay);
    overlay.querySelectorAll('select[data-motion-field]').forEach(el=>el.value=String(values[el.dataset.motionField]));
    overlay.addEventListener('click',ev=>{
      if(ev.target===overlay||ev.target.closest('[data-motion-close]')){overlay.remove();return;}
      if(ev.target.closest('[data-motion-reset]')){overlay.remove();commit(d=>{const x=d.sections.find(v=>v.id===section.id);if(x)delete x.settings.motion;});motionModalOpen();return;}
      if(ev.target.closest('[data-motion-test]')){
        const tile=overlay.querySelector('.motion-preview-tile');
        const current={};overlay.querySelectorAll('[data-motion-field]').forEach(el=>{current[el.dataset.motionField]=el.type==='checkbox'?el.checked:el.type==='number'?(el.dataset.motionField==='threshold'?Number(el.value)/100:Number(el.value)):el.value;});
        if(tile._motionPreview)tile._motionPreview.cancel();
        const distance=Math.max(0,Math.min(250,current.distance||0)), blur=Math.max(0,Math.min(50,current.blur||0));
        const scale=Math.max(.5,Math.min(1.5,current.scale||1));
        const xy=({top:[0,-distance],bottom:[0,distance],left:[-distance,0],right:[distance,0]})[current.direction]||[0,distance];
        const initial={opacity:0,transform:`translate(${xy[0]}px, ${xy[1]}px) scale(${scale})`,filter:`blur(${blur}px)`};
        if(type==='fade'){initial.transform='none';initial.filter='none';}
        if(type==='slide-left')initial.transform=`translateX(-${distance}px)`;
        if(type==='slide-right')initial.transform=`translateX(${distance}px)`;
        if(type==='zoom'||type==='soft-focus')initial.transform=`scale(${scale})`;
        if(type==='mask-reveal'||type==='curtain-reveal'){initial.transform='none';initial.clipPath=type==='curtain-reveal'?'inset(0 50% 0 50%)':({top:'inset(100% 0 0 0)',bottom:'inset(0 0 100% 0)',left:'inset(0 100% 0 0)',right:'inset(0 0 0 100%)'}[current.direction]||'inset(0 0 100% 0)');}
        if(type==='ripple-reveal'){initial.transform='none';initial.clipPath=`circle(0% at ${current.originX}% ${current.originY}%)`;}
        if(type==='liquid-blur')initial.transform+= ' skewX(-2deg)';
        const end={opacity:1,transform:'none',filter:'blur(0px)',clipPath:type==='ripple-reveal'?`circle(150% at ${current.originX}% ${current.originY}%)`:'inset(0 0 0 0)'};
        tile._motionPreview=tile.animate([initial,end],{duration:Math.max(200,Math.min(4000,current.duration||800)),delay:Math.max(0,Math.min(2500,current.delay||0)),easing:current.easing||'ease-out',fill:'both'});
        return;
      }
      if(ev.target.closest('[data-motion-save]')){
        const settings={};overlay.querySelectorAll('[data-motion-field]').forEach(el=>{settings[el.dataset.motionField]=el.type==='checkbox'?el.checked:el.type==='number'?(el.dataset.motionField==='threshold'?Math.max(0,Math.min(100,Number(el.value)))/100:Number(el.value)):el.value;});
        commit(d=>{const x=d.sections.find(v=>v.id===section.id);if(x){x.settings ||= {};x.settings.motion=settings;}});overlay.remove();
      }
    });
  }
  document.addEventListener('click',ev=>{if(ev.target.closest('[data-motion-settings-open]'))motionModalOpen();});
  function migrateProjectPaths(value) {
    if (typeof value === 'string') {
      return value
        .replace(/plugins\/scrollytelling-video-pro-v(?:1\.0\.0|2\.1\.0|2\.2\.0|2\.2\.1|2\.3\.0|2\.4\.0|2\.5\.0|2\.5\.1|2\.5\.3)\//g, 'plugins/parallax/');
    }
    if (Array.isArray(value)) return value.map(migrateProjectPaths);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, migrateProjectPaths(item)]));
    return value;
  }


  const PANEL_LIMITS = { left:{ min:230, max:620 }, right:{ min:230, max:620 }, workspaceMin:360 };

  function readPanelLayout() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PANEL_LAYOUT_KEY) || '{}');
      return {
        left: Number.isFinite(Number(parsed.left)) ? Number(parsed.left) : null,
        right: Number.isFinite(Number(parsed.right)) ? Number(parsed.right) : null
      };
    } catch { return { left:null, right:null }; }
  }

  function currentPanelWidth(side) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(side === 'left' ? '--left' : '--right');
    return Number.parseFloat(value) || (side === 'left' ? 328 : 306);
  }

  function panelMaxWidth(side) {
    const other = currentPanelWidth(side === 'left' ? 'right' : 'left');
    const available = window.innerWidth - other - PANEL_LIMITS.workspaceMin;
    return Math.max(PANEL_LIMITS[side].min, Math.min(PANEL_LIMITS[side].max, available));
  }

  function applyPanelWidth(side, value, persist = true) {
    if (window.innerWidth <= 820) return;
    const min = PANEL_LIMITS[side].min;
    const max = panelMaxWidth(side);
    const width = Math.round(Math.max(min, Math.min(max, Number(value) || min)));
    document.documentElement.style.setProperty(side === 'left' ? '--left' : '--right', `${width}px`);
    if (persist) {
      const layout = readPanelLayout();
      layout[side] = width;
      try { localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(layout)); } catch {}
    }
  }

  function restorePanelLayout() {
    if (window.innerWidth <= 820) return;
    const layout = readPanelLayout();
    if (layout.left) applyPanelWidth('left', layout.left, false);
    if (layout.right) applyPanelWidth('right', layout.right, false);
  }

  function bindPanelResizer(element, side) {
    if (!element) return;
    let pointerId = null;
    const widthFromPointer = (clientX) => side === 'left' ? clientX : window.innerWidth - clientX;

    const finish = () => {
      if (pointerId === null) return;
      try { element.releasePointerCapture(pointerId); } catch {}
      pointerId = null;
      document.body.classList.remove('is-resizing-panels');
      element.classList.remove('is-active');
      const layout = readPanelLayout();
      layout[side] = Math.round(currentPanelWidth(side));
      try { localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(layout)); } catch {}
    };

    element.addEventListener('pointerdown', (event) => {
      if (window.innerWidth <= 820 || event.button !== 0) return;
      pointerId = event.pointerId;
      element.setPointerCapture(pointerId);
      document.body.classList.add('is-resizing-panels');
      element.classList.add('is-active');
      applyPanelWidth(side, widthFromPointer(event.clientX), false);
      event.preventDefault();
    });
    element.addEventListener('pointermove', (event) => {
      if (pointerId !== event.pointerId) return;
      applyPanelWidth(side, widthFromPointer(event.clientX), false);
    });
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('dblclick', () => {
      const defaults = { left:328, right:306 };
      applyPanelWidth(side, defaults[side]);
    });
    element.addEventListener('keydown', (event) => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key) || window.innerWidth <= 820) return;
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const delta = (side === 'left' ? direction : -direction) * (event.shiftKey ? 40 : 12);
      applyPanelWidth(side, currentPanelWidth(side) + delta);
      event.preventDefault();
    });
  }

  const profileCopy = {
    consultive: { hero: ['Uma escolha importante merece informação clara e um caminho seguro.','Conheça o projeto, compare as possibilidades e avance no seu ritmo com orientação especializada.'], lead: 'Receba uma análise personalizada para o seu objetivo.' },
    family: { hero: ['Um lar pensado para acolher a vida que sua família quer construir.','Conforto, segurança e lazer para transformar a rotina em tempo de qualidade.'], lead: 'Descubra qual planta combina com a rotina da sua família.' },
    investment: { hero: ['Localização, produto e demanda reunidos em uma oportunidade consistente.','Conheça os diferenciais que sustentam o potencial de ocupação e valorização deste projeto.'], lead: 'Receba dados, tabela e disponibilidade para analisar o investimento.' },
    urgency: { hero: ['A condição certa pode mudar antes da sua decisão.','Consulte agora as unidades disponíveis e verifique se a condição atual faz sentido para você.'], lead: 'Consulte a disponibilidade e as condições válidas hoje.' },
    popular: { hero: ['Casa própria começa com informação simples e um próximo passo claro.','Veja o produto, entenda as possibilidades e descubra o que realmente pode fazer sentido para o seu perfil.'], lead:'Quero entender minhas possibilidades.' },
    firstHome: { hero: ['Sua primeira casa não precisa começar com um processo confuso.','Organize produto, valores, documentos e análise em uma sequência mais fácil de entender.'], lead:'Quero entender o caminho para minha primeira casa.' },
    patio: { hero: ['Mais do que comprar uma casa: tenha espaço para chamar de seu.','Conheça alternativas de casa, terreno e construção com foco em liberdade, pátio e planejamento.'], lead:'Quero entender como chegar à minha casa com pátio.' }
  };

  // Referências MD privadas do editor. São salvas no projeto JSON, nunca na página exportada.
  function normalizeAIReferences(items) {
    if (!Array.isArray(items)) return [];
    const docs = [], seen = new Set();
    let total = 0;
    for (const item of items) {
      if (docs.length >= 8 || total >= 160000) break;
      const name = String(item?.name || '').slice(0, 140);
      const content = typeof item?.content === 'string' ? item.content : '';
      if (!/\.(?:md|markdown)$/i.test(name) || !content || content.length > 65000 || total + content.length > 160000) continue;
      const id = String(item.id || '').slice(0, 80) || `md-${Date.now()}-${docs.length}`;
      if (seen.has(id)) continue;
      seen.add(id); total += content.length;
      docs.push({ id, name, category: ['memorial','commercial','copy','seo','other'].includes(item.category) ? item.category : 'other', enabled: item.enabled !== false, content });
    }
    return docs;
  }

  function normalizeState(input) {
    const base = catalog.defaultState();
    const saved = migrateProjectPaths(input && typeof input === 'object' ? input : {});
    const normalizeSection = (section) => {
      const rawSettings = section.settings || {};
      const next = {
        ...section,
        props: { ...(section.props || {}) },
        settings: {
          visible: true, hideMobile: false, hideDesktop: false, transition: 'default', cssClass: '', anchorId: '',
          ...rawSettings,
          style: { ...(catalog.sectionStyleDefaults?.() || {}), ...(rawSettings.style || {}) },
          background: { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(rawSettings.background || {}) }
        }
      };
      if (next.type === 'scrollytelling-video-pro') next.type = 'parallax';
      if (next.type === 'property-slider') {
        const sliderDefaults = catalog.plugins?.['property-slider']?.defaults || {};
        if (!Number.isFinite(Number(next.props.textPadding))) next.props.textPadding = Number(sliderDefaults.textPadding) || 64;
        if (!Number.isFinite(Number(next.props.mobileTextPadding))) next.props.mobileTextPadding = Number(sliderDefaults.mobileTextPadding) || 24;
      }
      if (next.type === 'segment-layout') {
        next.props.direction = next.props.direction === 'rows' ? 'rows' : 'columns';
        next.props.tracks = Math.max(1, Math.min(5, Number(next.props.tracks) || 1));
        next.props.itemCount = Math.max(0, Math.min(25, Number(next.props.itemCount) || 0));
      }
      if (next.settings.layoutSlot != null) next.settings.layoutSlot = Math.max(0, Number(next.settings.layoutSlot) || 0);
      return next;
    };
    const sourceSections = Array.isArray(saved.sections) && saved.sections.length ? saved.sections : base.sections;
    const preparedSections = sourceSections.map(normalizeSection);
    const migratedSections = window.ImobifyPluginLoader?.migrateLegacyCardGrids?.(preparedSections) || preparedSections;
    const normalized = {
      ...base,
      ...saved,
      version: '7.5.1',
      aiReferences: normalizeAIReferences(saved.aiReferences),
      projectId: saved.projectId || `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      brand: { ...base.brand, ...(saved.brand || {}) },
      seo: { ...base.seo, ...(saved.seo || {}) },
      strategy: { ...base.strategy, ...(saved.strategy || {}) },
      pageSettings: { ...base.pageSettings, ...(saved.pageSettings || {}) },
      siteData: { ...base.siteData, ...(saved.siteData || {}) },
      behaviorPlugins: (Array.isArray(saved.behaviorPlugins) ? saved.behaviorPlugins : base.behaviorPlugins).filter((key) => !['sticky-nav','floating-whatsapp'].includes(key)),
      sections: migratedSections.map(normalizeSection)
    };
    return normalized;
  }

  function readProjectLibrary() {
    const projects = {};
    projectMemoryStore.forEach((project, id) => { projects[id] = projectSummary(project); });
    if (state?.projectId) projects[state.projectId] = projectSummary(state);
    return projects;
  }

  function projectSummary(project) {
    return { projectId:project.projectId, projectName:project.projectName, version:project.version, sectionsCount:project.sections?.length || 0, updatedAt:project.updatedAt };
  }

  async function projectStorePut(project) {
    projectMemoryStore.set(project.projectId, clone(project));
  }

  async function projectStoreGet(id) {
    return id ? clone(projectMemoryStore.get(id) || null) : null;
  }

  async function projectStoreList() {
    return [...projectMemoryStore.values()].map(clone);
  }

  function readBlockLibrary() {
    try {
      const raw = localStorage.getItem(BLOCK_LIBRARY_KEY) || LEGACY_BLOCK_LIBRARY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      return raw ? JSON.parse(raw) : [];
    } catch (error) { return []; }
  }

  function writeBlockLibrary(blocks) {
    localStorage.setItem(BLOCK_LIBRARY_KEY, JSON.stringify(blocks));
  }

  function loadState() {
    return normalizeState(catalog.defaultState());
  }

  function setProjectDiskStatus(saved = false) {
    const status = $('#autosaveStatus');
    if (!status) return;
    projectDiskDirty = !saved;
    status.textContent = saved ? 'Salvo em disco' : 'Alterações não salvas';
    status.classList.toggle('is-saved', saved);
    status.classList.toggle('is-dirty', !saved);
  }

  function saveState(options = {}) {
    state.updatedAt = new Date().toISOString();
    state.version = '7.5.1';
    // 7.4.0 — avisa complementos do editor (Auditoria) que o projeto mudou.
    window.ImobifyStudioBridge?.notify?.();
    // O projeto ativo já é um objeto mutável em memória. O snapshot é produzido
    // somente na leitura, evitando serializar imagens e seções a cada tecla.
    projectMemoryStore.set(state.projectId, state);
    if (options.dirty !== false) setProjectDiskStatus(false);
  }

  function commit(mutator, options = {}) {
    if (options.history !== false) {
      undoStack.push(clone(state));
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
    }
    mutator(state);
    saveState();
    refresh(options.preview !== false);
  }

  function schedulePreview() {
    const frame = $('#previewFrame');
    // Invalida uma compilação em curso assim que chega uma nova alteração.
    if (frame) renderTokens.set(frame, (renderTokens.get(frame) || 0) + 1);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => renderPreview($('#previewFrame'), true, { focusSelected:Boolean(state.selectedSectionId) }), 300);
  }

  function liveCommit(mutator, after) {
    undoStack.push(clone(state));
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    mutator(state);
    saveState();
    after?.();
    $('#undoBtn').disabled = false;
    $('#redoBtn').disabled = true;
    schedulePreview();
  }

  function restore(snapshot) {
    state = clone(snapshot);
    saveState();
    refresh(true);
  }

  function undo() {
    if (!undoStack.length) return toast('Nada para desfazer.');
    redoStack.push(clone(state));
    restore(undoStack.pop());
  }

  function redo() {
    if (!redoStack.length) return toast('Nada para refazer.');
    undoStack.push(clone(state));
    restore(redoStack.pop());
  }

  function toast(message, type = 'success') {
    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = message;
    $('#toastRegion').append(item);
    setTimeout(() => item.remove(), 3200);
  }

  function activateTab(name) {
    $$('.panel-tab').forEach((button) => button.classList.toggle('is-active', button.dataset.tab === name));
    $$('.tool-tab').forEach((tab) => tab.classList.toggle('is-active', tab.id === `tab-${name}`));
  }

  function renderStrategy() {
    const methodSelect = $('#methodSelect');
    const profileSelect = $('#profileSelect');
    const strategyGroups = Object.entries(catalog.strategies || {}).reduce((groups, [key, strategy]) => {
      const group = strategy.group || 'Outros';
      (groups[group] ||= []).push([key, strategy]);
      return groups;
    }, {});
    methodSelect.innerHTML = Object.entries(strategyGroups).map(([group, entries]) => `<optgroup label="${catalog.esc(group)}">${entries.map(([key, strategy]) => `<option value="${catalog.esc(key)}">${catalog.esc(strategy.name)}</option>`).join('')}</optgroup>`).join('');
    profileSelect.innerHTML = Object.entries(catalog.profiles || {}).map(([key, profile]) => `<option value="${catalog.esc(key)}">${catalog.esc(profile.name)} — ${catalog.esc(profile.note.split('.')[0])}</option>`).join('');
    const method = catalog.strategies[state.strategy.method] || catalog.strategies.aida;
    const profile = catalog.profiles[state.strategy.profile] || catalog.profiles.consultive;
    if (!catalog.strategies[state.strategy.method]) state.strategy.method = 'aida';
    if (!catalog.profiles[state.strategy.profile]) state.strategy.profile = 'consultive';
    methodSelect.value = state.strategy.method;
    profileSelect.value = state.strategy.profile;
    $('#strategyCard').innerHTML = `<strong>${catalog.esc(method.name)} + ${catalog.esc(profile.name)}</strong><p>${catalog.esc(method.summary)} O perfil ${catalog.esc(profile.name.toLowerCase())} ${catalog.esc(profile.note)}</p><div class="strategy-stage-labels">${method.stages.map((stage) => `<span>${catalog.esc(stage)}</span>`).join('')}</div><div class="strategy-flow">${method.stages.map(() => '<span class="on"></span>').join('')}</div>`;
  }

  function isSegmentLayout(section) {
    return catalog.plugins[section?.type]?.manifest?.layout?.mode === 'segment-slots';
  }

  function segmentTrackCount(section) {
    const layout = catalog.plugins[section?.type]?.manifest?.layout;
    const max = Math.max(1, Math.min(5, Number(layout?.maxTracks) || 5));
    return Math.max(1, Math.min(max, Number(section?.props?.tracks) || 1));
  }

  function segmentDirectionLabel(section, plural = false) {
    const rows = section?.props?.direction === 'rows';
    if (rows) return plural ? 'linhas' : 'Linha';
    return plural ? 'colunas' : 'Coluna';
  }

  function pluginCanOccupySegment(plugin, segmentPlugin = catalog.plugins['segment-layout']) {
    if (!plugin || plugin.kind !== 'section' || plugin.manifest?.output === 'document-tag') return false;
    // Layouts continuam bloqueados dentro de células, com uma exceção deliberada:
    // Segmento pode conter outro Segmento para composições recursivas.
    if (plugin.manifest?.layout && plugin.manifest?.id !== 'segment-layout') return false;
    const role = catalog.compositionRole(plugin);
    const accepted = segmentPlugin?.manifest?.layout?.acceptRoles || ['item', 'both'];
    return accepted.includes(role);
  }

  function compositionBadge(plugin) {
    if (plugin.kind !== 'section') return '';
    const role = catalog.compositionRole(plugin);
    const labels = { section:'SEÇÃO', item:'ITEM', both:'FLEXÍVEL' };
    return `<em class="composition-role role-${role}">${labels[role] || 'FLEXÍVEL'}</em>`;
  }

  // Ordenação alfabética estável para todos os catálogos visuais de componentes.
  // Ignora acentos e diferenças de caixa; não altera a ordem real das seções da página.
  const pluginNameCollator = new Intl.Collator('pt-BR', { sensitivity:'base', numeric:true });
  function sortPluginEntries(entries) {
    return entries.sort((a,b) => pluginNameCollator.compare(String(a[1]?.name || a[0]), String(b[1]?.name || b[0])) || pluginNameCollator.compare(a[0],b[0]));
  }

  function renderPluginLibrary(filter = '') {
    const query = filter.trim().toLowerCase();
    const entries = sortPluginEntries(Object.entries(catalog.plugins).filter(([, plugin]) => !query || `${plugin.name} ${plugin.category} ${plugin.description}`.toLowerCase().includes(query)));
    $('#pluginCount').textContent = `${entries.length}`;
    $('#pluginLibrary').innerHTML = entries.map(([key, plugin]) => {
      const enabled = plugin.kind === 'behavior' ? state.behaviorPlugins.includes(key) : state.sections.some((section) => section.type === key);
      const source = plugin.pluginSource ? `<em class="plugin-source-badge">${plugin.pluginSource === 'installed' ? 'Importado' : 'Plugin Play'}</em>` : '';
      return `<button class="plugin-card ${enabled ? 'is-enabled' : ''}" data-plugin-key="${key}"><span class="plugin-icon">${plugin.icon}</span><span><strong>${plugin.name}</strong><small>${plugin.category} · ${plugin.description}</small><span class="plugin-card-badges">${compositionBadge(plugin)}${source}</span></span><span class="plugin-add">${plugin.kind === 'behavior' ? (enabled ? '✓' : '+') : '+'}</span></button>`;
    }).join('') || '<p class="helper">Nenhum plugin encontrado.</p>';
  }

  function renderInstalledPlugins() {
    const entries = sortPluginEntries(Object.entries(catalog.plugins).filter(([, plugin]) => plugin.pluginSource));
    $('#installedPluginList').innerHTML = entries.length ? entries.map(([key, plugin]) => `<div class="installed-plugin"><span>${plugin.icon}</span><span><strong>${plugin.name}</strong><small>v${plugin.manifest?.version || '1.0.0'} · ${plugin.pluginSource === 'installed' ? 'Importado por ZIP' : 'Incluído no framework'}</small></span>${plugin.pluginSource === 'installed' ? `<button data-uninstall-plugin="${key}" title="Desinstalar">×</button>` : '<span></span>'}</div>`).join('') : '<p class="helper">Nenhum pacote Plugin Play instalado.</p>';
  }

  function buildSectionLayoutMeta(sections = state.sections) {
    const meta = new Map();
    const visit = (index, parentId = null, depth = 0, slot = null) => {
      const section = sections[index];
      if (!section) return 1;
      const plugin = catalog.plugins[section.type];
      const layout = plugin?.manifest?.layout;
      let cursor = index + 1;
      let childCount = 0;
      if (layout?.mode === 'next-sections' || layout?.mode === 'segment-slots') {
        const maxChildren = Math.max(0, Number(layout.maxChildren) || 8);
        const excludedTypes = new Set(Array.isArray(layout.excludeTypes) ? layout.excludeTypes : []);
        const requested = Math.max(0, Math.min(maxChildren, Number(section.props?.itemCount ?? plugin?.defaults?.itemCount ?? 0) || 0));
        const tracks = layout.mode === 'segment-slots' ? segmentTrackCount(section) : 0;
        while (cursor < sections.length && childCount < requested) {
          const nextSection = sections[cursor];
          if (nextSection && excludedTypes.has(nextSection.type)) break;
          const rawSlot = Number(nextSection?.settings?.layoutSlot);
          const childSlot = layout.mode === 'segment-slots'
            ? (Number.isInteger(rawSlot) ? Math.max(0, Math.min(tracks - 1, rawSlot)) : Math.min(tracks - 1, childCount))
            : null;
          const span = Math.max(1, visit(cursor, section.id, depth + 1, childSlot));
          cursor += span;
          childCount += 1;
        }
      }
      const span = Math.max(1, cursor - index);
      meta.set(section.id, { index, parentId, depth, span, childCount, layout, slot });
      return span;
    };
    let cursor = 0;
    while (cursor < sections.length) cursor += Math.max(1, visit(cursor, null, 0));
    return meta;
  }

  function groupForSelection(id = state.selectedSectionId, sections = state.sections) {
    if (!id) return null;
    const meta = buildSectionLayoutMeta(sections);
    const selected = sections.find((item) => item.id === id);
    const selectedMeta = meta.get(id);
    if (!selected || !selectedMeta) return null;
    if (catalog.plugins[selected.type]?.manifest?.layout) return { section:selected, meta:selectedMeta };
    if (!selectedMeta.parentId) return null;
    const parent = sections.find((item) => item.id === selectedMeta.parentId);
    const parentMeta = parent ? meta.get(parent.id) : null;
    return parent && parentMeta && catalog.plugins[parent.type]?.manifest?.layout ? { section:parent, meta:parentMeta } : null;
  }

  function syncInspectorStateMenu(section, plugin) {
    const button = $('#inspectorStateMenuButton');
    if (!button) return;
    const available = Boolean(section && plugin && componentState);
    button.disabled = !available;
    button.setAttribute('aria-disabled', String(!available));
    const saveGroup = $('[data-component-state-action="save-group"]', $('#inspectorStateMenu'));
    if (saveGroup) saveGroup.disabled = !available || !groupForSelection(section?.id);
    if (!available) closeInspectorStateMenu();
  }

  function renderSectionList() {
    const layoutMeta = buildSectionLayoutMeta();
    $('#sectionList').innerHTML = state.sections.map((section, index) => {
      const plugin = catalog.plugins[section.type];
      const hidden = section.settings?.visible === false;
      const meta = layoutMeta.get(section.id) || { depth:0, parentId:null };
      const parent = meta.parentId ? state.sections.find((item) => item.id === meta.parentId) : null;
      const parentName = parent ? (catalog.plugins[parent.type]?.name || parent.type) : '';
      const segmentParent = parent && isSegmentLayout(parent) ? parent : null;
      const anchor = String(section.settings?.anchorId || '').trim().replace(/^#/, '');
      const badges = `${section.settings?.hideMobile === true ? '<em class="mobile-hidden-tag" title="Oculto no mobile — somente desktop">M</em>' : ''}${section.settings?.hideDesktop === true ? '<em class="desktop-hidden-tag" title="Oculto no desktop — somente mobile">D</em>' : ''}${hidden ? '<em class="hidden-section-tag" title="Oculta na publicação">OCULTA</em>' : ''}`;
      const isDocumentTag = plugin?.manifest?.output === 'document-tag';
      const tagDetail = isDocumentTag ? `${catalog.esc(section.props?.label || 'Tag sem nome')} · ${catalog.esc(section.props?.placement || 'head')} · ID ${catalog.esc(section.id)}` : '';
      const instanceField = plugin?.manifest?.instanceIdField;
      const instanceId = instanceField ? String(section.props?.[instanceField] || '').trim() : '';
      const segmentDetail = segmentParent ? `↳ ${segmentDirectionLabel(segmentParent)} ${(meta.slot ?? 0) + 1} do Segmento` : '';
      const ownSegmentDetail = isSegmentLayout(section) ? `${segmentTrackCount(section)} ${segmentDirectionLabel(section, true)} · ${meta.childCount || 0} componente${meta.childCount === 1 ? '' : 's'}` : '';
      const details = isDocumentTag ? tagDetail : [segmentDetail || (parentName ? `↳ dentro de ${catalog.esc(parentName)}` : ''), ownSegmentDetail, instanceId ? `chamada #${catalog.esc(instanceId)}` : '', anchor ? `âncora #${catalog.esc(anchor)}` : ''].filter(Boolean).join(' · ');
      const label = `<span class="section-row-label"><strong>${plugin?.name || section.type}${badges}</strong>${details ? `<small>${details}</small>` : ''}</span>`;
      const siblingIds = [...layoutMeta.entries()].filter(([, item]) => item.parentId === meta.parentId).sort((a,b) => a[1].index - b[1].index).map(([id]) => id);
      const siblingIndex = siblingIds.indexOf(section.id);
      const canMoveUp = siblingIndex > 0;
      const canMoveDown = siblingIndex >= 0 && siblingIndex < siblingIds.length - 1;
      const slotBack = segmentParent ? `<button data-move-slot="-1" title="Mover para ${segmentDirectionLabel(segmentParent).toLowerCase()} anterior" ${(meta.slot ?? 0) > 0 ? '' : 'disabled'}>${segmentParent.props?.direction === 'rows' ? '↑' : '←'}</button>` : '';
      const slotNext = segmentParent ? `<button data-move-slot="1" title="Mover para próxima ${segmentDirectionLabel(segmentParent).toLowerCase()}" ${(meta.slot ?? 0) < segmentTrackCount(segmentParent) - 1 ? '' : 'disabled'}>${segmentParent.props?.direction === 'rows' ? '↓' : '→'}</button>` : '';
      const orderControls = segmentParent ? `${slotBack}${slotNext}` : `<button data-move="up" title="Subir nesta ordem" ${canMoveUp ? '' : 'disabled'}>↑</button><button data-move="down" title="Descer nesta ordem" ${canMoveDown ? '' : 'disabled'}>↓</button>`;
      return `<div class="section-row ${state.selectedSectionId === section.id ? 'is-selected' : ''} ${hidden ? 'is-hidden' : ''} ${meta.depth ? 'is-layout-child' : ''} ${isSegmentLayout(section) ? 'is-segment-row' : ''}" data-section-id="${section.id}" data-section-index="${index}" data-depth="${meta.depth}" data-layout-slot="${meta.slot ?? ''}" style="--section-depth:${meta.depth}"><span class="drag-handle" title="Arraste a linha para reordenar ou mudar de nível">⋮⋮</span>${label}<span class="row-actions"><button data-visibility title="${hidden ? 'Exibir seção' : 'Ocultar seção'}">${hidden ? '⊘' : '◉'}</button><button data-duplicate title="Duplicar">⧉</button>${orderControls}<button data-remove title="Remover">×</button></span></div>`;
    }).join('');
  }

  function renderReusableBlocks() {
    const blocks = readBlockLibrary();
    $('#reusableBlockList').innerHTML = blocks.length ? blocks.map((block) => `<div class="reusable-block" data-reusable-id="${catalog.esc(block.id)}"><span>${catalog.plugins[block.section.type]?.icon || '⬡'}</span><span><strong>${catalog.esc(block.name)}</strong><small>${catalog.esc(catalog.plugins[block.section.type]?.name || block.section.type)}</small></span><button data-insert-reusable title="Inserir">+</button><button data-remove-reusable title="Excluir">×</button></div>`).join('') : '<p class="helper">Salve uma seção para reutilizá-la em outras páginas.</p>';
  }

  function renderProjectLibrary() {
    const projects = Object.values(readProjectLibrary()).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    $('#projectLibrary').innerHTML = projects.map((project) => `<button class="project-library-item ${project.projectId === state.projectId ? 'is-active' : ''}" data-open-project="${catalog.esc(project.projectId)}"><span>${catalog.esc(project.projectName || 'Projeto sem nome')}</span><small>${project.sectionsCount ?? project.sections?.length ?? 0} seções · ${project.projectId === state.projectId ? 'em edição' : 'abrir'}</small></button>`).join('');
    $('#projectCount').textContent = String(projects.length);
  }

  function projectPresetGroups() {
    const entries = projectPresets?.list?.() || [];
    const groups = [];
    entries.forEach((entry) => {
      let group = groups.find((item) => item.name === entry.category);
      if (!group) { group = { name:entry.category, items:[] }; groups.push(group); }
      group.items.push(entry);
    });
    return groups;
  }

  function renderProjectPresetLibrary() {
    const target = $('#projectPresetLibrary');
    const count = $('#projectPresetCount');
    if (!target || !count) return;
    const entries = projectPresets?.list?.() || [];
    count.textContent = String(entries.length);
    if (!entries.length) {
      const detail = projectPresets?.loadError ? 'Não foi possível carregar presets/presets.json. Abra o Studio por um servidor local.' : 'Nenhum preset cadastrado.';
      target.innerHTML = `<p class="helper">${catalog.esc(detail)}</p>`;
      return;
    }
    target.innerHTML = entries.map((entry) => `<div class="project-preset-item"><span><strong>${catalog.esc(entry.name)}</strong><small>${catalog.esc(entry.category)}${entry.subcategory ? ` › ${catalog.esc(entry.subcategory)}` : ''} · ${catalog.esc(entry.description)}</small></span><span class="project-preset-actions"><button type="button" data-preset-action="new" data-project-preset-id="${catalog.esc(entry.id)}">Novo</button><button type="button" data-preset-action="apply" data-project-preset-id="${catalog.esc(entry.id)}">Aplicar</button></span></div>`).join('');
  }

  function renderNewProjectPresetTree() {
    const target = $('#newProjectPresetTree');
    if (!target) return;
    const groups = projectPresetGroups();
    if (!groups.length) {
      const detail = projectPresets?.loadError ? 'Não foi possível carregar presets/presets.json.' : 'Nenhum modelo cadastrado.';
      target.innerHTML = `<p class="helper">${catalog.esc(detail)}</p>`;
      return;
    }
    target.innerHTML = groups.map((group, groupIndex) => {
      const subgroups = [];
      const direct = [];
      group.items.forEach((entry) => {
        if (!entry.subcategory) direct.push(entry);
        else {
          let subgroup = subgroups.find((item) => item.name === entry.subcategory);
          if (!subgroup) { subgroup = { name:entry.subcategory, items:[] }; subgroups.push(subgroup); }
          subgroup.items.push(entry);
        }
      });
      const itemHtml = (entry) => `<button type="button" class="preset-tree-item" data-new-project-preset="${catalog.esc(entry.id)}"><span><strong>${catalog.esc(entry.name)}</strong><small>${catalog.esc(entry.description)}</small></span><b>›</b></button>`;
      if (group.items.length === 1 && direct.length === 1 && !subgroups.length && direct[0].name === group.name) return itemHtml(direct[0]);
      const content = `${direct.map(itemHtml).join('')}${subgroups.map((subgroup) => `<div class="preset-tree-subtitle">${catalog.esc(subgroup.name)}</div>${subgroup.items.map(itemHtml).join('')}`).join('')}`;
      return `<details class="preset-tree-group" ${groupIndex < 2 ? 'open' : ''}><summary>${catalog.esc(group.name)}</summary><div class="preset-tree-items">${content}</div></details>`;
    }).join('');
  }

  function renderProductionSettings() {
    $$('[data-page-setting]').forEach((input) => { input.value = state.pageSettings[input.dataset.pageSetting] ?? ''; });
    $$('[data-site-data]').forEach((input) => { input.value = state.siteData[input.dataset.siteData] ?? ''; });
    $('#blueprintSelect').innerHTML = Object.entries(catalog.blueprints || {}).map(([key, blueprint]) => `<option value="${key}">${catalog.esc(blueprint.name)}</option>`).join('');
  }

  const paletteTechniqueNotes = {
    manual:'Você controla cada cor individualmente.',
    '60-30-10':'60% base clara, 30% cor estrutural e 10% destaque. Boa para páginas comerciais equilibradas.',
    complementary:'Combina a cor principal com o lado oposto do círculo cromático para criar contraste de CTA.',
    analogous:'Usa cores vizinhas para uma sensação mais acolhedora e coerente.',
    triadic:'Distribui três regiões do círculo cromático para dar energia sem perder equilíbrio.',
    monochromatic:'Varia luminosidade e saturação da mesma cor para um visual mais sóbrio.'
  };
  const paletteTechniqueLabels = {
    manual:'Manual', '60-30-10':'60–30–10', complementary:'Complementar', analogous:'Análoga', triadic:'Tríade', monochromatic:'Monocromática'
  };

  function clampNumber(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }

  function hexToRgb(hex) {
    const raw = String(hex || '').trim().replace('#','');
    if (!/^[0-9a-f]{6}$/i.test(raw)) return null;
    return { r:parseInt(raw.slice(0,2),16), g:parseInt(raw.slice(2,4),16), b:parseInt(raw.slice(4,6),16) };
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d) {
      s = d / (1 - Math.abs(2*l - 1));
      switch (max) {
        case r: h = 60 * (((g-b)/d) % 6); break;
        case g: h = 60 * (((b-r)/d) + 2); break;
        default: h = 60 * (((r-g)/d) + 4);
      }
    }
    if (h < 0) h += 360;
    return { h, s:s*100, l:l*100 };
  }

  function hslToHex(h, s, l) {
    h = ((Number(h) % 360) + 360) % 360;
    s = clampNumber(s,0,100) / 100;
    l = clampNumber(l,0,100) / 100;
    const c = (1 - Math.abs(2*l - 1)) * s;
    const x = c * (1 - Math.abs((h/60)%2 - 1));
    const m = l - c/2;
    let r=0,g=0,b=0;
    if (h < 60) [r,g,b]=[c,x,0];
    else if (h < 120) [r,g,b]=[x,c,0];
    else if (h < 180) [r,g,b]=[0,c,x];
    else if (h < 240) [r,g,b]=[0,x,c];
    else if (h < 300) [r,g,b]=[x,0,c];
    else [r,g,b]=[c,0,x];
    const toHex = (v) => Math.round((v+m)*255).toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function relativeLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const values = [rgb.r,rgb.g,rgb.b].map((v) => {
      v /= 255;
      return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4);
    });
    return values[0]*.2126 + values[1]*.7152 + values[2]*.0722;
  }

  function contrastRatio(foreground, background) {
    const a = relativeLuminance(foreground);
    const b = relativeLuminance(background);
    return (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
  }

  function readableText(background) {
    const l = relativeLuminance(background);
    const contrastWhite = 1.05 / (l + .05);
    const contrastDark = (l + .05) / .05;
    return contrastWhite >= contrastDark ? '#ffffff' : '#000000';
  }

  function renderDesignEffectPreview() {
    const root = $('#designEffectPreview');
    if (!root) return;
    const b = state.brand || {};
    const num = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const clamp = (value,min,max) => Math.max(min,Math.min(max,num(value,min)));
    const rgba = (hex, alpha) => {
      const rgb = hexToRgb(hex) || { r:0,g:0,b:0 };
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0,Math.min(1,alpha)).toFixed(3)})`;
    };
    const shadow = (style,color,strength) => {
      const amount = clamp(strength,0,100)/100;
      if (style === 'none' || amount <= 0) return 'none';
      if (style === 'soft') return `0 .035em .11em ${rgba(color,.30*amount)}`;
      if (style === 'cinematic') return `0 .018em .012em ${rgba(color,.72*amount)},0 .07em .15em ${rgba(color,.46*amount)},0 .20em .48em ${rgba(color,.27*amount)}`;
      if (style === 'glow') return `0 0 .06em ${rgba(color,.52*amount)},0 0 .20em ${rgba(color,.38*amount)},0 0 .46em ${rgba(color,.20*amount)}`;
      return `0 .018em .018em ${rgba(color,.76*amount)},0 .055em .16em ${rgba(color,.48*amount)},0 .14em .34em ${rgba(color,.24*amount)}`;
    };
    const title = root.querySelector('h3');
    const subtitle = root.querySelector('p');
    const button = root.querySelector('button');
    root.style.background = `linear-gradient(135deg,${b.dark || '#0e1218'} 0 52%,${b.surface || '#f5f7f8'} 52%)`;
    title.style.color = b.inverseHeadingColor || '#ffffff';
    title.style.webkitTextStroke = `${(clamp(b.titleOutlineWidth,0,8)/100).toFixed(4)}em ${b.titleOutlineColor || '#000000'}`;
    title.style.textShadow = shadow(b.titleShadowStyle || 'contrast', b.titleShadowColor || '#000000', b.titleShadowStrength ?? 72);
    subtitle.style.color = b.inverseBodyColor || '#dbe1e5';
    subtitle.style.webkitTextStroke = `${(clamp(b.subtitleOutlineWidth,0,6)/100).toFixed(4)}em ${b.subtitleOutlineColor || '#000000'}`;
    subtitle.style.textShadow = shadow(b.subtitleShadowStyle || 'contrast', b.subtitleShadowColor || '#000000', b.subtitleShadowStrength ?? 52);

    const bg = b.actionButtonBackground || b.primary || '#d7ff3f';
    const accent = b.accent || bg;
    const rgb = hexToRgb(bg) || { r:215,g:255,b:63 };
    const effect = b.actionButtonEffect || 'depth';
    const depth = clamp(b.actionButtonDepth,0,20);
    const glow = clamp(b.actionButtonGlow,0,100)/100;
    const opacity = clamp(b.actionButtonGlassOpacity,8,100)/100;
    const blur = clamp(b.actionButtonGlassBlur,0,36);
    const shine = clamp(b.actionButtonShine,0,100)/100;
    const scale = clamp(b.actionButtonHoverScale ?? 100,100,115)/100;
    const speed = clamp(b.actionButtonSpeed ?? 180,80,700);
    const dark = hslToHex(rgbToHsl(rgb).h, Math.min(80,rgbToHsl(rgb).s), Math.max(5,rgbToHsl(rgb).l*.56));
    const light = `rgb(${Math.round(rgb.r+(255-rgb.r)*.24)},${Math.round(rgb.g+(255-rgb.g)*.24)},${Math.round(rgb.b+(255-rgb.b)*.24)})`;
    const shinePart = shine ? `inset 0 1px 0 rgba(255,255,255,${(.08+shine*.34).toFixed(3)})` : '';
    const glowPart = glow ? `0 0 ${Math.round(8+glow*28)}px rgba(${rgb.r},${rgb.g},${rgb.b},${(.10+glow*.42).toFixed(3)})` : '';
    const depthPart = depth ? `0 ${depth}px 0 ${dark},0 ${depth+6}px ${Math.round(16+depth*2.2)}px rgba(0,0,0,.22)` : '';
    button.dataset.effect = effect;
    button.style.color = b.actionButtonText || readableText(bg);
    button.style.borderWidth = `${clamp(b.actionButtonBorderWidth,0,4)}px`;
    button.style.borderColor = ['glass','liquid-glass'].includes(effect) ? 'rgba(255,255,255,.34)' : effect === 'neon' ? accent : 'transparent';
    button.style.backdropFilter = ['glass','liquid-glass'].includes(effect) ? `blur(${blur}px) saturate(${effect === 'liquid-glass' ? 1.34 : 1.18})` : 'none';
    button.style.transition = `all ${speed}ms cubic-bezier(.2,.75,.25,1)`;
    button.style.transform = `scale(${Math.min(scale,1.03).toFixed(3)})`;
    button.style.backgroundSize = 'auto';
    button.style.backgroundPosition = 'center';
    if (effect === 'glass' || effect === 'liquid-glass') {
      button.style.background = effect === 'liquid-glass'
        ? `linear-gradient(145deg,rgba(255,255,255,${(.16+shine*.28).toFixed(3)}),rgba(255,255,255,.03) 46%,transparent),rgba(${rgb.r},${rgb.g},${rgb.b},${opacity.toFixed(3)})`
        : `linear-gradient(135deg,rgba(255,255,255,${(.06+shine*.20).toFixed(3)}),rgba(255,255,255,0) 58%),rgba(${rgb.r},${rgb.g},${rgb.b},${opacity.toFixed(3)})`;
    } else if (effect === 'shine') {
      button.style.background = `linear-gradient(110deg,transparent 0 35%,rgba(255,255,255,${(.16+shine*.48).toFixed(3)}) 48%,transparent 61%),linear-gradient(180deg,${light},${bg} 45%,${dark})`;
      button.style.backgroundSize = '240% 100%,100% 100%'; button.style.backgroundPosition = '-20% 0,0 0';
    } else if (effect === 'gradient' || effect === 'fill-slide') {
      button.style.background = effect === 'gradient' ? `linear-gradient(120deg,${bg},${accent},${bg})` : `linear-gradient(90deg,${accent} 0 49.5%,${bg} 50.5% 100%)`;
      button.style.backgroundSize = effect === 'gradient' ? '220% 220%' : '205% 100%';
    } else button.style.background = bg;
    if (effect === 'glow' || effect === 'pulse' || effect === 'neon') button.style.boxShadow = [glowPart,'0 10px 28px rgba(0,0,0,.16)',shinePart].filter(Boolean).join(',');
    else if (effect === 'glass' || effect === 'liquid-glass') button.style.boxShadow = ['0 14px 38px rgba(0,0,0,.20)',glowPart,shinePart].filter(Boolean).join(',');
    else if (effect === 'depth-glow') button.style.boxShadow = [depthPart,glowPart,shinePart].filter(Boolean).join(',');
    else if (effect === 'depth') button.style.boxShadow = [depthPart,shinePart].filter(Boolean).join(',');
    else if (effect === 'soft-shadow' || ['magnetic','scale-pop','ripple','shine','gradient','fill-slide','border-reveal'].includes(effect)) button.style.boxShadow = ['0 10px 28px rgba(0,0,0,.16)',glowPart,shinePart].filter(Boolean).join(',');
    else button.style.boxShadow = shinePart || 'none';
  }

  function renderContrastAudit() {
    const root = $('#contrastAudit');
    if (!root) return;
    const b = state.brand || {};
    const threshold = b.contrastMode === 'comfort' ? 7 : 4.5;
    if (b.contrastMode === 'manual') {
      root.innerHTML = '<strong>Proteção desativada</strong><small>As cores serão usadas exatamente como escolhidas. Verifique a leitura no preview.</small>';
      root.className = 'contrast-audit is-manual';
      return;
    }
    const checks = [
      ['Título / fundo claro', b.headingColor || b.ink, b.surface],
      ['Texto / fundo claro', b.bodyColor || b.ink, b.surface],
      ['Texto secundário / fundo claro', b.mutedColor, b.surface],
      ['Cor principal como texto', b.primary, b.surface],
      ['Título / fundo escuro', b.inverseHeadingColor, b.dark],
      ['Texto / fundo escuro', b.inverseBodyColor, b.dark],
      ['Destaque / fundo escuro', b.accent, b.dark],
      ['CTA', b.actionButtonText, b.actionButtonBackground || b.primary]
    ].map(([label,fg,bg]) => {
      const ratio = contrastRatio(fg || '#000000', bg || '#ffffff');
      return { label, ratio, ok:ratio >= threshold };
    });
    const rawIssues = checks.filter((item) => !item.ok).length;
    root.className = `contrast-audit ${rawIssues ? 'has-corrections' : 'is-ok'}`;
    const note = b.contrastMode === 'comfort' ? 'Alvo 7:1. O sistema busca o maior contraste possível sem trocar a cor de fundo; tons médios podem ter limite físico inferior a 7:1.' : 'Meta 4,5:1. O preview/publicação corrige automaticamente o foreground quando necessário.';
    root.innerHTML = `<strong>${rawIssues ? `${rawIssues} combinação${rawIssues > 1 ? 'ões' : ''} precisa${rawIssues > 1 ? 'm' : ''} de proteção` : 'Contraste funcional aprovado'}</strong><small>${note}</small><div>${checks.map((item) => `<span class="${item.ok ? 'ok' : 'fix'}"><b>${catalog.esc(item.label)}</b><em>${item.ratio.toFixed(1)}:1</em></span>`).join('')}</div>`;
  }

  function derivePalette(primary, technique) {
    const rgb = hexToRgb(primary);
    if (!rgb || technique === 'manual') return null;
    const base = rgbToHsl(rgb);
    const saturation = Math.max(42, base.s);
    let accentHue = base.h + 165;
    if (technique === 'complementary') accentHue = base.h + 180;
    if (technique === 'analogous') accentHue = base.h + 38;
    if (technique === 'triadic') accentHue = base.h + 120;
    if (technique === 'monochromatic') accentHue = base.h;
    const accentLight = technique === 'monochromatic'
      ? (base.l > 52 ? clampNumber(base.l - 22,28,58) : clampNumber(base.l + 22,42,72))
      : clampNumber(base.l > 62 ? 44 : 54,38,62);
    const accentSat = technique === 'monochromatic' ? Math.max(30,saturation*.68) : Math.min(88, Math.max(52,saturation*.9));
    const surfaceSat = technique === 'monochromatic' ? Math.min(18,saturation*.18) : Math.min(24,saturation*.24);
    const darkSat = Math.min(58, Math.max(22,saturation*.58));
    const inkSat = Math.min(34, Math.max(12,saturation*.32));
    const generated = {
      accent:hslToHex(accentHue, accentSat, accentLight),
      surface:hslToHex(base.h, surfaceSat, 97),
      ink:hslToHex(base.h, inkSat, 15),
      dark:hslToHex(base.h, darkSat, 12),
      headingColor:hslToHex(base.h, inkSat, 15),
      bodyColor:hslToHex(base.h, Math.min(24,inkSat), 29),
      mutedColor:hslToHex(base.h, Math.min(18,inkSat), 48),
      inverseHeadingColor:'#ffffff',
      inverseBodyColor:hslToHex(base.h, Math.min(14,surfaceSat+4), 88),
      actionButtonBackground:primary,
      actionButtonText:readableText(primary)
    };
    if (technique === '60-30-10') {
      generated.surface = hslToHex(base.h, Math.min(18,surfaceSat), 98);
      generated.dark = hslToHex(base.h, Math.max(28,darkSat), 14);
      generated.accent = hslToHex(base.h + 165, Math.min(90,accentSat+8), 52);
    }
    return generated;
  }

  function applyPaletteTechnique() {
    const technique = state.brand.paletteTechnique || 'manual';
    const generated = derivePalette(state.brand.primary, technique);
    if (!generated) return toast('Selecione uma técnica automática para gerar a paleta.', 'error');
    commit((draft) => {
      Object.assign(draft.brand, generated);
      draft.preset = 'personalizado';
    });
    toast(`Paleta ${paletteTechniqueLabels[technique] || 'automática'} aplicada a partir da cor principal.`);
  }

  function applyTypographyProfile() {
    const key = state.brand.typographyProfile || 'conversion';
    const profile = catalog.typographyProfiles?.[key];
    if (!profile) return toast('Perfil tipográfico inválido.', 'error');
    const { name, description, ...settings } = profile;
    commit((draft) => {
      Object.assign(draft.brand, settings);
      draft.brand.typographyProfile = key;
      draft.preset = 'personalizado';
    });
    toast(`Tipografia ${name} aplicada.`);
  }

  function applyButtonKit(key) {
    if (key === 'custom') {
      commit((draft) => { draft.brand.actionButtonKit = 'custom'; draft.preset = 'personalizado'; });
      return;
    }
    const kit = catalog.buttonKits?.[key];
    if (!kit) return toast('Modelo de botão inválido.', 'error');
    commit((draft) => {
      Object.assign(draft.brand, kit.settings || {});
      draft.brand.actionButtonKit = key;
      draft.preset = 'personalizado';
    });
    toast(`Botão ${kit.name} aplicado.`);
  }

  function renderPresets() {
    $('#presetGrid').innerHTML = Object.entries(catalog.presets).map(([key, preset]) => `<button class="preset ${state.preset === key ? 'is-active' : ''}" data-preset="${key}"><span class="preset-swatch" style="background:${preset.swatch}"><i style="background:${preset.surface}"></i><i style="background:${preset.primary}"></i><i style="background:${preset.accent}"></i></span><strong>${catalog.esc(preset.name)}</strong><small>${catalog.esc(preset.description || '')}</small></button>`).join('');
    const typographySelect = $('#typographyProfileSelect');
    if (typographySelect) typographySelect.innerHTML = Object.entries(catalog.typographyProfiles || {}).map(([key, profile]) => `<option value="${catalog.esc(key)}">${catalog.esc(profile.name)}</option>`).join('');
    const buttonKitSelect = $('#buttonKitSelect');
    if (buttonKitSelect) {
      buttonKitSelect.innerHTML = `<option value="custom">Personalizado</option>${Object.entries(catalog.buttonKits || {}).map(([key, kit]) => `<option value="${catalog.esc(key)}">${catalog.esc(kit.name)}</option>`).join('')}`;
      buttonKitSelect.value = state.brand.actionButtonKit || 'custom';
    }
    const buttonKitHint = $('#buttonKitHint');
    if (buttonKitHint) buttonKitHint.textContent = catalog.buttonKits?.[state.brand.actionButtonKit]?.description || 'Escolha um modelo e refine os controles abaixo.';
    $$('[data-brand]').forEach((input) => { input.value = state.brand[input.dataset.brand] ?? ''; });
    const paletteHint = $('#paletteTechniqueHint');
    if (paletteHint) paletteHint.textContent = paletteTechniqueNotes[state.brand.paletteTechnique || 'manual'] || '';
    const typographyHint = $('#typographyProfileHint');
    if (typographyHint) typographyHint.textContent = catalog.typographyProfiles?.[state.brand.typographyProfile || 'conversion']?.description || '';
    renderContrastAudit();
    $$('[data-brand-output]').forEach((output) => {
      const key = output.dataset.brandOutput; const value = state.brand[key];
      const pxKeys = ['h1Size','h2Size','h3Size','bodySize','containerWidth','sectionSpace','contentGap','elementGap','componentPadding','radius','actionButtonDepth','actionButtonGlassBlur','actionButtonBorderWidth','actionButtonSpeed','paragraphIndent','paragraphSpacing'];
      const percentKeys = ['textEffectStrength','titleOutlineWidth','titleShadowStrength','subtitleOutlineWidth','subtitleShadowStrength','actionButtonGlow','actionButtonGlassOpacity','actionButtonShine','actionButtonHoverScale'];
      const unit = key === 'actionButtonSpeed' ? 'ms' : (pxKeys.includes(key) ? 'px' : (percentKeys.includes(key) ? '%' : (key === 'headingTracking' || key === 'eyebrowTracking' || key === 'bodyTracking' ? 'em' : (key === 'textMeasure' ? 'ch' : ''))));
      output.textContent = `${value ?? ''}${unit}`;
    });
    renderDesignEffectPreview();
  }

  function seoChecks() {
    const seo = state.seo;
    const hero = state.sections.find((section) => ['hero','hero-plus'].includes(section.type) && section.settings?.visible !== false);
    return [
      ['Título entre 35 e 60 caracteres', seo.title?.length >= 35 && seo.title.length <= 60],
      ['Descrição entre 120 e 160 caracteres', seo.description?.length >= 120 && seo.description.length <= 160],
      ['URL canônica HTTPS válida', /^https:\/\//.test(seo.canonical || '')],
      ['Sitemap XML automático configurado', seo.sitemapEnabled === 'no' || /^https:\/\//.test(seo.canonical || '')],
      ['Imagem social configurada', Boolean(seo.ogImage)],
      ['Ícone do site configurado', Boolean(seo.favicon)],
      ['Hero com texto alternativo', Boolean(hero?.props?.imageAlt && hero.props.imageAlt.length >= 12)],
      ['Localização completa', Boolean(seo.city && seo.region && seo.address)],
      ['Dados estruturados imobiliários', Boolean(seo.propertyName && (seo.city || seo.address))],
      ['Autor e especialidade identificados', Boolean(seo.authorName && seo.authorRole)],
      ['CRECI/credencial informado', Boolean(state.siteData?.license)],
      ['Data de revisão informada', Boolean(seo.lastReviewed)],
      ['Fontes das informações registradas', Boolean(seo.sourceNotes?.length >= 30)],
      ['Contexto local/exclusivo registrado', Boolean(seo.localInsight?.length >= 40)],
      ['Descoberta por IA configurada', ['allow','disallow'].includes(seo.aiSearch)],
    ];
  }

  function clampScore(value) { return Math.max(0, Math.min(10, Math.round(value * 10) / 10)); }

  function readinessMetrics() {
    const seo = state.seo;
    const visible = state.sections.filter((section) => section.settings?.visible !== false);
    const hero = visible.find((section) => ['hero','hero-plus'].includes(section.type));
    const videoCount = visible.filter((section) => /video|scrolly|parallax/i.test(section.type)).length;
    const cwv = clampScore(9.2 - Math.min(1.5, videoCount * .35) - ((hero?.props?.image || hero?.props?.image1) ? 0 : 1.2));
    const crawl = clampScore(6.6 + (/^https:\/\//.test(seo.canonical || '') ? .8 : 0) + (seo.robots === 'index, follow' ? .6 : 0) + (seo.title && seo.description ? .7 : 0) + .8); // + sitemap/robots automáticos na compilação
    const eeat = clampScore(5.8 + (seo.authorName ? .7 : 0) + (seo.authorRole ? .5 : 0) + (state.siteData?.license ? .7 : 0) + (seo.sourceNotes?.length >= 30 ? .6 : 0) + (seo.lastReviewed ? .4 : 0) + (seo.organizationName ? .4 : 0));
    const ai = clampScore(7.1 + (seo.aiSearch === 'allow' ? .8 : 0) + (seo.localInsight?.length >= 40 ? .5 : 0) + (seo.sourceNotes?.length >= 30 ? .4 : 0) + (seo.authorName ? .3 : 0));
    const scale = clampScore(6.8 + (seo.localInsight?.length >= 40 ? .8 : 0) + (seo.sourceNotes?.length >= 30 ? .5 : 0) + (seo.propertyName && seo.city ? .5 : 0) + (seo.canonical ? .4 : 0));
    return [
      ['Core Web Vitals potencial', cwv],
      ['Arquitetura de rastreamento', crawl],
      ['E-E-A-T imobiliário', eeat],
      ['Descoberta por IA', ai],
      ['Produção em escala', scale]
    ];
  }

  function renderSeo() {
    $$('[data-seo]').forEach((input) => {
      const key = input.dataset.seo;
      const value = state.seo[key] ?? '';
      // Evita expor dezenas de milhares de caracteres base64 no campo de texto.
      // O arquivo continua no estado; digitar uma URL substitui a seleção.
      const uploaded = (key === 'favicon' || key === 'ogImage') ? /^data:image\/(png|jpeg|svg\+xml|webp);base64,/i.exec(value) : null;
      if (uploaded) {
        const format = uploaded[1].toLowerCase() === 'jpeg' ? 'jpg' : uploaded[1].toLowerCase() === 'svg+xml' ? 'svg' : uploaded[1].toLowerCase();
        input.value = '';
        input.placeholder = `Arquivo carregado → ./${key === 'favicon' ? 'icon' : 'share'}.${format}`;
      } else {
        input.value = value;
      }
    });
    $('[data-counter="title"]').textContent = `${state.seo.title?.length || 0}/60`;
    $('[data-counter="description"]').textContent = `${state.seo.description?.length || 0}/160`;
    $('#seoPreviewUrl').textContent = (state.seo.canonical || 'https://seudominio.com.br').replace(/^https?:\/\//, '').replace(/\/$/, '');
    $('#seoPreviewTitle').textContent = state.seo.title || 'Título da página';
    $('#seoPreviewDescription').textContent = state.seo.description || 'A descrição aparecerá aqui.';
    for (const [key, id] of [['ogImage','seoPreviewShare'], ['favicon','seoPreviewIcon']]) {
      const el = $('#' + id), source = String(state.seo[key] || '').trim();
      el.style.display = source ? 'block' : 'none';
      if (source) el.src = source;
    }
    const imageSize = (value) => {
      const match = /^data:[^;]+;base64,(.+)$/s.exec(value || '');
      return match ? Math.floor(match[1].length * 3 / 4 - ((match[1].match(/=+$/) || [''])[0].length)) : 0;
    };
    if (imageSize(state.seo.ogImage)) $('#seoShareSize').textContent = `Imagem processada: ${(imageSize(state.seo.ogImage)/1024).toFixed(1)} KB • exportação ./share.${state.seo.ogImage.startsWith('data:image/png') ? 'png' : 'jpg'}`;
    if (imageSize(state.seo.favicon)) $('#seoIconSize').textContent = `SVG preparado: ${(imageSize(state.seo.favicon)/1024).toFixed(1)} KB • exportação ./icon.svg`;
    const sitemapCard = $('#seoSitemapCard');
    const sitemapStatus = $('#seoSitemapStatus');
    const sitemapUrl = $('#seoSitemapUrl');
    const sitemapEnabled = state.seo.sitemapEnabled !== 'no';
    let sitemapTarget = '';
    try {
      const canonical = new URL(String(state.seo.canonical || '').trim());
      if (canonical.protocol === 'https:') {
        const base = new URL(canonical.href);
        if (!base.pathname.endsWith('/')) {
          const tail = base.pathname.split('/').pop() || '';
          if (/\.[a-z0-9]{1,8}$/i.test(tail)) base.pathname = base.pathname.replace(/[^/]*$/, '');
          else base.pathname += '/';
        }
        sitemapTarget = new URL('sitemap.xml', base).href;
      }
    } catch {}
    if (sitemapUrl) sitemapUrl.textContent = sitemapEnabled ? (sitemapTarget || 'Informe uma URL canônica HTTPS válida') : 'sitemap.xml desativado';
    if (sitemapStatus) sitemapStatus.textContent = sitemapEnabled ? (sitemapTarget ? 'Será incluído automaticamente na raiz do ZIP compilado.' : 'A URL canônica é necessária para gerar um sitemap válido.') : 'A geração automática está desativada.';
    sitemapCard?.classList.toggle('is-invalid', sitemapEnabled && !sitemapTarget);
    const checks = seoChecks();
    const score = Math.round(checks.filter(([, ok]) => ok).length / checks.length * 100);
    $('#seoScore').textContent = `${score}%`;
    $('#seoChecklist').innerHTML = checks.map(([label, ok]) => `<div class="check-item ${ok ? 'ok' : ''}">${label}</div>`).join('');
    const metrics = readinessMetrics();
    const avg = metrics.reduce((sum, [, value]) => sum + value, 0) / metrics.length;
    if ($('#readinessAverage')) $('#readinessAverage').textContent = avg.toFixed(1);
    if ($('#readinessMetrics')) $('#readinessMetrics').innerHTML = metrics.map(([label, value]) => `<div class="check-item ${value >= 8 ? 'ok' : ''}"><strong>${label}</strong><span style="margin-left:auto">${value.toFixed(1)}/10</span></div>`).join('');
  }

  function isIconPickerField(field) {
    if (!field) return false;
    if (field.type === 'icon') return true;
    const key = String(field.key || '');
    return field.type === 'text' && /icon$/i.test(key) && !/(?:iconColor|showItemIcons)$/i.test(key);
  }

  function iconPickerMarkup(field, value) {
    const library = window.ImobifyIconLibrary;
    const current = String(value ?? '');
    const normalized = library?.normalize?.(current) || current;
    const options = library?.groups || [];
    const known = library?.flat?.some?.((item) => item.value === normalized);
    const groups = options.map(([group, items]) => `<optgroup label="${catalog.esc(group)}">${items.map(([label, icon]) => `<option value="${catalog.esc(icon)}" ${icon === normalized ? 'selected' : ''}>${catalog.esc(label)} — ${catalog.esc(icon)}</option>`).join('')}</optgroup>`).join('');
    const previewClass = library?.safeClass?.(normalized) || '';
    const preview = previewClass ? `<i class="${catalog.esc(previewClass)}" aria-hidden="true"></i>` : `<span>${catalog.esc(current || '∅')}</span>`;
    return `<div class="inspector-field icon-picker-field"><span>${catalog.esc(field.label)}</span><div class="icon-picker-preview" data-icon-preview>${preview}<code>${catalog.esc(current || 'Nenhum ícone')}</code></div><select class="control icon-picker-select" data-icon-select data-icon-key="${catalog.esc(field.key)}"><option value="">Sem ícone</option>${!known && normalized ? `<option value="${catalog.esc(normalized)}" selected>Atual / personalizado — ${catalog.esc(normalized)}</option>` : ''}${groups}</select><input class="control icon-class-input" data-prop="${catalog.esc(field.key)}" value="${catalog.esc(current)}" placeholder="Ex.: fa-solid fa-house"><small class="field-note">Escolha na biblioteca ou informe manualmente uma classe Font Awesome. Valores antigos como “R$” e “✓” continuam válidos.</small></div>`;
  }

  function computedInspectorValue(field, section) {
    const template = String(field?.template || '');
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => String(section?.props?.[String(key).trim()] ?? ''));
  }

  function inspectorFieldAttrs(field) {
    const attrs = [`data-field-key="${catalog.esc(field?.key || '')}"`];
    if (field?.disabledWhen) attrs.push(`data-disabled-when="${catalog.esc(JSON.stringify(field.disabledWhen))}"`);
    if (field?.hiddenWhen) attrs.push(`data-hidden-when="${catalog.esc(JSON.stringify(field.hiddenWhen))}"`);
    return attrs.join(' ');
  }

  function inspectorField(field, value, section) {
    const safe = catalog.esc(value ?? '');
    const fieldNote = field.note ? `<small class="field-note">${catalog.esc(field.note)}</small>` : '';
    if (field.type === 'computed') {
      const computed = computedInspectorValue(field, section);
      const note = field.note ? `<small class="field-note">${catalog.esc(field.note)}</small>` : '';
      const copy = field.copy ? `<button class="btn" type="button" data-inspector-copy-computed="${catalog.esc(field.key)}">Copiar</button>` : '';
      return `<div class="inspector-field computed-inspector-field" ${inspectorFieldAttrs(field)} data-computed-field="${catalog.esc(field.key)}" data-computed-template="${catalog.esc(field.template || '')}"><span>${catalog.esc(field.label)}</span><div class="computed-inspector-row"><input class="control" type="text" readonly data-computed-output value="${catalog.esc(computed)}" aria-label="${catalog.esc(field.label)}">${copy}</div>${note}</div>`;
    }
    if (isIconPickerField(field)) return iconPickerMarkup(field, value);
    if (field.type === 'benefits-wizard') return `<div class="inspector-field" ${inspectorFieldAttrs(field)}><button type="button" class="btn btn-wide" data-bs-wizard-open>✦ Gerenciar benefícios (adicionar, editar, remover)</button><small class="field-note">Abra o assistente para escolher ícones, escrever títulos, descrições e grupos. As alterações são aplicadas somente ao salvar.</small></div>`;
    if (field.type === 'textarea') return `<label class="inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}</span><textarea class="control" rows="${Math.max(3, Math.min(18, Number(field.rows) || 4))}" data-prop="${field.key}">${safe}</textarea>${fieldNote}</label>`;
    if (field.type === 'toggle') return `<div class="toggle-row" ${inspectorFieldAttrs(field)}><span>${field.label}</span><button class="switch ${value ? 'on' : ''}" data-toggle-prop="${field.key}" aria-label="${field.label}"></button></div>`;
    if (field.type === 'select') {
      const options = window.ImobifyUtil.normalizeSelectOptions(field.options);
      return `<label class="inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}</span><select class="control" data-prop="${field.key}">${options.map((option) => `<option value="${catalog.esc(option.value)}" ${option.value === String(value ?? '') ? 'selected' : ''}>${catalog.esc(option.label)}</option>`).join('')}</select>${fieldNote}</label>`;
    }
    if (['image','video','audio'].includes(field.type)) {
      const isDataUrl = /^data:/i.test(String(value || ''));
      const pathValue = isDataUrl ? '' : safe;
      const cfg = field.type === 'image'
        ? { label:'Clique para trocar a imagem', accept:'image/jpeg,image/png,image/webp,image/gif', aria:'Caminho ou URL da imagem' }
        : field.type === 'video'
          ? { label:'Carregar vídeo', accept:'video/mp4,video/webm,video/quicktime', aria:'URL ou caminho do vídeo' }
          : { label:'Carregar áudio', accept:'audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,.mp3,.ogg,.webm,.m4a,.mp4', aria:'URL ou caminho do áudio' };
      const localHint = isDataUrl ? '<small class="helper media-local-hint">Mídia local carregada. Digite um caminho/URL somente para substituir.</small>' : '';
      return `<div class="inspector-field media-inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}</span><label class="image-drop">${cfg.label}<input type="file" accept="${cfg.accept}" data-media-prop="${field.key}" data-media-kind="${field.type}"></label><input class="control" data-media-path-prop="${field.key}" value="${pathValue}" placeholder="${isDataUrl ? 'Mídia local carregada' : 'Caminho ou URL'}" aria-label="${cfg.aria}">${localHint}${fieldNote}${section?.type === 'benefits-showcase' && field.key === 'backgroundImage' && value ? '<button type="button" class="btn" data-bs-clear-background>Remover imagem de fundo</button>' : ''}</div>`;
    }
    if (field.type === 'color') return `<label class="inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}</span><input class="control color-control" type="color" data-prop="${field.key}" value="${safe || '#000000'}">${fieldNote}</label>`;
    if (field.type === 'range') {
      const valueDisplay = field.showValue ? ` <output data-range-output="${catalog.esc(field.key)}">${safe}${field.unit ? ` ${catalog.esc(field.unit)}` : ''}</output>` : '';
      return `<label class="inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}${valueDisplay}</span><input class="control" type="range" min="${field.min ?? 0}" max="${field.max ?? 100}" step="${field.step ?? 1}" data-prop="${field.key}" data-range-unit="${catalog.esc(field.unit || '')}" value="${safe}">${fieldNote}</label>`;
    }
    if (field.type === 'number') return `<label class="inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}</span><input class="control" type="number" min="${field.min ?? ''}" max="${field.max ?? ''}" step="${field.step ?? 1}" data-prop="${field.key}" value="${safe}">${fieldNote}</label>`;
    return `<label class="inspector-field" ${inspectorFieldAttrs(field)}><span>${field.label}</span><input class="control" type="${field.type === 'url' ? 'url' : 'text'}" data-prop="${field.key}" value="${safe}">${fieldNote}</label>`;
  }

  function syncInspectorComputedFields(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return;
    $$('#inspectorContent [data-computed-field]').forEach((wrapper) => {
      const plugin = catalog.plugins[section.type];
      const field = plugin?.fields?.find((item) => item.key === wrapper.dataset.computedField);
      const output = wrapper.querySelector('[data-computed-output]');
      if (field && output) output.value = computedInspectorValue(field, section);
    });
  }

  function evaluateInspectorRule(rule, props = {}) {
    if (!rule || !rule.field) return false;
    const value = props?.[String(rule.field)] ;
    if (Object.prototype.hasOwnProperty.call(rule, 'equals')) return String(value ?? '') === String(rule.equals ?? '');
    if (Object.prototype.hasOwnProperty.call(rule, 'notEquals')) return String(value ?? '') !== String(rule.notEquals ?? '');
    if (Array.isArray(rule.in)) return rule.in.map((item) => String(item)).includes(String(value ?? ''));
    if (Array.isArray(rule.notIn)) return !rule.notIn.map((item) => String(item)).includes(String(value ?? ''));
    if (rule.truthy === true) return Boolean(value);
    if (rule.falsy === true) return !value;
    return false;
  }

  function syncInspectorDynamicFields(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return;
    $$('#inspectorContent [data-field-key]').forEach((wrapper) => {
      let disabledRule = null;
      let hiddenRule = null;
      try { disabledRule = wrapper.dataset.disabledWhen ? JSON.parse(wrapper.dataset.disabledWhen) : null; } catch {}
      try { hiddenRule = wrapper.dataset.hiddenWhen ? JSON.parse(wrapper.dataset.hiddenWhen) : null; } catch {}
      const disable = evaluateInspectorRule(disabledRule, section.props || {});
      const hide = evaluateInspectorRule(hiddenRule, section.props || {});
      wrapper.hidden = hide;
      wrapper.classList.toggle('is-disabled', disable);
      wrapper.querySelectorAll('input, textarea, select, button').forEach((control) => {
        if (control.hasAttribute('data-computed-output')) return;
        control.disabled = disable;
      });
    });
  }

  function pluginOptionLabel(plugin, fieldKey, value) {
    const field = plugin?.fields?.find((item) => item.key === fieldKey);
    const option = field?.options?.find((item) => String(item?.value ?? item) === String(value ?? ''));
    return option ? String(option?.label ?? option?.value ?? option) : String(value ?? '');
  }

  function floatingHelpSnapshot(section) {
    const plugin = catalog.plugins[section?.type];
    const layoutMeta = buildSectionLayoutMeta();
    const meta = layoutMeta.get(section?.id) || { childCount:0 };
    const guide = plugin?.manifest?.inspectorGuide || {};
    const childCountField = guide.childCountField || 'itemCount';
    const requested = Math.max(0, Math.min(Number(plugin?.manifest?.layout?.maxChildren) || 12, Number(section?.props?.[childCountField]) || 0));
    const children = state.sections.filter((item) => layoutMeta.get(item.id)?.parentId === section?.id);
    const targetField = guide.targetField || plugin?.manifest?.instanceIdField || 'panelId';
    const targetPrefix = String(guide.targetPrefix ?? '#');
    const publicId = String(section?.props?.[targetField] || section?.id || '').trim().replace(/^#/, '');
    const modeFields = guide.modes || {};
    const modes = {
      desktop: pluginOptionLabel(plugin, modeFields.desktop || 'displayMode', section?.props?.[modeFields.desktop || 'displayMode']),
      mobile: pluginOptionLabel(plugin, modeFields.mobile || 'mobileMode', section?.props?.[modeFields.mobile || 'mobileMode'])
    };
    const columnFields = guide.columns || {};
    return {
      section,
      plugin,
      publicId,
      target:`${targetPrefix}${publicId}`,
      requested,
      captured:Number(meta.childCount) || children.length,
      children,
      columns:{
        desktop:Number(section?.props?.[columnFields.desktop || 'columns']) || 1,
        tablet:Number(section?.props?.[columnFields.tablet || 'tabletColumns']) || 1,
        mobile:Number(section?.props?.[columnFields.mobile || 'mobileColumns']) || 1
      },
      modes,
      snippets:{ href:`${targetPrefix}${publicId}` }
    };
  }

  function floatingHelpCard(title, code, copyKey, primary = false) {
    return `<div class="floating-help-card"><div class="floating-help-card-head"><strong>${catalog.esc(title)}</strong><button class="btn" type="button" data-floating-help-copy="${copyKey}">Copiar</button></div><code class="floating-help-code ${primary ? 'floating-help-primary-code' : ''}" data-floating-help-code="${copyKey}">${catalog.esc(code)}</code></div>`;
  }

  function renderFloatingHelp(section) {
    const content = $('#floatingHelpContent');
    const guide = section ? catalog.plugins[section.type]?.manifest?.inspectorGuide : null;
    if (!content || !section || !guide?.enabled || guide?.kind !== 'href-container') return;
    const info = floatingHelpSnapshot(section);
    const childRows = info.children.length ? info.children.map((child, index) => {
      const childPlugin = catalog.plugins[child.type];
      const childMeta = buildSectionLayoutMeta().get(child.id);
      const nested = Math.max(0, Number(childMeta?.childCount) || 0);
      return `<div class="floating-help-child"><span class="floating-help-child-index">${index + 1}</span><span><strong>${catalog.esc(childPlugin?.name || child.type)}</strong><small>${catalog.esc(child.type)}${nested ? ` · contém ${nested} subitem${nested === 1 ? '' : 's'}` : ''}</small></span><span class="floating-help-badge">dentro do container</span></div>`;
    }).join('') : '<div class="floating-help-warning">Nenhum item está sendo capturado agora. Aumente “Quantidade de itens internos” e mantenha os componentes desejados logo abaixo deste container na lista Estrutura.</div>';
    const missing = Math.max(0, info.requested - info.captured);
    const status = missing
      ? `<div class="floating-help-warning">O container pede ${info.requested} item${info.requested === 1 ? '' : 's'}, mas encontrou ${info.captured}. Faltam ${missing} bloco${missing === 1 ? '' : 's'} abaixo dele na Estrutura.</div>`
      : `<div class="floating-help-ok">Estrutura coerente: ${info.captured} de ${info.requested} item${info.requested === 1 ? '' : 's'} configurado${info.requested === 1 ? '' : 's'} ${info.captured === 1 ? 'está' : 'estão'} dentro do container.</div>`;

    content.dataset.floatingHelpSectionId = section.id;
    content.innerHTML = `
      <div class="floating-help-summary">
        <div class="floating-help-stat"><small>ID de chamada</small><strong title="${catalog.esc(info.target)}">${catalog.esc(info.target)}</strong></div>
        <div class="floating-help-stat"><small>Itens internos</small><strong>${info.captured} / ${info.requested}</strong></div>
        <div class="floating-help-stat"><small>Grid D / T / M</small><strong>${info.columns.desktop} / ${info.columns.tablet} / ${info.columns.mobile}</strong></div>
        <div class="floating-help-stat"><small>Modo atual</small><strong title="${catalog.esc(`${info.modes.desktop} · ${info.modes.mobile}`)}">${catalog.esc(info.modes.desktop)}</strong></div>
      </div>

      <section class="floating-help-section">
        <h3>1. Cole somente no HREF do botão</h3>
        <p>Este é o uso oficial no Imobify. Abra o inspetor de qualquer botão e cole exatamente o valor abaixo no campo <strong>HREF / Destino do CTA</strong>. O framework reconhece o ID e abre o container automaticamente.</p>
        <div class="floating-help-call-grid">
          ${floatingHelpCard('HREF do botão', info.snippets.href, 'href', true)}
        </div>
        <div class="floating-help-ok">Não use <code>javascript:</code>, não adicione atributos extras e não precisa escrever <code>window.ImobifyFloating.open()</code>.</div>
      </section>

      <section class="floating-help-section">
        <h3>2. Conteúdo que está dentro deste container</h3>
        <p>O Floating Container funciona como uma section composta. Ele captura os próximos blocos lógicos da Estrutura conforme “Quantidade de itens internos”. Containers filhos continuam sendo tratados como um bloco lógico único.</p>
        <div class="floating-help-children">${childRows}</div>
        <div style="margin-top:8px">${status}</div>
      </section>

      <section class="floating-help-section">
        <h3>3. Layout responsivo atual</h3>
        <p>Desktop: <strong>${catalog.esc(info.modes.desktop)}</strong> com ${info.columns.desktop} coluna${info.columns.desktop === 1 ? '' : 's'}. Tablet: ${info.columns.tablet}. Mobile: <strong>${catalog.esc(info.modes.mobile)}</strong> com ${info.columns.mobile} coluna${info.columns.mobile === 1 ? '' : 's'}.</p>
        <ol class="floating-help-steps">
          <li>Arraste os componentes que devem ficar dentro da caixa para logo abaixo do Floating Container na <strong>Estrutura</strong>.</li>
          <li>Ajuste <strong>Quantidade de itens internos</strong> para corresponder aos blocos que deseja capturar.</li>
          <li>Configure as colunas de desktop, tablet e mobile no grupo <strong>Conteúdo interno</strong>.</li>
          <li>Em qualquer CTA, informe <code>${catalog.esc(info.target)}</code>. Não precisa criar código adicional.</li>
        </ol>
      </section>`;
  }

  function openFloatingHelp(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    const guide = section ? catalog.plugins[section.type]?.manifest?.inspectorGuide : null;
    if (!section || !guide?.enabled || guide?.kind !== 'href-container') return;
    renderFloatingHelp(section);
    const dialog = $('#floatingHelpDialog');
    if (dialog && !dialog.open) dialog.showModal();
  }

  const heroPlusPresetValues = {
    popular:{ typographyPreset:'popular', titleFont:'preset', titleSize:86, titleWeight:850, titleLineHeight:.98, titleLetterSpacing:-.04, subtitleSize:19, ribbonSize:11, titleAnimation:'words-rise', bgMotion:'pan-left', motionIntensity:28, overlayOpacity:62, vignette:34, ctaEffect:'shine' },
    contemporary:{ typographyPreset:'contemporary', titleFont:'preset', titleSize:94, titleWeight:780, titleLineHeight:.95, titleLetterSpacing:-.05, subtitleSize:20, ribbonSize:11.5, titleAnimation:'words-rise', bgMotion:'ken-burns', motionIntensity:34, overlayOpacity:56, vignette:38, ctaEffect:'shine' },
    luxury:{ typographyPreset:'luxury', titleFont:'preset', titleSize:108, titleWeight:600, titleLineHeight:.92, titleLetterSpacing:-.025, subtitleSize:19, ribbonSize:10.5, titleAnimation:'blur-in', bgMotion:'perspective', motionIntensity:22, overlayOpacity:48, vignette:46, ctaEffect:'glow' },
    editorial:{ typographyPreset:'editorial', titleFont:'preset', titleSize:116, titleWeight:650, titleLineHeight:.9, titleLetterSpacing:-.035, subtitleSize:18, ribbonSize:10, titleAnimation:'mask-slide', bgMotion:'drift', motionIntensity:24, overlayOpacity:52, vignette:44, ctaEffect:'none' },
    architectural:{ typographyPreset:'architectural', titleFont:'preset', titleSize:100, titleWeight:650, titleLineHeight:.94, titleLetterSpacing:-.03, subtitleSize:19, ribbonSize:10.5, titleAnimation:'tracking-in', bgMotion:'pan-right', motionIntensity:25, overlayOpacity:54, vignette:40, ctaEffect:'glow' }
  };

  function renderHeroPlusStudio(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    const plugin = section ? catalog.plugins[section.type] : null;
    const root = $('#heroPlusStudioContent');
    if (!root) return;
    if (!section || section.type !== 'hero-plus' || !plugin) {
      root.innerHTML = '<div class="info-card"><strong>Hero Plus não selecionado</strong><p>Selecione uma instância do Hero Imobiliário Plus para acessar os controles avançados.</p></div>';
      return;
    }
    const advanced = plugin.fields.filter((item) => item.panel === 'advanced');
    const groups = [...new Set(advanced.map((item) => item.group))];
    root.dataset.sectionId = section.id;
    root.innerHTML = `<div class="hero-plus-studio-intro"><div><strong>Direção visual em camadas</strong><p>Use os presets como ponto de partida e refine cada camada. O Hero original permanece independente; estes ajustes pertencem somente a esta instância Plus.</p></div><div class="hero-plus-preset-row"><button class="btn" data-hp-studio-preset="popular">Popular premium</button><button class="btn" data-hp-studio-preset="contemporary">Contemporâneo</button><button class="btn" data-hp-studio-preset="luxury">Luxury</button><button class="btn" data-hp-studio-preset="editorial">Editorial</button><button class="btn" data-hp-studio-preset="architectural">Arquitetônico</button></div></div><div class="hero-plus-studio-grid">${groups.map((group) => `<section class="hero-plus-studio-group"><h3>${catalog.esc(group)}</h3><div class="hero-plus-studio-fields">${advanced.filter((item) => item.group === group).map((field) => inspectorField(field, section.props[field.key], section)).join('')}</div></section>`).join('')}</div>`;
  }

  function openHeroPlusStudio(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section || section.type !== 'hero-plus') return;
    renderHeroPlusStudio(sectionId);
    const dialog = $('#heroPlusStudioDialog');
    if (dialog && !dialog.open) dialog.showModal();
  }

  async function copyEditorText(text) {
    const value = String(text ?? '');
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        textarea.remove();
        if (!ok) throw new Error('copy command unavailable');
      }
      toast('Exemplo copiado.');
      return true;
    } catch (error) {
      console.warn('Não foi possível copiar automaticamente.', error);
      toast('Selecione o exemplo e copie manualmente.', 'error');
      return false;
    }
  }

  const sectionStyleFonts = ['Manrope','Inter','DM Sans','Playfair Display','Montserrat','Josefin Sans','Source Sans 3','Bodoni Moda','Roboto Serif','Plus Jakarta Sans','Outfit','Sora','Urbanist','Poppins','Lato','Nunito Sans','Work Sans','Raleway','Archivo','Barlow','Barlow Condensed','Roboto','Roboto Slab','Merriweather','Lora','Cormorant Garamond','Libre Baskerville','DM Serif Display','Cinzel','Space Grotesk','IBM Plex Sans','IBM Plex Serif','Figtree','Public Sans'];

  function styleSelect(label, key, value, options, note = '') {
    return `<label class="inspector-field section-style-field"><span>${catalog.esc(label)}</span><select class="control" data-section-style="${catalog.esc(key)}">${options.map(([optionValue, optionLabel]) => `<option value="${catalog.esc(optionValue)}" ${String(value ?? '') === String(optionValue) ? 'selected' : ''}>${catalog.esc(optionLabel)}</option>`).join('')}</select>${note ? `<small class="field-note">${catalog.esc(note)}</small>` : ''}</label>`;
  }

  function styleColor(label, key, value, note = '') {
    const safe = /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#000000';
    return `<label class="inspector-field section-style-field"><span>${catalog.esc(label)}</span><input class="control color-control" type="color" data-section-style="${catalog.esc(key)}" value="${catalog.esc(safe)}">${note ? `<small class="field-note">${catalog.esc(note)}</small>` : ''}</label>`;
  }

  function styleRange(label, key, value, min, max, step = 1, note = '') {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
    return `<label class="inspector-field section-style-field"><span>${catalog.esc(label)} <output data-section-style-output="${catalog.esc(key)}">${catalog.esc(numeric)}</output></span><input class="control" type="range" min="${min}" max="${max}" step="${step}" data-section-style="${catalog.esc(key)}" value="${catalog.esc(numeric)}">${note ? `<small class="field-note">${catalog.esc(note)}</small>` : ''}</label>`;
  }

  function renderSectionBackgroundInspector(section) {
    const bg = { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(section.settings?.background || {}) };
    const enabled = bg.enabled === true;
    const isImage = bg.type === 'image';
    const gradient = bg.colorMode === 'gradient';
    const dataImage = /^data:image\//i.test(bg.image || '');
    return `<div class="inspector-group section-background-inspector ${enabled ? 'is-enabled' : ''}">
      <div class="section-background-heading"><div><h3>Fundo da seção</h3><small>Personalize o fundo de todo este plugin, sem mudar o conteúdo interno.</small></div>
        <button type="button" class="switch ${enabled ? 'on' : ''}" data-section-background-toggle aria-label="${enabled ? 'Desativar' : 'Ativar'} fundo personalizado" aria-pressed="${enabled}"></button></div>
      ${enabled ? `<div class="section-background-controls">
        ${styleSelect('Tipo de fundo','type',bg.type,[['color','Cor'],['image','Imagem']]).replaceAll('data-section-style=', 'data-section-background=')}
        ${isImage ? `
          ${styleSelect('Comportamento da imagem','imageMode',bg.imageMode,[['static','Estática · acompanha a seção'],['fixed','Fixa · acompanha a rolagem'],['repeat','Repeat · repete o padrão']]).replaceAll('data-section-style=', 'data-section-background=')}
          <div class="inspector-field media-inspector-field"><span>Imagem do fundo</span>
            <label class="image-drop">Escolher imagem <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" data-section-background-file></label>
            <input type="text" class="control" data-section-background="image" value="${dataImage ? '' : catalog.esc(bg.image || '')}" placeholder="Caminho ou URL da imagem" aria-label="Caminho ou URL da imagem de fundo">
            ${dataImage ? '<small class="field-note">Imagem local carregada (incluída na exportação).</small>' : '<small class="field-note">Use um arquivo local ou um endereço HTTPS. Para padrões, selecione Repeat.</small>'}
            ${bg.image ? '<button type="button" class="btn" data-section-background-clear>Remover imagem</button>' : ''}
          </div>` : `
          ${styleSelect('Estilo de cor','colorMode',bg.colorMode,[['solid','Sólida'],['gradient','Gradiente linear']]).replaceAll('data-section-style=', 'data-section-background=')}
          <div class="section-style-grid">${styleColor(gradient ? 'Cor inicial' : 'Cor do fundo','color1',bg.color1).replaceAll('data-section-style=', 'data-section-background=')}
          ${gradient ? styleColor('Cor final','color2',bg.color2).replaceAll('data-section-style=', 'data-section-background=') : ''}</div>
          ${gradient ? styleRange('Ângulo do gradiente','angle',bg.angle,0,360,1).replaceAll('data-section-style=', 'data-section-background=').replaceAll('data-section-style-output=', 'data-section-background-output=') : ''}`}
        <button type="button" class="btn section-background-reset" data-section-background-reset>Restaurar fundo original</button>
      </div>` : '<small class="section-background-hint">Desativado · o plugin mantém o fundo original.</small>'}
    </div>`;
  }

  function renderSectionStyleInspector(section) {
    const style = { ...(catalog.sectionStyleDefaults?.() || {}), ...(section.settings?.style || {}) };
    const enabled = style.enabled === true;
    const panelOpen = enabled && style.panelOpen !== false;
    const colorModesHeading = [['auto','Automático pelo fundo'],['inherit','Herdar sem forçar'],['heading','Global · títulos'],['inverse','Global · títulos claros'],['primary','Primária da seção'],['accent','Destaque da seção'],['custom','Personalizada']];
    const colorModesBody = [['auto','Automático pelo fundo'],['inherit','Herdar sem forçar'],['body','Global · texto'],['inverse','Global · texto claro'],['primary','Primária da seção'],['accent','Destaque da seção'],['custom','Personalizada']];
    const eyebrowModes = [['auto','Automático'],['inherit','Herdar sem forçar'],['primary','Primária da seção'],['accent','Destaque da seção'],['heading','Global · títulos'],['inverse','Global · claro'],['custom','Personalizada']];
    const fontOptions = [['inherit','Herdar fonte global'], ...sectionStyleFonts.map((font) => [font,font])];
    const actionBackgroundModes = [['auto','Automático · acompanha primária local'],['inherit','Herdar Button Kit global'],['primary','Primária da seção'],['accent','Destaque da seção'],['custom','Cor personalizada']];
    const actionTextModes = [['auto','Contraste automático'],['inherit','Herdar texto do Button Kit'],['heading','Global/local · títulos'],['body','Global/local · texto'],['custom','Cor personalizada']];
    return `<div class="inspector-group section-style-inspector ${enabled ? 'is-enabled' : 'is-disabled'} ${panelOpen ? 'is-open' : 'is-collapsed'}">
      <div class="section-style-heading">
        <div><h3>Estilo do elemento</h3><small>Por padrão este plugin herda o projeto. Ative para criar uma exceção visual somente neste elemento.</small></div>
        <div class="section-style-heading-actions">${enabled ? `<button class="section-style-collapse" type="button" data-section-style-panel-toggle aria-label="${panelOpen ? 'Recolher' : 'Expandir'} personalização" title="${panelOpen ? 'Recolher' : 'Expandir'}">${panelOpen ? '⌃' : '⌄'}</button>` : ''}<button class="switch ${enabled ? 'on' : ''}" type="button" data-section-style-toggle="enabled" aria-label="Personalizar este elemento"></button></div>
      </div>
      <div class="section-style-status"><strong>${enabled ? (panelOpen ? 'Personalização ativa' : 'Personalização ativa · recolhida') : 'Usando padrão herdado'}</strong><span>${enabled ? 'As regras locais têm prioridade sobre o CSS interno do plugin.' : 'Ative para abrir os controles. Enquanto estiver desligado, nenhuma opção local ocupa espaço.'}</span></div>
      <div class="section-style-controls" ${panelOpen ? '' : 'hidden'}>
        <h4>Fundo e paleta</h4>
        ${styleSelect('Fundo do elemento','backgroundMode',style.backgroundMode,[['inherit','Herdar do componente'],['surface','Global · superfície'],['dark','Global · escuro'],['primary','Global/local · primária'],['accent','Global/local · destaque'],['custom','Cor personalizada'],['gradient','Gradiente personalizado']],'A personalização local é aplicada depois do CSS do plugin e tem prioridade.')}
        <div class="section-style-grid">${styleColor('Cor personalizada A','backgroundColor',style.backgroundColor)}${styleColor('Cor personalizada B','backgroundColor2',style.backgroundColor2)}</div>
        ${styleRange('Ângulo do gradiente','gradientAngle',style.gradientAngle,0,360,1)}
        <div class="section-style-grid">
          ${styleSelect('Primária local','primaryMode',style.primaryMode,[['inherit','Usar global'],['custom','Personalizar']])}
          ${styleColor('Cor primária local','primaryColor',style.primaryColor)}
          ${styleSelect('Destaque local','accentMode',style.accentMode,[['inherit','Usar global'],['custom','Personalizar']])}
          ${styleColor('Cor de destaque local','accentColor',style.accentColor)}
        </div>
        <h4>Botões e ações</h4>
        ${styleSelect('Fundo dos CTAs','actionBackgroundMode',style.actionBackgroundMode,actionBackgroundModes,'No modo Automático, uma primária local personalizada passa a alimentar os CTAs deste plugin.')}
        <div class="section-style-grid">
          ${styleColor('Fundo personalizado','actionBackgroundColor',style.actionBackgroundColor)}
          ${styleSelect('Texto dos CTAs','actionTextMode',style.actionTextMode,actionTextModes)}
          ${styleColor('Texto personalizado','actionTextColor',style.actionTextColor)}
        </div>
        <h4>Texto por elemento</h4>
        <div class="section-style-grid">
          ${styleSelect('Cor dos títulos','headingColorMode',style.headingColorMode,colorModesHeading)}
          ${styleColor('Título personalizado','headingColor',style.headingColor)}
          ${styleSelect('Cor do corpo','bodyColorMode',style.bodyColorMode,colorModesBody)}
          ${styleColor('Texto personalizado','bodyColor',style.bodyColor)}
          ${styleSelect('Cor do eyebrow','eyebrowColorMode',style.eyebrowColorMode,eyebrowModes)}
          ${styleColor('Eyebrow personalizado','eyebrowColor',style.eyebrowColor)}
        </div>
        <h4>Tipografia local</h4>
        <div class="section-style-grid">
          ${styleSelect('Fonte dos títulos','headingFont',style.headingFont,fontOptions)}
          ${styleSelect('Fonte dos textos','bodyFont',style.bodyFont,fontOptions)}
          ${styleSelect('Peso dos títulos','headingWeight',style.headingWeight,[['inherit','Herdar global'],['500','500'],['600','600'],['700','700'],['800','800'],['900','900']])}
          ${styleSelect('Tracking dos títulos','headingTracking',style.headingTracking,[['inherit','Herdar global'],['-0.06','-0.06em · compacto'],['-0.04','-0.04em'],['-0.02','-0.02em'],['0','0'],['0.02','0.02em · aberto']])}
          ${styleSelect('Tamanho do corpo','bodySize',style.bodySize,[['inherit','Herdar global'],['14','14 px'],['15','15 px'],['16','16 px'],['17','17 px'],['18','18 px'],['20','20 px']])}
          ${styleSelect('Entrelinha do corpo','bodyLineHeight',style.bodyLineHeight,[['inherit','Herdar global'],['1.4','1.40'],['1.5','1.50'],['1.6','1.60'],['1.7','1.70'],['1.8','1.80']])}
        </div>
        <h4>Texto e posicionamento</h4>
        <small class="field-note" style="display:block;margin:-4px 0 10px;font-size:11px;line-height:1.45;color:var(--muted)">Vale para títulos, chamada superior, subtítulos e textos desta seção, no desktop e no celular. Com centro ou direita, a caixa do texto também se desloca.</small>
        <div class="section-style-grid">
          ${styleSelect('Alinhamento dos títulos','headingAlign',style.headingAlign,[['inherit','Herdar do componente'],['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']])}
          ${styleSelect('Alinhamento dos títulos · mobile','headingAlignMobile',style.headingAlignMobile,[['inherit','Igual ao desktop / componente'],['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']])}
          ${styleSelect('Alinhamento do corpo','bodyAlign',style.bodyAlign,[['inherit','Herdar do componente'],['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']])}
          ${styleSelect('Alinhamento do corpo · mobile','bodyAlignMobile',style.bodyAlignMobile,[['inherit','Igual ao desktop / componente'],['left','Esquerda'],['center','Centro'],['right','Direita'],['justify','Justificado']])}
          ${styleSelect('Chamada superior','eyebrowAlign',style.eyebrowAlign || 'heading',[['heading','Seguir o título'],['inherit','Do componente'],['left','Esquerda'],['center','Centro'],['right','Direita']])}
          ${styleSelect('Posição do bloco de texto','blockPosition',style.blockPosition || 'auto',[['auto','Automática'],['component','Do componente']])}
          ${styleSelect('Largura de leitura do corpo','textMeasure',style.textMeasure || 'inherit',[['inherit','Do componente'],['45','45 caracteres'],['55','55 caracteres'],['65','65 · ideal'],['75','75 caracteres'],['none','Livre']])}
          ${styleSelect('Hifenização no justificado','justifyHyphens',style.justifyHyphens || 'auto',[['auto','Automática'],['none','Desligada']])}
          ${styleSelect('Quebra de linha do corpo','bodyLineFit',style.bodyLineFit,[['inherit','Do componente'],['normal','Normal'],['editorial','Editorial · sem hífen'],['balanced','Balanceado · recomendado']])}
        </div>
        <small class="field-note" style="display:block;margin:6px 0 4px;font-size:11px;line-height:1.45;color:var(--muted)">Boas práticas: corpo entre 45 e 75 caracteres por linha. Justificado só em blocos de texto, com hifenização; títulos no celular, prefira Esquerda. Títulos nunca são hifenizados.</small>
        <h4>Efeitos de texto</h4>
        <div class="section-style-grid">
          ${styleSelect('Efeito nos títulos','titleEffect',style.titleEffect,[['inherit','Herdar global'],['none','Sem efeito'],['soft','Sombra suave'],['contrast','Contraste'],['cinematic','Cinematográfico'],['glow','Glow']])}
          ${styleColor('Cor do efeito do título','titleEffectColor',style.titleEffectColor)}
          ${styleSelect('Efeito no corpo','bodyEffect',style.bodyEffect,[['inherit','Herdar global'],['none','Sem efeito'],['soft','Sombra suave'],['contrast','Contraste'],['glow','Glow']])}
          ${styleColor('Cor do efeito do corpo','bodyEffectColor',style.bodyEffectColor)}
        </div>
        ${styleRange('Força do efeito do título','titleEffectStrength',style.titleEffectStrength,0,100,1)}
        ${styleRange('Força do efeito do corpo','bodyEffectStrength',style.bodyEffectStrength,0,100,1)}
        <h4>Ajuste fino do elemento</h4>
        ${styleSelect('Espaçamento vertical','paddingMode',style.paddingMode,[['inherit','Herdar do componente'],['custom','Personalizar']])}
        <div class="section-style-grid">${styleRange('Espaço superior','paddingTop',style.paddingTop,0,240,4)}${styleRange('Espaço inferior','paddingBottom',style.paddingBottom,0,240,4)}</div>
        <button class="btn btn-wide" type="button" data-section-style-reset>Restaurar estilo local</button>
      </div>
    </div>`;
  }

  function parallaxNumber(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function parallaxClamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parallaxTime(value) {
    return String(Math.round(parallaxNumber(value, 0) * 1000) / 1000);
  }

  function parseParallaxPauses(raw) {
    return String(raw || '').split(/\n|,/).map((line) => {
      const [at, duration] = line.trim().split(':').map(Number);
      return Number.isFinite(at) && Number.isFinite(duration) && duration > 0 ? { at, duration } : null;
    }).filter(Boolean).sort((a, b) => a.at - b.at);
  }

  function serializeParallaxPauses(items) {
    return items.slice().sort((a, b) => a.at - b.at).map((item) => `${parallaxTime(item.at)}:${parallaxTime(item.duration)}`).join('\n');
  }

  function parseParallaxBanners(raw) {
    try {
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function parallaxBannerDefaults(at, index = 0) {
    return {
      id:`banner-${index + 1}`, enabled:true, cinematicStop:true, movementLocked:true, releaseScroll:false,
      startTime:at, endTime:at + 4, transitionMs:0, decelMs:0,
      position:'center', eyebrow:'', title:`Novo banner ${index + 1}`, subtitle:'', text:'', image:'', imageAlt:'', icon:'',
      buttonText:'', buttonLink:'', animation:'fade-up', width:620, opacity:1, align:'center', hideOnMobile:false,
      fontFamily:'', titleFontFamily:'', textFontFamily:'', eyebrowFontFamily:'', titleTransform:'none', textTransform:'none',
      narrationAudio:'', narrationEnabled:false, narrationDelay:2, narrationVolume:100, narrationLoop:false, boomerang:false, boomerangAtTime:at, boomerangSpan:1.5, boomerangDuration:3, boomerangCycles:2
    };
  }

  function parallaxMovementLocked(point) {
    /* Segurança do Studio: chaves antigas sem a propriedade também iniciam
       bloqueadas. O movimento só é habilitado por ação explícita no cadeado. */
    return point?.movementLocked !== false;
  }

  function parallaxTimelineBounds(section) {
    const props = section?.props || {};
    const pauses = parseParallaxPauses(props.pausePoints);
    const rawBanners = parseParallaxBanners(props.heroPoints);
    const detectedDuration = parallaxNumber(props.videoDuration, 0);
    const known = [parallaxNumber(props.endTime, 0), ...pauses.map((p) => p.at), ...rawBanners.map((p) => parallaxNumber(p.startTime, 0)), ...rawBanners.map((p) => parallaxNumber(p.endTime, 0))];
    const duration = detectedDuration > 0.1 ? detectedDuration : Math.max(0.1, ...known, 30);
    const start = parallaxClamp(parallaxNumber(props.startTime, 0), 0, Math.max(0, duration - 0.01));
    const end = parallaxClamp(parallaxNumber(props.endTime, duration), Math.min(duration, start + 0.01), duration);
    const step = parallaxStep(section);
    const banners = rawBanners.filter((point) => parallaxNumber(point?.startTime, start) > start + step * 0.55);
    return { start, end, duration, pauses, banners };
  }

  function parallaxMarkerLeft(time, duration) {
    return `${parallaxClamp((parallaxNumber(time, 0) / Math.max(0.1, duration)) * 100, 0, 100).toFixed(3)}%`;
  }

  function parallaxStep(section) {
    const fps = Math.max(1, parallaxNumber(section?.props?.timelineFps, 30));
    return section?.props?.timelineSnap === false || String(section?.props?.timelineSnap).toLowerCase() === 'false' ? 0.01 : 1 / fps;
  }

  function parallaxSnapTime(section, value, duration = parallaxTimelineBounds(section).duration) {
    const step = parallaxStep(section);
    const raw = parallaxClamp(parallaxNumber(value, 0), 0, Math.max(0, duration));
    return parallaxClamp(Math.round(raw / step) * step, 0, Math.max(0, duration));
  }

  function parallaxTimelineTickStep(duration) {
    const target = Math.max(1, duration / 9);
    const candidates = [0.25,0.5,1,2,5,10,15,20,30,60,120,300,600];
    return candidates.find((value) => value >= target) || Math.max(1, Math.ceil(target / 600) * 600);
  }

  function parallaxTimelineTicks(duration) {
    const step = parallaxTimelineTickStep(duration);
    const ticks = [];
    for (let time = 0; time <= duration + step * 0.05; time += step) {
      const at = Math.min(duration, time);
      const endClass = Math.abs(at - duration) < 0.0005 ? ' is-end' : '';
      ticks.push(`<span class="parallax-tick${endClass}" style="left:${parallaxMarkerLeft(at,duration)}"><i></i><b>${parallaxTime(at)}s</b></span>`);
      if (at >= duration) break;
    }
    if (!ticks.length || !ticks[ticks.length - 1].includes(`>${parallaxTime(duration)}s<`)) {
      ticks.push(`<span class="parallax-tick is-end" style="left:100%"><i></i><b>${parallaxTime(duration)}s</b></span>`);
    }
    return ticks.join('');
  }

  function parallaxReleaseFloor(section, banners = parseParallaxBanners(section?.props?.heroPoints), duration = parallaxTimelineBounds(section).duration) {
    const step = parallaxStep(section);
    const lastKey = banners.reduce((max, point) => Math.max(max, parallaxNumber(point?.startTime, 0)), parallaxNumber(section?.props?.startTime, 0));
    return parallaxClamp(lastKey + step, 0, duration);
  }

  function parallaxFreeKeyTime(section, desired, skipId = '') {
    const bounds = parallaxTimelineBounds(section);
    const step = parallaxStep(section);
    /* IN e LIBERAR são limites da timeline, nunca banners. */
    const minKey = Math.min(bounds.end - step, bounds.start + step);
    const maxKey = Math.max(minKey, bounds.end - step);
    const occupied = bounds.banners
      .filter((point) => String(point?.id || '') !== String(skipId || ''))
      .map((point) => parallaxNumber(point?.startTime, minKey));
    const isFree = (time) => occupied.every((other) => Math.abs(other - time) >= step * 0.8);
    const base = parallaxClamp(parallaxSnapTime(section, desired, bounds.duration), minKey, maxKey);
    if (isFree(base)) return base;
    const span = Math.max(1, Math.ceil((maxKey - minKey) / step));
    for (let offset = 1; offset <= span; offset += 1) {
      const forward = parallaxSnapTime(section, base + offset * step, bounds.duration);
      if (forward <= maxKey && isFree(forward)) return forward;
      const backward = parallaxSnapTime(section, base - offset * step, bounds.duration);
      if (backward >= minKey && isFree(backward)) return backward;
    }
    return base;
  }

  function parallaxPreviewTime(sectionId, time) {
    const payload = { type:'parallax-preview-time', sectionId, time:parallaxNumber(time, 0) };
    [$('#previewFrame'), $('#fullPreviewFrame')].forEach((frame) => {
      try { frame?.contentWindow?.postMessage(payload, '*'); } catch {}
    });
  }

  function parallaxSelectedBanner(section, banners) {
    const selectedId = parallaxEditorSelection.get(section.id);
    if (!selectedId) return { point:null, index:-1 };
    const index = banners.findIndex((point) => String(point?.id || '') === String(selectedId));
    if (index < 0) { parallaxEditorSelection.delete(section.id); return { point:null, index:-1 }; }
    return { point:banners[index], index };
  }

  function addParallaxKeyAt(section, desiredTime) {
    if (!section || section.type !== 'parallax') return;
    const bounds = parallaxTimelineBounds(section);
    const at = parallaxFreeKeyTime(section, desiredTime);
    const existing = parseParallaxBanners(section.props.heroPoints);
    const ids = new Set(existing.map((item) => String(item?.id || '')));
    let sequence = existing.length + 1;
    let id = `banner-${sequence}`;
    while (ids.has(id)) id = `banner-${++sequence}`;
    const next = { ...parallaxBannerDefaults(at, existing.length), id, startTime:at, endTime:Math.min(bounds.end, at + 4), boomerangAtTime:at, cinematicStop:true, enabled:true, decelMs:0 };
    parallaxEditorSelection.set(section.id, id);
    parallaxEditorPlayheads.set(section.id, at);
    commit((draft) => {
      const target = draft.sections.find((item) => item.id === section.id);
      if (!target || target.type !== 'parallax') return;
      const items = parseParallaxBanners(target.props.heroPoints);
      items.push(next);
      items.sort((a,b) => parallaxNumber(a.startTime,0) - parallaxNumber(b.startTime,0));
      target.props.heroPoints = JSON.stringify(items);
    });
    parallaxPreviewTime(section.id, at);
  }

  function renderParallaxPointEditor(section) {
    if (section.type !== 'parallax') return '';
    const { start, end, duration, banners } = parallaxTimelineBounds(section);
    const step = parallaxStep(section);
    const detected = parallaxNumber(section.props.videoDuration, 0) > 0.1;
    const playhead = parallaxClamp(parallaxEditorPlayheads.get(section.id) ?? start, 0, duration);
    parallaxEditorPlayheads.set(section.id, playhead);
    const { point:selectedPoint, index:selectedIndex } = parallaxSelectedBanner(section, banners);
    const selectedId = selectedPoint?.id || '';
    const bannerMarkers = banners.map((point, index) => {
      const selected = String(point.id || '') === String(selectedId);
      const movementLocked = parallaxMovementLocked(point);
      const releases = point?.releaseScroll === true || String(point?.releaseScroll).toLowerCase() === 'true';
      return `<button type="button" class="parallax-marker banner ${selected ? 'is-selected' : ''} ${movementLocked ? 'is-movement-locked' : ''} ${releases ? 'is-release-banner' : ''}" style="left:${parallaxMarkerLeft(point.startTime, duration)}" data-parallax-key-marker data-parallax-index="${index}" data-parallax-key-id="${catalog.esc(point.id || '')}" title="${catalog.esc(point.title || point.id || `Ponto ${index + 1}`)} · ${parallaxTime(point.startTime)}s · ${movementLocked ? 'movimento bloqueado' : 'movimento liberado'}${releases ? ' · libera o scroll' : ''}"><span>${releases ? '↧' : index + 1}</span><em>${parallaxTime(point.startTime)}s</em></button>`;
    }).join('');
    const movementLocked = selectedPoint ? parallaxMovementLocked(selectedPoint) : true;
    const selectedEditor = selectedPoint ? `<article class="parallax-selected-editor" data-parallax-selected-card data-parallax-index="${selectedIndex}">
      <div class="parallax-point-card-head"><div><strong>◆ Ponto-chave ${selectedIndex + 1}</strong><small>Frame ${parallaxTime(selectedPoint.startTime)}s · o vídeo para e o banner abre aqui.</small></div><div class="parallax-point-card-actions"><button class="btn parallax-movement-lock ${movementLocked ? 'is-locked' : 'is-unlocked'}" type="button" data-parallax-toggle-movement-lock="${selectedIndex}" aria-pressed="${movementLocked ? 'true' : 'false'}" title="${movementLocked ? 'Movimento bloqueado. Clique para liberar a chave.' : 'Movimento liberado. Clique para bloquear a chave.'}"><span aria-hidden="true">${movementLocked ? '🔒' : '🔓'}</span> ${movementLocked ? 'Bloqueada' : 'Mover chave'}</button><button class="btn danger" type="button" data-parallax-delete-banner="${selectedIndex}">Excluir chave</button></div></div>
      <button class="btn primary" type="button" data-parallax-design-open="${selectedIndex}" style="width:100%;margin:12px 0">⚙ Configuração avançada do layout · Prévia</button>
      <div class="parallax-point-grid">
        <label class="inspector-field"><span>Segundo / frame da chave</span><input class="control" type="number" min="${Math.min(end-step,start+step)}" max="${Math.max(start+step,end-step)}" step="${step}" value="${parallaxTime(selectedPoint.startTime)}" data-parallax-banner-field="startTime" data-parallax-index="${selectedIndex}" ${movementLocked ? 'disabled' : ''}><small class="field-note">${movementLocked ? '🔒 Desbloqueie a chave para alterar o frame ou arrastá-la na timeline.' : '🔓 Movimento liberado: você pode alterar o frame ou arrastar a chave.'}</small></label>
        <label class="inspector-field"><span>ID</span><input class="control" value="${catalog.esc(selectedPoint.id || '')}" data-parallax-banner-field="id" data-parallax-index="${selectedIndex}"></label>
      </div>
      <details class="parallax-arrival-advanced"><summary>Ajuste avançado da chegada</summary><div class="parallax-point-grid">
        <label class="inspector-field"><span>Desaceleração antes da chave (ms)</span><input class="control" type="number" min="0" max="6000" step="25" value="${parallaxNumber(selectedPoint.decelMs, 0)}" data-parallax-banner-field="decelMs" data-parallax-index="${selectedIndex}"><small class="field-note">0 = usa o perfil cinematográfico selecionado.</small></label>
        <label class="inspector-field"><span>Duração da chegada até esta chave (ms)</span><input class="control" type="number" min="0" max="20000" step="50" value="${parallaxNumber(selectedPoint.transitionMs, 0)}" data-parallax-banner-field="transitionMs" data-parallax-index="${selectedIndex}"><small class="field-note">0 = automática conforme distância e perfil.</small></label>
      </div></details>
      <details class="parallax-arrival-advanced"><summary>🎙 Narração do slide</summary><div class="parallax-point-grid"><label class="inspector-field"><span>Arquivo ou URL da narração (MP3, OGG, M4A, WebM)</span><input class="control" data-parallax-banner-field="narrationAudio" data-parallax-index="${selectedIndex}" value="${catalog.esc(selectedPoint.narrationAudio || '')}" placeholder="https://.../narracao.mp3"></label><label class="inspector-field"><span>Upload da narração</span><input class="control" type="file" accept="audio/mpeg,audio/ogg,audio/webm,audio/mp4,.mp3,.ogg,.webm,.m4a,.mp4" data-parallax-narration-upload data-parallax-index="${selectedIndex}"><small class="field-note">O áudio é incorporado ao projeto; arquivos grandes aumentam o tamanho da exportação.</small></label><label class="inspector-field"><span>Atraso após abrir o slide (segundos)</span><input class="control" type="number" min="0" max="30" step="0.5" value="${parallaxNumber(selectedPoint.narrationDelay,2)}" data-parallax-banner-field="narrationDelay" data-parallax-index="${selectedIndex}"></label><label class="inspector-field"><span>Volume da narração (%)</span><input class="control" type="number" min="0" max="100" step="1" value="${parallaxNumber(selectedPoint.narrationVolume,100)}" data-parallax-banner-field="narrationVolume" data-parallax-index="${selectedIndex}"></label></div><div class="parallax-toggle-row"><label><input type="checkbox" ${selectedPoint.narrationEnabled ? 'checked' : ''} data-parallax-banner-field="narrationEnabled" data-parallax-index="${selectedIndex}"> Ativar narração</label><label><input type="checkbox" ${selectedPoint.narrationLoop ? 'checked' : ''} data-parallax-banner-field="narrationLoop" data-parallax-index="${selectedIndex}"> Repetir narração</label></div><small class="field-note">Upload local de narração: use uma URL ou caminho publicado no projeto. Reprodução automática com som exige interação prévia do visitante.</small></details>
      <div class="parallax-key-rule"><strong>Regra da chave</strong><span>Chega desacelerando → para exatamente no ◆ → abre o banner → próximo gesto segue para a próxima chave.</span></div>
      <div class="parallax-point-grid">
        <label class="inspector-field"><span>Eyebrow</span><input class="control" value="${catalog.esc(selectedPoint.eyebrow || '')}" data-parallax-banner-field="eyebrow" data-parallax-index="${selectedIndex}"></label>
        <label class="inspector-field"><span>Título</span><input class="control" value="${catalog.esc(selectedPoint.title || '')}" data-parallax-banner-field="title" data-parallax-index="${selectedIndex}"></label>
      </div>
      <label class="inspector-field"><span>Subtítulo</span><input class="control" value="${catalog.esc(selectedPoint.subtitle || '')}" data-parallax-banner-field="subtitle" data-parallax-index="${selectedIndex}"></label>
      <label class="inspector-field"><span>Texto</span><textarea class="control" rows="3" data-parallax-banner-field="text" data-parallax-index="${selectedIndex}">${catalog.esc(selectedPoint.text || '')}</textarea></label>
      <p class="field-note">Tipografia e animações: configure exclusivamente no modal <b>Configuração avançada do layout</b>. Os ajustes antigos permanecem preservados.</p>
      <div class="parallax-point-grid">
        <label class="inspector-field"><span>Texto do botão</span><input class="control" value="${catalog.esc(selectedPoint.buttonText || '')}" data-parallax-banner-field="buttonText" data-parallax-index="${selectedIndex}"></label>
        <label class="inspector-field"><span>Link do botão</span><input class="control" value="${catalog.esc(selectedPoint.buttonLink || '')}" data-parallax-banner-field="buttonLink" data-parallax-index="${selectedIndex}"></label>
        <label class="inspector-field"><span>Posição</span><select class="control" data-parallax-banner-field="position" data-parallax-index="${selectedIndex}">${['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'].map((value) => `<option value="${value}" ${String(selectedPoint.position || 'center') === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
      </div>
      <div class="parallax-toggle-row"><label><input type="checkbox" ${selectedPoint.hideOnMobile ? 'checked' : ''} data-parallax-banner-field="hideOnMobile" data-parallax-index="${selectedIndex}"> Ocultar este banner no mobile</label><label><input type="checkbox" ${(selectedPoint.releaseScroll === true || String(selectedPoint.releaseScroll).toLowerCase() === 'true') ? 'checked' : ''} data-parallax-banner-field="releaseScroll" data-parallax-index="${selectedIndex}"> Este banner libera o scroll</label></div>
    </article>` : `<div class="parallax-empty-selection"><strong>Clique em uma chave ◆ para editar.</strong><p>A timeline fica limpa: somente a chave selecionada abre o editor do banner.</p></div>`;
    const releaseAuto = section.props.endTimeAuto === true || String(section.props.endTimeAuto).toLowerCase() === 'true';
    return `<div class="inspector-group parallax-point-studio" data-parallax-point-studio>
      <div class="parallax-studio-head"><div><h3>Timeline de pontos-chave</h3><p><b>INICIAR</b> define o primeiro frame do vídeo. Ex.: 3,0s faz a experiência começar no frame de 3 segundos. Cada ◆ entre INICIAR e LIBERAR é uma parada real e abre um banner.</p></div><span class="parallax-version">Parallax 2.10.3</span></div>
      <div class="parallax-duration-status ${detected ? 'is-detected' : 'is-waiting'}"><strong>${detected ? `Vídeo detectado: ${parallaxTime(duration)} s` : `Duração provisória: ${parallaxTime(duration)} s`}</strong><span>${detected ? 'capturada automaticamente do vídeo carregado na URL' : 'a escala será atualizada assim que os metadados da URL carregarem'}</span></div>
      <div class="parallax-timeline-summary"><span>0s</span><strong>iniciar em ${parallaxTime(start)}s · ${banners.length} chave(s) · liberar em ${parallaxTime(end)}s</strong><span>${parallaxTime(duration)}s</span></div>
      <div class="parallax-timeline" data-parallax-timeline data-duration="${duration}">
        <div class="parallax-ticks">${parallaxTimelineTicks(duration)}</div>
        <div class="parallax-window" style="left:${parallaxMarkerLeft(start,duration)};right:${(100 - parseFloat(parallaxMarkerLeft(end,duration))).toFixed(3)}%"></div>
        <button type="button" class="parallax-start-marker" style="left:${parallaxMarkerLeft(start,duration)}" data-parallax-start-marker title="Iniciar vídeo em ${parallaxTime(start)}s"><span>INICIAR</span><em>${parallaxTime(start)}s</em></button>
        <div class="parallax-marker-row banners">${bannerMarkers}</div>
        <button type="button" class="parallax-release-marker ${releaseAuto ? 'is-auto' : ''}" style="left:${parallaxMarkerLeft(end,duration)}" data-parallax-release-marker title="Liberar scroll em ${parallaxTime(end)}s${releaseAuto ? ' · automático no fim do vídeo' : ''}"><span>LIBERAR</span><em>${parallaxTime(end)}s</em></button>
        <span class="parallax-playhead-line" style="left:${parallaxMarkerLeft(playhead,duration)}" data-parallax-playhead-line></span>
      </div>
      <div class="parallax-timeline-help"><span>Arraste INICIAR para definir o primeiro frame do vídeo.</span><span>Arraste ◆ para mover a chave.</span><span>Arraste LIBERAR para definir a saída.</span></div>
      <label class="parallax-playhead-control"><span>Playhead <output data-parallax-playhead-label>${parallaxTime(playhead)}s</output></span><input type="range" min="0" max="${duration}" step="${step}" value="${playhead}" data-parallax-playhead></label>
      <div class="parallax-studio-actions"><button class="btn primary" type="button" data-parallax-add-banner>+ Adicionar ponto-chave no playhead</button><button class="btn" type="button" data-parallax-release-auto>LIBERAR = fim do vídeo</button></div>
      ${selectedEditor}
    </div>`;
  }


  function propertySliderNormalizeSlide(item, index = 0) {
    const source = item && typeof item === 'object' ? item : {};
    const rawShow = source.showButton;
    const showButton = rawShow === undefined ? Boolean(String(source.buttonText || source.cta || '').trim()) : !(rawShow === false || String(rawShow).toLowerCase() === 'false');
    return {
      id:String(source.id || `slide-${index + 1}`),
      image:String(source.image || ''),
      imageAlt:String(source.imageAlt || source.title || ''),
      eyebrow:String(source.eyebrow || ''),
      title:String(source.title || ''),
      text:String(source.text || source.copy || ''),
      showButton,
      buttonText:String(source.buttonText || source.cta || ''),
      buttonLink:String(source.buttonLink || source.link || '#')
    };
  }

  function propertySliderSlides(section) {
    const props = section?.props || {};
    try {
      const parsed = JSON.parse(String(props.slides || '[]'));
      if (Array.isArray(parsed) && parsed.length) return parsed.map(propertySliderNormalizeSlide);
    } catch {}
    const legacy = [];
    for (let n = 1; n <= 3; n += 1) {
      const candidate = {
        id:`slide-${n}`,
        image:props[`image${n}`] || '',
        imageAlt:props[`title${n}`] || '',
        eyebrow:props[`eyebrow${n}`] || '',
        title:props[`title${n}`] || '',
        text:props[`copy${n}`] || '',
        showButton:Boolean(String(props[`cta${n}`] || '').trim()),
        buttonText:props[`cta${n}`] || '',
        buttonLink:props[`link${n}`] || '#'
      };
      if (candidate.image || candidate.eyebrow || candidate.title || candidate.text || candidate.buttonText) legacy.push(propertySliderNormalizeSlide(candidate, legacy.length));
    }
    return legacy.length ? legacy : [propertySliderNormalizeSlide({ title:'Novo slide', showButton:false }, 0)];
  }

  function propertySliderUniqueId(items, base = 'slide') {
    const used = new Set(items.map((item) => String(item.id || '')));
    let seed = `${base}-${items.length + 1}`;
    let candidate = seed;
    let n = 2;
    while (used.has(candidate)) candidate = `${seed}-${n++}`;
    return candidate;
  }

  function propertySliderNewSlide(items) {
    const index = items.length;
    return propertySliderNormalizeSlide({
      id:propertySliderUniqueId(items),
      image:'', imageAlt:'', eyebrow:'', title:`Novo slide ${index + 1}`, text:'',
      showButton:false, buttonText:'Quero saber mais', buttonLink:'#contato'
    }, index);
  }

  function propertySliderWrite(section, items) {
    const normalized = items.map(propertySliderNormalizeSlide);
    section.props.slides = JSON.stringify(normalized);
    // Mantém os três campos legados sincronizados para abrir projetos antigos e
    // preservar compatibilidade com exportações/presets anteriores à versão 1.1.0.
    for (let n = 1; n <= 3; n += 1) {
      const item = normalized[n - 1] || {};
      section.props[`image${n}`] = item.image || '';
      section.props[`eyebrow${n}`] = item.eyebrow || '';
      section.props[`title${n}`] = item.title || '';
      section.props[`copy${n}`] = item.text || '';
      section.props[`cta${n}`] = item.showButton === false ? '' : (item.buttonText || '');
      section.props[`link${n}`] = item.buttonLink || '#';
    }
  }

  function propertySliderSelected(section, items = propertySliderSlides(section)) {
    const id = propertySliderEditorSelection.get(section?.id);
    if (!id) return { item:null, index:-1 };
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index < 0) {
      propertySliderEditorSelection.delete(section.id);
      return { item:null, index:-1 };
    }
    return { item:items[index], index };
  }

  function renderPropertySliderEditor(section) {
    if (!section || section.type !== 'property-slider') return '';
    const items = propertySliderSlides(section);
    const { item:selected, index:selectedIndex } = propertySliderSelected(section, items);
    const selectedId = selected?.id || '';
    const rows = items.map((item, index) => {
      const label = String(item.title || item.eyebrow || `Slide ${index + 1}`).trim() || `Slide ${index + 1}`;
      const image = String(item.image || '').trim();
      return `<div class="property-slide-editor-row ${String(item.id) === String(selectedId) ? 'is-selected' : ''}" data-property-slide-row data-property-slide-id="${catalog.esc(item.id)}" draggable="true">
        <span class="property-slide-order-number">${index + 1}</span>
        <span class="property-slide-order-thumb">${image ? `<img src="${catalog.esc(image)}" alt="">` : '<i>IMG</i>'}</span>
        <span class="property-slide-order-label"><strong>${catalog.esc(label)}</strong><small>${item.eyebrow ? catalog.esc(item.eyebrow) : `Slide ${index + 1}`}</small></span>
        <span class="property-slide-order-actions">
          <button type="button" data-property-slide-move="up" data-property-slide-id="${catalog.esc(item.id)}" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-property-slide-move="down" data-property-slide-id="${catalog.esc(item.id)}" title="Mover para baixo" ${index === items.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="edit" data-property-slide-edit="${catalog.esc(item.id)}">Editar</button>
        </span>
      </div>`;
    }).join('');
    const editor = selected ? `<article class="property-slide-detail" data-property-slide-detail data-property-slide-id="${catalog.esc(selected.id)}">
      <div class="property-slide-detail-head"><div><strong>Slide ${selectedIndex + 1}</strong><small>Edite o conteúdo do slide selecionado.</small></div><button class="btn danger" type="button" data-property-slide-remove="${catalog.esc(selected.id)}">− Remover</button></div>
      <div class="inspector-field media-inspector-field property-slide-media"><span>Imagem do slide</span><label class="image-drop">Clique para carregar a imagem<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-property-slide-media data-property-slide-id="${catalog.esc(selected.id)}"></label><input class="control" type="text" value="${/^data:/i.test(String(selected.image || '')) ? '' : catalog.esc(selected.image)}" placeholder="${/^data:/i.test(String(selected.image || '')) ? 'Mídia local carregada' : 'https://... ou assets/images/...'}" data-property-slide-field="image" data-property-slide-id="${catalog.esc(selected.id)}">${/^data:/i.test(String(selected.image || '')) ? '<small class="helper media-local-hint">Mídia local carregada. Ela será convertida em arquivo físico na exportação.</small>' : ''}<small class="field-note">Informe uma URL/caminho ou carregue uma imagem. Na exportação o Studio tenta incorporar a mídia ao pacote para a página não depender da origem externa.</small></div>
      <label class="inspector-field"><span>Texto alternativo da imagem</span><input class="control" value="${catalog.esc(selected.imageAlt)}" data-property-slide-field="imageAlt" data-property-slide-id="${catalog.esc(selected.id)}"></label>
      <label class="inspector-field"><span>Hero / chamada</span><input class="control" value="${catalog.esc(selected.eyebrow)}" placeholder="Ex.: LANÇAMENTO" data-property-slide-field="eyebrow" data-property-slide-id="${catalog.esc(selected.id)}"></label>
      <label class="inspector-field"><span>Título</span><textarea class="control" rows="2" data-property-slide-field="title" data-property-slide-id="${catalog.esc(selected.id)}">${catalog.esc(selected.title)}</textarea></label>
      <label class="inspector-field"><span>Texto</span><textarea class="control" rows="4" data-property-slide-field="text" data-property-slide-id="${catalog.esc(selected.id)}">${catalog.esc(selected.text)}</textarea></label>
      <div class="toggle-row"><span>Exibir botão</span><button class="switch ${selected.showButton ? 'on' : ''}" type="button" data-property-slide-button-toggle="${catalog.esc(selected.id)}" aria-label="Exibir botão deste slide"></button></div>
      ${selected.showButton ? `<div class="property-slide-cta-fields"><label class="inspector-field"><span>Texto do CTA</span><input class="control" value="${catalog.esc(selected.buttonText)}" data-property-slide-field="buttonText" data-property-slide-id="${catalog.esc(selected.id)}"></label><label class="inspector-field"><span>Link do CTA</span><input class="control" value="${catalog.esc(selected.buttonLink)}" placeholder="#contato ou https://..." data-property-slide-field="buttonLink" data-property-slide-id="${catalog.esc(selected.id)}"></label></div>` : ''}
    </article>` : `<div class="property-slide-empty"><strong>Selecione um slide para editar.</strong><p>Clique em <b>Editar</b> na ordem acima. Você pode adicionar quantos slides precisar.</p></div>`;
    return `<div class="inspector-group property-slider-studio" data-property-slider-studio>
      <div class="property-slider-studio-head"><div><h3>Slides</h3><p>Gerencie a ordem e o conteúdo sem limite fixo de slides.</p></div><span>${items.length} slide${items.length === 1 ? '' : 's'}</span></div>
      <div class="property-slider-studio-toolbar">
        <button class="btn primary" type="button" data-property-slide-add>＋ Adicionar</button>
        <button class="btn" type="button" data-property-slide-remove-selected ${selected ? '' : 'disabled'}>− Remover</button>
        <button class="btn" type="button" data-property-slide-edit-selected ${items.length ? '' : 'disabled'}>Editar</button>
      </div>
      <div class="property-slide-order" data-property-slide-order>${rows}</div>
      <small class="field-note property-slide-order-note">Use ↑ ↓ ou arraste uma linha para reorganizar os slides.</small>
      ${editor}
    </div>`;
  }



  function benefitsModalNormalizeItem(item, index = 0) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id:String(item.id || `benefit-${index + 1}`),
      icon:String(item.icon || 'fa-solid fa-circle-check'),
      title:String(item.title || `Benefício ${index + 1}`),
      description:String(item.description || '')
    };
  }

  function benefitsModalItems(section) {
    if (!section || section.type !== 'beneficios-modal') return [];
    try {
      const parsed = JSON.parse(String(section.props?.items || '[]'));
      if (Array.isArray(parsed)) return parsed.map(benefitsModalNormalizeItem);
    } catch {}
    return [benefitsModalNormalizeItem({ title:'Novo benefício' }, 0)];
  }

  function benefitsModalUniqueId(items, base = 'benefit') {
    const used = new Set(items.map((item) => String(item.id || '')));
    let candidate = `${base}-${items.length + 1}`;
    let n = 2;
    while (used.has(candidate)) candidate = `${base}-${items.length + 1}-${n++}`;
    return candidate;
  }

  function benefitsModalNewItem(items) {
    const index = items.length;
    return benefitsModalNormalizeItem({
      id:benefitsModalUniqueId(items),
      icon:'fa-solid fa-circle-check',
      title:`Novo benefício ${index + 1}`,
      description:'Descreva aqui este benefício, sua finalidade e o valor que ele agrega ao empreendimento.'
    }, index);
  }

  function benefitsModalWrite(section, items) {
    section.props.items = JSON.stringify(items.map(benefitsModalNormalizeItem));
  }

  function benefitsModalSelected(section, items = benefitsModalItems(section)) {
    const id = benefitsModalEditorSelection.get(section?.id);
    if (!id) return { item:null, index:-1 };
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index < 0) {
      benefitsModalEditorSelection.delete(section.id);
      return { item:null, index:-1 };
    }
    return { item:items[index], index };
  }

  function benefitsIconPreview(value, empty = '◌') {
    const cls = window.ImobifyIconLibrary?.safeClass?.(value) || '';
    return cls && window.ImobifyIconLibrary?.isFontAwesome?.(cls)
      ? `<i class="${catalog.esc(cls)}" aria-hidden="true"></i>`
      : `<span>${catalog.esc(String(value || empty))}</span>`;
  }

  function renderBenefitsModalEditor(section) {
    if (!section || section.type !== 'beneficios-modal') return '';
    const items = benefitsModalItems(section);
    const { item:selected, index:selectedIndex } = benefitsModalSelected(section, items);
    const selectedId = selected?.id || '';
    const rows = items.map((item, index) => `<div class="benefit-editor-row ${String(item.id) === String(selectedId) ? 'is-selected' : ''}" data-benefit-row data-benefit-id="${catalog.esc(item.id)}">
      <span class="benefit-editor-order">${index + 1}</span>
      <span class="benefit-editor-icon">${benefitsIconPreview(item.icon)}</span>
      <span class="benefit-editor-label"><strong>${catalog.esc(item.title || `Benefício ${index + 1}`)}</strong><small>${catalog.esc(item.icon || 'Sem ícone')}</small></span>
      <span class="benefit-editor-actions"><button type="button" data-benefit-move="up" data-benefit-id="${catalog.esc(item.id)}" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-benefit-move="down" data-benefit-id="${catalog.esc(item.id)}" title="Mover para baixo" ${index === items.length - 1 ? 'disabled' : ''}>↓</button><button class="edit" type="button" data-benefit-edit="${catalog.esc(item.id)}">Editar</button></span>
    </div>`).join('');
    const editor = selected ? `<article class="benefit-editor-detail" data-benefit-detail data-benefit-id="${catalog.esc(selected.id)}">
      <div class="benefit-editor-detail-head"><div><strong>Benefício ${selectedIndex + 1}</strong><small>O texto detalhado é publicado no HTML e permanece disponível para indexação.</small></div><button class="btn danger" type="button" data-benefit-remove="${catalog.esc(selected.id)}">− Remover</button></div>
      <div class="benefit-icon-config">
        <div class="benefit-icon-preview-large">${benefitsIconPreview(selected.icon)}</div>
        <div><button class="btn" type="button" data-benefit-open-icon-picker="${catalog.esc(selected.id)}">✦ Escolher na biblioteca visual</button><small class="field-note">A biblioteca usa Font Awesome e inclui categorias de infraestrutura, lazer, segurança e condomínio.</small></div>
      </div>
      <label class="inspector-field"><span>Classe Font Awesome / personalizada</span><input class="control" value="${catalog.esc(selected.icon)}" placeholder="Ex.: fa-solid fa-water-ladder" data-benefit-field="icon" data-benefit-id="${catalog.esc(selected.id)}"><small class="field-note">Pode informar manualmente qualquer classe Font Awesome futura que não esteja na biblioteca atual.</small></label>
      <label class="inspector-field"><span>Título curto</span><input class="control" value="${catalog.esc(selected.title)}" maxlength="80" data-benefit-field="title" data-benefit-id="${catalog.esc(selected.id)}"><small class="field-note">Ex.: Piscina coberta, Spa, Adega, Garagem privativa.</small></label>
      <label class="inspector-field"><span>Descrição completa do modal</span><textarea class="control" rows="7" data-benefit-field="description" data-benefit-id="${catalog.esc(selected.id)}">${catalog.esc(selected.description)}</textarea><small class="field-note">Use dois Enter para separar parágrafos. O conteúdo é renderizado semanticamente no HTML final.</small></label>
    </article>` : `<div class="benefit-editor-empty"><strong>Selecione um benefício para editar.</strong><p>Clique em <b>Editar</b> na lista acima.</p></div>`;
    return `<div class="inspector-group benefits-modal-studio" data-benefits-modal-studio>
      <div class="benefits-modal-studio-head"><div><h3>Benefícios / infraestrutura</h3><p>Adicione quantos itens precisar. No padrão: 5 por linha no desktop e 3 no mobile.</p></div><span>${items.length} item${items.length === 1 ? '' : 's'}</span></div>
      <div class="benefits-modal-studio-toolbar"><button class="btn primary" type="button" data-benefit-add>＋ Adicionar item</button><button class="btn" type="button" data-benefit-remove-selected ${selected ? '' : 'disabled'}>− Remover</button><button class="btn" type="button" data-benefit-edit-selected ${items.length ? '' : 'disabled'}>Editar</button></div>
      <div class="benefits-editor-order">${rows}</div>
      <small class="field-note">Use ↑ ↓ para reorganizar. “Salvar componente” no menu do Inspetor preserva itens e estilos como preset .saved.json.</small>
      ${editor}
    </div>`;
  }

  function ensureBenefitsIconPickerDialog() {
    let dialog = $('#benefitsIconPickerDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'benefitsIconPickerDialog';
    dialog.className = 'benefits-icon-picker-dialog';
    dialog.setAttribute('aria-labelledby', 'benefitsIconPickerTitle');
    dialog.innerHTML = `<div class="dialog-toolbar"><div><strong id="benefitsIconPickerTitle">Biblioteca visual de ícones</strong><small>Font Awesome · escolha um ícone ou use uma classe manual no item</small></div><button class="btn" type="button" data-benefits-icon-picker-close>Fechar</button></div><div class="benefits-icon-picker-content"><div class="benefits-icon-picker-search"><span>⌕</span><input class="control" data-benefits-icon-search placeholder="Buscar piscina, spa, garagem, segurança..."></div><div class="benefits-icon-picker-grid" data-benefits-icon-grid></div></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-benefits-icon-picker-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector('[data-benefits-icon-search]')?.addEventListener('input', (event) => renderBenefitsIconPickerGrid(event.target.value));
    dialog.querySelector('[data-benefits-icon-grid]')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-benefits-icon-value]');
      if (!button || !benefitsIconPickerContext) return;
      const { sectionId, itemId } = benefitsIconPickerContext;
      const value = button.dataset.benefitsIconValue || '';
      benefitsModalEditorSelection.set(sectionId, itemId);
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === sectionId);
        if (!section || section.type !== 'beneficios-modal') return;
        const items = benefitsModalItems(section);
        const index = items.findIndex((item) => String(item.id) === String(itemId));
        if (index < 0) return;
        items[index].icon = value;
        benefitsModalWrite(section, items);
      });
      dialog.close();
    });
    return dialog;
  }

  function renderBenefitsIconPickerGrid(query = '') {
    const dialog = ensureBenefitsIconPickerDialog();
    const root = dialog.querySelector('[data-benefits-icon-grid]');
    if (!root) return;
    const q = String(query || '').trim().toLocaleLowerCase('pt-BR');
    const groups = window.ImobifyIconLibrary?.groups || [];
    const markup = groups.map(([group, entries]) => {
      const filtered = entries.filter(([label, value]) => !q || `${label} ${value} ${group}`.toLocaleLowerCase('pt-BR').includes(q));
      if (!filtered.length) return '';
      return `<section class="benefits-icon-picker-group"><h3>${catalog.esc(group)}</h3><div>${filtered.map(([label, value]) => `<button type="button" data-benefits-icon-value="${catalog.esc(value)}" title="${catalog.esc(label)}"><span>${benefitsIconPreview(value)}</span><small>${catalog.esc(label)}</small></button>`).join('')}</div></section>`;
    }).join('');
    root.innerHTML = markup || '<div class="benefits-icon-picker-empty">Nenhum ícone encontrado. Você ainda pode informar a classe manualmente no item.</div>';
  }

  function openBenefitsIconPicker(sectionId, itemId) {
    benefitsIconPickerContext = { sectionId, itemId };
    const dialog = ensureBenefitsIconPickerDialog();
    const search = dialog.querySelector('[data-benefits-icon-search]');
    if (search) search.value = '';
    renderBenefitsIconPickerGrid('');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.setTimeout(() => search?.focus(), 0);
  }



  // Editor modal de plugins — contrato genérico Plugin Play (5.12.4)
  function pluginModalEditorLaunch(section) {
    if (!section) return '';
    const plugin = catalog.plugins[section.type];
    const editor = plugin?.manifest?.editor;
    if (!plugin || editor?.mode !== 'modal' || !plugin.editorBundle) return '';
    const label = editor.label || `Editar ${plugin.name}`;
    const note = editor.description || 'Configuração avançada em janela dedicada. Alterações só são aplicadas ao clicar em Salvar.';
    return `<div class="inspector-group"><h3>${catalog.esc(plugin.name || 'Plugin')}</h3><button class="btn btn-wide" type="button" data-open-plugin-modal-editor>✎ ${catalog.esc(label)}</button><small class="field-note">${catalog.esc(note)}</small></div>`;
  }

  function pluginEditorEnsureDialog() {
    let dialog = document.getElementById('pluginModalEditorDialog');
    if (dialog) return dialog;
    if (!document.getElementById('pluginModalEditorStyles')) {
      const style = document.createElement('style');
      style.id = 'pluginModalEditorStyles';
      style.textContent = `#pluginModalEditorDialog{width:calc(100vw - 24px);height:calc(100dvh - 24px);max-width:none;max-height:none;padding:0;border:1px solid #2b3442;border-radius:14px;background:#0c1119;color:#fff;overflow:hidden}#pluginModalEditorDialog::backdrop{background:rgba(2,6,12,.82);backdrop-filter:blur(3px)}.plugin-modal-editor-shell{height:100%;display:grid;grid-template-rows:auto 1fr}.plugin-modal-editor-head{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-bottom:1px solid #283243;background:#111722}.plugin-modal-editor-head strong{display:block}.plugin-modal-editor-head small{display:block;color:#8ea0b8;margin-top:2px}.plugin-modal-editor-actions{display:flex;gap:8px}.plugin-modal-editor-body{min-height:0;background:#070a0f}.plugin-modal-editor-frame{width:100%;height:100%;border:0;background:#0b0e13}@media(max-width:700px){#pluginModalEditorDialog{width:100vw;height:100dvh;border:0;border-radius:0}.plugin-modal-editor-head{align-items:flex-start;flex-direction:column}.plugin-modal-editor-actions{width:100%}.plugin-modal-editor-actions .btn{flex:1}}`;
      document.head.appendChild(style);
    }
    dialog = document.createElement('dialog');
    dialog.id = 'pluginModalEditorDialog';
    dialog.innerHTML = `<div class="plugin-modal-editor-shell"><header class="plugin-modal-editor-head"><div><strong data-plugin-modal-title>Editor do plugin</strong><small data-plugin-modal-description>Section selecionada</small></div><div class="plugin-modal-editor-actions"><button class="btn" type="button" data-plugin-modal-cancel>Cancelar</button><button class="btn btn-primary" type="button" data-plugin-modal-save>Salvar</button></div></header><div class="plugin-modal-editor-body"><iframe class="plugin-modal-editor-frame" title="Editor do plugin"></iframe></div></div>`;
    document.body.appendChild(dialog);
    return dialog;
  }

  function pluginEditorSrcdoc(plugin) {
    const editor = plugin?.manifest?.editor;
    const bundle = plugin?.editorBundle;
    if (!editor || !bundle?.html || !bundle?.js) throw new Error('O editor modal não está incluído neste plugin.');
    const basename = (value) => String(value || '').split('/').pop();
    const escRx = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let html = String(bundle.html || '');
    const styleName = basename(editor.style);
    const scriptName = basename(editor.script);
    if (styleName) html = html.replace(new RegExp(`<link[^>]+href=["'](?:\\./)?${escRx(styleName)}["'][^>]*>`, 'ig'), '');
    if (scriptName) html = html.replace(new RegExp(`<script[^>]+src=["'](?:\\./)?${escRx(scriptName)}["'][^>]*>\\s*<\\/script>`, 'ig'), '');
    const css = String(bundle.css || '').replace(/<\/style/gi, '<\\/style');
    const js = String(bundle.js || '');
    const bytes = new TextEncoder().encode(js);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    const js64 = btoa(binary);
    const embedCss = `html.imobify-embed .top-actions{display:none!important}html.imobify-embed .topbar{min-height:54px}`;
    const styleTag = `<style>${embedCss}\n${css}</style>`;
    // Não embutir o código-fonte cru dentro de <script>. O editor Tour360 gera HTML que contém
    // sequências literais "<script"; o parser HTML entra em script-double-escaped state e pode
    // engolir o fechamento do script, impedindo o editor modal de inicializar. Base64 elimina
    // essa colisão e mantém o contrato genérico do Plugin Play.
    const scriptTag = `<script>document.documentElement.classList.add('imobify-embed');(function(){const raw=atob('${js64}');const data=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)data[i]=raw.charCodeAt(i);const code=new TextDecoder().decode(data);(0,eval)(code);})();</scr` + `ipt>`;
    html = html.includes('</head>') ? html.replace('</head>', `${styleTag}</head>`) : `${styleTag}${html}`;
    html = html.includes('</body>') ? html.replace('</body>', `${scriptTag}</body>`) : `${html}${scriptTag}`;
    return html;
  }

  function pluginEditorOpen(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    const plugin = section && catalog.plugins[section.type];
    const editor = plugin?.manifest?.editor;
    if (!section || !plugin || editor?.mode !== 'modal' || !plugin.editorBundle) return;
    const dialog = pluginEditorEnsureDialog();
    const frame = dialog.querySelector('.plugin-modal-editor-frame');
    const title = dialog.querySelector('[data-plugin-modal-title]');
    const description = dialog.querySelector('[data-plugin-modal-description]');
    title.textContent = editor.title || plugin.name || 'Editor do plugin';
    description.textContent = editor.description || 'Editor da section selecionada';
    dialog.dataset.sectionId = sectionId;
    dialog.dataset.pluginId = section.type;
    dialog.dataset.field = editor.field;
    dialog.dataset.ready = '0';
    frame.onload = () => {
      let attempts = 0;
      const apply = () => {
        attempts += 1;
        try {
          const api = frame.contentWindow?.ImobifyPluginEditor;
          if (!api?.load) {
            if (attempts < 120) window.setTimeout(apply, 50);
            else toast('O editor do plugin não respondeu.', 'error');
            return;
          }
          api.load(section.props?.[editor.field] ?? '');
          dialog.dataset.ready = '1';
        } catch (error) {
          console.warn('[Plugin Play] Falha ao carregar editor modal.', error);
          toast('Não foi possível carregar o editor do plugin.', 'error');
        }
      };
      apply();
    };
    frame.srcdoc = pluginEditorSrcdoc(plugin);
    if (!dialog.open) dialog.showModal();
  }

  function pluginEditorSave(dialog) {
    const sectionId = dialog?.dataset?.sectionId;
    const pluginId = dialog?.dataset?.pluginId;
    const field = dialog?.dataset?.field;
    const frame = dialog?.querySelector('.plugin-modal-editor-frame');
    if (!sectionId || !pluginId || !field || !frame) return;
    try {
      const api = frame.contentWindow?.ImobifyPluginEditor;
      if (!api?.save) throw new Error('Editor ainda não está pronto');
      const raw = api.save();
      const value = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === sectionId);
        if (section?.type === pluginId) section.props[field] = value;
      });
      dialog.close();
      toast('Configuração do plugin atualizada.');
    } catch (error) {
      toast(`Não foi possível salvar o plugin: ${error.message || error}`, 'error');
    }
  }

  const smartPlantStudioDrafts = new Map();
  const smartPlantStudioSelection = new Map();
  const smartPlantStudioThemes = new Map();

  function smartPlantParse(section) {
    try {
      const value = JSON.parse(String(section?.props?.plants || '[]'));
      return Array.isArray(value) ? value.map((item, index) => ({
        id:String(item?.id || `planta-${index + 1}`),
        code:String(item?.code || item?.identifier || ''),
        title:String(item?.title || `Planta ${index + 1}`),
        description:String(item?.description || ''),
        area:String(item?.area || ''),
        composition:String(item?.composition || ''),
        bathrooms:String(item?.bathrooms || ''),
        features:String(item?.features || ''),
        image:String(item?.image || ''),
        fullImage:String(item?.fullImage || item?.image || ''),
        positionImage:String(item?.positionImage || ''),
        position:String(item?.position || '')
      })) : [];
    } catch (_) { return []; }
  }

  function smartPlantPlugin(section) { return section ? catalog.plugins[section.type] : null; }

  function smartPlantAssetUrl(section, value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^(?:data:|blob:|https?:|file:|\/)/i.test(raw)) return raw;
    const plugin = smartPlantPlugin(section);
    const base = String(plugin?.assetBase || '').trim();
    if (!base) return raw;
    if (raw.startsWith(base)) return raw;
    return `${base}${raw.replace(/^\.\//, '')}`;
  }

  function smartPlantFeatures(value) {
    return String(value || '').split('|').map((item) => item.trim()).filter(Boolean);
  }

  function smartPlantThemeFromSection(section) {
    const props = section?.props || {};
    return {
      localTheme: props.localTheme === true || String(props.localTheme) === 'true',
      localAccent: String(props.localAccent || '#7e686d'),
      localSectionBg: String(props.localSectionBg || '#f7f5ea'),
      localCardBg: String(props.localCardBg || '#ffffff'),
      localModalBg: String(props.localModalBg || '#ffffff'),
      localText: String(props.localText || '#171717'),
      localMuted: String(props.localMuted || '#595959')
    };
  }

  function smartPlantTheme(sectionId, section) {
    if (!smartPlantStudioThemes.has(sectionId)) smartPlantStudioThemes.set(sectionId, smartPlantThemeFromSection(section));
    return smartPlantStudioThemes.get(sectionId);
  }

  function smartPlantThemeVars(theme, section) {
    const b = state.brand || {};
    const active = theme?.localTheme;
    const local = section?.settings?.style;
    const on = !active && local?.enabled === true;
    const byMode = (mode,custom,base) => mode === 'custom' ? String(custom || base) :
      mode === 'primary' ? String(b.primary || base) :
      mode === 'accent' ? String(b.accent || base) :
      mode === 'dark' ? String(b.dark || base) :
      mode === 'surface' ? String(b.surface || base) : base;
    const foreground = (color) => {
      const match = /^#([a-f0-9]{6})$/i.exec(String(color || ''));
      if (!match) return '#ffffff';
      const rgb = [0,2,4].map(i => {
        const value = parseInt(match[1].slice(i,i+2),16) / 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722 > .1791 ? '#101318' : '#ffffff';
    };
    const surface = String(b.surface || '#f5f7f8');
    const heading = String(b.headingColor || '#101318');
    const muted = String(b.mutedColor || b.bodyColor || '#6b747b');
    let bg = on ? byMode(local.backgroundMode,local.backgroundColor,surface) : surface;
    if(on && local.backgroundMode === 'gradient') bg = `linear-gradient(${Number(local.gradientAngle)||135}deg,${local.backgroundColor || surface},${local.backgroundColor2 || b.dark || '#101318'})`;
    const globalAction = String(b.actionButtonBackground || b.primary || '#d7ff3f');
    const localAction = on ? byMode(local.actionBackgroundMode,local.actionBackgroundColor,globalAction) : globalAction;
    const accent = active ? theme.localAccent : localAction;
    const ink = active ? foreground(accent) : on && local.actionTextMode === 'custom' ? String(local.actionTextColor) : on && local.actionBackgroundMode === 'custom' ? foreground(accent) : String(b.actionButtonText || foreground(accent));
    return {
      accent,
      sectionBg:active ? theme.localSectionBg : bg,
      cardBg:active ? theme.localCardBg : surface,
      modalBg:active ? theme.localModalBg : surface,
      text:active ? theme.localText : on && local.headingColorMode === 'custom' ? String(local.headingColor) : heading,
      muted:active ? theme.localMuted : on && local.bodyColorMode === 'custom' ? String(local.bodyColor) : muted,
      ctaText:ink
    };
  }

  function smartPlantEnsureDialog() {
    let dialog = document.getElementById('smartPlantStudioDialog');
    if (dialog) return dialog;
    if (!document.getElementById('smartPlantStudioStyles')) {
      const style = document.createElement('style');
      style.id = 'smartPlantStudioStyles';
      style.textContent = `
#smartPlantStudioDialog{width:min(1480px,calc(100vw - 28px));height:min(900px,calc(100dvh - 28px));max-width:none;max-height:none;padding:0;border:1px solid #273141;border-radius:14px;background:#111722;color:#f4f7fb;box-shadow:0 34px 100px rgba(0,0,0,.48)}
#smartPlantStudioDialog::backdrop{background:rgba(3,7,13,.76);backdrop-filter:blur(3px)}
.spstudio{height:100%;display:grid;grid-template-rows:auto 1fr;background:#111722}.spstudio *{box-sizing:border-box}.spstudio__head{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #222b39}.spstudio__head h2{margin:0;font-size:16px}.spstudio__head p{margin:4px 0 0;color:#94a3b8;font-size:12px}.spstudio__actions{display:flex;gap:8px}.spstudio__body{min-height:0;display:grid;grid-template-columns:270px 520px minmax(420px,1fr)}.spstudio__list,.spstudio__edit,.spstudio__preview{min-height:0;overflow:auto;padding:14px}.spstudio__list,.spstudio__edit{border-right:1px solid #222b39}.spstudio__list-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.spstudio__list-head strong{font-size:14px}.spstudio__plant-row{display:grid;grid-template-columns:70px 1fr;gap:10px;padding:9px;border-radius:10px;background:#151c28;margin-bottom:8px;border:1px solid transparent;cursor:pointer}.spstudio__plant-row.is-active{border-color:#46556d;background:#182131}.spstudio__thumb{height:58px;background:#0d131d;border-radius:7px;overflow:hidden;display:grid;place-items:center;color:#64748b;font-size:10px}.spstudio__thumb img{width:100%;height:100%;object-fit:contain;background:#f2f0e8}.spstudio__plant-row strong{display:block;font-size:12px;line-height:1.25}.spstudio__plant-row small{color:#8ea0b7}.spstudio__order{display:flex;gap:6px;margin:8px 0 14px}.spstudio__field{display:block;margin-bottom:12px}.spstudio__field>span{display:block;font-size:12px;font-weight:700;margin-bottom:5px;color:#dbe4ef}.spstudio__field input,.spstudio__field textarea,.spstudio__field select{width:100%;border:1px solid #2c3748;border-radius:8px;background:#0d131d;color:#eef3f8;padding:9px 10px;font:inherit;font-size:12px}.spstudio__field input[type=color]{height:38px;padding:4px;cursor:pointer}.spstudio__field textarea{resize:vertical}.spstudio__grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.spstudio__theme{padding:12px;border:1px solid #2a3648;border-radius:11px;background:#141c28;margin-bottom:14px}.spstudio__theme-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.spstudio__theme-head strong{font-size:13px}.spstudio__theme-head label{display:flex;align-items:center;gap:7px;color:#cbd5e1;font-size:11px}.spstudio__theme-head input{accent-color:#e9edf4}.spstudio__color-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.spstudio__color-grid.is-disabled{opacity:.42;pointer-events:none}.spstudio__color-row{display:grid;grid-template-columns:40px 1fr;gap:8px;align-items:center}.spstudio__color-row input[type=color]{width:40px;height:34px;border:1px solid #344155;border-radius:7px;background:#0d131d;padding:3px}.spstudio__color-row span{font-size:11px;color:#d6deea}.spstudio__media{padding:10px;border:1px solid #222d3c;border-radius:10px;background:#151c28;margin-bottom:12px}.spstudio__media-title{font-size:12px;font-weight:800;margin-bottom:8px}.spstudio__drop{height:132px;border:1px dashed #46556d;border-radius:8px;display:grid;place-items:center;overflow:hidden;background:#0d131d;position:relative}.spstudio__drop.is-over{outline:2px solid #7d91af}.spstudio__drop img{width:100%;height:100%;object-fit:contain;background:#f1eee6}.spstudio__drop em{color:#74869d;font-size:11px}.spstudio__media-buttons{display:flex;gap:8px;margin-top:8px}.spstudio button{border:1px solid #2b3647;background:#151c28;color:#f2f6fb;border-radius:8px;padding:8px 11px;font-weight:700;cursor:pointer}.spstudio button:hover{background:#1c2635}.spstudio button.primary{background:#e9edf4;color:#111722}.spstudio button.danger{color:#ff8181}.spstudio__tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:sticky;top:0;background:#111722;padding-bottom:10px;z-index:2}.spstudio__tabs button.is-active{background:#1b2534}.spstudio__preview-stage{background:var(--sp-preview-section,#eeeae0);border-radius:14px;padding:20px;min-height:510px;color:var(--sp-preview-text,#171717);transition:background .18s ease,color .18s ease}.spstudio__card-preview{background:var(--sp-preview-card,#fff);border-radius:14px;overflow:hidden;max-width:480px;margin:25px auto;box-shadow:0 12px 32px rgba(20,20,20,.08)}.spstudio__card-preview img{width:100%;height:240px;object-fit:contain;background:#f1eee6;display:block}.spstudio__card-preview div{padding:18px}.spstudio__card-preview h3{margin:0 0 8px;color:var(--sp-preview-text,#171717)}.spstudio__card-preview p{color:var(--sp-preview-muted,#595959)}.spstudio__badges{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.spstudio__badge{font-size:11px;padding:5px 9px;border-radius:99px;background:color-mix(in srgb,var(--sp-preview-accent,#7e686d) 13%,#fff);color:var(--sp-preview-text,#171717);border:1px solid color-mix(in srgb,var(--sp-preview-accent,#7e686d) 20%,transparent)}.spstudio__detail-preview{background:var(--sp-preview-modal,#fff);color:var(--sp-preview-text,#171717);border-radius:14px;padding:20px;display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,1fr);gap:22px;min-height:470px}.spstudio__detail-preview>img{width:100%;height:100%;max-height:430px;object-fit:contain;background:#f1eee6;border-radius:10px}.spstudio__detail-preview h3{font-size:20px;margin:2px 0 10px;color:var(--sp-preview-text,#171717)}.spstudio__detail-preview p{color:var(--sp-preview-muted,#595959)}.spstudio__detail-preview .spstudio__detail-action{width:100%;background:var(--sp-preview-accent,#7e686d);color:#fff;border:0}.spstudio__empty{padding:30px;text-align:center;color:#8fa1b8}.spstudio__hidden-input{display:none}
@media(max-width:1100px){.spstudio__body{grid-template-columns:240px minmax(420px,1fr)}.spstudio__preview{grid-column:1/-1;border-top:1px solid #222b39}.spstudio__list{border-right:1px solid #222b39}.spstudio__edit{border-right:0}}
`;
      style.textContent += `
.spstudio__preview-stage :is(.spstudio__card-preview,.spstudio__detail-preview){font-family:var(--sp-preview-body-font,inherit)}
.spstudio__preview-stage :is(.spstudio__card-preview,.spstudio__detail-preview) h3 {font-family:var(--sp-preview-heading-font,inherit);font-size:var(--sp-preview-heading-size,22px);font-weight:var(--sp-preview-heading-weight,700)}
.spstudio__preview-stage :is(.spstudio__card-preview,.spstudio__detail-preview) p {font-family:var(--sp-preview-body-font,inherit);font-size:var(--sp-preview-body-size,16px)}
.spstudio__preview-stage .spstudio__detail-action {background:var(--sp-preview-accent);color:var(--sp-preview-cta-text,#ffffff)}
`;
    document.head.appendChild(style);
    }
    dialog = document.createElement('dialog');
    dialog.id = 'smartPlantStudioDialog';
    document.body.appendChild(dialog);
    return dialog;
  }

  function smartPlantCurrent(sectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section || section.type !== 'smart-plant') return null;
    if (!smartPlantStudioDrafts.has(sectionId)) smartPlantStudioDrafts.set(sectionId, smartPlantParse(section));
    const items = smartPlantStudioDrafts.get(sectionId);
    let selectedId = smartPlantStudioSelection.get(sectionId);
    if (!items.some((item) => item.id === selectedId)) selectedId = items[0]?.id || '';
    smartPlantStudioSelection.set(sectionId, selectedId);
    return { section, items, selectedId, selected:items.find((item) => item.id === selectedId) || null };
  }

  function smartPlantPreviewImage(section, value, alt = '') {
    const src = smartPlantAssetUrl(section, value);
    return src ? `<img src="${catalog.esc(src)}" alt="${catalog.esc(alt)}" onerror="this.style.visibility='hidden'">` : '<em>Sem imagem</em>';
  }

  function smartPlantRenderStudio(sectionId, tab = null) {
    const ctx = smartPlantCurrent(sectionId);
    const dialog = smartPlantEnsureDialog();
    if (!ctx) return;
    const { section, items, selectedId, selected } = ctx;
    const theme = smartPlantTheme(sectionId, section);
    const palette = smartPlantThemeVars(theme, section);
    const typeSystem = window.ImobifyTypeSystem;
    const brand = state.brand || {};
    const wizard = brand.typographyWizardEnabled && typeSystem;
    const roles = wizard ? typeSystem.normalize(brand.typographyRoles) : null;
    const pickFont = (role, fallback) => {
      const localStyle = section?.settings?.style;
      const family = localStyle?.enabled && role !== 'cta' && (role === 'body' ? localStyle.bodyFont : localStyle.headingFont) && (role === 'body' ? localStyle.bodyFont : localStyle.headingFont) !== 'inherit' ? (role === 'body' ? localStyle.bodyFont : localStyle.headingFont) : (roles?.[role]?.family || fallback);
      if (family === 'heading') return String(brand.headingFont || 'Manrope');
      if (family === 'body') return String(brand.bodyFont || 'DM Sans');
      return family;
    };
    const previewFont = (family) => `"${String(family).replace(/[^a-zA-Z0-9 éáàâãêíóôõúç-]/gi,'')}", sans-serif`;
    const previewStyle = [
      `--sp-preview-heading-font:${previewFont(pickFont('subheadline','heading'))}`,
      `--sp-preview-body-font:${previewFont(pickFont('body','body'))}`,
      `--sp-preview-heading-weight:${roles?.subheadline?.weight || brand.headingWeight || 700}`,
      `--sp-preview-heading-size:${roles?.subheadline?.size || 22}px`,
      `--sp-preview-body-size:${roles?.body?.size || brand.bodySize || 16}px`,
      `--sp-preview-cta-text:${catalog.esc(palette.ctaText)}`
    ].join(';');
    const currentTab = tab || dialog.dataset.tab || 'card';
    dialog.dataset.sectionId = sectionId;
    dialog.dataset.tab = currentTab;
    const rows = items.map((item) => `<div class="spstudio__plant-row ${item.id === selectedId ? 'is-active' : ''}" data-spstudio-select="${catalog.esc(item.id)}"><div class="spstudio__thumb">${smartPlantPreviewImage(section,item.image,item.title)}</div><div><strong>${catalog.esc(item.title)}</strong><small>${catalog.esc(item.area)}</small></div></div>`).join('');
    const features = selected ? smartPlantFeatures(selected.features) : [];
    const badgeMarkup = selected ? [selected.area, selected.composition, selected.bathrooms, ...features].filter(Boolean).map((item) => `<span class="spstudio__badge">${catalog.esc(item)}</span>`).join('') : '';
    const preview = !selected ? '<div class="spstudio__empty">Adicione uma planta para começar.</div>' : currentTab === 'detail'
      ? `<div class="spstudio__detail-preview">${smartPlantPreviewImage(section,selected.fullImage || selected.image,selected.title)}<div><h3>${catalog.esc(selected.title)}</h3><div class="spstudio__badges">${badgeMarkup}</div><p>${catalog.esc(selected.description)}</p>${selected.positionImage ? `<div style="max-width:220px;height:80px">${smartPlantPreviewImage(section,selected.positionImage,'Posição da planta')}</div>` : ''}<p>${catalog.esc(selected.position)}</p><button type="button" class="spstudio__detail-action">${catalog.esc(section.props.actionMode === 'form' ? section.props.actionLabelForm : section.props.actionLabelWhats)}</button></div></div>`
      : `<div class="spstudio__card-preview">${smartPlantPreviewImage(section,selected.image,selected.title)}<div><h3>${catalog.esc(selected.title)}</h3><p>${catalog.esc(selected.description)}</p><div class="spstudio__badges">${badgeMarkup}</div></div></div>`;
    const mediaBox = (key,label) => !selected ? '' : `<div class="spstudio__media"><div class="spstudio__media-title">${label}</div><div class="spstudio__drop" data-spstudio-drop="${key}">${smartPlantPreviewImage(section,selected[key],label)}</div><div class="spstudio__media-buttons"><button type="button" data-spstudio-pick="${key}">Selecionar</button><button type="button" data-spstudio-clear="${key}">Limpar</button><input class="spstudio__hidden-input" type="file" accept="image/*" data-spstudio-file="${key}"></div><small style="display:block;margin-top:7px;color:#778aa2">Arraste uma imagem aqui ou cole do clipboard com Ctrl+V.</small></div>`;
    const themeEditor = `<section class="spstudio__theme"><div class="spstudio__theme-head"><strong>Perfil de cores</strong><label><input type="checkbox" data-spstudio-theme-toggle ${theme.localTheme ? 'checked' : ''}> Personalizar localmente</label></div><div class="spstudio__color-grid ${theme.localTheme ? '' : 'is-disabled'}"><label class="spstudio__color-row"><input type="color" data-spstudio-theme="localAccent" value="${catalog.esc(theme.localAccent)}"><span>Destaque / CTA</span></label><label class="spstudio__color-row"><input type="color" data-spstudio-theme="localSectionBg" value="${catalog.esc(theme.localSectionBg)}"><span>Fundo da vitrine</span></label><label class="spstudio__color-row"><input type="color" data-spstudio-theme="localCardBg" value="${catalog.esc(theme.localCardBg)}"><span>Fundo dos cards</span></label><label class="spstudio__color-row"><input type="color" data-spstudio-theme="localModalBg" value="${catalog.esc(theme.localModalBg)}"><span>Fundo do detalhado</span></label><label class="spstudio__color-row"><input type="color" data-spstudio-theme="localText" value="${catalog.esc(theme.localText)}"><span>Texto principal</span></label><label class="spstudio__color-row"><input type="color" data-spstudio-theme="localMuted" value="${catalog.esc(theme.localMuted)}"><span>Texto secundário</span></label></div></section>`;
    dialog.innerHTML = `<div class="spstudio"><header class="spstudio__head"><div><h2>Smart Plant Studio</h2><p>Editor administrativo · o resultado público permanece independente</p></div><div class="spstudio__actions"><button type="button" data-spstudio-cancel>Cancelar</button><button type="button" class="primary" data-spstudio-save>Salvar plantas</button></div></header><div class="spstudio__body"><aside class="spstudio__list"><div class="spstudio__list-head"><strong>Plantas</strong><button type="button" data-spstudio-add>＋ Adicionar</button></div>${rows}<div class="spstudio__order"><button type="button" data-spstudio-move="up">↑</button><button type="button" data-spstudio-move="down">↓</button><button type="button" data-spstudio-duplicate>Duplicar</button><button type="button" class="danger" data-spstudio-delete>Excluir</button></div></aside><main class="spstudio__edit">${themeEditor}${selected ? `<div class="spstudio__grid2"><label class="spstudio__field"><span>Título</span><input data-spstudio-field="title" value="${catalog.esc(selected.title)}"></label><label class="spstudio__field"><span>Metragem</span><input data-spstudio-field="area" value="${catalog.esc(selected.area)}"></label></div><label class="spstudio__field"><span>Código / identificador</span><input data-spstudio-field="code" value="${catalog.esc(selected.code || '')}" placeholder="Ex.: VT-2D-6788"><small style="color:#72839a">Uso interno de conversão. É enviado ao Form Sender v4 quando o cliente selecionar esta planta.</small></label><label class="spstudio__field"><span>Descrição</span><textarea rows="3" data-spstudio-field="description">${catalog.esc(selected.description)}</textarea></label><div class="spstudio__grid2"><label class="spstudio__field"><span>Composição</span><input data-spstudio-field="composition" value="${catalog.esc(selected.composition)}"></label><label class="spstudio__field"><span>Banheiros</span><input data-spstudio-field="bathrooms" value="${catalog.esc(selected.bathrooms)}"></label></div><label class="spstudio__field"><span>Atributos</span><input data-spstudio-field="features" value="${catalog.esc(selected.features)}"><small style="color:#72839a">Separe os atributos com |</small></label><label class="spstudio__field"><span>Posição / observação</span><textarea rows="3" data-spstudio-field="position">${catalog.esc(selected.position)}</textarea></label>${mediaBox('image','Imagem do card')}${mediaBox('fullImage','Imagem detalhada')}${mediaBox('positionImage','Imagem da posição / implantação')}` : '<div class="spstudio__empty">Nenhuma planta selecionada.</div>'}</main><section class="spstudio__preview"><div class="spstudio__tabs"><button type="button" data-spstudio-tab="card" class="${currentTab === 'card' ? 'is-active' : ''}">Prévia da vitrine</button><button type="button" data-spstudio-tab="detail" class="${currentTab === 'detail' ? 'is-active' : ''}">Prévia detalhada</button></div><div class="spstudio__preview-stage" style="--sp-preview-accent:${catalog.esc(palette.accent)};--sp-preview-section:${catalog.esc(palette.sectionBg)};--sp-preview-card:${catalog.esc(palette.cardBg)};--sp-preview-modal:${catalog.esc(palette.modalBg)};--sp-preview-text:${catalog.esc(palette.text)};--sp-preview-muted:${catalog.esc(palette.muted)};${previewStyle}">${preview}</div></section></div></div>`;
  }

  function smartPlantOpenStudio(sectionId = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section || section.type !== 'smart-plant') return;
    smartPlantStudioDrafts.set(sectionId, smartPlantParse(section));
    smartPlantStudioSelection.set(sectionId, smartPlantParse(section)[0]?.id || '');
    smartPlantStudioThemes.set(sectionId, smartPlantThemeFromSection(section));
    const dialog = smartPlantEnsureDialog();
    smartPlantRenderStudio(sectionId, 'card');
    if (!dialog.open) dialog.showModal();
  }

  function smartPlantSetField(sectionId, key, value) {
    const ctx = smartPlantCurrent(sectionId); if (!ctx?.selected) return;
    ctx.selected[key] = value;
  }

  function smartPlantReadFile(file, callback) {
    if (!file || !String(file.type || '').startsWith('image/')) return;
    const reader = new FileReader(); reader.onload = () => callback(String(reader.result || '')); reader.readAsDataURL(file);
  }

  function smartPlantEditorLaunch(section) {
    if (!section || section.type !== 'smart-plant') return '';
    return `<div class="inspector-group"><h3>Plantas</h3><button class="btn btn-wide" type="button" data-open-smart-plant-studio>✦ Gerenciar plantas</button><small class="field-note">Abra o Studio para editar cards, textos, imagens e prévias em uma janela maior.</small></div>`;
  }


  // Benefits Showcase — edição assistida; preserva o formato serializado das versões anteriores.
  const bsIconNames = ['pool','laptop','fitness_center','shield','pets','celebration','elevator','location_on','park','directions_car','home','bed','waves','sailing','anchor','wifi','groups','child_care','spa','restaurant','sun','business','check_circle','eco','local_parking'];
  const bsDefaultsGroups = ['Lazer','Conveniência','Bem-estar','Segurança','Infraestrutura','Localização','Sustentabilidade','Outros'];
  // Catalogo remoto oficial Material Symbols: todos os nomes em .codepoints, inclusive novos.
  // Os SVGs selecionados sao incorporados ao JSON. A busca completa requer conexao para atualizar o indice.
  const bsGoogleIndexUrl='https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints';
  let bsMaterialNames=null;
  const bsSVGCache=new Map();
  function bsSanitizeSvg(raw){
    if(raw.length>70000)return null;
    const doc=new DOMParser().parseFromString(raw,'image/svg+xml');
    const svg=doc.documentElement;
    if(!svg||svg.localName!=='svg'||doc.querySelector('parsererror'))return null;
    const vb=svg.getAttribute('viewBox')||'0 0 24 24';
    if(!/^[0-9.\s-]{3,60}$/.test(vb))return null;
    const paths=[...svg.querySelectorAll('path')];
    if(!paths.length||paths.length>18)return null;
    const parts=paths.map(path=>{
      const d=path.getAttribute('d')||'';
      return d.length<=16000&&/^[MmLlHhVvCcSsQqTtAaZz0-9\s, .+\-]+$/.test(d)?`<path d="${d}"/>`:'';
    });
    if(parts.some(p=>!p))return null;
    const result=`<svg viewBox="${vb}">${parts.join('')}</svg>`;
    return result.length<25000?result:null;
  }
  async function bsMaterialSVG(name,style){
    if(!/^[a-z0-9_]{1,90}$/.test(name)||!['outlined','rounded','sharp'].includes(style))throw Error('Icone ou estilo invalido');
    const key=style+'/'+name;
    if(!bsSVGCache.has(key)){
      const url='https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/'+encodeURIComponent(name)+'/materialsymbols'+style+'/'+encodeURIComponent(name)+'_24px.svg';
      const pending=fetch(url).then(r=>{if(!r.ok)throw Error('SVG indisponivel: '+name);return r.text();}).then(bsSanitizeSvg).then(svg=>{if(!svg)throw Error('O SVG nao pode ser validado');return svg;});
      bsSVGCache.set(key,pending);
    }
    try{return await bsSVGCache.get(key);}catch(error){bsSVGCache.delete(key);throw error;}
  }
  async function bsGoogleNames(){
    if(bsMaterialNames)return bsMaterialNames;
    const response=await fetch(bsGoogleIndexUrl);
    if(!response.ok)throw Error('O catalogo oficial nao respondeu');
    const txt=await response.text();
    const names=txt.split(/\r?\n/).map(row=>row.split(/\s+/)[0]).filter(n=>/^[a-z0-9_]{1,90}$/.test(n));
    if(names.length<1000)throw Error('Indice Material Symbols incompleto');
    return bsMaterialNames=[...new Set(names)].sort((a,b)=>a.localeCompare(b));
  }

  function bsParse(raw) {
    return String(raw || '').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const parts=line.split('|');const icon=(parts.shift()||'').trim();
      return {icon:icon.replace(/^\*/,''),featured:icon.startsWith('*'),title:(parts.shift()||'').trim(),description:(parts.shift()||'').trim(),group:parts.join('|').trim()};
    });
  }
  function bsSerialize(items) { return items.map(item=>`${item.featured?'*':''}${item.icon}|${item.title}|${item.description}|${item.group}`).join('\n'); }
  function openBenefitsShowcaseWizard(){
    const source=state.sections.find(s=>s.id===state.selectedSectionId);
    if(!source||source.type!=='benefits-showcase')return;
    document.getElementById('bsWizardDialog')?.remove();
    const entries=bsParse(source.props.items).map(item=>({...item}));
    let svgMap={};try{svgMap=JSON.parse(source.props.iconSvgMap||'{}')||{};}catch(_){svgMap={};}
    let allIcons=bsIconNames.slice(), indexReady=false, savingIcon=false, iconObserver=null;
    let active=-1;
    const esc=catalog.esc;
    const dialog=document.createElement('dialog');dialog.id='bsWizardDialog';
    const style=document.createElement('style');style.id='bsWizardStyle';
    style.textContent=`#bsWizardDialog{width:min(1040px,calc(100vw - 24px));max-width:1040px;height:min(790px,calc(100dvh - 24px));max-height:calc(100dvh - 24px);padding:0;border:1px solid #394454;border-radius:15px;background:#121923;color:#e9eef6;overflow:hidden}#bsWizardDialog::backdrop{background:#05090dd9;backdrop-filter:blur(4px)}#bsWizardDialog *{box-sizing:border-box}#bsWizardDialog .bsw-shell{display:flex;flex-direction:column;height:100%}#bsWizardDialog header,#bsWizardDialog footer{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:15px 18px;background:#172130;border-bottom:1px solid #354053}#bsWizardDialog footer{border-top:1px solid #354053;border-bottom:0}#bsWizardDialog h2{font-size:17px;margin:0}#bsWizardDialog p{font-size:12px;color:#adb9c9;margin:5px 0 0}#bsWizardDialog button{cursor:pointer}#bsWizardDialog .bsw-body{min-height:0;flex:1;display:grid;grid-template-columns:minmax(225px,34%) 1fr}#bsWizardDialog .bsw-list{overflow:auto;border-right:1px solid #354053;padding:14px}#bsWizardDialog .bsw-edit{overflow:auto;padding:18px}#bsWizardDialog .bsw-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid #354053;border-radius:9px;padding:10px;margin:0 0 8px;background:#1b2838;color:#e6edf8}#bsWizardDialog .bsw-item.active{border-color:#8fbbe9;background:#25405a}#bsWizardDialog .bsw-item svg{width:25px;height:25px;flex-shrink:0}#bsWizardDialog .bsw-item small{display:block;color:#afbdcd;margin-top:3px}#bsWizardDialog .bsw-field{display:block;margin:0 0 14px;font-size:13px;font-weight:600}#bsWizardDialog input,#bsWizardDialog textarea,#bsWizardDialog select{display:block;width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid #48566a;background:#0c141f;color:white;font:inherit}#bsWizardDialog textarea{resize:vertical;min-height:80px}#bsWizardDialog .bsw-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(69px,1fr));gap:7px;margin:8px 0 17px;max-height:225px;overflow-y:auto}#bsWizardDialog .bsw-icon{border:1px solid #384658;background:#182536;color:#ceddec;border-radius:8px;padding:8px 3px;min-height:62px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}#bsWizardDialog .bsw-icon svg{width:23px;height:23px}#bsWizardDialog .bsw-icon small{font-size:9px;overflow-wrap:anywhere}#bsWizardDialog .bsw-icon.active{border-color:#8fc8ff;background:#2a4d6c}#bsWizardDialog .bsw-actions{display:flex;flex-wrap:wrap;gap:8px}#bsWizardDialog .bsw-btn{background:#233246;color:white;border:1px solid #48566a;border-radius:8px;padding:9px 12px}#bsWizardDialog .bsw-primary{background:#2d76b5;border-color:#368ed7}#bsWizardDialog .bsw-danger{color:#ffb5b5}#bsWizardDialog .bsw-empty{padding:24px;text-align:center;color:#b5c0cd}#bsWizardDialog .bsw-tools{display:flex;gap:7px;margin-bottom:12px;flex-wrap:wrap}#bsWizardDialog .bsw-hint{font-size:11px;color:#a8b6c7;margin-bottom:12px}#bsWizardDialog .bsw-icon:disabled{opacity:.6;cursor:wait}#bsWizardDialog .bsw-icon svg{color:#e7efff;fill:currentColor}#bsWizardDialog .bsw-index-status{font-size:11px;color:#a9c7df;margin:-6px 0 10px}#bsWizardDialog .bsw-icon-placeholder{font-size:18px;opacity:.35}#bsWizardDialog .bsw-icon-name{font-size:9px;overflow-wrap:anywhere}#bsWizardDialog .bsw-svg-preview{display:grid;place-items:center;width:24px;height:24px}#bsWizardDialog .bsw-svg-preview svg{width:24px;height:24px}@media(max-width:650px){#bsWizardDialog{width:100vw;height:100dvh;max-height:100dvh;border-radius:0}#bsWizardDialog .bsw-body{grid-template-columns:1fr;grid-template-rows:minmax(130px,35%) 1fr}#bsWizardDialog .bsw-list{border-right:0;border-bottom:1px solid #354053}}`;
    document.head.appendChild(style);
    dialog.innerHTML=`<div class="bsw-shell"><header><div><h2>Benefits Showcase · Gerenciador de benefícios</h2><p>Adicione, edite e organize os itens da section</p></div><button class="bsw-btn" type="button" data-bsw-action="cancel">✕ Fechar</button></header><div class="bsw-body"><aside class="bsw-list"><div class="bsw-tools"><button class="bsw-btn bsw-primary" data-bsw-action="add">＋ Adicionar</button><button class="bsw-btn" data-bsw-action="duplicate">Duplicar</button></div><div class="bsw-rows"></div></aside><main class="bsw-edit"></main></div><footer><span class="bsw-count"></span><div class="bsw-actions"><button class="bsw-btn" data-bsw-action="cancel">Cancelar</button><button class="bsw-btn bsw-primary" data-bsw-action="save">Salvar benefícios</button></div></footer></div>`;
    document.body.appendChild(dialog);
    function iconSvg(name){
      const style=['outlined','rounded','sharp'].includes(source.props.iconStyle)?source.props.iconStyle:'outlined';
      const chosen=svgMap[style+'/'+name]||svgMap['outlined/'+name];
      if(chosen)return chosen.replace('<svg viewBox=', '<svg fill="currentColor" viewBox=');
      if(!bsIconNames.includes(name))return '<span class="bsw-icon-placeholder" aria-hidden="true">◇</span>';
      const plugin=catalog.plugins['benefits-showcase'];
      const html=plugin.render({...source.props,items:`${name}|X|X|X`,categoryFilter:false},state,'bsw-icon-preview');
      return html.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/)?.[0] || '';
    }
    function renderIcons(){
      if(iconObserver)iconObserver.disconnect();
      const grid=dialog.querySelector('.bsw-icons');if(!grid)return;
      const q=(dialog.dataset.search||'').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      // Sinônimos imobiliários em português, mantendo pesquisa direta pelos nomes oficiais em inglês.
      const pt={piscina:'pool water hot_tub',academia:'fitness exercise gym',seguranca:'shield security verified_user',portaria:'security guard door',pet:'pets sound_detection_dog_barking',elevador:'elevator',garagem:'garage local_parking',localizacao:'location place map_pin',parque:'park forest nature',jardim:'yard nature park',praia:'beach_access',marina:'sailing directions_boat anchor',churrasqueira:'outdoor_grill',festas:'celebration event',reuniao:'meeting_room groups',trabalho:'laptop computer work',moradia:'home apartment',apartamento:'apartment',construcao:'construction engineering',sustentabilidade:'eco energy_savings_leaf',bicicleta:'directions_bike',ciclovia:'directions_bike',estacionamento:'local_parking',energia:'solar_power bolt',carro:'directions_car',onibus:'directions_bus',area:'park',familia:'family_restroom',infantil:'child_care toys',brinquedos:'toys',quadra:'sports_soccer sports_basketball sports_tennis'};
      const keys=q?Object.entries(pt).filter(([word])=>word.includes(q)||q.includes(word)).flatMap(([,val])=>val.split(' ')):[];
      const matching=allIcons.filter(x=>x.includes(q)||keys.some(alias=>x.includes(alias)));
      const names=matching.slice(0,64);
      dialog.querySelector('.bsw-index-status').textContent=indexReady
        ? `${matching.length} de ${allIcons.length} icones Material Symbols. Mostrando ate 64; refine pela busca.`
        : `25 icones locais. Conectando ao indice Google para liberar o catalogo completo...`;
      grid.innerHTML=names.map(name=>`<button type="button" class="bsw-icon ${entries[active]?.icon===name?'active':''}" data-bsw-icon="${name}" title="${name}"><span class="bsw-svg-preview">${iconSvg(name)}</span><small class="bsw-icon-name">${name}</small></button>`).join('')||'<p class="bsw-hint">Nenhum icone encontrado. Tente outro termo.</p>';
      if(!indexReady)return;
      const getPreview=async button=>{
        const name=button.dataset.bswIcon;
        if(!name||bsIconNames.includes(name)||button.dataset.loaded||!grid.contains(button))return;
        button.dataset.loaded='1';
        try{const style=['outlined','rounded','sharp'].includes(source.props.iconStyle)?source.props.iconStyle:'outlined';
          const svg=svgMap[style+'/'+name]||await bsMaterialSVG(name,style);
          if(grid.contains(button))button.querySelector('.bsw-svg-preview').innerHTML=svg;
        }catch(_){button.dataset.loaded='';}
      };
      if(typeof IntersectionObserver==='function'){
        iconObserver=new IntersectionObserver(items=>items.forEach(item=>{if(item.isIntersecting){iconObserver.unobserve(item.target);getPreview(item.target);}}),{root:grid,rootMargin:'60px'});
        grid.querySelectorAll('[data-bsw-icon]').forEach(b=>iconObserver.observe(b));
      }else grid.querySelectorAll('[data-bsw-icon]').forEach(getPreview);
    }
    function draw(){
      dialog.querySelector('.bsw-count').textContent=`${entries.length} de 48 benefícios`;
      dialog.querySelector('.bsw-rows').innerHTML=entries.map((it,i)=>`<button type="button" class="bsw-item ${i===active?'active':''}" data-bsw-index="${i}">${iconSvg(it.icon)}<span><strong>${esc(it.title||'Novo benefício')}</strong><small>${esc(it.group||'Sem grupo')}${it.featured?' · Destaque':''}</small></span></button>`).join('')||'<div class="bsw-empty">Nenhum benefício. Clique em Adicionar.</div>';
      const edit=dialog.querySelector('.bsw-edit');
      if(active<0||!entries[active]){edit.innerHTML='<div class="bsw-empty">Selecione um benefício ou clique em Adicionar.</div>';return;}
      const it=entries[active];
      edit.innerHTML=`<div class="bsw-actions" style="justify-content:space-between;margin-bottom:15px"><strong>Editar benefício ${active+1}</strong><div class="bsw-actions"><button class="bsw-btn" data-bsw-action="up" title="Mover para cima">↑</button><button class="bsw-btn" data-bsw-action="down" title="Mover para baixo">↓</button><button class="bsw-btn bsw-danger" data-bsw-action="delete">Remover</button></div></div><label class="bsw-field">Ícone SVG<input data-bsw-search placeholder="Pesquisar ícone (ex.: pool, pets, spa)" value="${esc(dialog.dataset.search||'')}"></label><div class="bsw-index-status" aria-live="polite"></div><div class="bsw-icons"></div><label class="bsw-field">Título<input maxlength="100" data-bsw-field="title" value="${esc(it.title)}" placeholder="Ex.: Piscina & Spa"></label><label class="bsw-field">Descrição<textarea maxlength="500" data-bsw-field="description" placeholder="Descrição objetiva do benefício">${esc(it.description)}</textarea></label><label class="bsw-field">Grupo / categoria<input list="bswGroupList" maxlength="90" data-bsw-field="group" value="${esc(it.group)}" placeholder="Ex.: Lazer"><datalist id="bswGroupList">${[...new Set([...bsDefaultsGroups,...entries.map(e=>e.group).filter(Boolean)])].map(g=>`<option value="${esc(g)}"></option>`).join('')}</datalist></label><label style="display:flex;gap:9px;align-items:center;font-size:13px"><input type="checkbox" data-bsw-field="featured" ${it.featured?'checked':''} style="width:auto;margin:0"> Destacar este benefício no layout</label><p class="bsw-hint">Alterações só serão aplicadas à página ao clicar em Salvar benefícios.</p>`;
      renderIcons();
    }
    active=entries.length?0:-1;draw();
    bsGoogleNames().then(names=>{if(!dialog.isConnected)return;allIcons=[...bsIconNames,...names.filter(name=>!bsIconNames.includes(name))];indexReady=true;renderIcons();}).catch(err=>{const label=dialog.querySelector('.bsw-index-status');if(label)label.textContent='Sem conexao com o catalogo completo do Google. Os 25 icones locais continuam disponiveis.';console.warn('[Benefits Showcase] catalogo Google',err);});
    dialog.addEventListener('input',e=>{
      if(e.target.matches('[data-bsw-search]')){dialog.dataset.search=e.target.value;renderIcons();return;}
      const key=e.target.dataset.bswField;if(!key||active<0)return;
      entries[active][key]=key==='featured'?e.target.checked:e.target.value;
      const row=dialog.querySelector(`[data-bsw-index="${active}"]`);
      if(row){row.querySelector('strong').textContent=entries[active].title||'Novo benefício';row.querySelector('small').textContent=(entries[active].group||'Sem grupo')+(entries[active].featured?' · Destaque':'');}
    });
    dialog.addEventListener('change',e=>{if(e.target.dataset.bswField==='featured'&&active>=0){entries[active].featured=e.target.checked;draw();}});
    dialog.addEventListener('click',e=>{
      const icon=e.target.closest('[data-bsw-icon]');if(icon&&active>=0){
        const name=icon.dataset.bswIcon;
        if(savingIcon)return;
        if(bsIconNames.includes(name)){
          entries[active].icon=name;dialog.dataset.search='';draw();return;
        }
        savingIcon=true;icon.disabled=true;
        const label=dialog.querySelector('.bsw-index-status');if(label)label.textContent='Preparando SVG oficial para exportacao offline...';
        Promise.allSettled(['outlined','rounded','sharp'].map(async style=>({style,svg:await bsMaterialSVG(name,style)})))
        .then(results=>{
          if(!dialog.isConnected)return;
          const all=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
          if(!all.length)throw Error('Nenhuma variante SVG disponivel no repositorio oficial');
          all.forEach(v=>{svgMap[v.style+'/'+name]=v.svg;});entries[active].icon=name;dialog.dataset.search='';draw();
        })
        .catch(err=>{alert('Nao foi possivel obter o SVG do Google. Confira sua conexao e tente novamente. '+err.message);renderIcons();})
        .finally(()=>{savingIcon=false;});return;
      }
      const row=e.target.closest('[data-bsw-index]');if(row){active=Number(row.dataset.bswIndex);dialog.dataset.search='';draw();return;}
      const action=e.target.closest('[data-bsw-action]')?.dataset.bswAction;if(!action)return;
      if(action==='cancel'){dialog.close();return;}
      if(action==='add'){if(entries.length>=48)return alert('O limite é de 48 benefícios.');entries.push({icon:'check_circle',title:'',description:'',group:'',featured:false});active=entries.length-1;dialog.dataset.search='';draw();dialog.querySelector('[data-bsw-field="title"]')?.focus();return;}
      if(action==='save'){
        if(savingIcon)return alert('Aguarde o download dos SVGs selecionados.');
        if(entries.some(e=>!e.title.trim()))return alert('Preencha o título de todos os benefícios antes de salvar.');
        if(entries.some(e=>/[|\r\n]/.test([e.icon,e.title,e.description,e.group].join(''))))return alert('Não use o caractere | ou quebras de linha nos campos.');
        const serialized=bsSerialize(entries);
        commit(draft=>{const target=draft.sections.find(s=>s.id===source.id);if(target&&target.type==='benefits-showcase')target.props.items=serialized;target.props.iconSvgMap=JSON.stringify(Object.fromEntries(Object.entries(svgMap).filter(([key])=>entries.some(entry=>key.endsWith('/'+entry.icon)))));});
        renderInspector();dialog.close();return;
      }
      if(active<0)return;
      if(action==='duplicate'&&entries.length<48){entries.splice(active+1,0,{...entries[active]});active++;}
      if(action==='delete'){entries.splice(active,1);active=Math.min(active,entries.length-1);}
      if(action==='up'&&active>0){[entries[active-1],entries[active]]=[entries[active],entries[active-1]];active--;}
      if(action==='down'&&active<entries.length-1){[entries[active+1],entries[active]]=[entries[active],entries[active+1]];active++;}
      dialog.dataset.search='';draw();
    });
    dialog.addEventListener('close',()=>{iconObserver?.disconnect();dialog.remove();style.remove();});
    dialog.addEventListener('cancel',()=>{});
    dialog.showModal();
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-bs-wizard-open]'))openBenefitsShowcaseWizard();});

  function renderInspector() {
    const section = state.sections.find((item) => item.id === state.selectedSectionId);
    $('#inspectorEmpty').style.display = section ? 'none' : 'block';
    $('#inspectorContent').style.display = section ? 'block' : 'none';
    if (!section) { $('#inspectorTitle').textContent = 'Selecione uma seção'; syncInspectorStateMenu(null, null); return; }
    const plugin = catalog.plugins[section.type];
    syncInspectorStateMenu(section, plugin);
    if (!plugin) {
      $('#inspectorTitle').textContent = 'Plugin ausente';
      $('#inspectorContent').innerHTML = `<div class="info-card"><strong>${catalog.esc(section.type)}</strong><p>Instale novamente o pacote ZIP deste plugin para editar e renderizar o componente.</p></div><div class="inspector-group"><button class="btn btn-wide danger" data-inspector-remove>Remover referência</button></div>`;
      return;
    }
    $('#inspectorTitle').textContent = plugin.name;
    const layoutMeta = buildSectionLayoutMeta();
    const selectedMeta = layoutMeta.get(section.id);
    const layoutParent = selectedMeta?.parentId ? state.sections.find((item) => item.id === selectedMeta.parentId) : null;
    const segmentParent = layoutParent && isSegmentLayout(layoutParent) ? layoutParent : null;
    const primaryFields = plugin.fields.filter((item) => item.panel !== 'advanced' && !(section.type === 'parallax' && ['heroPoints','pausePoints'].includes(item.key)));
    const advancedFields = plugin.fields.filter((item) => item.panel === 'advanced');
    const groups = [...new Set(primaryFields.map((item) => item.group))];
    const settings = section.settings || { visible:true, transition:'default' };
    const isDocumentTag = plugin.manifest?.output === 'document-tag';
    const guide = plugin.manifest?.inspectorGuide;
    const helpLaunch = guide?.enabled && guide?.kind === 'href-container'
      ? `<div class="inspector-group inspector-help-launch"><button class="btn btn-wide" type="button" data-inspector-how-use>✦ ${catalog.esc(guide.label || 'Como usar')}</button><small>${catalog.esc(guide.description || 'Veja o HREF real e a configuração desta instância.')}</small></div>`
      : '';
    const advancedGuide = plugin.manifest?.advancedInspector;
    const advancedLaunch = advancedGuide?.enabled && advancedFields.length
      ? `<div class="inspector-group inspector-advanced-launch"><h3>Studio avançado</h3><button class="btn btn-wide" type="button" data-open-advanced-inspector>✦ ${catalog.esc(advancedGuide.label || 'Abrir controles avançados')}</button><small>${catalog.esc(advancedGuide.description || 'Abra os controles complexos em uma janela flutuante.')}</small></div>`
      : '';
    const placement = segmentParent
      ? `<div class="inspector-group segment-placement"><h3>Posição no Segmento</h3><label class="inspector-field"><span>${segmentDirectionLabel(segmentParent)}</span><select class="control" data-segment-slot-select>${Array.from({ length:segmentTrackCount(segmentParent) }, (_, slot) => `<option value="${slot}" ${slot === (selectedMeta?.slot ?? 0) ? 'selected' : ''}>${segmentDirectionLabel(segmentParent)} ${slot + 1}</option>`).join('')}</select><small class="field-note">Reposiciona o componente sem alterar suas configurações. Uma célula pode conter vários itens.</small></label><button class="btn btn-wide" type="button" data-add-to-current-slot>+ Adicionar outro componente nesta célula</button></div>`
      : '';
    const visualKind = isSegmentLayout(section) ? 'Segmento' : (segmentParent ? 'Componente' : 'Seção');
    const segmentSummary = isSegmentLayout(section)
      ? `<div class="info-card segment-summary"><strong>${segmentTrackCount(section)} ${segmentDirectionLabel(section, true)}</strong><p>${selectedMeta?.childCount || 0} componente${selectedMeta?.childCount === 1 ? '' : 's'} distribuído${selectedMeta?.childCount === 1 ? '' : 's'} nas células. Use os botões “Inserir componente” diretamente na prévia.</p></div>`
      : '';
    const smartPlantEditor = smartPlantEditorLaunch(section);
    const modalPluginEditor = pluginModalEditorLaunch(section);
    const sectionBackground = isDocumentTag ? '' : renderSectionBackgroundInspector(section);
    const localStyle = isDocumentTag ? '' : renderSectionStyleInspector(section);
    const general = isDocumentTag
      ? `<div class="inspector-group"><h3>Tag do projeto</h3><div class="info-card"><strong>ID único</strong><p><code>${catalog.esc(section.id)}</code></p><p>Este identificador acompanha esta tag no projeto e também é gravado como comentário no HTML compilado.</p></div><div class="toggle-row"><span>Desativar na publicação</span><button class="switch ${settings.visible === false ? 'on' : ''}" data-section-setting-toggle="visible" aria-label="Desativar esta tag na publicação"></button></div><div class="inspector-actions"><button class="btn" data-inspector-duplicate>Duplicar tag</button></div></div>`
      : `<div class="inspector-group"><h3>${visualKind}</h3>${segmentSummary}<div class="toggle-row"><span>Ocultar ${visualKind.toLowerCase()}</span><button class="switch ${settings.visible === false ? 'on' : ''}" data-section-setting-toggle="visible" aria-label="Ocultar este bloco na publicação"></button></div><div class="toggle-row"><span>Ocultar no mobile</span><button class="switch ${settings.hideMobile === true ? 'on' : ''}" data-section-setting-toggle="hideMobile" aria-label="Ocultar este bloco no mobile; exibir somente no desktop"></button></div><div class="toggle-row"><span>Ocultar no desktop</span><button class="switch ${settings.hideDesktop === true ? 'on' : ''}" data-section-setting-toggle="hideDesktop" aria-label="Ocultar este bloco no desktop; exibir somente no mobile"></button></div><label class="inspector-field"><span>Tipografia deste plugin</span><select class="control" data-section-setting="typographyMode"><option value="inherit" ${settings.typographyMode !== 'local' ? 'selected' : ''}>Seguir Wizard global</option><option value="local" ${settings.typographyMode === 'local' ? 'selected' : ''}>Preservar estilo próprio</option></select><small class="field-note">Escolha estilo próprio para plugins com controles tipográficos independentes.</small></label><label class="inspector-field"><span>Âncora do bloco</span><input class="control" data-section-setting="anchorId" value="${catalog.esc(settings.anchorId || '')}" placeholder="ex.: contato"><small class="field-note">Use este identificador em links como #contato.</small></label><label class="inspector-field"><span>Transição de entrada</span><select class="control" data-section-setting="transition"><option value="default">Suave para cima</option><option value="fade">Fade</option><option value="slide-left">Deslizar da esquerda</option><option value="slide-right">Deslizar da direita</option><option value="zoom">Zoom suave</option><option value="scroll-reveal">Scroll Reveal</option><option value="mask-reveal">Mask Reveal</option><option value="curtain-reveal">Scroll-Driven Curtain Reveal</option><option value="scroll-triggered">Scroll-triggered Animation</option><option value="liquid-blur">Liquid Blur Reveal</option><option value="ripple-reveal">Ripple Reveal</option><option value="soft-focus">Soft Focus Reveal</option><option value="none">Sem animação</option></select></label><button class="btn" type="button" data-motion-settings-open style="width:100%;margin:9px 0">⚙ Configurar efeito de entrada</button><div class="inspector-actions"><button class="btn" data-inspector-duplicate>Duplicar</button><button class="btn" data-inspector-save-block>Salvar bloco</button></div></div>`;
    const elementMotionLaunch = isDocumentTag ? '' : `<div class="inspector-group"><h3>Animação dos elementos</h3><p class="helper">Presets independentes de texto, imagem e botão. A sequência começa depois da entrada da seção, usando seu gatilho atual.</p><button class="btn btn-wide" type="button" data-element-motion-open>✦ Configurar coreografia dos elementos</button></div>`;
    const benefitsModalEditor = renderBenefitsModalEditor(section);
    const propertySliderEditor = renderPropertySliderEditor(section);
    const parallaxPointEditor = renderParallaxPointEditor(section);
    $('#inspectorContent').innerHTML = helpLaunch + advancedLaunch + placement + general + modalPluginEditor + smartPlantEditor + benefitsModalEditor + propertySliderEditor + sectionBackground + localStyle + elementMotionLaunch + groups.map((group) => `<div class="inspector-group"><h3>${group || 'Plugin'}</h3>${primaryFields.filter((item) => item.group === group).map((field) => inspectorField(field, section.props[field.key], section)).join('')}</div>`).join('') + parallaxPointEditor + `<div class="inspector-group"><button class="btn btn-wide danger" data-inspector-remove>Remover ${isDocumentTag ? 'tag' : visualKind.toLowerCase()}</button></div>`;
    const transition = $('[data-section-setting="transition"]', $('#inspectorContent'));
    if (transition) transition.value = settings.transition || 'default';
    syncInspectorDynamicFields(section.id);
  }

  function openElementMotionModal(){
    const section=state.sections.find(s=>s.id===state.selectedSectionId);
    if(!section)return;
    document.getElementById('imobify-element-motion-modal')?.remove();
    const existing=section.settings?.elementMotion||{};
    const presets=[['none','Nenhum'],['orthogonal-assemble','Montagem ortogonal'],['line-reveal','Reveal por linhas'],['soft-focus','Soft focus'],['float-in','Float-in'],['layer-assemble','Layer assemble'],['mask-unveil','Mask unveil'],['subtle-scale','Subtle scale'],['orbit-settle','Órbita suave'],['elastic-dock','Encaixe elástico'],['diagonal-sweep','Varredura diagonal'],['flip-reveal','Virada 3D'],['arc-rise','Arco ascendente'],['depth-arrival','Entrada em profundidade'],['split-shift','Deslocamento lateral'],['tilt-unfold','Desdobrar inclinado'],['bounce-fade','Rebote delicado'],['wave-glide','Deslize ondulado'],['curtain-diagonal','Cortina diagonal'],['magnetic-snap','Encaixe magnético'],['architectural-curtain','Architectural curtain'],['kinetic-shear','Kinetic shear'],['depth-parallax','Depth parallax'],['light-sweep','Light sweep'],['prism-unfold','Prism unfold'],['liquid-mask','Liquid mask'],['cinema-focus','Cinema focus'],['stereo-drift','Stereo drift']];
    const draft=JSON.parse(JSON.stringify(existing.items||{}));
    const choreographyLibrary=[
      {id:'cinematic',name:'Cinematográfica',desc:'Foco, profundidade e CTA magnético',effects:['soft-focus','depth-arrival','arc-rise','magnetic-snap'],base:170,stagger:160},
      {id:'editorial',name:'Editorial em camadas',desc:'Revelações elegantes em sequência',effects:['line-reveal','mask-unveil','layer-assemble','subtle-scale'],base:140,stagger:130},
      {id:'dynamic',name:'Dinâmica alternada',desc:'Movimentos variados com encaixe',effects:['orbit-settle','wave-glide','split-shift','elastic-dock'],base:110,stagger:155},
      {id:'architecture',name:'Arquitetônica 3D',desc:'Volumes e perspectivas em construção',effects:['tilt-unfold','depth-arrival','flip-reveal','magnetic-snap'],base:180,stagger:165},
      {id:'cascade',name:'Cascata orgânica',desc:'Fluxo suave entre conteúdo e imagens',effects:['float-in','arc-rise','soft-focus','bounce-fade'],base:125,stagger:190},
      {id:'impact',name:'Impacto sofisticado',desc:'Entradas fortes com final delicado',effects:['curtain-diagonal','diagonal-sweep','elastic-dock','mask-unveil'],base:130,stagger:140},
      {id:'cinema-architect',name:'Arquitetura cinematográfica',desc:'Cortina, foco e planos com profundidade',effects:['architectural-curtain','cinema-focus','depth-parallax','light-sweep'],base:140,stagger:145},
      {id:'kinetic-luxury',name:'Editorial cinético',desc:'Recortes, torções e máscaras fluidas',effects:['kinetic-shear','prism-unfold','liquid-mask','stereo-drift'],base:110,stagger:135},
      {id:'light-depth',name:'Luz e profundidade',desc:'Entrada luminosa e composição em perspectiva',effects:['light-sweep','depth-parallax','cinema-focus','architectural-curtain'],base:160,stagger:170}
    ];
    const choreographyStorageKey='imobstudio.element-motion.choreographies.v1';
    const savedChoreographies=()=>{try{const obj=JSON.parse(localStorage.getItem(choreographyStorageKey)||'[]');return Array.isArray(obj)?obj.filter(x=>x&&typeof x.name==='string'&&x.items):[];}catch(_){return [];}};
    let chosenChoreography=existing.choreographyId||'';

    const modal=document.createElement('div');modal.id='imobify-element-motion-modal';
    modal.style.cssText='position:fixed;inset:0;z-index:999999;background:#050912dd;display:grid;place-items:center;padding:16px';
    const form=document.createElement('div');form.style.cssText='background:#172330;color:#f2f6fc;border:1px solid #607087;border-radius:14px;padding:18px;width:min(930px,96vw);max-height:90vh;overflow:auto;font:13px system-ui';
    const escape=catalog.esc;
    form.innerHTML=`<h2 style="margin:0 0 8px;font-size:18px">Motion Studio · Coreografia por elemento</h2><p>O gatilho e a transição da seção continuam funcionando como antes. Selecione os presets e confira a prévia individual.</p><div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0"><label>Atraso após a seção (ms) <input type="number" data-em-base min="0" max="2500" value="${Number(existing.baseDelayMs??150)}" style="width:90px"></label><label>Intervalo entre elementos (ms) <input type="number" data-em-stagger min="0" max="1000" value="${Number(existing.staggerMs??100)}" style="width:90px"></label></div><label style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;color:#e1ecf7">Sincronização <select data-em-scroll-mode style="background:#23384e;color:#fff;border:1px solid #6f8ba6;border-radius:7px;padding:8px"><option value="entrance">Entrada após gatilho da section</option><option value="scrub">Progresso vinculado ao scroll</option></select></label><small style="display:block;margin:-8px 0 14px;color:#acc0d5">Modo scroll acompanha a passagem da section pela tela; respeita movimento reduzido e dispensa bibliotecas externas.</small><div data-em-list>Carregando elementos…</div><div data-em-preview-panel style="position:sticky;bottom:0;margin-top:14px;padding:12px;background:#101c2a;border:1px solid #4e667d;border-radius:12px;box-shadow:0 -8px 24px #070d1688"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px"><strong style="color:#f0f6ff">Prévia da animação <small data-em-preview-name style="font-weight:400;color:#a8bed4">— selecione um preset</small></strong><button type="button" data-em-replay style="background:#29445d;color:#fff;border:1px solid #6186a5;padding:7px 13px;border-radius:8px;cursor:pointer">↻ Reproduzir novamente</button></div><div style="min-height:105px;display:grid;place-items:center;overflow:hidden;border:1px dashed #426079;border-radius:9px;background:linear-gradient(135deg,#1f3349,#142537);padding:14px"><div data-em-preview-target style="font-size:25px;line-height:1.2;font-weight:700;max-width:100%;text-align:center;color:#f5f8ff">Seu conteúdo ganha movimento</div></div><small style="display:block;margin-top:7px;color:#9fb3c8">Demonstração isolada. O botão “Testar” também reproduz o efeito no elemento real da página, quando disponível.</small></div><div style="display:flex;justify-content:flex-end;gap:9px;margin-top:18px"><button type="button" data-em-close style="background:#263b50;color:#f5f8ff;border:1px solid #7690aa;border-radius:8px;padding:10px 17px;font-weight:650;cursor:pointer">Cancelar</button><button type="button" data-em-save style="background:#2875b9;color:#fff;border:1px solid #58a7ec;border-radius:8px;padding:10px 17px;font-weight:700;cursor:pointer">Aplicar animações</button></div>`;
    form.querySelector('[data-em-scroll-mode]').value=existing.scrollMode==='scrub'?'scrub':'entrance';
    const libraryPanel=document.createElement('div');
    libraryPanel.setAttribute('data-em-library','');
    libraryPanel.style.cssText='margin:16px 0;padding:14px;border:1px solid #4b6b83;background:#101c2a;border-radius:12px';
    libraryPanel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><div><strong style="font-size:15px;color:#f2f7ff">✦ Coreografias combinadas</strong><div style="font-size:12px;color:#acbfd3;margin-top:3px">Escolha uma sequência pronta ou crie sua própria composição.</div></div><span style="font-size:11px;color:#aabed0">Prévia antes de aplicar</span></div><div style="display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin-top:12px"><label style="flex:1;min-width:190px">Biblioteca de coreografias<br><select data-em-choreography style="width:100%;max-width:440px;padding:9px;color:#f5f8ff;background:#23384e;border:1px solid #6f8ba6;border-radius:8px"></select></label><button type="button" data-em-load style="background:#2875b9;color:#fff;border:1px solid #65aeeb;border-radius:8px;padding:9px 12px;cursor:pointer">Aplicar combinação</button><button type="button" data-em-play-all style="background:#264757;color:#fff;border:1px solid #6d9ca9;border-radius:8px;padding:9px 12px;cursor:pointer">▶ Preview completo</button></div><p data-em-choreography-description style="margin:8px 0;color:#aabed0;font-size:12px"></p><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #324c63"><label style="flex:1;min-width:180px">Minha coreografia — nome<br><input data-em-custom-name maxlength="70" placeholder="Ex.: Hero apresentação premium" style="width:100%;padding:8px;color:#f5f8ff;background:#23384e;border:1px solid #6f8ba6;border-radius:8px"></label><button type="button" data-em-store style="background:#395d48;color:#fff;border:1px solid #6aa585;border-radius:8px;padding:9px 12px;cursor:pointer">＋ Salvar coreografia</button><button type="button" data-em-remove-custom style="background:#4c3340;color:#fff;border:1px solid #976477;border-radius:8px;padding:9px 12px;cursor:pointer">Excluir salva</button></div><small style="display:block;margin-top:9px;color:#96abc1">As coreografias personalizadas ficam salvas neste navegador. Ao aplicar, os parâmetros entram no JSON do projeto e na página exportada.</small>`;
    form.querySelector('[data-em-list]').before(libraryPanel);
    modal.appendChild(form);document.body.appendChild(modal);

    const preview=document.querySelector('#previewFrame')||document.querySelector('iframe');
    const doc=preview?.contentDocument;
    const root=doc?.querySelector(`[data-section-id="${CSS.escape(section.id)}"]`);
    const selectors='h1,h2,h3,h4,h5,h6,p,img,button,a,[data-design-role="title"],[data-design-role="subtitle"],[data-design-role="cta"]';
    let nodes=root?[...root.querySelectorAll(selectors)].filter(el=>el.closest('[data-section-id]')===root):[];
    if(!nodes.length){try{const plugin=catalog.plugins[section.type];const html=plugin?.render?.(section.props,state,section.id)||'';const parsed=new DOMParser().parseFromString(html,'text/html');const host=parsed.body.firstElementChild;nodes=host?[...host.querySelectorAll(selectors)]:[];}catch(_){}}
    const named=nodes.map((el,i)=>({key:String(i),name:`${i+1}. ${el.tagName.toLowerCase()} — ${String(el.textContent||el.alt||el.getAttribute('aria-label')||'imagem').trim().slice(0,65)}`}));
    const opts=presets.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
    form.querySelector('[data-em-list]').innerHTML=named.length?named.map(({key,name})=>{
      const c=draft[key]||{};
      return `<div data-em-row="${key}" style="border-top:1px solid #455569;padding:10px 0"><div style="font-weight:600;margin-bottom:6px">${escape(name)}</div><div style="display:flex;flex-wrap:wrap;align-items:end;gap:8px"><label>Preset<br><select data-em-field="preset">${opts}</select></label><label>Duração (ms)<br><input data-em-field="durationMs" type="number" min="200" max="2000" value="${Number(c.durationMs??750)}" style="width:90px"></label><label>Delay (ms)<br><input data-em-field="delayMs" type="number" min="0" max="2000" value="${Number(c.delayMs??120)}" style="width:85px"></label><label>Ordem<br><input data-em-field="order" type="number" min="0" max="99" value="${Number(c.order??Number(key)+1)}" style="width:65px"></label><label>Intensidade<br><select data-em-field="intensity"><option value="soft">Suave</option><option value="balanced">Equilibrada</option></select></label><button type="button" data-em-test="${key}">▶ Testar</button></div></div>`;
    }).join(''):'<p>Abra a pré-visualização da página para identificar os elementos. Você também pode configurar as animações diretamente depois que a prévia carregar.</p>';
    form.querySelectorAll('[data-em-row]').forEach(row=>{const c=draft[row.dataset.emRow]||{};row.querySelector('[data-em-field="preset"]').value=c.preset||'none';row.querySelector('[data-em-field="intensity"]').value=c.intensity||'soft';});
    const choreographySelect=form.querySelector('[data-em-choreography]');
    const updateChoreographyOptions=()=>{
      const previous=choreographySelect.value||chosenChoreography;
      choreographySelect.innerHTML='<option value="">Personalizada / edição manual</option>'+choreographyLibrary.map(o=>`<option value="${o.id}">${o.name}</option>`).join('')+savedChoreographies().map(o=>`<option value="custom:${escape(o.id)}">★ ${escape(o.name)}</option>`).join('');
      choreographySelect.value=[...choreographySelect.options].some(o=>o.value===previous)?previous:'';
      describeChoreography();
    };
    const describeChoreography=()=>{
      const key=choreographySelect.value;
      const template=choreographyLibrary.find(o=>o.id===key);
      const custom=key.startsWith('custom:')?savedChoreographies().find(o=>'custom:'+o.id===key):null;
      form.querySelector('[data-em-choreography-description]').textContent=template?.desc||(custom?'Combinação personalizada salva. Ajuste cada elemento abaixo antes de aplicar.':'Edite livremente os presets e a ordem de cada elemento.');
      form.querySelector('[data-em-remove-custom]').disabled=!custom;
      form.querySelector('[data-em-remove-custom]').style.opacity=custom?'1':'.45';
    };
    choreographySelect.addEventListener('change',describeChoreography);
    updateChoreographyOptions();
    let activePreviewKey=named[0]?.key??null;

    const playModalPreview=(key=activePreviewKey)=>{
      if(key===null)return;
      activePreviewKey=key;
      const row=form.querySelector(`[data-em-row="${key}"]`);
      if(!row)return;
      const preset=row.querySelector('[data-em-field="preset"]').value;
      const duration=Math.max(200,Math.min(2000,Number(row.querySelector('[data-em-field="durationMs"]').value)||750));
      const intensity=row.querySelector('[data-em-field="intensity"]').value==='balanced'?1:.62;
      const node=form.querySelector('[data-em-preview-target]');
      const original=nodes[Number(key)];
      const label=String(original?.textContent||original?.alt||original?.getAttribute('aria-label')||'Seu conteúdo ganha movimento').trim().replace(/\s+/g,' ').slice(0,90);
      node.textContent=original?.tagName==='IMG'?'Prévia de imagem':(label||'Seu conteúdo ganha movimento');
      form.querySelector('[data-em-preview-name]').textContent=`— ${presets.find(x=>x[0]===preset)?.[1]||preset}`;
      node.getAnimations().forEach(a=>a.cancel());
      node.style.opacity='1';node.style.transform='none';node.style.filter='none';node.style.clipPath='none';
      if(preset==='none'||!node.animate)return;
      const x=25*intensity,y=24*intensity,blur=7*intensity;
      const frame={opacity:0,transform:`translate3d(0,${y}px,0)`};
      if(preset==='orthogonal-assemble'){frame.transform=`translate3d(${-x}px,${y}px,0) rotate(-3deg) scale(.985)`;frame.clipPath='inset(0 0 75% 0)';}
      else if(preset==='line-reveal'){frame.transform=`translateY(${y}px)`;frame.clipPath='inset(100% 0 0 0)';}
      else if(preset==='soft-focus'){frame.filter=`blur(${blur}px)`;frame.transform=`translateY(${y/2}px)`;}
      else if(preset==='float-in'){frame.transform=`translate3d(0,${y}px,0)`;}
      else if(preset==='layer-assemble'){frame.transform=`translate3d(${x}px,${-y}px,0) scale(.98)`;}
      else if(preset==='mask-unveil'){frame.opacity=1;frame.transform='none';frame.clipPath='inset(0 100% 0 0)';}
      else if(preset==='subtle-scale'){frame.transform='scale(.963)';}
      else if(preset==='orbit-settle'){frame.transform=`translate3d(${-x*2}px,${y*1.4}px,0) rotate(-9deg) scale(.92)`;}
      else if(preset==='elastic-dock'){frame.transform=`translate3d(${x*2.4}px,0,0) scale(.92)`;}
      else if(preset==='diagonal-sweep'){frame.transform=`translate3d(${-x*1.8}px,${y*1.8}px,0)`;frame.clipPath='inset(0 70% 70% 0)';}
      else if(preset==='flip-reveal'){frame.transform='perspective(700px) rotateX(-48deg) translateY(16px)';}
      else if(preset==='arc-rise'){frame.transform=`translate3d(${x*1.5}px,${y*2}px,0) rotate(7deg)`;}
      else if(preset==='depth-arrival'){frame.transform='perspective(700px) translateZ(-180px) scale(.86)';frame.filter=`blur(${blur*.65}px)`;}
      else if(preset==='split-shift'){frame.transform=`translate3d(${-x*2}px,${-y*.5}px,0) skewX(-8deg)`;}
      else if(preset==='tilt-unfold'){frame.opacity=1;frame.transform='perspective(650px) rotateY(-35deg) scale(.94)';frame.clipPath='inset(0 85% 0 0)';}
      else if(preset==='bounce-fade'){frame.transform=`translate3d(0,${y*2}px,0) scale(.9)`;}
      else if(preset==='wave-glide'){frame.transform=`translate3d(${x*1.6}px,${y*.8}px,0) rotate(4deg)`;}
      else if(preset==='curtain-diagonal'){frame.opacity=1;frame.transform=`translate3d(0,${y*.5}px,0)`;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';}
      else if(preset==='magnetic-snap'){frame.transform=`translate3d(${-x*1.7}px,${y*.5}px,0) scale(.94) rotate(-4deg)`;}
      else if(preset==='architectural-curtain'){frame.opacity=1;frame.clipPath='inset(0 100% 0 0)';frame.transform=`scale(1.06) translateX(${x}px)`;}
      else if(preset==='kinetic-shear'){frame.transform=`translate3d(${-x*2}px,${y}px,0) skewX(13deg)`;frame.clipPath='inset(0 35% 0 0)';}
      else if(preset==='depth-parallax'){frame.transform=`perspective(900px) translate3d(0,${y*2}px,-120px) rotateX(9deg) scale(.88)`;}
      else if(preset==='light-sweep'){frame.filter=`brightness(1.8) blur(${blur}px)`;frame.transform=`translateX(${-x}px) scale(1.04)`;}
      else if(preset==='prism-unfold'){frame.opacity=1;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';frame.transform='perspective(950px) rotateY(-24deg)';}
      else if(preset==='liquid-mask'){frame.opacity=1;frame.clipPath='ellipse(0% 10% at 50% 50%)';frame.filter=`blur(${blur*.65}px)`;}
      else if(preset==='cinema-focus'){frame.filter=`blur(${blur*1.7}px) brightness(.7)`;frame.transform='scale(1.115)';}
      else if(preset==='stereo-drift'){frame.transform=`perspective(900px) translate3d(${x*2}px,${-y}px,-90px) rotateY(16deg)`;}
      const end={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};
      const overshoot={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};
      let frames=[frame,{opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'}],easing='cubic-bezier(.22,1,.36,1)';
      if(preset==='elastic-dock'||preset==='magnetic-snap'||preset==='bounce-fade'){
        const offset=preset==='bounce-fade'?`translateY(${-y*.28}px) scale(1.035)`:`translateX(${-x*.25}px) scale(1.025)`;
        frames=[{...frame,offset:0},{...overshoot,transform:offset,offset:.72},{...end,offset:1}];easing='ease-out';
      }else if(preset==='orbit-settle'||preset==='arc-rise'||preset==='wave-glide'){
        frames=[{...frame,offset:0},{...overshoot,transform:`translate3d(${x*.35}px,${-y*.28}px,0) rotate(-2deg)`,offset:.68},{...end,offset:1}];
      }else if(preset==='curtain-diagonal'){
        frames=[{...frame,offset:0},{...overshoot,clipPath:'polygon(0 0,75% 0,100% 100%,0 100%)',offset:.62},{...end,clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',offset:1}];
      }
      const animation=node.animate(frames,{duration,fill:'backwards',easing});
      animation.finished.then(()=>animation.cancel()).catch(()=>{});
    };
    form.addEventListener('change',e=>{const row=e.target.closest('[data-em-row]');if(row&&e.target.matches('[data-em-field]'))playModalPreview(row.dataset.emRow);});
    form.addEventListener('focusin',e=>{const row=e.target.closest('[data-em-row]');if(row&&row.dataset.emRow!==activePreviewKey)playModalPreview(row.dataset.emRow);});
    form.querySelector('[data-em-replay]').addEventListener('click',()=>playModalPreview());
    if(activePreviewKey!==null)playModalPreview(activePreviewKey);
    const read=()=>{form.querySelectorAll('[data-em-row]').forEach(row=>{const o={};row.querySelectorAll('[data-em-field]').forEach(input=>o[input.dataset.emField]=input.type==='number'?Number(input.value):input.value);draft[row.dataset.emRow]=o;});};
    const populateRows=()=>{form.querySelectorAll('[data-em-row]').forEach(row=>{const config=draft[row.dataset.emRow]||{};row.querySelectorAll('[data-em-field]').forEach(input=>{const val=config[input.dataset.emField];if(val!==undefined)input.value=val;});});if(activePreviewKey!==null)playModalPreview(activePreviewKey);};
    const loadChoreography=()=>{
      const key=choreographySelect.value;
      const built=choreographyLibrary.find(o=>o.id===key);
      const custom=key.startsWith('custom:')?savedChoreographies().find(o=>'custom:'+o.id===key):null;
      if(built){named.forEach(({key:i},position)=>{draft[i]={preset:built.effects[position%built.effects.length],durationMs:position===0?950:730,delayMs:position===0?0:80,order:position+1,intensity:'soft'};});form.querySelector('[data-em-base]').value=built.base;form.querySelector('[data-em-stagger]').value=built.stagger;}
      else if(custom){Object.keys(draft).forEach(k=>delete draft[k]);Object.assign(draft,JSON.parse(JSON.stringify(custom.items)));form.querySelector('[data-em-base]').value=custom.baseDelayMs;form.querySelector('[data-em-stagger]').value=custom.staggerMs;form.querySelector('[data-em-custom-name]').value=custom.name;}
      else return;
      chosenChoreography=key;populateRows();
    };
    const previewSequence=()=>{
      read();
      if(!named.length)return;
      const cfg={baseDelayMs:Math.max(0,Number(form.querySelector('[data-em-base]').value)||0),staggerMs:Math.max(0,Number(form.querySelector('[data-em-stagger]').value)||0),items:JSON.parse(JSON.stringify(draft))};
      const sorted=named.filter(o=>cfg.items[o.key]?.preset&&cfg.items[o.key].preset!=='none').sort((a,b)=>(Number(cfg.items[a.key].order)||0)-(Number(cfg.items[b.key].order)||0));
      if(!sorted.length){form.querySelector('[data-em-preview-name]').textContent='— configure ao menos um elemento';return;}
      // Preview the entire composition on the actual section, without waiting for the scroll trigger.
      preview?.contentWindow?.postMessage({type:'imobify-element-motion-preview-all',sectionId:section.id,config:cfg},'*');
      // The modal preview also cycles through every configured item, following its relative schedule.
      const token=++previewSequence.token;
      sorted.forEach((o,i)=>{const cfgItem=cfg.items[o.key];setTimeout(()=>{if(token!==previewSequence.token||!modal.isConnected)return;playModalPreview(o.key);},Math.min(11000,cfg.baseDelayMs+i*cfg.staggerMs+(Number(cfgItem.delayMs)||0)));});
    };
    previewSequence.token=0;
    form.addEventListener('click',e=>{
      if(e.target.closest('[data-em-load]')){loadChoreography();return;}
      if(e.target.closest('[data-em-play-all]')){previewSequence();return;}
      if(e.target.closest('[data-em-store]')){
        read();const name=form.querySelector('[data-em-custom-name]').value.trim();if(!name){form.querySelector('[data-em-custom-name]').focus();return;}
        const collection=savedChoreographies();const existingCustom=collection.find(o=>o.name.toLowerCase()===name.toLowerCase());
        const id=existingCustom?.id||('preset-'+Date.now().toString(36));
        const entry={id,name,baseDelayMs:Number(form.querySelector('[data-em-base]').value)||0,staggerMs:Number(form.querySelector('[data-em-stagger]').value)||0,items:JSON.parse(JSON.stringify(draft))};
        const next=[...collection.filter(o=>o.id!==id),entry];
        try{localStorage.setItem(choreographyStorageKey,JSON.stringify(next));chosenChoreography='custom:'+id;updateChoreographyOptions();choreographySelect.value=chosenChoreography;describeChoreography();}catch(err){alert('Não foi possível salvar esta coreografia neste navegador.');}
        return;
      }
      if(e.target.closest('[data-em-remove-custom]')){
        const key=choreographySelect.value;if(!key.startsWith('custom:'))return;
        try{localStorage.setItem(choreographyStorageKey,JSON.stringify(savedChoreographies().filter(o=>'custom:'+o.id!==key)));chosenChoreography='';updateChoreographyOptions();}catch(err){alert('Não foi possível excluir a coreografia.');}return;
      }

      if(e.target.closest('[data-em-close]')){modal.remove();return;}
      if(e.target.closest('[data-em-save]')){read();const base=Number(form.querySelector('[data-em-base]').value);const stagger=Number(form.querySelector('[data-em-stagger]').value);commit(d=>{const target=d.sections.find(x=>x.id===section.id);if(target){target.settings ||= {};target.settings.elementMotion={baseDelayMs:Math.max(0,Math.min(2500,base||0)),staggerMs:Math.max(0,Math.min(1000,stagger||0)),scrollMode:form.querySelector('[data-em-scroll-mode]').value,choreographyId:chosenChoreography,items:draft};}});modal.remove();return;}
      const test=e.target.closest('[data-em-test]');if(test){read();playModalPreview(test.dataset.emTest);const el=nodes[Number(test.dataset.emTest)];const config=draft[test.dataset.emTest];if(config?.preset!=='none')preview?.contentWindow?.postMessage({type:'imobify-element-motion-test',sectionId:section.id,index:Number(test.dataset.emTest),config},'*');}
    });
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-element-motion-open]'))openElementMotionModal();});

  function previewSandbox(editor) {
    if (!editor) return 'allow-scripts allow-forms allow-popups allow-presentation';
    const activeTypes = new Set((state.sections || []).filter((section) => section.settings?.visible !== false).map((section) => section.type));
    const activePlugins = [...activeTypes, ...(state.behaviorPlugins || [])].map((key) => catalog.plugins[key]).filter(Boolean);
    const hasInstalledPlugin = activePlugins.some((plugin) => plugin.pluginSource === 'installed');
    const needsTrustedYouTubeEmbed = activeTypes.has('youtube') && catalog.plugins.youtube?.pluginSource === 'bundled';
    const needsTrustedSameOrigin = needsTrustedYouTubeEmbed;
    return needsTrustedSameOrigin && !hasInstalledPlugin
      ? 'allow-scripts allow-forms allow-same-origin allow-presentation'
      : 'allow-scripts allow-forms allow-presentation';
  }

  async function renderPreview(target = $('#previewFrame'), editor = true, view = {}) {
    if (!target) return;
    const token = (renderTokens.get(target) || 0) + 1;
    renderTokens.set(target, token);
    try {
      target.setAttribute('sandbox', previewSandbox(editor));
      const isMainPreview = target === $('#previewFrame');
      const keepEditingSectionVisible = editor && isMainPreview && Boolean(state.selectedSectionId);
      const focusSelected = view.focusSelected === false ? false : Boolean(view.focusSelected || keepEditingSectionVisible);
      const restoreScrollY = isMainPreview && !focusSelected ? Number(previewViewport.scrollY) || 0 : 0;
      const html = await renderer.buildInlineDocument(state, { editor, restoreScrollY, focusSelected });
      if (token !== renderTokens.get(target)) return;
      // Evita reinicializar scripts, vídeos e plugins se o HTML é idêntico.
      if (target.__imobifyLastHTML !== html) {
        target.__imobifyLastHTML = html;
        target.srcdoc = html;
      }
    } catch (error) {
      console.error(error);
      if (token !== renderTokens.get(target)) return;
      target.srcdoc = `<style>body{font-family:system-ui;padding:40px;background:#fff3f3;color:#6a2020}</style><h2>Não foi possível montar a prévia.</h2><p>Abra o framework por um servidor local. Consulte o README.</p>`;
    }
  }

  function refresh(preview = true) {
    $('#projectName').value = state.projectName;
    renderStrategy();
    renderPluginLibrary($('#pluginSearch').value);
    renderInstalledPlugins();
    renderSectionList();
    renderReusableBlocks();
    renderProjectLibrary();
    renderProjectPresetLibrary();
    renderProductionSettings();
    renderPresets();
    renderSeo();
    renderInspector();
    $('#undoBtn').disabled = !undoStack.length;
    $('#redoBtn').disabled = !redoStack.length;
    if (preview) schedulePreview();
  }

  function selectSection(id) {
    state.selectedSectionId = id;
    saveState({ dirty:false });
    renderSectionList();
    renderInspector();
    previewViewport.selectedId = id;
    schedulePreview();
  }

  function logicalInsertIndexAfterSelection(sections = state.sections) {
    const meta = buildSectionLayoutMeta(sections);
    const selected = state.selectedSectionId && meta.get(state.selectedSectionId);
    if (selected) {
      const parent = selected.parentId ? meta.get(selected.parentId) : null;
      const owner = parent || selected;
      return owner.index + owner.span;
    }
    const footerIndex = sections.findIndex((item) => item.type === 'footer');
    return footerIndex >= 0 ? footerIndex : sections.length;
  }

  function createSegment(direction = 'columns', tracks = 2, insertIndex = null) {
    if (!catalog.plugins['segment-layout']) return toast('O componente Segmento não está disponível.', 'error');
    const normalizedDirection = direction === 'rows' ? 'rows' : 'columns';
    const normalizedTracks = Math.max(1, Math.min(5, Number(tracks) || 1));
    commit((draft) => {
      const segment = catalog.createSection('segment-layout');
      segment.props.direction = normalizedDirection;
      segment.props.tracks = normalizedTracks;
      segment.props.itemCount = 0;
      const target = Number.isInteger(insertIndex) ? insertIndex : logicalInsertIndexAfterSelection(draft.sections);
      draft.sections.splice(Math.max(0, Math.min(target, draft.sections.length)), 0, segment);
      draft.selectedSectionId = segment.id;
    });
    toast(`Segmento com ${normalizedTracks} ${normalizedDirection === 'rows' ? (normalizedTracks === 1 ? 'linha' : 'linhas') : (normalizedTracks === 1 ? 'coluna' : 'colunas')} adicionado.`);
  }

  function addOrTogglePlugin(key, insertIndex = null, segmentTarget = null) {
    const plugin = catalog.plugins[key];
    if (!plugin) return;
    if (plugin.kind === 'behavior') {
      commit((draft) => {
        const index = draft.behaviorPlugins.indexOf(key);
        if (index >= 0) draft.behaviorPlugins.splice(index, 1); else draft.behaviorPlugins.push(key);
      });
      return toast(`${plugin.name} ${state.behaviorPlugins.includes(key) ? 'ativado' : 'desativado'}.`);
    }
    if (segmentTarget) {
      const targetSegment = state.sections.find((item) => item.id === segmentTarget.segmentId);
      const segmentPlugin = catalog.plugins[targetSegment?.type];
      if (!targetSegment || !isSegmentLayout(targetSegment)) return toast('O Segmento de destino não existe mais.', 'error');
      if (!pluginCanOccupySegment(plugin, segmentPlugin)) return toast(`${plugin.name} é uma seção inteira e não pode ocupar uma célula.`, 'error');
      let warning = '';
      commit((draft) => {
        const meta = buildSectionLayoutMeta(draft.sections);
        const parentMeta = meta.get(segmentTarget.segmentId);
        const segment = draft.sections.find((item) => item.id === segmentTarget.segmentId);
        if (!parentMeta || !segment) { warning = 'O Segmento de destino não existe mais.'; return; }
        const maxChildren = Math.max(1, Number(catalog.plugins[segment.type]?.manifest?.layout?.maxChildren) || 25);
        const count = Math.max(0, Number(segment.props?.itemCount) || 0);
        if (count >= maxChildren) { warning = `Este Segmento aceita no máximo ${maxChildren} componentes.`; return; }
        const section = catalog.createSection(key);
        section.settings.layoutSlot = Math.max(0, Math.min(segmentTrackCount(segment) - 1, Number(segmentTarget.slot) || 0));
        draft.sections.splice(parentMeta.index + parentMeta.span, 0, section);
        segment.props.itemCount = count + 1;
        draft.selectedSectionId = section.id;
      });
      pendingInsertIndex = null;
      pendingSegmentTarget = null;
      if (warning) return toast(warning, 'error');
      return toast(`${plugin.name} inserido em ${segmentDirectionLabel(targetSegment).toLowerCase()} ${Math.max(0, Number(segmentTarget.slot) || 0) + 1}.`);
    }
    commit((draft) => {
      const section = catalog.createSection(key);
      const footerIndex = draft.sections.findIndex((item) => item.type === 'footer');
      const target = Number.isInteger(insertIndex) ? insertIndex : (footerIndex >= 0 && key !== 'footer' ? footerIndex : draft.sections.length);
      draft.sections.splice(Math.max(0, Math.min(target, draft.sections.length)), 0, section);
      draft.selectedSectionId = section.id;
    });
    pendingInsertIndex = null;
    pendingSegmentTarget = null;
    toast(`${plugin.name} adicionado.`);
  }

  function removeSection(id) {
    const section = state.sections.find((item) => item.id === id);
    if (!section) return;
    commit((draft) => {
      const meta = buildSectionLayoutMeta(draft.sections);
      const source = meta.get(id);
      if (!source) return;
      if (source.parentId) {
        const parent = draft.sections.find((item) => item.id === source.parentId);
        if (parent) parent.props.itemCount = Math.max(0, (Number(parent.props.itemCount) || 0) - 1);
      }
      // Remove a árvore lógica inteira. Isso é essencial quando um Segmento contém
      // outro Segmento, que por sua vez pode conter novos componentes/Segmentos.
      const removedIds = new Set(draft.sections.slice(source.index, source.index + source.span).map((item) => item.id));
      draft.sections.splice(source.index, source.span);
      if (removedIds.has(draft.selectedSectionId)) draft.selectedSectionId = null;
    });
    toast(`${catalog.plugins[section.type]?.name || 'Seção'} removido.`);
  }

  function moveSectionSlot(id, deltaOrSlot, absolute = false) {
    let warning = '';
    commit((draft) => {
      const meta = buildSectionLayoutMeta(draft.sections);
      const source = meta.get(id);
      const parent = source?.parentId ? draft.sections.find((item) => item.id === source.parentId) : null;
      const section = draft.sections.find((item) => item.id === id);
      if (!source || !parent || !section || !isSegmentLayout(parent)) { warning = 'Este componente não está dentro de um Segmento.'; return; }
      const current = Math.max(0, Number(source.slot) || 0);
      const requested = absolute ? Number(deltaOrSlot) : current + Number(deltaOrSlot);
      const next = Math.max(0, Math.min(segmentTrackCount(parent) - 1, Number.isFinite(requested) ? requested : current));
      section.settings = { ...(section.settings || {}), layoutSlot:next };
    });
    if (warning) toast(warning, 'error');
  }

  function moveSection(id, direction) {
    const meta = buildSectionLayoutMeta();
    const source = meta.get(id);
    if (!source) return;
    const parent = source.parentId ? state.sections.find((item) => item.id === source.parentId) : null;
    if (parent && isSegmentLayout(parent)) return moveSectionSlot(id, direction === 'up' ? -1 : 1);
    const siblings = [...meta.entries()]
      .filter(([, item]) => item.parentId === source.parentId)
      .sort((a, b) => a[1].index - b[1].index);
    const current = siblings.findIndex(([sectionId]) => sectionId === id);
    const sibling = direction === 'up' ? siblings[current - 1] : siblings[current + 1];
    if (!sibling) return;
    moveSectionTo(id, sibling[0], direction === 'up' ? 'before' : 'after');
  }

  function moveSectionTo(id, targetId, position = 'before') {
    let warning = '';
    commit((draft) => {
      const meta = buildSectionLayoutMeta(draft.sections);
      const source = meta.get(id);
      const target = meta.get(targetId);
      if (!source || !target || id === targetId) return;
      const sourceSection = draft.sections[source.index];
      const sourcePlugin = catalog.plugins[sourceSection?.type];

      let nextParentId = target.parentId || null;
      if (!target.parentId && ['next-sections', 'segment-slots'].includes(target.layout?.mode) && position === 'after') nextParentId = targetId;
      if (nextParentId) {
        const parentMeta = meta.get(nextParentId);
        if (parentMeta && parentMeta.index >= source.index && parentMeta.index < source.index + source.span) {
          warning = 'Não é possível mover um layout para dentro dele mesmo.';
          return;
        }
      }

      const nextParent = nextParentId ? draft.sections.find((item) => item.id === nextParentId) : null;
      const nextParentPlugin = nextParent && catalog.plugins[nextParent.type];
      const nextIsSegment = nextParent && isSegmentLayout(nextParent);
      if (source.parentId !== nextParentId && nextParentId) {
        const maxChildren = Math.max(0, Number(nextParentPlugin?.manifest?.layout?.maxChildren) || 8);
        const count = Math.max(0, Number(nextParent?.props?.itemCount) || 0);
        if (count >= maxChildren) { warning = `Este layout aceita no máximo ${maxChildren} blocos.`; return; }
        if (nextIsSegment && !pluginCanOccupySegment(sourcePlugin, nextParentPlugin)) {
          warning = `${sourcePlugin?.name || 'Esta seção'} ocupa uma seção inteira e não pode entrar em uma célula.`;
          return;
        }
      }

      let insertIndex;
      if (!target.parentId && ['next-sections', 'segment-slots'].includes(target.layout?.mode) && position === 'after') insertIndex = target.index + 1;
      else insertIndex = target.index + (position === 'after' ? target.span : 0);
      if (insertIndex >= source.index && insertIndex <= source.index + source.span) return;

      let nextSlot = 0;
      if (nextIsSegment) {
        if (target.parentId === nextParentId && target.slot != null) nextSlot = Number(target.slot) || 0;
        else if (source.parentId === nextParentId && source.slot != null) nextSlot = Number(source.slot) || 0;
        nextSlot = Math.max(0, Math.min(segmentTrackCount(nextParent) - 1, nextSlot));
      }

      const movedSections = draft.sections.splice(source.index, source.span);
      if (insertIndex > source.index) insertIndex -= source.span;
      insertIndex = Math.max(0, Math.min(draft.sections.length, insertIndex));
      draft.sections.splice(insertIndex, 0, ...movedSections);

      if (source.parentId !== nextParentId) {
        const oldParent = source.parentId ? draft.sections.find((item) => item.id === source.parentId) : null;
        const newParent = nextParentId ? draft.sections.find((item) => item.id === nextParentId) : null;
        if (oldParent) oldParent.props.itemCount = Math.max(0, (Number(oldParent.props.itemCount) || 0) - 1);
        if (newParent) newParent.props.itemCount = Math.max(0, (Number(newParent.props.itemCount) || 0) + 1);
      }
      const movedRoot = movedSections[0];
      if (movedRoot?.settings) {
        if (nextIsSegment) movedRoot.settings.layoutSlot = nextSlot;
        else delete movedRoot.settings.layoutSlot;
      }
    });
    if (warning) toast(warning, 'error');
  }

  function duplicateSection(id) {
    const source = state.sections.find((item) => item.id === id);
    if (!source) return;
    commit((draft) => {
      const meta = buildSectionLayoutMeta(draft.sections);
      const sourceMeta = meta.get(id);
      if (!sourceMeta) return;
      const segment = draft.sections.slice(sourceMeta.index, sourceMeta.index + sourceMeta.span).map((item) => {
        const duplicate = clone(item);
        catalog.refreshSectionIdentity(duplicate);
        return duplicate;
      });
      draft.sections.splice(sourceMeta.index + sourceMeta.span, 0, ...segment);
      if (sourceMeta.parentId) {
        const parent = draft.sections.find((item) => item.id === sourceMeta.parentId);
        if (parent) parent.props.itemCount = Math.max(0, Number(parent.props.itemCount) || 0) + 1;
      }
      draft.selectedSectionId = segment[0]?.id || null;
    });
    toast('Seção duplicada.');
  }

  function toggleSectionVisibility(id) {
    commit((draft) => {
      const section = draft.sections.find((item) => item.id === id);
      if (!section) return;
      section.settings = { visible:true, hideMobile:false, hideDesktop:false, transition:'default', ...(section.settings || {}) };
      section.settings.visible = section.settings.visible === false;
    });
  }

  function toggleSectionBooleanSetting(id, key) {
    if (!['visible', 'hideMobile', 'hideDesktop'].includes(key)) return;
    if (key === 'visible') return toggleSectionVisibility(id);
    commit((draft) => {
      const section = draft.sections.find((item) => item.id === id);
      if (!section) return;
      section.settings = { visible:true, hideMobile:false, hideDesktop:false, transition:'default', ...(section.settings || {}) };
      section.settings[key] = section.settings[key] !== true;
    });
  }

  function saveReusableBlock(id = state.selectedSectionId) {
    const section = state.sections.find((item) => item.id === id);
    if (!section) return;
    const plugin = catalog.plugins[section.type];
    const name = prompt('Nome do bloco reutilizável:', `${plugin?.name || section.type} — ${state.projectName}`);
    if (!name?.trim()) return;
    const reusableSection = clone(section);
    if (reusableSection.settings) delete reusableSection.settings.layoutSlot;
    if (isSegmentLayout(reusableSection)) reusableSection.props.itemCount = 0;
    const blocks = readBlockLibrary();
    blocks.unshift({ id:`block-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name:name.trim(), section:reusableSection, createdAt:new Date().toISOString() });
    writeBlockLibrary(blocks.slice(0, 60));
    renderReusableBlocks();
    toast('Bloco salvo para reutilização.');
  }

  function insertReusableBlock(id) {
    const block = readBlockLibrary().find((item) => item.id === id);
    if (!block) return;
    if (!catalog.plugins[block.section.type]) return toast('O plugin deste bloco não está instalado.', 'error');
    commit((draft) => {
      const section = clone(block.section);
      catalog.refreshSectionIdentity(section);
      if (section.settings) delete section.settings.layoutSlot;
      if (isSegmentLayout(section)) section.props.itemCount = 0;
      const fallback = draft.sections.findIndex((item) => item.type === 'footer');
      const index = Number.isInteger(pendingInsertIndex) ? pendingInsertIndex : (fallback >= 0 ? fallback : draft.sections.length);
      draft.sections.splice(Math.max(0, Math.min(index, draft.sections.length)), 0, section);
      draft.selectedSectionId = section.id;
    });
    pendingInsertIndex = null;
    pendingSegmentTarget = null;
    toast('Bloco reutilizável inserido.');
  }

  function openBlockPicker(index, segmentTarget = null) {
    pendingInsertIndex = Number.isInteger(index) ? index : state.sections.length;
    pendingSegmentTarget = segmentTarget ? { segmentId:segmentTarget.segmentId, slot:Math.max(0, Number(segmentTarget.slot) || 0) } : null;
    const segment = pendingSegmentTarget ? state.sections.find((item) => item.id === pendingSegmentTarget.segmentId) : null;
    const entries = sortPluginEntries(Object.entries(catalog.plugins).filter(([, plugin]) => pendingSegmentTarget ? pluginCanOccupySegment(plugin, catalog.plugins[segment?.type]) : plugin.kind === 'section'));
    if ($('#blockDialogTitle')) $('#blockDialogTitle').textContent = pendingSegmentTarget ? 'Adicionar componente' : 'Adicionar seção';
    if ($('#blockDialogSubtitle')) $('#blockDialogSubtitle').textContent = pendingSegmentTarget && segment
      ? `${segmentDirectionLabel(segment)} ${pendingSegmentTarget.slot + 1} · itens, flexíveis e Segmentos aninhados`
      : 'Escolha um componente para inserir na página';
    $('#blockPickerList').innerHTML = entries.map(([key, plugin]) => `<button class="block-picker-item" data-picker-plugin="${key}"><span>${plugin.icon}</span><span><strong>${catalog.esc(plugin.name)}</strong><small>${catalog.esc(plugin.category)} · ${catalog.esc(plugin.description)}</small><em>${catalog.esc(({ section:'Seção inteira', item:'Item', both:'Flexível' })[catalog.compositionRole(plugin)] || 'Flexível')}</em></span><b>+</b></button>`).join('') || '<p class="helper">Nenhum componente compatível encontrado.</p>';
    $('#blockDialog').showModal();
  }

  function resetProjectSession(next, name) {
    state = normalizeState(next);
    state.projectName = String(name || state.projectName || 'Novo projeto').trim() || 'Novo projeto';
    state.projectId = `project-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    state.selectedSectionId = null;
    currentProjectFileHandle = null;
    undoStack = [];
    redoStack = [];
    saveState();
    refresh();
  }

  function openNewProjectDialog() {
    renderNewProjectPresetTree();
    $('#newProjectDialog')?.showModal();
  }

  function createBlankProject() {
    const next = catalog.defaultState();
    next.sections = [];
    next.selectedSectionId = null;
    next.projectName = 'Novo projeto em branco';
    next.seo.title = '';
    next.seo.description = '';
    next.seo.keywords = '';
    next.siteData.propertyName = '';
    const name = prompt('Nome do novo projeto:', 'Novo projeto em branco');
    if (name === null) return;
    resetProjectSession(next, name);
    $('#newProjectDialog')?.close();
    toast('Novo projeto em branco criado.');
  }

  async function createNewProjectFromPreset(id) {
    try {
      const entry = projectPresets.get(id);
      const next = await projectPresets.createProject(id);
      const name = prompt('Nome do novo projeto:', next.projectName || `Novo projeto — ${entry?.name || 'Modelo'}`);
      if (name === null) return;
      resetProjectSession(next, name);
      $('#newProjectDialog')?.close();
      toast(`Novo projeto criado a partir de ${entry?.name || 'preset'}.`);
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível criar o projeto a partir do preset.', 'error');
    }
  }

  async function applyProjectPreset(id) {
    const entry = projectPresets.get(id);
    if (!entry) return toast('Preset não encontrado.', 'error');
    if (!confirm(`Aplicar o preset “${entry.name}” ao projeto atual? A composição atual será substituída, mas o nome e o ID do projeto serão mantidos.`)) return;
    try {
      const next = await projectPresets.createProject(id);
      const currentId = state.projectId;
      const currentName = state.projectName;
      undoStack.push(clone(state));
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
      state = normalizeState(next);
      state.projectId = currentId;
      state.projectName = currentName;
      currentProjectFileHandle = null;
      saveState();
      refresh();
      toast(`Preset ${entry.name} aplicado ao projeto atual.`);
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível aplicar o preset.', 'error');
    }
  }

  function openSaveProjectPresetDialog() {
    const suggestedName = `${state.projectName} — preset`;
    $('#projectPresetName').value = suggestedName;
    $('#projectPresetId').value = projectPresets.slug(suggestedName);
    $('#projectPresetCategory').value = state.templateMeta?.presetCategory || 'Personalizado';
    $('#projectPresetDescription').value = '';
    $('#projectPresetId').dataset.auto = 'true';
    $('#saveProjectPresetDialog')?.showModal();
  }

  function currentProjectPresetMeta() {
    const name = $('#projectPresetName').value.trim();
    const id = projectPresets.slug($('#projectPresetId').value.trim() || name);
    const category = $('#projectPresetCategory').value.trim() || 'Personalizado';
    const description = $('#projectPresetDescription').value.trim();
    if (!name) throw new Error('Informe o nome do preset.');
    if (!id) throw new Error('Informe um ID válido para o preset.');
    return { id, name, category, description };
  }

  async function saveCurrentProjectPresetToStudio() {
    try {
      const meta = currentProjectPresetMeta();
      await projectPresets.saveToStudio(meta, state);
      $('#saveProjectPresetDialog')?.close();
      renderProjectPresetLibrary();
      toast(`Preset ${meta.name} salvo e cadastrado em presets/presets.json.`);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error(error);
      toast(error.message || 'Não foi possível salvar o preset no Studio.', 'error');
    }
  }

  async function exportCurrentProjectPresetZip() {
    try {
      const meta = currentProjectPresetMeta();
      const blob = await projectPresets.exportZip(meta, state);
      compiler.downloadBlob(blob, `${meta.id}-preset.zip`);
      toast('Pacote do preset exportado.');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível exportar o preset.', 'error');
    }
  }

  function newProjectFromBlueprint() {
    const blueprint = $('#blueprintSelect').value || 'launch';
    const next = catalog.createFromBlueprint(blueprint);
    const name = prompt('Nome do novo projeto:', `Nova landing — ${catalog.blueprints[blueprint]?.name || 'Imóvel'}`);
    if (name === null) return;
    state = normalizeState(next);
    state.projectName = name.trim() || 'Nova landing page';
    state.projectId = `project-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    currentProjectFileHandle = null;
    undoStack = []; redoStack = [];
    saveState(); refresh();
    toast('Novo projeto criado a partir do modelo.');
  }

  function duplicateProject() {
    const next = clone(state);
    next.projectId = `project-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    next.projectName = `${state.projectName} — cópia`;
    next.sections.forEach((section) => { catalog.refreshSectionIdentity(section); });
    next.selectedSectionId = null;
    state = normalizeState(next);
    currentProjectFileHandle = null;
    undoStack = []; redoStack = [];
    saveState(); refresh();
    toast('Projeto duplicado. Altere os dados globais e publique uma nova landing page.');
  }

  async function openProject(id) {
    if (id === state.projectId) return;
    const indexed = readProjectLibrary()[id];
    const project = await projectStoreGet(id) || (indexed?.sections ? indexed : null);
    if (!project) return toast('Projeto não encontrado.', 'error');
    state = normalizeState(project);
    currentProjectFileHandle = null;
    undoStack = []; redoStack = [];
    saveState();
    refresh();
    toast(`${state.projectName} aberto.`);
  }

  function applyGlobalData() {
    const data = state.siteData;
    commit((draft) => {
      draft.seo.propertyName = data.propertyName || draft.seo.propertyName;
      draft.seo.city = data.city || draft.seo.city;
      draft.seo.address = data.address || draft.seo.address;
      draft.seo.price = String(data.price || draft.seo.price).replace(/[^0-9,]/g, '').replace(',', '.');
      draft.seo.authorName = data.broker || draft.seo.authorName;
      draft.seo.organizationName = data.broker || draft.seo.organizationName;
      draft.sections.forEach((section) => {
        if (['hero','hero-plus'].includes(section.type) && data.city) section.props.eyebrow = `IMÓVEL EM ${data.city.toUpperCase()}`;
        if (section.type === 'payment' && data.price) section.props.price = data.price;
        if (section.type === 'location' && data.address) section.props.address = data.address;
        if (section.type === 'footer') Object.assign(section.props, { brand:data.broker || section.props.brand, license:data.license || section.props.license, phone:data.phone || section.props.phone, email:data.email || section.props.email });
        if (section.type === 'form-sender-v4') Object.assign(section.props, { product:data.propertyName || section.props.product, endpoint: 'https://script.google.com/macros/s/AKfycbxxA_8OOrK8oSJk6dFSC4bSvIHxICKLYG6ZpalORyFnM5fe-I4eLil-KGsKyoD31NMWlg/exec' });
      });
    });
    toast('Dados globais aplicados em toda a página.');
  }

  function applyStrategy() {
    const strategy = catalog.strategies[state.strategy.method] || catalog.strategies.aida;
    const profile = profileCopy[state.strategy.profile] || profileCopy.consultive;
    const copy = strategy.copy || profile;
    commit((draft) => {
      const byType = new Map(draft.sections.map((section) => [section.type, section]));
      const keepFormV4 = byType.has('form-sender-v4') && catalog.plugins['form-sender-v4'];
      const keepHeroPlus = byType.has('hero-plus') && !byType.has('hero');
      const desired = strategy.sections.map((type) => type === 'hero' && keepHeroPlus ? 'hero-plus' : (type === 'lead-form' ? 'form-sender-v4' : type));
      draft.sections = desired.map((type) => byType.get(type) || catalog.createSection(type)).filter(Boolean);
      const hero = draft.sections.find((item) => ['hero','hero-plus'].includes(item.type));
      const lead = draft.sections.find((item) => item.type === 'form-sender-v4');
      const payment = draft.sections.find((item) => item.type === 'payment');
      const timeline = draft.sections.find((item) => item.type === 'timeline-process-pro');
      if (hero && copy?.hero) { hero.props.title = copy.hero[0]; hero.props.subtitle = copy.hero[1]; }
      if (lead && copy?.lead && 'title' in lead.props) lead.props.title = copy.lead;
      if (payment && copy?.paymentTitle) payment.props.title = copy.paymentTitle;
      if (payment && copy?.paymentCta) payment.props.cta = copy.paymentCta;
      if (timeline && strategy.timeline) {
        if (strategy.timeline.title) timeline.props.title = strategy.timeline.title;
        if (strategy.timeline.intro) timeline.props.intro = strategy.timeline.intro;
      }
      draft.selectedSectionId = hero?.id || null;
    });
    toast(`Roteiro ${strategy.name} aplicado.`);
  }

  function applyPreset(key, custom) {
    const preset = custom || catalog.presets[key];
    if (!preset) return;
    commit((draft) => { draft.brand = { ...draft.brand, ...preset }; draft.preset = custom ? 'personalizado' : key; });
    toast(`Preset ${preset.name || 'personalizado'} aplicado.`);
  }

  function downloadJson(data, filename) {
    compiler.downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
  }

  function closeProjectFileMenu() {
    const menu = $('#projectFileMenu');
    const button = $('#saveBtn');
    if (!menu || !button) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function toggleProjectFileMenu() {
    const menu = $('#projectFileMenu');
    const button = $('#saveBtn');
    if (!menu || !button) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
  }

  async function writeProjectToHandle(handle) {
    const writable = await handle.createWritable();
    await writable.write(new Blob([JSON.stringify(state, null, 2)], { type:'application/json' }));
    await writable.close();
  }

  async function saveProjectToDisk() {
    state.updatedAt = new Date().toISOString();
    state.version = '7.5.1';
    // O projeto ativo já é um objeto mutável em memória. O snapshot é produzido
    // somente na leitura, evitando serializar imagens e seções a cada tecla.
    projectMemoryStore.set(state.projectId, state);
    const filename = `${compiler.slug(state.projectName || 'projeto')}-projeto.json`;
    try {
      if ('showSaveFilePicker' in window) {
        if (!currentProjectFileHandle) {
          currentProjectFileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description:'Projeto Imobify JSON', accept:{ 'application/json':['.json'] } }]
          });
        }
        await writeProjectToHandle(currentProjectFileHandle);
      } else {
        downloadJson(state, filename);
      }
      setProjectDiskStatus(true);
      toast('Projeto salvo no disco local.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error(error);
      currentProjectFileHandle = null;
      toast(error.message || 'Não foi possível salvar o projeto no disco.', 'error');
    }
  }

  function applyLoadedProject(data, handle = null) {
    if (!data?.sections || !data?.brand || !data?.seo) return toast('Este arquivo não é um projeto Imobify válido.', 'error');
    state = normalizeState(data);
    currentProjectFileHandle = handle;
    undoStack = [];
    redoStack = [];
    saveState({ dirty:false });
    refresh();
    setProjectDiskStatus(true);
    toast(`Projeto ${state.projectName || ''} carregado do disco.`.trim());
  }

  async function openProjectFromDisk() {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          multiple:false,
          types: [{ description:'Projeto Imobify JSON', accept:{ 'application/json':['.json'] } }]
        });
        const file = await handle.getFile();
        const data = JSON.parse(await file.text());
        applyLoadedProject(data, handle);
      } else {
        $('#projectFileInput')?.click();
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast(error.message || 'Não foi possível carregar o projeto.', 'error');
    }
  }

  function closeInspectorStateMenu() {
    const menu = $('#inspectorStateMenu');
    const button = $('#inspectorStateMenuButton');
    if (!menu || !button) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function toggleInspectorStateMenu() {
    const menu = $('#inspectorStateMenu');
    const button = $('#inspectorStateMenuButton');
    if (!menu || !button || button.disabled) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) menu.querySelector('button:not([disabled])')?.focus();
  }

  function exportComponentState(scope = 'component') {
    const selected = state.sections.find((item) => item.id === state.selectedSectionId);
    if (!selected || !componentState) return toast('Selecione um componente para salvar.', 'error');
    let sections = [selected];
    if (scope === 'group') {
      const group = groupForSelection(selected.id);
      if (!group) return toast('Selecione um Segmento ou um componente dentro de um grupo.', 'error');
      sections = state.sections.slice(group.meta.index, group.meta.index + group.meta.span);
    }
    try {
      const preset = componentState.createPreset({ scope, sections, plugins:catalog.plugins, frameworkVersion:state.version });
      downloadJson(preset, componentState.filename(preset, compiler.slug));
      toast(scope === 'group' ? 'Grupo de componentes exportado.' : 'Estado do componente exportado.');
    } catch (error) {
      toast(error.message || 'Não foi possível exportar o componente.', 'error');
    } finally {
      closeInspectorStateMenu();
    }
  }

  function applyComponentState(input) {
    if (!componentState) return toast('O recurso de presets de componente não foi carregado.', 'error');
    let preset;
    try { preset = componentState.parsePreset(input); }
    catch (error) { return toast(error.message || 'Preset de componente inválido.', 'error'); }

    const selected = state.sections.find((item) => item.id === state.selectedSectionId);
    if (!selected) return toast('Selecione o componente que receberá o estado.', 'error');

    try {
      const imported = componentState.hydratePreset(preset, catalog.plugins, catalog.refreshSectionIdentity);
      if (preset.scope === 'component') {
        if (selected.type !== preset.rootType) throw new Error(`Selecione um componente do tipo ${catalog.plugins[preset.rootType]?.name || preset.rootType}.`);
        commit((draft) => {
          const target = draft.sections.find((item) => item.id === draft.selectedSectionId);
          if (!target) return;
          const plugin = catalog.plugins[target.type];
          const instanceField = plugin?.manifest?.instanceIdField;
          const instanceValue = instanceField ? target.props?.[instanceField] : null;
          const layoutCount = plugin?.manifest?.layout ? target.props?.itemCount : null;
          const layoutSlot = target.settings?.layoutSlot;
          target.props = clone(imported[0].props);
          target.settings = clone(imported[0].settings);
          if (instanceField && instanceValue) target.props[instanceField] = instanceValue;
          if (plugin?.manifest?.layout && layoutCount != null) target.props.itemCount = layoutCount;
          if (layoutSlot != null) target.settings.layoutSlot = layoutSlot;
        });
        toast('Estado carregado no componente selecionado.');
        return;
      }

      const targetGroup = groupForSelection(selected.id);
      if (!targetGroup) throw new Error('Selecione o Segmento ou um item dentro do grupo que receberá o preset.');
      if (targetGroup.section.type !== preset.rootType) throw new Error(`Selecione um grupo do tipo ${catalog.plugins[preset.rootType]?.name || preset.rootType}.`);
      if (!catalog.plugins[imported[0].type]?.manifest?.layout) throw new Error('O preset de grupo não possui um container compatível.');
      const importedMeta = buildSectionLayoutMeta(imported).get(imported[0].id);
      if (!importedMeta || importedMeta.span !== imported.length) throw new Error('A estrutura interna do preset de grupo é inválida.');

      commit((draft) => {
        const group = groupForSelection(draft.selectedSectionId, draft.sections);
        if (!group) return;
        const currentRoot = group.section;
        const nextRoot = imported[0];
        const plugin = catalog.plugins[currentRoot.type];
        const instanceField = plugin?.manifest?.instanceIdField;
        const instanceValue = instanceField ? currentRoot.props?.[instanceField] : null;
        const outerSlot = currentRoot.settings?.layoutSlot;
        nextRoot.id = currentRoot.id;
        if (instanceField && instanceValue) nextRoot.props[instanceField] = instanceValue;
        if (outerSlot != null) nextRoot.settings.layoutSlot = outerSlot;
        draft.sections.splice(group.meta.index, group.meta.span, ...imported);
        draft.selectedSectionId = nextRoot.id;
      });
      toast('Grupo de componentes carregado.');
    } catch (error) {
      toast(error.message || 'Não foi possível carregar o estado.', 'error');
    }
  }

  async function installPluginFile(file) {
    if (!file) return;
    const status = $('#pluginInstallStatus');
    status.textContent = 'Validando e instalando o pacote...';
    try {
      const plugin = await window.ImobifyPluginLoader.installZip(file);
      status.textContent = `${plugin.name} instalado com sucesso.`;
      renderPluginLibrary($('#pluginSearch').value);
      renderInstalledPlugins();
      toast(`${plugin.name} pronto para adicionar.`);
    } catch (error) {
      status.textContent = error.message || 'Não foi possível instalar o plugin.';
      if (error.message !== 'Instalação cancelada.') toast(status.textContent, 'error');
    } finally {
      $('#pluginZipInput').value = '';
    }
  }

  async function uninstallPlugin(id) {
    const plugin = catalog.plugins[id];
    if (!plugin) return;
    const used = state.sections.some((section) => section.type === id) || state.behaviorPlugins.includes(id);
    if (used && !confirm(`“${plugin.name}” está em uso. Remover o componente da página e desinstalar o plugin?`)) return;
    try {
      await window.ImobifyPluginLoader.uninstall(id);
      commit((draft) => {
        const meta = buildSectionLayoutMeta(draft.sections);
        const removed = draft.sections.filter((section) => section.type === id);
        removed.forEach((section) => {
          const source = meta.get(section.id);
          if (source?.parentId) {
            const parent = draft.sections.find((item) => item.id === source.parentId);
            if (parent) parent.props.itemCount = Math.max(0, (Number(parent.props.itemCount) || 0) - 1);
          } else if (source?.layout?.mode === 'segment-slots') {
            for (const [childId, childMeta] of meta.entries()) {
              if (childMeta.parentId !== section.id) continue;
              const child = draft.sections.find((item) => item.id === childId);
              if (child?.settings) delete child.settings.layoutSlot;
            }
          }
        });
        draft.sections = draft.sections.filter((section) => section.type !== id);
        draft.behaviorPlugins = draft.behaviorPlugins.filter((key) => key !== id);
        if (!draft.sections.some((section) => section.id === draft.selectedSectionId)) draft.selectedSectionId = null;
      });
      toast(`${plugin.name} desinstalado.`);
    } catch (error) { toast(error.message, 'error'); }
  }

  function setCanvasZoom(percent, device = $('#browserFrame').dataset.device || 'desktop') {
    const widths = { desktop: 1180, tablet: 820, mobile: 390 };
    const width = widths[device];
    const zoom = Number(percent) / 100;
    $('#browserFrame').style.transform = `scale(${zoom})`;
    $('#browserFrame').style.height = `calc(100% / ${zoom})`;
    $('#browserFrame').style.marginInline = `${-(width * (1 - zoom) / 2)}px`;
    $('#zoomRange').value = String(percent);
    $('#zoomOutput').textContent = `${percent}%`;
  }

  function readJsonFile(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { callback(JSON.parse(reader.result)); }
      catch (error) { toast(error.message || 'Arquivo JSON inválido.', 'error'); }
    };
    reader.readAsText(file);
  }

  async function compileProject() {
    const dialog = $('#progressDialog');
    const bar = $('#progressBar');
    dialog.showModal();
    try {
      const result = await compiler.compile(state, (message, percent) => {
        $('#progressText').textContent = message;
        bar.style.width = `${percent}%`;
      });
      compiler.downloadBlob(result.blob, result.filename);
      setTimeout(() => dialog.close(), 500);
      toast(`Pacote criado com ${result.files.length} arquivos. Auditoria: ${result.exportValidation.warnings.length} aviso(s); consulte VALIDACAO-EXPORTACAO.txt.`);
    } catch (error) {
      dialog.close();
      console.error(error);
      toast(error.message || 'Falha ao compilar o projeto.', 'error');
    }
  }

  async function compileProjectBatch() {
    await projectStorePut(state);
    const projects = await projectStoreList();
    if (!projects.length) return toast('Nenhum projeto salvo para exportar.', 'error');
    const dialog = $('#progressDialog');
    const bar = $('#progressBar');
    dialog.showModal();
    try {
      const result = await compiler.compileBatch(projects.map(normalizeState), (message, percent) => {
        $('#progressText').textContent = message;
        bar.style.width = `${percent}%`;
      });
      compiler.downloadBlob(result.blob, result.filename);
      setTimeout(() => dialog.close(), 500);
      toast(`${projects.length} projetos organizados no pacote de produção.`);
    } catch (error) {
      dialog.close();
      console.error(error);
      toast(error.message || 'Falha ao exportar os projetos.', 'error');
    }
  }

  function clearSectionDropIndicators() {
    $$('.section-row', $('#sectionList')).forEach((row) => {
      row.classList.remove('is-dragging', 'is-drop-before', 'is-drop-after');
      delete row.dataset.dropPosition;
    });
  }

  function beginSectionPointerDrag(event) {
    if (event.button !== 0 || event.target.closest('.row-actions button')) return;
    const row = event.target.closest('[data-section-id]');
    if (!row) return;
    sectionPointerDrag = {
      pointerId:event.pointerId, sourceId:row.dataset.sectionId, sourceRow:row,
      startX:event.clientX, startY:event.clientY, targetId:null, position:'before', active:false
    };
    /* Pointer capture keeps the reorder alive even when the cursor crosses
       children/buttons or leaves the narrow section row while dragging. */
    try { row.setPointerCapture?.(event.pointerId); } catch (_) {}
  }

  function updateSectionPointerDrag(event) {
    const drag = sectionPointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.active && distance < 6) return;
    if (!drag.active) {
      drag.active = true;
      drag.sourceRow.classList.add('is-dragging');
      document.body.classList.add('is-section-reordering');
    }
    event.preventDefault();
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const row = hit?.closest?.('[data-section-id]');
    if (!row || row.dataset.sectionId === drag.sourceId) {
      $$('.section-row', $('#sectionList')).forEach((item) => { item.classList.remove('is-drop-before', 'is-drop-after'); delete item.dataset.dropPosition; });
      drag.targetId = null;
      return;
    }
    const rect = row.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    $$('.section-row', $('#sectionList')).forEach((item) => item.classList.remove('is-drop-before', 'is-drop-after'));
    row.classList.add(position === 'before' ? 'is-drop-before' : 'is-drop-after');
    row.dataset.dropPosition = position;
    drag.targetId = row.dataset.sectionId;
    drag.position = position;

    const panel = $('#sectionList')?.closest('.panel-content');
    if (panel) {
      const panelRect = panel.getBoundingClientRect();
      const edge = 54;
      if (event.clientY < panelRect.top + edge) panel.scrollBy({ top:-22, behavior:'auto' });
      else if (event.clientY > panelRect.bottom - edge) panel.scrollBy({ top:22, behavior:'auto' });
    }
  }

  function finishSectionPointerDrag(event) {
    const drag = sectionPointerDrag;
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    sectionPointerDrag = null;
    try { if (drag.sourceRow?.hasPointerCapture?.(drag.pointerId)) drag.sourceRow.releasePointerCapture(drag.pointerId); } catch (_) {}
    document.body.classList.remove('is-section-reordering');
    const didMove = Boolean(drag.active && drag.targetId && drag.targetId !== drag.sourceId);
    clearSectionDropIndicators();
    if (didMove) {
      suppressSectionClick = true;
      moveSectionTo(drag.sourceId, drag.targetId, drag.position);
      requestAnimationFrame(() => { suppressSectionClick = false; });
    }
  }

  function handleEditorAction(data) {
    if (data.action === 'insert') return openBlockPicker(Number(data.index));
    if (data.action === 'insert-segment-item' && data.segmentId) return openBlockPicker(state.sections.length, { segmentId:data.segmentId, slot:Number(data.segmentSlot) || 0 });
    if (!data.id) return;
    if (data.action === 'move-up') return moveSection(data.id, 'up');
    if (data.action === 'move-down') return moveSection(data.id, 'down');
    if (data.action === 'duplicate') return duplicateSection(data.id);
    if (data.action === 'toggle-visible') return toggleSectionVisibility(data.id);
    if (data.action === 'remove') return removeSection(data.id);
  }

  function applyParallaxMetadata(detail) {
    const sectionId = String(detail?.sectionId || '');
    const duration = parallaxNumber(detail?.duration, 0);
    if (!sectionId || !(duration > 0.01) || !state) return;
    const section = state.sections.find((item) => item.id === sectionId && item.type === 'parallax');
    if (!section) return;
    const step = parallaxStep(section);
    const startTime = parallaxClamp(parallaxSnapTime(section, section.props.startTime || 0, duration), 0, Math.max(0, duration - step));
    const minKey = Math.min(duration - step, startTime + step);
    const maxKey = Math.max(minKey, duration - step);
    const sourceBanners = parseParallaxBanners(section.props.heroPoints)
      /* Migração 2.8.0 → 2.8.1: remove a chave criada indevidamente sobre o IN. */
      .filter((point) => parallaxNumber(point?.startTime, startTime) > startTime + step * 0.55)
      .slice().sort((a,b) => parallaxNumber(a.startTime,0) - parallaxNumber(b.startTime,0));
    const used = [];
    const normalizedBanners = sourceBanners.map((point) => {
      const before = parallaxNumber(point.startTime, minKey);
      let at = parallaxClamp(parallaxSnapTime(section, before, duration), minKey, maxKey);
      const free = (candidate) => used.every((other) => Math.abs(other - candidate) >= step * 0.8);
      if (!free(at)) {
        const span = Math.max(1, Math.ceil((maxKey - minKey) / step));
        for (let offset = 1; offset <= span; offset += 1) {
          const forward = parallaxClamp(parallaxSnapTime(section, at + offset * step, duration), minKey, maxKey);
          const backward = parallaxClamp(parallaxSnapTime(section, at - offset * step, duration), minKey, maxKey);
          if (free(forward)) { at = forward; break; }
          if (free(backward)) { at = backward; break; }
        }
      }
      used.push(at);
      const delta = at - before;
      return {
        ...point,
        enabled:true,
        cinematicStop:true,
        startTime:at,
        endTime:parallaxClamp(Math.max(at, parallaxNumber(point.endTime, before + 4) + delta), at, duration),
        boomerangAtTime:parallaxClamp(parallaxNumber(point.boomerangAtTime, before) + delta, 0, duration)
      };
    }).sort((a,b) => parallaxNumber(a.startTime,0) - parallaxNumber(b.startTime,0));
    const temporary = { ...section, props:{ ...section.props, videoDuration:duration, startTime, heroPoints:JSON.stringify(normalizedBanners) } };
    const releaseFloor = parallaxClamp(parallaxReleaseFloor(temporary, normalizedBanners, duration), Math.min(duration, startTime + step), duration);
    const auto = section.props.endTimeAuto === true || String(section.props.endTimeAuto).toLowerCase() === 'true';
    const currentEnd = parallaxNumber(section.props.endTime, duration);
    const endTime = auto ? duration : parallaxClamp(parallaxSnapTime(section, currentEnd, duration), releaseFloor, duration);
    const nextHeroPoints = JSON.stringify(normalizedBanners);
    const changed = Math.abs(parallaxNumber(section.props.videoDuration, 0) - duration) > 0.0005
      || Math.abs(parallaxNumber(section.props.startTime, 0) - startTime) > 0.0005
      || Math.abs(parallaxNumber(section.props.endTime, 0) - endTime) > 0.0005
      || String(section.props.heroPoints || '[]') !== nextHeroPoints;
    if (!changed) return;
    section.props.videoDuration = Number(duration.toFixed(6));
    section.props.startTime = startTime;
    section.props.endTime = endTime;
    section.props.heroPoints = nextHeroPoints;
    if (auto) section.props.endTimeAuto = true;
    parallaxEditorPlayheads.set(section.id, parallaxClamp(parallaxEditorPlayheads.get(section.id) ?? startTime, 0, duration));
    saveState();
    if (state.selectedSectionId === section.id) renderInspector();
  }

  function bindEvents() {
    $$('.panel-tab').forEach((button) => button.addEventListener('click', () => activateTab(button.dataset.tab)));
    $('#methodSelect').addEventListener('change', (event) => commit((draft) => { draft.strategy.method = event.target.value; }, { preview: false }));
    $('#profileSelect').addEventListener('change', (event) => commit((draft) => { draft.strategy.profile = event.target.value; }, { preview: false }));
    $('#applyStrategyBtn').addEventListener('click', applyStrategy);
    $('#pluginSearch').addEventListener('input', (event) => renderPluginLibrary(event.target.value));
    $('#pluginLibrary').addEventListener('click', (event) => { const card = event.target.closest('[data-plugin-key]'); if (card) addOrTogglePlugin(card.dataset.pluginKey); });
    $('#segmentComposer')?.addEventListener('click', (event) => {
      const axis = event.target.closest('[data-segment-axis]');
      if (axis) {
        $$('[data-segment-axis]', $('#segmentComposer')).forEach((button) => button.classList.toggle('is-active', button === axis));
        $('#segmentComposer').dataset.direction = axis.dataset.segmentAxis;
        return;
      }
      const tracks = event.target.closest('[data-segment-tracks]');
      if (tracks) {
        $$('[data-segment-tracks]', $('#segmentComposer')).forEach((button) => button.classList.toggle('is-active', button === tracks));
        return;
      }
      if (event.target.closest('#addSegmentBtn')) {
        const direction = $('#segmentComposer').dataset.direction || 'columns';
        const count = Number($('[data-segment-tracks].is-active', $('#segmentComposer'))?.dataset.segmentTracks) || 2;
        createSegment(direction, count);
      }
    });
    $('#pluginZipInput').addEventListener('change', (event) => installPluginFile(event.target.files?.[0]));
    $('#pluginDropZone').addEventListener('dragover', (event) => { event.preventDefault(); event.currentTarget.classList.add('is-dragging'); });
    $('#pluginDropZone').addEventListener('dragleave', (event) => event.currentTarget.classList.remove('is-dragging'));
    $('#pluginDropZone').addEventListener('drop', (event) => { event.preventDefault(); event.currentTarget.classList.remove('is-dragging'); installPluginFile(event.dataTransfer?.files?.[0]); });
    $('#installedPluginList').addEventListener('click', (event) => { const button = event.target.closest('[data-uninstall-plugin]'); if (button) uninstallPlugin(button.dataset.uninstallPlugin); });
    $('#sectionList').addEventListener('click', (event) => {
      if (suppressSectionClick) return;
      const row = event.target.closest('[data-section-id]'); if (!row) return;
      if (event.target.closest('[data-remove]')) return removeSection(row.dataset.sectionId);
      if (event.target.closest('[data-duplicate]')) return duplicateSection(row.dataset.sectionId);
      if (event.target.closest('[data-visibility]')) return toggleSectionVisibility(row.dataset.sectionId);
      const slotMove = event.target.closest('[data-move-slot]'); if (slotMove) return moveSectionSlot(row.dataset.sectionId, Number(slotMove.dataset.moveSlot) || 0);
      const move = event.target.closest('[data-move]'); if (move) return moveSection(row.dataset.sectionId, move.dataset.move);
      selectSection(row.dataset.sectionId);
    });
    $('#sectionList').addEventListener('pointerdown', beginSectionPointerDrag);
    $('#sectionList').addEventListener('dragstart', (event) => event.preventDefault());
    window.addEventListener('pointermove', updateSectionPointerDrag, { passive:false });
    window.addEventListener('pointerup', finishSectionPointerDrag);
    window.addEventListener('pointercancel', finishSectionPointerDrag);
    $('#addSectionBtn').addEventListener('click', () => openBlockPicker(state.sections.length));
    $('#reusableBlockList').addEventListener('click', (event) => { const row = event.target.closest('[data-reusable-id]'); if (!row) return; if (event.target.closest('[data-insert-reusable]')) return insertReusableBlock(row.dataset.reusableId); if (event.target.closest('[data-remove-reusable]')) { writeBlockLibrary(readBlockLibrary().filter((item) => item.id !== row.dataset.reusableId)); renderReusableBlocks(); } });
    $('#blockPickerList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-picker-plugin]'); if (!button) return;
      const insertIndex = pendingInsertIndex;
      const segmentTarget = pendingSegmentTarget ? { ...pendingSegmentTarget } : null;
      $('#blockDialog').close();
      addOrTogglePlugin(button.dataset.pickerPlugin, insertIndex, segmentTarget);
    });
    $('#closeBlockDialog').addEventListener('click', () => { pendingInsertIndex = null; pendingSegmentTarget = null; $('#blockDialog').close(); });
    $('#closeFloatingHelpDialog')?.addEventListener('click', () => $('#floatingHelpDialog')?.close());
    $('#closeHeroPlusStudioDialog')?.addEventListener('click', () => $('#heroPlusStudioDialog')?.close());
    $('#heroPlusStudioContent')?.addEventListener('input', (event) => {
      const input = event.target.closest('[data-prop]');
      if (!input) return;
      const sectionId = $('#heroPlusStudioContent')?.dataset.sectionId || state.selectedSectionId;
      const numeric = input.type === 'range' || input.type === 'number';
      const value = numeric ? Number(input.value) : input.value;
      liveCommit((draft) => { const section = draft.sections.find((item) => item.id === sectionId && item.type === 'hero-plus'); if (section) section.props[input.dataset.prop] = value; });
    });
    $('#heroPlusStudioContent')?.addEventListener('click', (event) => {
      const root = $('#heroPlusStudioContent');
      const sectionId = root?.dataset.sectionId || state.selectedSectionId;
      const toggle = event.target.closest('[data-toggle-prop]');
      if (toggle) {
        liveCommit((draft) => { const section = draft.sections.find((item) => item.id === sectionId && item.type === 'hero-plus'); if (section) section.props[toggle.dataset.toggleProp] = !section.props[toggle.dataset.toggleProp]; });
        toggle.classList.toggle('on');
        return;
      }
      const preset = event.target.closest('[data-hp-studio-preset]');
      if (preset) {
        const values = heroPlusPresetValues[preset.dataset.hpStudioPreset];
        if (!values) return;
        liveCommit((draft) => { const section = draft.sections.find((item) => item.id === sectionId && item.type === 'hero-plus'); if (section) Object.assign(section.props, values); });
        renderHeroPlusStudio(sectionId);
        toast(`Preset Hero Plus aplicado: ${preset.textContent.trim()}.`);
      }
    });
    $('#floatingHelpDialog')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
    $('#floatingHelpContent')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-floating-help-copy]');
      if (!button) return;
      const key = button.dataset.floatingHelpCopy;
      const code = $('#floatingHelpContent').querySelector(`[data-floating-help-code="${CSS.escape(key)}"]`);
      if (code) copyEditorText(code.textContent);
    });
    $('#presetGrid').addEventListener('click', (event) => { const item = event.target.closest('[data-preset]'); if (item) applyPreset(item.dataset.preset); });
    $('#applyPaletteTechniqueBtn')?.addEventListener('click', applyPaletteTechnique);
    $('#applyTypographyProfileBtn')?.addEventListener('click', applyTypographyProfile);
    $('#openTypographyWizardBtn')?.addEventListener('click', () => window.ImobifyTypeWizard?.open(state.brand, (roles, style) => {
      commit((draft) => { Object.assign(draft.brand, style || {}); const kit = catalog.buttonKits?.[style?.actionButtonKit]; if(kit) Object.assign(draft.brand, kit.settings || {}); draft.brand.typographyRoles = roles; draft.brand.typographyWizardEnabled = true; draft.preset = 'personalizado'; });
      toast('Wizard aplicado: hierarquia global ativa em todos os plugins compatíveis.');
    }));
    $('#buttonKitSelect')?.addEventListener('change', (event) => applyButtonKit(event.target.value));
    $('#designControls').addEventListener('input', (event) => {
      const input = event.target.closest('[data-brand]'); if (!input) return;
      const key = input.dataset.brand; const numeric = input.type === 'range' || input.type === 'number'; const value = numeric ? Number(input.value) : input.value;
      liveCommit((draft) => { draft.brand[key] = value; if (key.startsWith('actionButton')) draft.brand.actionButtonKit = 'custom'; draft.preset = 'personalizado'; }, () => { renderPresets(); $$('.preset').forEach((item) => item.classList.remove('is-active')); });
    });
    $('#seoControls').addEventListener('input', (event) => { const input = event.target.closest('[data-seo]'); if (input) liveCommit((draft) => { draft.seo[input.dataset.seo] = input.value; }, renderSeo); });
    // A imagem Open Graph preserva o formato original e tem limite rígido de 300 KB.
    const SEO_SHARE_MAX = 300 * 1024;
    const shareInput = $('#seoShareInput');
    shareInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      const ext = /\.png$/i.test(file.name) ? 'png' : /\.jpe?g$/i.test(file.name) ? 'jpeg' : '';
      if (!ext || (file.type && file.type !== `image/${ext}`)) return toast('Envie PNG ou JPEG.', 'error');
      if (file.size > 30 * 1024 * 1024) return toast('O arquivo original excede 30 MB.', 'error');
      try {
        const img = await new Promise((resolve, reject) => {
          const bitmap = new Image(), url = URL.createObjectURL(file);
          bitmap.onload = () => { URL.revokeObjectURL(url); resolve(bitmap); };
          bitmap.onerror = () => { URL.revokeObjectURL(url); reject(Error('Imagem inválida')); };
          bitmap.src = url;
        });
        if (!img.naturalWidth || !img.naturalHeight) throw Error('Dimensões inválidas');
        let width = img.naturalWidth, height = img.naturalHeight, result = '';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        // PNG não possui parâmetro de qualidade: reduzir dimensões é necessário.
        for (let step = 0; step < 35; step++) {
          const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(width)); canvas.height = Math.max(1,Math.round(height));
          canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
          if (ext === 'jpeg') {
            for (const quality of [.88,.75,.6,.45,.3,.18]) {
              result = canvas.toDataURL(mime, quality);
              if (Math.floor(result.split(',')[1].length * 3 / 4) < SEO_SHARE_MAX) break;
            }
          } else result = canvas.toDataURL(mime);
          if (Math.floor(result.split(',')[1].length * 3 / 4) < SEO_SHARE_MAX) break;
          if (width <= 1 && height <= 1) throw Error('Não foi possível reduzir a imagem');
          width = Math.max(1, Math.floor(width * .82)); height = Math.max(1, Math.floor(height * .82));
        }
        if (Math.floor(result.split(',')[1].length * 3 / 4) >= SEO_SHARE_MAX) throw Error('A imagem ainda excede 300 KB');
        commit((draft) => { draft.seo.ogImage = result; });
        toast(`Imagem social otimizada: ${(Math.floor(result.split(',')[1].length*3/4)/1024).toFixed(1)} KB. Arquivo share.${ext === 'png' ? 'png':'jpg'}.`);
      } catch (error) { toast(`Não foi possível processar a imagem: ${error.message}`, 'error'); }
    });
    const vectorModal = $('#seoVectorModal'), vectorFrame = $('#seoVectorFrame');
    $('#openSeoVectorizer').addEventListener('click', () => {
      if (!vectorFrame.src) vectorFrame.src = vectorFrame.dataset.src;
      vectorModal.showModal();
    });
    $('#closeSeoVectorizer').addEventListener('click', () => vectorModal.close());
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin || event.source !== vectorFrame.contentWindow || event.data?.type !== 'imobify-seo-svg') return;
      const {data, bytes} = event.data;
      if (typeof data !== 'string' || !/^data:image\/svg\+xml;base64,/.test(data) || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > 2 * 1024 * 1024) return toast('SVG inválido ou muito grande.', 'error');
      commit((draft) => { draft.seo.favicon = data; });
      vectorModal.close();
      toast(`Ícone SVG incorporado ao projeto (${(bytes/1024).toFixed(1)} KB).`);
    });
    $('#projectName').addEventListener('change', (event) => commit((draft) => { draft.projectName = event.target.value.trim() || 'Minha Landing Page'; }));
    $('#inspectorContent').addEventListener('change', (event) => {
      const slot = event.target.closest('[data-segment-slot-select]');
      if (slot) return moveSectionSlot(state.selectedSectionId, Number(slot.value) || 0, true);
      const select = event.target.closest('[data-icon-select]');
      if (!select) return;
      const key = select.dataset.iconKey;
      const input = $('#inspectorContent').querySelector(`[data-prop="${CSS.escape(key)}"]`);
      if (!input) return;
      input.value = select.value;
      const preview = select.closest('.icon-picker-field')?.querySelector('[data-icon-preview]');
      if (preview) {
        const cls = window.ImobifyIconLibrary?.safeClass?.(select.value) || '';
        preview.innerHTML = cls ? `<i class="${catalog.esc(cls)}" aria-hidden="true"></i><code>${catalog.esc(select.value)}</code>` : `<span>∅</span><code>Nenhum ícone</code>`;
      }
      input.dispatchEvent(new Event('input', { bubbles:true }));
    });
    $('#inspectorContent').addEventListener('input', (event) => {
      const input = event.target.closest('[data-prop]'); if (!input) return;
      const numeric = input.type === 'range' || input.type === 'number';
      const value = numeric ? Number(input.value) : input.value;
      const rangeOutput = input.closest('.inspector-field')?.querySelector('[data-range-output]');
      if (rangeOutput) rangeOutput.textContent = `${value}${input.dataset.rangeUnit ? ` ${input.dataset.rangeUnit}` : ''}`;
      liveCommit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.props[input.dataset.prop] = value;
        if (section.type === 'parallax') {
          if (input.dataset.prop === 'videoSrc') {
            section.props.videoDuration = 0;
            section.props.endTimeAuto = true;
          }
          if (input.dataset.prop === 'endTime') section.props.endTimeAuto = false;
          if (input.dataset.prop === 'endTimeAuto' && String(value).toLowerCase() === 'true' && parallaxNumber(section.props.videoDuration,0) > 0) {
            section.props.endTime = parallaxNumber(section.props.videoDuration, section.props.endTime);
          }
        }
        if (isSegmentLayout(section) && input.dataset.prop === 'tracks') {
          section.props.tracks = Math.max(1, Math.min(5, Number(value) || 1));
          const meta = buildSectionLayoutMeta(draft.sections);
          for (const [childId, childMeta] of meta.entries()) {
            if (childMeta.parentId !== section.id) continue;
            const child = draft.sections.find((item) => item.id === childId);
            if (child?.settings) child.settings.layoutSlot = childMeta.slot ?? 0;
          }
        }
      }, () => { syncInspectorComputedFields(); syncInspectorDynamicFields(); });
    });
    $('#inspectorContent').addEventListener('input', (event) => {
      const playhead = event.target.closest('[data-parallax-playhead]');
      if (!playhead) return;
      const section = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!section || section.type !== 'parallax') return;
      const duration = parallaxTimelineBounds(section).duration;
      const value = parallaxClamp(parallaxNumber(playhead.value, 0), 0, duration);
      parallaxEditorPlayheads.set(section.id, value);
      const label = $('#inspectorContent').querySelector('[data-parallax-playhead-label]');
      const line = $('#inspectorContent').querySelector('[data-parallax-playhead-line]');
      if (label) label.textContent = `${parallaxTime(value)}s`;
      if (line) line.style.left = parallaxMarkerLeft(value, duration);
      parallaxPreviewTime(section.id, value);
    });
    $('#inspectorContent').addEventListener('change', async (event) => {
      const narrationUpload = event.target.closest('[data-parallax-narration-upload]');
      if (narrationUpload) {
        const file = narrationUpload.files?.[0];
        if (!file) return;
        if (!(/^audio\//.test(file.type) || /\.(mp3|ogg|webm|m4a|mp4)$/i.test(file.name))) { toast('Formato de áudio não suportado.', 'error'); return; }
        if (file.size > 30*1024*1024) { toast('A narração deve ter no máximo 30 MB.', 'error'); return; }
        const index = Number(narrationUpload.dataset.parallaxIndex);
        const activeSectionId = state.selectedSectionId;
        const reader = new FileReader();
        reader.onload = () => {
          commit(draft => {
            const section = draft.sections.find(item => item.id === activeSectionId);
            if (!section || section.type !== 'parallax') return;
            const items = parseParallaxBanners(section.props.heroPoints);
            if (!items[index]) return;
            items[index].narrationAudio = String(reader.result || '');
            items[index].narrationEnabled = true;
            section.props.heroPoints = JSON.stringify(items);
          });
          toast('Narração adicionada ao slide.', 'success');
        };
        reader.onerror = () => toast('Falha ao ler a narração.', 'error');
        reader.readAsDataURL(file);
        return;
      }
      const bannerField = event.target.closest('[data-parallax-banner-field]');
      if (!bannerField) return;
      const index = Number(bannerField.dataset.parallaxIndex);
      const key = bannerField.dataset.parallaxBannerField;
      const current = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!current || current.type !== 'parallax') return;
      const currentItems = parseParallaxBanners(current.props.heroPoints);
      const currentPoint = currentItems[index];
      if (!currentPoint) return;
      if (key === 'startTime' && parallaxMovementLocked(currentPoint)) {
        toast('A chave está bloqueada. Use o cadeado para liberar o movimento.', 'info');
        renderInspector();
        return;
      }
      let value = bannerField.type === 'checkbox' ? bannerField.checked : bannerField.value;
      if (['startTime','endTime','transitionMs','decelMs','width','opacity','eyebrowSize','titleSize','subtitleSize','textSize','buttonSize','titleWeight','textWeight','titleLineHeight','textLineHeight','narrationDelay','narrationVolume'].includes(key)) value = String(value).trim() === '' ? null : parallaxNumber(value, 0);
      if (key === 'startTime') value = parallaxFreeKeyTime(current, value, currentPoint.id);
      if (key === 'id') {
        const requested = String(value || '').trim() || `banner-${index + 1}`;
        const used = new Set(currentItems.filter((_, itemIndex) => itemIndex !== index).map((item) => String(item.id || '')));
        let nextId = requested, n = 2;
        while (used.has(nextId)) nextId = `${requested}-${n++}`;
        value = nextId;
        parallaxEditorSelection.set(current.id, nextId);
      }
      const oldStart = parallaxNumber(currentPoint.startTime, 0);
      const nextStart = key === 'startTime' ? parallaxNumber(value, oldStart) : oldStart;
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section || section.type !== 'parallax') return;
        const items = parseParallaxBanners(section.props.heroPoints);
        if (!items[index]) return;
        const previous = items[index];
        const beforeStart = parallaxNumber(previous.startTime, 0);
        items[index] = { ...previous, [key]:value, cinematicStop:true, enabled:true };
        if (key === 'releaseScroll' && value === true) {
          items.forEach((item, itemIndex) => { if (itemIndex !== index) item.releaseScroll = false; });
        }
        if (key === 'startTime') {
          const delta = nextStart - beforeStart;
          items[index].startTime = nextStart;
          items[index].endTime = Math.max(nextStart, parallaxNumber(previous.endTime, beforeStart + 4) + delta);
          items[index].boomerangAtTime = parallaxNumber(previous.boomerangAtTime, beforeStart) + delta;
          parallaxEditorPlayheads.set(section.id, nextStart);
        }
        items.sort((a,b) => parallaxNumber(a.startTime,0) - parallaxNumber(b.startTime,0));
        const duration = parallaxTimelineBounds({ ...section, props:{ ...section.props, heroPoints:JSON.stringify(items) } }).duration;
        const floor = parallaxReleaseFloor({ ...section, props:{ ...section.props, heroPoints:JSON.stringify(items) } }, items, duration);
        if (parallaxNumber(section.props.endTime, duration) < floor) {
          section.props.endTime = floor;
          section.props.endTimeAuto = false;
        }
        section.props.heroPoints = JSON.stringify(items);
      });
      if (key === 'startTime') parallaxPreviewTime(current.id, nextStart);
    });
    $('#inspectorContent').addEventListener('change', (event) => {
      const field = event.target.closest('[data-benefit-field]');
      if (!field) return;
      const current = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!current || current.type !== 'beneficios-modal') return;
      const id = field.dataset.benefitId;
      const key = field.dataset.benefitField;
      const value = field.value;
      benefitsModalEditorSelection.set(current.id, id);
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === current.id);
        if (!section || section.type !== 'beneficios-modal') return;
        const items = benefitsModalItems(section);
        const index = items.findIndex((item) => String(item.id) === String(id));
        if (index < 0) return;
        items[index] = benefitsModalNormalizeItem({ ...items[index], [key]:value }, index);
        benefitsModalWrite(section, items);
      });
    });

    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-property-slide-media]');
      if (!input?.files?.[0]) return;
      const current = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!current || current.type !== 'property-slider') return;
      const file = input.files[0];
      if (!String(file.type || '').startsWith('image/')) return toast('Selecione um arquivo de imagem válido.', 'error');
      if (file.size > 8 * 1024 * 1024) return toast('Use uma imagem de até 8 MB.', 'error');
      const id = input.dataset.propertySlideId;
      const reader = new FileReader();
      reader.onload = () => {
        propertySliderEditorSelection.set(current.id, id);
        commit((draft) => {
          const section = draft.sections.find((item) => item.id === current.id);
          if (!section || section.type !== 'property-slider') return;
          const items = propertySliderSlides(section);
          const index = items.findIndex((item) => String(item.id) === String(id));
          if (index < 0) return;
          items[index] = propertySliderNormalizeSlide({ ...items[index], image:String(reader.result || '') }, index);
          propertySliderWrite(section, items);
        }, { history:false });
        input.value = '';
      };
      reader.readAsDataURL(file);
    });

    $('#inspectorContent').addEventListener('change', (event) => {
      const field = event.target.closest('[data-property-slide-field]');
      if (!field) return;
      const current = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!current || current.type !== 'property-slider') return;
      const id = field.dataset.propertySlideId;
      const key = field.dataset.propertySlideField;
      const value = field.value;
      propertySliderEditorSelection.set(current.id, id);
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === current.id);
        if (!section || section.type !== 'property-slider') return;
        const items = propertySliderSlides(section);
        const index = items.findIndex((item) => String(item.id) === String(id));
        if (index < 0) return;
        items[index] = propertySliderNormalizeSlide({ ...items[index], [key]:value }, index);
        propertySliderWrite(section, items);
      });
    });

    /* Caminhos de mídia são deliberadamente commitados apenas ao concluir a edição.
       Isso evita reconstruir a prévia + histórico a cada caractere e evita foco em
       inputs contendo Data URLs gigantes. */
    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-media-path-prop]');
      if (!input) return;
      const next = input.value.trim();
      if (!next) return;
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        const key = input.dataset.mediaPathProp;
        section.props[key] = next;
        if (section.type === 'parallax' && key === 'videoSrc') {
          section.props.videoDuration = 0;
          section.props.endTimeAuto = true;
        }
      });
    });
    $('#inspectorContent').addEventListener('keydown', (event) => {
      const input = event.target.closest('[data-media-path-prop]');
      if (!input || event.key !== 'Enter') return;
      event.preventDefault();
      input.blur();
    });
    $('#inspectorContent').addEventListener('input', (event) => {
      const input = event.target.closest('[data-section-background]');
      if (!input || !['color','range'].includes(input.type)) return;
      const key = input.dataset.sectionBackground;
      const value = input.type === 'range' ? Number(input.value) : input.value;
      const output = $('#inspectorContent').querySelector(`[data-section-background-output="${CSS.escape(key)}"]`);
      if (output) output.textContent = String(value);
      liveCommit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        section.settings.background = { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(section.settings.background || {}), [key]:value };
      });
    });
    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-section-background]');
      if (!input || (input.type !== 'text' && input.tagName !== 'SELECT')) return;
      const key = input.dataset.sectionBackground;
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        section.settings.background = { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(section.settings.background || {}), [key]:input.value.trim() };
      });
    });
    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-section-background-file]');
      const file = input?.files?.[0];
      if (!file) return;
      if (!/^image\/(?:png|jpeg|webp|gif|avif)$/.test(file.type)) return toast('Escolha uma imagem PNG, JPG, WebP, GIF ou AVIF.', 'error');
      if (file.size > 8 * 1024 * 1024) return toast('A imagem do fundo deve ter até 8 MB.', 'error');
      const sectionId = state.selectedSectionId;
      const reader = new FileReader();
      reader.onload = () => commit((draft) => {
        const section = draft.sections.find((item) => item.id === sectionId);
        if (!section) return;
        section.settings ||= {};
        section.settings.background = { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(section.settings.background || {}), enabled:true, type:'image', image:String(reader.result || '') };
      });
      reader.onerror = () => toast('Não foi possível carregar a imagem.', 'error');
      reader.readAsDataURL(file);
    });
    $('#inspectorContent').addEventListener('input', (event) => {
      const input = event.target.closest('[data-section-style]');
      if (!input || !['range','color','number'].includes(input.type)) return;
      const key = input.dataset.sectionStyle;
      const value = ['range','number'].includes(input.type) ? Number(input.value) : input.value;
      const output = $('#inspectorContent').querySelector(`[data-section-style-output="${CSS.escape(key)}"]`);
      if (output) output.textContent = String(value);
      liveCommit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        section.settings.style = { ...(catalog.sectionStyleDefaults?.() || {}), ...(section.settings.style || {}), [key]:value };
      });
    });
    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-section-style]');
      if (!input || input.tagName !== 'SELECT') return;
      const key = input.dataset.sectionStyle;
      commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        section.settings.style = { ...(catalog.sectionStyleDefaults?.() || {}), ...(section.settings.style || {}), [key]:input.value };
      });
    });
    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-section-setting]');
      if (input) commit((draft) => { const section = draft.sections.find((item) => item.id === draft.selectedSectionId); if (section) { const key = input.dataset.sectionSetting; section.settings[key] = key === 'anchorId' ? input.value.trim().replace(/^#/, '') : input.value; } });
    });
    $('#inspectorContent').addEventListener('click', (event) => {
      if (event.target.closest('[data-bs-clear-background]')) {
        commit((draft) => {
          const section=draft.sections.find((item) => item.id === draft.selectedSectionId);
          if (section?.type === 'benefits-showcase') section.props.backgroundImage='';
        });
        return;
      }
      const selectedBenefitsModal = state.sections.find((item) => item.id === state.selectedSectionId);
      if (selectedBenefitsModal?.type === 'beneficios-modal') {
        const currentItems = benefitsModalItems(selectedBenefitsModal);
        const addItem = event.target.closest('[data-benefit-add]');
        if (addItem) {
          const newItem = benefitsModalNewItem(currentItems);
          benefitsModalEditorSelection.set(selectedBenefitsModal.id, newItem.id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedBenefitsModal.id);
            if (!section || section.type !== 'beneficios-modal') return;
            const items = benefitsModalItems(section);
            items.push(newItem);
            benefitsModalWrite(section, items);
          });
          return;
        }
        const editItem = event.target.closest('[data-benefit-edit]');
        if (editItem) {
          benefitsModalEditorSelection.set(selectedBenefitsModal.id, editItem.dataset.benefitEdit);
          renderInspector();
          return;
        }
        const editSelected = event.target.closest('[data-benefit-edit-selected]');
        if (editSelected) {
          const selected = benefitsModalSelected(selectedBenefitsModal, currentItems);
          if (!selected.item && currentItems[0]) benefitsModalEditorSelection.set(selectedBenefitsModal.id, currentItems[0].id);
          renderInspector();
          return;
        }
        const row = event.target.closest('[data-benefit-row]');
        if (row && !event.target.closest('button')) {
          benefitsModalEditorSelection.set(selectedBenefitsModal.id, row.dataset.benefitId);
          renderInspector();
          return;
        }
        const removeSpecific = event.target.closest('[data-benefit-remove]');
        const removeSelected = event.target.closest('[data-benefit-remove-selected]');
        if (removeSpecific || removeSelected) {
          const selected = benefitsModalSelected(selectedBenefitsModal, currentItems);
          const id = removeSpecific?.dataset.benefitRemove || selected.item?.id;
          if (!id) return;
          if (currentItems.length <= 1) return toast('Mantenha pelo menos um benefício no componente.', 'error');
          const victim = currentItems.find((item) => String(item.id) === String(id));
          if (!confirm(`Remover ${victim?.title ? `“${victim.title}”` : 'este benefício'}?`)) return;
          const victimIndex = currentItems.findIndex((item) => String(item.id) === String(id));
          const nextSelection = currentItems[victimIndex + 1]?.id || currentItems[victimIndex - 1]?.id || '';
          if (nextSelection) benefitsModalEditorSelection.set(selectedBenefitsModal.id, nextSelection);
          else benefitsModalEditorSelection.delete(selectedBenefitsModal.id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedBenefitsModal.id);
            if (!section || section.type !== 'beneficios-modal') return;
            benefitsModalWrite(section, benefitsModalItems(section).filter((item) => String(item.id) !== String(id)));
          });
          return;
        }
        const moveItem = event.target.closest('[data-benefit-move]');
        if (moveItem) {
          const id = moveItem.dataset.benefitId;
          const direction = moveItem.dataset.benefitMove;
          const index = currentItems.findIndex((item) => String(item.id) === String(id));
          const target = direction === 'up' ? index - 1 : index + 1;
          if (index < 0 || target < 0 || target >= currentItems.length) return;
          benefitsModalEditorSelection.set(selectedBenefitsModal.id, id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedBenefitsModal.id);
            if (!section || section.type !== 'beneficios-modal') return;
            const items = benefitsModalItems(section);
            const from = items.findIndex((item) => String(item.id) === String(id));
            const to = direction === 'up' ? from - 1 : from + 1;
            if (from < 0 || to < 0 || to >= items.length) return;
            [items[from], items[to]] = [items[to], items[from]];
            benefitsModalWrite(section, items);
          });
          return;
        }
        const iconPicker = event.target.closest('[data-benefit-open-icon-picker]');
        if (iconPicker) {
          const id = iconPicker.dataset.benefitOpenIconPicker;
          benefitsModalEditorSelection.set(selectedBenefitsModal.id, id);
          openBenefitsIconPicker(selectedBenefitsModal.id, id);
          return;
        }
      }

      const selectedPropertySlider = state.sections.find((item) => item.id === state.selectedSectionId);
      if (selectedPropertySlider?.type === 'property-slider') {
        const currentItems = propertySliderSlides(selectedPropertySlider);
        const addSlide = event.target.closest('[data-property-slide-add]');
        if (addSlide) {
          const newSlide = propertySliderNewSlide(currentItems);
          propertySliderEditorSelection.set(selectedPropertySlider.id, newSlide.id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedPropertySlider.id);
            if (!section || section.type !== 'property-slider') return;
            const items = propertySliderSlides(section);
            items.push(newSlide);
            propertySliderWrite(section, items);
          });
          return;
        }
        const editSlide = event.target.closest('[data-property-slide-edit]');
        if (editSlide) {
          propertySliderEditorSelection.set(selectedPropertySlider.id, editSlide.dataset.propertySlideEdit);
          renderInspector();
          return;
        }
        const editSelected = event.target.closest('[data-property-slide-edit-selected]');
        if (editSelected) {
          const selected = propertySliderSelected(selectedPropertySlider, currentItems);
          if (!selected.item && currentItems[0]) propertySliderEditorSelection.set(selectedPropertySlider.id, currentItems[0].id);
          renderInspector();
          return;
        }
        const row = event.target.closest('[data-property-slide-row]');
        if (row && !event.target.closest('button')) {
          propertySliderEditorSelection.set(selectedPropertySlider.id, row.dataset.propertySlideId);
          renderInspector();
          return;
        }
        const removeSpecific = event.target.closest('[data-property-slide-remove]');
        const removeSelected = event.target.closest('[data-property-slide-remove-selected]');
        if (removeSpecific || removeSelected) {
          const selected = propertySliderSelected(selectedPropertySlider, currentItems);
          const id = removeSpecific?.dataset.propertySlideRemove || selected.item?.id;
          if (!id) return;
          if (currentItems.length <= 1) return toast('O slider precisa manter pelo menos um slide.', 'error');
          const victim = currentItems.find((item) => String(item.id) === String(id));
          if (!confirm(`Remover ${victim?.title ? `“${victim.title}”` : 'este slide'}?`)) return;
          const victimIndex = currentItems.findIndex((item) => String(item.id) === String(id));
          const nextSelection = currentItems[victimIndex + 1]?.id || currentItems[victimIndex - 1]?.id || '';
          if (nextSelection) propertySliderEditorSelection.set(selectedPropertySlider.id, nextSelection);
          else propertySliderEditorSelection.delete(selectedPropertySlider.id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedPropertySlider.id);
            if (!section || section.type !== 'property-slider') return;
            const items = propertySliderSlides(section).filter((item) => String(item.id) !== String(id));
            propertySliderWrite(section, items);
          });
          return;
        }
        const moveSlide = event.target.closest('[data-property-slide-move]');
        if (moveSlide) {
          const id = moveSlide.dataset.propertySlideId;
          const direction = moveSlide.dataset.propertySlideMove;
          const index = currentItems.findIndex((item) => String(item.id) === String(id));
          const target = direction === 'up' ? index - 1 : index + 1;
          if (index < 0 || target < 0 || target >= currentItems.length) return;
          propertySliderEditorSelection.set(selectedPropertySlider.id, id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedPropertySlider.id);
            if (!section || section.type !== 'property-slider') return;
            const items = propertySliderSlides(section);
            const from = items.findIndex((item) => String(item.id) === String(id));
            const to = direction === 'up' ? from - 1 : from + 1;
            if (from < 0 || to < 0 || to >= items.length) return;
            [items[from], items[to]] = [items[to], items[from]];
            propertySliderWrite(section, items);
          });
          return;
        }
        const buttonToggle = event.target.closest('[data-property-slide-button-toggle]');
        if (buttonToggle) {
          const id = buttonToggle.dataset.propertySlideButtonToggle;
          propertySliderEditorSelection.set(selectedPropertySlider.id, id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedPropertySlider.id);
            if (!section || section.type !== 'property-slider') return;
            const items = propertySliderSlides(section);
            const index = items.findIndex((item) => String(item.id) === String(id));
            if (index < 0) return;
            items[index].showButton = !items[index].showButton;
            propertySliderWrite(section, items);
          });
          return;
        }
      }
      const selectedParallax = state.sections.find((item) => item.id === state.selectedSectionId);
      if (selectedParallax?.type === 'parallax') {
        const addBanner = event.target.closest('[data-parallax-add-banner]');
        if (addBanner) {
          const at = parallaxEditorPlayheads.get(selectedParallax.id) ?? parallaxTimelineBounds(selectedParallax).start;
          addParallaxKeyAt(selectedParallax, at);
          return;
        }
        const releaseAuto = event.target.closest('[data-parallax-release-auto]');
        if (releaseAuto) {
          const bounds = parallaxTimelineBounds(selectedParallax);
          parallaxEditorPlayheads.set(selectedParallax.id, bounds.duration);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedParallax.id);
            if (!section || section.type !== 'parallax') return;
            section.props.endTimeAuto = true;
            section.props.endTime = bounds.duration;
          });
          parallaxPreviewTime(selectedParallax.id, bounds.duration);
          return;
        }
        const movementLock = event.target.closest('[data-parallax-toggle-movement-lock]');
        if (movementLock) {
          const index = Number(movementLock.dataset.parallaxToggleMovementLock);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedParallax.id);
            if (!section || section.type !== 'parallax') return;
            const items = parseParallaxBanners(section.props.heroPoints);
            if (!items[index]) return;
            items[index].movementLocked = !parallaxMovementLocked(items[index]);
            section.props.heroPoints = JSON.stringify(items);
          });
          return;
        }
        const deleteBanner = event.target.closest('[data-parallax-delete-banner]');
        if (deleteBanner) {
          const index = Number(deleteBanner.dataset.parallaxDeleteBanner);
          parallaxEditorSelection.delete(selectedParallax.id);
          commit((draft) => {
            const section = draft.sections.find((item) => item.id === selectedParallax.id);
            if (!section || section.type !== 'parallax') return;
            const items = parseParallaxBanners(section.props.heroPoints);
            items.splice(index, 1);
            section.props.heroPoints = JSON.stringify(items);
          });
          return;
        }
        const keyMarker = event.target.closest('[data-parallax-key-marker]');
        if (keyMarker) {
          if (Date.now() < parallaxSuppressClickUntil) return;
          const index = Number(keyMarker.dataset.parallaxIndex);
          const bounds = parallaxTimelineBounds(selectedParallax);
          const point = bounds.banners[index];
          if (!point) return;
          parallaxEditorSelection.set(selectedParallax.id, String(point.id || ''));
          parallaxEditorPlayheads.set(selectedParallax.id, parallaxNumber(point.startTime, bounds.start));
          parallaxPreviewTime(selectedParallax.id, point.startTime);
          renderInspector();
          return;
        }
        const startMarker = event.target.closest('[data-parallax-start-marker]');
        if (startMarker) {
          const bounds = parallaxTimelineBounds(selectedParallax);
          parallaxEditorPlayheads.set(selectedParallax.id, bounds.start);
          parallaxPreviewTime(selectedParallax.id, bounds.start);
          const range = $('#inspectorContent').querySelector('[data-parallax-playhead]');
          if (range) { range.value = bounds.start; range.dispatchEvent(new Event('input', { bubbles:true })); }
          return;
        }
        const releaseMarker = event.target.closest('[data-parallax-release-marker]');
        if (releaseMarker) {
          const bounds = parallaxTimelineBounds(selectedParallax);
          parallaxEditorPlayheads.set(selectedParallax.id, bounds.end);
          parallaxPreviewTime(selectedParallax.id, bounds.end);
          const range = $('#inspectorContent').querySelector('[data-parallax-playhead]');
          if (range) { range.value = bounds.end; range.dispatchEvent(new Event('input', { bubbles:true })); }
          return;
        }
        const timeline = event.target.closest('[data-parallax-timeline]');
        if (timeline && !event.target.closest('button')) {
          const bounds = parallaxTimelineBounds(selectedParallax);
          const rect = timeline.getBoundingClientRect();
          if (rect.width > 0) {
            const at = parallaxSnapTime(selectedParallax, ((event.clientX - rect.left) / rect.width) * bounds.duration, bounds.duration);
            parallaxEditorPlayheads.set(selectedParallax.id, at);
            parallaxPreviewTime(selectedParallax.id, at);
            const range = $('#inspectorContent').querySelector('[data-parallax-playhead]');
            if (range) { range.value = at; range.dispatchEvent(new Event('input', { bubbles:true })); }
          }
          return;
        }
      }
      const copyComputed = event.target.closest('[data-inspector-copy-computed]');
      if (copyComputed) {
        const wrapper = copyComputed.closest('[data-computed-field]');
        const output = wrapper?.querySelector('[data-computed-output]');
        if (output) copyEditorText(output.value);
      }
      const toggle = event.target.closest('[data-toggle-prop]');
      if (toggle) {
        commit((draft) => { const section = draft.sections.find((item) => item.id === draft.selectedSectionId); if (section) section.props[toggle.dataset.toggleProp] = !section.props[toggle.dataset.toggleProp]; });
        syncInspectorDynamicFields();
      }
      const sectionToggle = event.target.closest('[data-section-setting-toggle]');
      if (sectionToggle) toggleSectionBooleanSetting(state.selectedSectionId, sectionToggle.dataset.sectionSettingToggle);
      if (event.target.closest('[data-section-background-toggle]')) commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        const current = { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(section.settings.background || {}) };
        current.enabled = current.enabled !== true;
        section.settings.background = current;
      });
      if (event.target.closest('[data-section-background-clear]')) commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings.background = { ...(catalog.sectionBackgroundDefaults?.() || {}), ...(section.settings.background || {}), image:'' };
      });
      if (event.target.closest('[data-section-background-reset]')) commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (section) section.settings.background = catalog.sectionBackgroundDefaults?.() || { enabled:false };
      });
      const styleToggle = event.target.closest('[data-section-style-toggle]');
      if (styleToggle) commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        const current = { ...(catalog.sectionStyleDefaults?.() || {}), ...(section.settings.style || {}) };
        const key = styleToggle.dataset.sectionStyleToggle;
        current[key] = !current[key];
        if (key === 'enabled') current.panelOpen = current.enabled === true;
        section.settings.style = current;
      });
      if (event.target.closest('[data-section-style-panel-toggle]')) commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (!section) return;
        section.settings ||= {};
        const current = { ...(catalog.sectionStyleDefaults?.() || {}), ...(section.settings.style || {}) };
        if (current.enabled !== true) return;
        current.panelOpen = current.panelOpen === false;
        section.settings.style = current;
      });
      if (event.target.closest('[data-section-style-reset]')) commit((draft) => {
        const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
        if (section) { section.settings ||= {}; section.settings.style = catalog.sectionStyleDefaults?.() || { enabled:false }; }
      });
      if (event.target.closest('[data-inspector-how-use]')) openFloatingHelp(state.selectedSectionId);
      if (event.target.closest('[data-open-advanced-inspector]')) openHeroPlusStudio(state.selectedSectionId);
      if (event.target.closest('[data-add-to-current-slot]')) {
        const meta = buildSectionLayoutMeta();
        const current = meta.get(state.selectedSectionId);
        if (current?.parentId) openBlockPicker(state.sections.length, { segmentId:current.parentId, slot:current.slot || 0 });
      }
      if (event.target.closest('[data-inspector-duplicate]')) duplicateSection(state.selectedSectionId);
      if (event.target.closest('[data-inspector-save-block]')) saveReusableBlock();
      if (event.target.closest('[data-inspector-remove]')) removeSection(state.selectedSectionId);
    });
    $('#inspectorContent').addEventListener('dragstart', (event) => {
      const row = event.target.closest('[data-property-slide-row]');
      if (!row) return;
      const section = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!section || section.type !== 'property-slider') return;
      propertySliderDrag = { sectionId:section.id, id:row.dataset.propertySlideId };
      row.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', row.dataset.propertySlideId || 'slide');
      }
    });
    $('#inspectorContent').addEventListener('dragover', (event) => {
      if (!propertySliderDrag) return;
      const row = event.target.closest('[data-property-slide-row]');
      if (!row) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    $('#inspectorContent').addEventListener('drop', (event) => {
      if (!propertySliderDrag) return;
      const targetRow = event.target.closest('[data-property-slide-row]');
      const section = state.sections.find((item) => item.id === propertySliderDrag.sectionId);
      if (!targetRow || !section || section.type !== 'property-slider') return;
      event.preventDefault();
      const sourceId = propertySliderDrag.id;
      const targetId = targetRow.dataset.propertySlideId;
      propertySliderDrag = null;
      if (!sourceId || !targetId || sourceId === targetId) return renderInspector();
      const rect = targetRow.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      propertySliderEditorSelection.set(section.id, sourceId);
      commit((draft) => {
        const draftSection = draft.sections.find((item) => item.id === section.id);
        if (!draftSection || draftSection.type !== 'property-slider') return;
        const items = propertySliderSlides(draftSection);
        const from = items.findIndex((item) => String(item.id) === String(sourceId));
        let to = items.findIndex((item) => String(item.id) === String(targetId));
        if (from < 0 || to < 0) return;
        const [moved] = items.splice(from, 1);
        to = items.findIndex((item) => String(item.id) === String(targetId));
        if (after) to += 1;
        items.splice(Math.max(0, Math.min(to, items.length)), 0, moved);
        propertySliderWrite(draftSection, items);
      });
    });
    $('#inspectorContent').addEventListener('dragend', () => {
      propertySliderDrag = null;
      $('#inspectorContent').querySelectorAll('.property-slide-editor-row.is-dragging').forEach((row) => row.classList.remove('is-dragging'));
    });
    $('#inspectorContent').addEventListener('dblclick', (event) => {
      const timeline = event.target.closest('[data-parallax-timeline]');
      if (!timeline || event.target.closest('[data-parallax-key-marker], [data-parallax-start-marker], [data-parallax-release-marker], button')) return;
      const section = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!section || section.type !== 'parallax') return;
      const bounds = parallaxTimelineBounds(section);
      const rect = timeline.getBoundingClientRect();
      if (!rect.width) return;
      const at = parallaxFreeKeyTime(section, ((event.clientX - rect.left) / rect.width) * bounds.duration);
      parallaxEditorPlayheads.set(section.id, at);
      parallaxPreviewTime(section.id, at);
      if (confirm(`Deseja criar um ponto-chave em ${parallaxTime(at)}s?\n\nOK = Sim · Cancelar = Não`)) addParallaxKeyAt(section, at);
    });
    $('#inspectorContent').addEventListener('pointerdown', (event) => {
      const keyMarker = event.target.closest('[data-parallax-key-marker]');
      const startMarker = event.target.closest('[data-parallax-start-marker]');
      const releaseMarker = event.target.closest('[data-parallax-release-marker]');
      if (!keyMarker && !startMarker && !releaseMarker) return;
      const section = state.sections.find((item) => item.id === state.selectedSectionId);
      if (!section || section.type !== 'parallax') return;
      const timeline = event.target.closest('[data-parallax-timeline]');
      if (!timeline) return;
      const bounds = parallaxTimelineBounds(section);
      event.preventDefault();
      if (keyMarker) {
        const index = Number(keyMarker.dataset.parallaxIndex);
        const point = bounds.banners[index];
        if (!point) return;
        const pointId = String(point.id || '');
        if (parallaxMovementLocked(point)) {
          /* Selecionar não é arrastar. Quando bloqueada, deixamos o click normal
             abrir o editor e não armamos pointer capture nem movimento. */
          parallaxEditorSelection.set(section.id, pointId);
          parallaxEditorPlayheads.set(section.id, parallaxNumber(point.startTime, bounds.start));
          parallaxPreviewTime(section.id, point.startTime);
          return;
        }
        parallaxEditorSelection.set(section.id, pointId);
        parallaxEditorPlayheads.set(section.id, parallaxNumber(point.startTime, bounds.start));
        parallaxEditorDrag = {
          type:'key', pointerId:event.pointerId, sectionId:section.id, pointId, timeline, marker:keyMarker,
          duration:bounds.duration, originalTime:parallaxNumber(point.startTime, bounds.start), currentTime:parallaxNumber(point.startTime, bounds.start), moved:false
        };
        keyMarker.classList.add('is-dragging');
      } else if (startMarker) {
        const step = parallaxStep(section);
        const firstKey = bounds.banners.length ? Math.min(...bounds.banners.map((point) => parallaxNumber(point.startTime, bounds.end))) : bounds.end;
        const maxTime = Math.max(0, Math.min(bounds.end - step, firstKey - step));
        parallaxEditorDrag = {
          type:'start', pointerId:event.pointerId, sectionId:section.id, timeline, marker:startMarker,
          duration:bounds.duration, maxTime, originalTime:bounds.start, currentTime:bounds.start, moved:false
        };
        startMarker.classList.add('is-dragging');
      } else {
        const floor = parallaxReleaseFloor(section, bounds.banners, bounds.duration);
        parallaxEditorDrag = {
          type:'release', pointerId:event.pointerId, sectionId:section.id, timeline, marker:releaseMarker,
          duration:bounds.duration, minTime:floor, originalTime:bounds.end, currentTime:bounds.end, moved:false
        };
        releaseMarker.classList.add('is-dragging');
      }
      try { event.target.setPointerCapture?.(event.pointerId); } catch {}
    });
    window.addEventListener('pointermove', (event) => {
      const drag = parallaxEditorDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const section = state.sections.find((item) => item.id === drag.sectionId);
      if (!section || section.type !== 'parallax') return;
      const bounds = parallaxTimelineBounds(section);
      const rect = drag.timeline.getBoundingClientRect();
      if (!rect.width) return;
      let at = parallaxSnapTime(section, ((event.clientX - rect.left) / rect.width) * bounds.duration, bounds.duration);
      if (drag.type === 'key') { const step = parallaxStep(section); at = parallaxClamp(at, Math.min(bounds.end-step,bounds.start+step), Math.max(bounds.start+step, bounds.end-step)); }
      else if (drag.type === 'start') at = parallaxClamp(at, 0, drag.maxTime);
      else at = parallaxClamp(at, drag.minTime, bounds.duration);
      drag.currentTime = at;
      drag.moved ||= Math.abs(at - drag.originalTime) >= parallaxStep(section) * 0.45;
      drag.marker.style.left = parallaxMarkerLeft(at, bounds.duration);
      const markerTime = drag.marker.querySelector('em'); if (markerTime) markerTime.textContent = `${parallaxTime(at)}s`;
      const label = $('#inspectorContent').querySelector('[data-parallax-playhead-label]'); if (label) label.textContent = `${parallaxTime(at)}s`;
      const line = $('#inspectorContent').querySelector('[data-parallax-playhead-line]'); if (line) line.style.left = parallaxMarkerLeft(at, bounds.duration);
      parallaxEditorPlayheads.set(section.id, at);
      if (drag.type === 'release' || drag.type === 'start') {
        const windowEl = $('#inspectorContent').querySelector('.parallax-window');
        if (windowEl) {
          if (drag.type === 'release') windowEl.style.right = `${Math.max(0, 100 - (at / Math.max(0.1, bounds.duration)) * 100).toFixed(3)}%`;
          else windowEl.style.left = parallaxMarkerLeft(at, bounds.duration);
        }
      }
      parallaxPreviewTime(section.id, at);
    }, { passive:true });
    const finishParallaxDrag = (event) => {
      const drag = parallaxEditorDrag;
      if (!drag || (event.pointerId != null && drag.pointerId !== event.pointerId)) return;
      parallaxEditorDrag = null;
      drag.marker?.classList.remove('is-dragging');
      const section = state.sections.find((item) => item.id === drag.sectionId);
      if (!section || section.type !== 'parallax') return;
      parallaxSuppressClickUntil = Date.now() + 220;
      if (drag.type === 'key') {
        const at = parallaxFreeKeyTime(section, drag.currentTime, drag.pointId);
        const currentItems = parseParallaxBanners(section.props.heroPoints);
        const currentPoint = currentItems.find((item) => String(item.id || '') === drag.pointId);
        if (!currentPoint) return;
        const oldStart = parallaxNumber(currentPoint.startTime, at);
        const delta = at - oldStart;
        parallaxEditorSelection.set(section.id, drag.pointId);
        parallaxEditorPlayheads.set(section.id, at);
        if (!drag.moved && Math.abs(delta) < parallaxStep(section) * 0.45) { renderInspector(); parallaxPreviewTime(section.id, at); return; }
        commit((draft) => {
          const target = draft.sections.find((item) => item.id === drag.sectionId);
          if (!target || target.type !== 'parallax') return;
          const items = parseParallaxBanners(target.props.heroPoints);
          const point = items.find((item) => String(item.id || '') === drag.pointId);
          if (!point) return;
          const before = parallaxNumber(point.startTime, at);
          const shift = at - before;
          point.startTime = at;
          point.cinematicStop = true;
          point.enabled = true;
          point.endTime = Math.max(at, parallaxNumber(point.endTime, before + 4) + shift);
          point.boomerangAtTime = parallaxNumber(point.boomerangAtTime, before) + shift;
          items.sort((a,b) => parallaxNumber(a.startTime,0) - parallaxNumber(b.startTime,0));
          target.props.heroPoints = JSON.stringify(items);
          const nextBounds = parallaxTimelineBounds(target);
          const floor = parallaxReleaseFloor(target, items, nextBounds.duration);
          if (parallaxNumber(target.props.endTime, nextBounds.duration) < floor) {
            target.props.endTime = floor;
            target.props.endTimeAuto = false;
          }
        });
        parallaxPreviewTime(section.id, at);
        return;
      }
      if (drag.type === 'start') {
        const at = parallaxClamp(parallaxSnapTime(section, drag.currentTime, drag.duration), 0, drag.maxTime);
        parallaxEditorPlayheads.set(section.id, at);
        if (!drag.moved && Math.abs(at - drag.originalTime) < parallaxStep(section) * 0.45) { parallaxPreviewTime(section.id, at); return; }
        commit((draft) => {
          const target = draft.sections.find((item) => item.id === drag.sectionId);
          if (!target || target.type !== 'parallax') return;
          target.props.startTime = at;
        });
        parallaxPreviewTime(section.id, at);
        return;
      }
      const at = parallaxClamp(parallaxSnapTime(section, drag.currentTime, drag.duration), drag.minTime, drag.duration);
      parallaxEditorPlayheads.set(section.id, at);
      if (!drag.moved && Math.abs(at - drag.originalTime) < parallaxStep(section) * 0.45) { parallaxPreviewTime(section.id, at); return; }
      commit((draft) => {
        const target = draft.sections.find((item) => item.id === drag.sectionId);
        if (!target || target.type !== 'parallax') return;
        target.props.endTimeAuto = false;
        target.props.endTime = at;
      });
      parallaxPreviewTime(section.id, at);
    };
    window.addEventListener('pointerup', finishParallaxDrag, { passive:true });
    window.addEventListener('pointercancel', finishParallaxDrag, { passive:true });
    $('#inspectorContent').addEventListener('change', (event) => {
      const input = event.target.closest('[data-media-prop]'); if (!input?.files?.[0]) return;
      const file = input.files[0];
      const kind = input.dataset.mediaKind || 'file';
      const limits = { image: 8, video: 120, audio: 40 };
      const maxMb = limits[kind] || 20;
      if (file.size > maxMb * 1024 * 1024) return toast(`Use ${kind === 'image' ? 'uma imagem' : kind === 'video' ? 'um vídeo' : 'um áudio'} de até ${maxMb} MB.`, 'error');
      const reader = new FileReader();
      reader.onload = () => {
        commit((draft) => {
          const section = draft.sections.find((item) => item.id === draft.selectedSectionId);
          if (!section) return;
          const key = input.dataset.mediaProp;
          section.props[key] = reader.result;
          if (section.type === 'parallax' && key === 'videoSrc') {
            section.props.videoDuration = 0;
            section.props.endTimeAuto = true;
          }
        }, { history:false });
        input.value = '';
      };
      reader.readAsDataURL(file);
    });
    $('#undoBtn').addEventListener('click', undo); $('#redoBtn').addEventListener('click', redo);
    $('#saveBtn').addEventListener('click', (event) => { event.stopPropagation(); toggleProjectFileMenu(); });
    $('#newProjectBtn').addEventListener('click', openNewProjectDialog);
    $('#quickBlankProjectBtn')?.addEventListener('click', createBlankProject);
    $('#closeNewProjectDialog').addEventListener('click', () => $('#newProjectDialog').close());
    $('#createBlankProjectBtn').addEventListener('click', createBlankProject);
    $('#newProjectPresetTree').addEventListener('click', (event) => {
      const item = event.target.closest('[data-new-project-preset]');
      if (item) createNewProjectFromPreset(item.dataset.newProjectPreset);
    });
    $('#openPresetNewProjectBtn').addEventListener('click', openNewProjectDialog);
    $('#projectPresetLibrary').addEventListener('click', (event) => {
      const action = event.target.closest('[data-project-preset-id]');
      if (!action) return;
      if (action.dataset.presetAction === 'new') createNewProjectFromPreset(action.dataset.projectPresetId);
      if (action.dataset.presetAction === 'apply') applyProjectPreset(action.dataset.projectPresetId);
    });
    $('#saveProjectAsPresetBtn').addEventListener('click', openSaveProjectPresetDialog);
    $('#closeSaveProjectPresetDialog').addEventListener('click', () => $('#saveProjectPresetDialog').close());
    $('#projectPresetName').addEventListener('input', (event) => {
      const idInput = $('#projectPresetId');
      if (idInput.dataset.auto === 'true') idInput.value = projectPresets.slug(event.target.value);
    });
    $('#projectPresetId').addEventListener('input', (event) => { event.target.dataset.auto = 'false'; });
    $('#savePresetToStudioBtn').addEventListener('click', saveCurrentProjectPresetToStudio);
    $('#exportProjectPresetZipBtn').addEventListener('click', exportCurrentProjectPresetZip);
    $('#compileBtn').addEventListener('click', compileProject);
    $('#previewBtn').addEventListener('click', async () => { $('#previewDialog').showModal(); await renderPreview($('#fullPreviewFrame'), false); });
    $('#closePreviewBtn').addEventListener('click', () => $('#previewDialog').close());
    $('#savePresetBtn').addEventListener('click', () => downloadJson({ name: `${state.projectName} — preset`, ...state.brand }, `${compiler.slug(state.projectName)}-preset.json`));
    $('#importPresetInput').addEventListener('change', (event) => readJsonFile(event.target.files[0], (data) => applyPreset(null, data)));
    $('#duplicateProjectBtn').addEventListener('click', duplicateProject);
    $('#newFromBlueprintBtn').addEventListener('click', newProjectFromBlueprint);
    $('#applySiteDataBtn').addEventListener('click', applyGlobalData);
    $('#compileBatchBtn').addEventListener('click', compileProjectBatch);
    $('#projectLibrary').addEventListener('click', (event) => { const item = event.target.closest('[data-open-project]'); if (item) openProject(item.dataset.openProject); });
    $('#pageSettingsControls').addEventListener('change', (event) => { const input = event.target.closest('[data-page-setting]'); if (input) commit((draft) => { draft.pageSettings[input.dataset.pageSetting] = input.value; }); });
    $('#siteDataControls').addEventListener('input', (event) => { const input = event.target.closest('[data-site-data]'); if (!input) return; state.siteData[input.dataset.siteData] = input.value; saveState(); });
    $('#projectFileMenu').addEventListener('click', (event) => {
      const action = event.target.closest('[data-project-file-action]');
      if (!action) return;
      closeProjectFileMenu();
      if (action.dataset.projectFileAction === 'load') openProjectFromDisk();
      if (action.dataset.projectFileAction === 'save') saveProjectToDisk();
    });
    $('#projectFileInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      readJsonFile(file, (data) => applyLoadedProject(data, null));
      event.target.value = '';
    });
    document.addEventListener('click', (event) => { if (!event.target.closest('.project-file-menu-wrap')) closeProjectFileMenu(); });
    $('#resetProjectBtn').addEventListener('click', () => { if (confirm('Restaurar o projeto demonstrativo?')) { undoStack.push(clone(state)); state = normalizeState(catalog.defaultState()); currentProjectFileHandle = null; saveState(); refresh(); } });
    $$('.device-btn').forEach((button) => button.addEventListener('click', () => { const levels = { desktop: 60, tablet: 74, mobile: 92 }; $$('.device-btn').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); $('#browserFrame').dataset.device = button.dataset.device; setCanvasZoom(levels[button.dataset.device], button.dataset.device); }));
    $('#zoomRange').addEventListener('input', (event) => setCanvasZoom(event.target.value));
    $('#inspectorStateMenuButton').addEventListener('click', (event) => {
      event.stopPropagation();
      toggleInspectorStateMenu();
    });
    $('#inspectorStateMenu').addEventListener('click', (event) => {
      const action = event.target.closest('[data-component-state-action]');
      if (!action || action.disabled) return;
      event.stopPropagation();
      if (action.dataset.componentStateAction === 'save-component') return exportComponentState('component');
      if (action.dataset.componentStateAction === 'save-group') return exportComponentState('group');
      if (action.dataset.componentStateAction === 'load') {
        closeInspectorStateMenu();
        $('#componentStateInput').click();
      }
    });
    $('#componentStateInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) toast('Use um preset JSON de até 25 MB.', 'error');
      else readJsonFile(file, applyComponentState);
      event.target.value = '';
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.inspector-state-menu-wrap')) closeInspectorStateMenu();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeInspectorStateMenu(); closeProjectFileMenu(); } });

    document.addEventListener('click', (event) => {
      const modalPluginLaunch = event.target.closest('[data-open-plugin-modal-editor]');
      if (modalPluginLaunch) { pluginEditorOpen(); return; }
      const launch = event.target.closest('[data-open-smart-plant-studio]');
      if (launch) { smartPlantOpenStudio(); return; }
      const pluginDialog = event.target.closest('#pluginModalEditorDialog');
      if (pluginDialog) {
        if (event.target.closest('[data-plugin-modal-cancel]')) { pluginDialog.close(); return; }
        if (event.target.closest('[data-plugin-modal-save]')) { pluginEditorSave(pluginDialog); return; }
      }
      const dialog = event.target.closest('#smartPlantStudioDialog');
      if (!dialog) return;
      const sectionId = dialog.dataset.sectionId;
      const ctx = smartPlantCurrent(sectionId);
      if (!ctx) return;
      if (event.target.closest('[data-spstudio-cancel]')) { smartPlantStudioDrafts.delete(sectionId); smartPlantStudioThemes.delete(sectionId); dialog.close(); return; }
      if (event.target.closest('[data-spstudio-save]')) {
        const payload = clone(ctx.items);
        const themePayload = clone(smartPlantTheme(sectionId, ctx.section));
        commit((draft) => {
          const section = draft.sections.find((item) => item.id === sectionId);
          if (section?.type !== 'smart-plant') return;
          section.props.plants = JSON.stringify(payload);
          Object.assign(section.props, themePayload);
        });
        smartPlantStudioDrafts.delete(sectionId); smartPlantStudioThemes.delete(sectionId); dialog.close(); toast('Smart Plant atualizado.'); return;
      }
      const themeToggle = event.target.closest('[data-spstudio-theme-toggle]');
      if (themeToggle) { const theme = smartPlantTheme(sectionId, ctx.section); theme.localTheme = !!themeToggle.checked; smartPlantRenderStudio(sectionId); return; }
      const select = event.target.closest('[data-spstudio-select]');
      if (select) { smartPlantStudioSelection.set(sectionId, select.dataset.spstudioSelect); smartPlantRenderStudio(sectionId); return; }
      const tab = event.target.closest('[data-spstudio-tab]');
      if (tab) { smartPlantRenderStudio(sectionId, tab.dataset.spstudioTab); return; }
      if (event.target.closest('[data-spstudio-add]')) {
        const id = `planta-${Date.now().toString(36)}`;
        ctx.items.push({id,code:'',title:'Nova planta',description:'',area:'',composition:'',bathrooms:'',features:'',image:'',fullImage:'',positionImage:'',position:''});
        smartPlantStudioSelection.set(sectionId,id); smartPlantRenderStudio(sectionId); return;
      }
      if (event.target.closest('[data-spstudio-duplicate]') && ctx.selected) {
        const copy = clone(ctx.selected); copy.id = `${ctx.selected.id}-copy-${Date.now().toString(36)}`; copy.title = `${copy.title} (cópia)`; ctx.items.splice(ctx.items.indexOf(ctx.selected)+1,0,copy); smartPlantStudioSelection.set(sectionId,copy.id); smartPlantRenderStudio(sectionId); return;
      }
      if (event.target.closest('[data-spstudio-delete]') && ctx.selected) {
        const index = ctx.items.indexOf(ctx.selected); ctx.items.splice(index,1); smartPlantStudioSelection.set(sectionId,ctx.items[Math.min(index,ctx.items.length-1)]?.id || ''); smartPlantRenderStudio(sectionId); return;
      }
      const move = event.target.closest('[data-spstudio-move]');
      if (move && ctx.selected) { const index=ctx.items.indexOf(ctx.selected); const to=move.dataset.spstudioMove==='up'?index-1:index+1; if(to>=0&&to<ctx.items.length){[ctx.items[index],ctx.items[to]]=[ctx.items[to],ctx.items[index]]; smartPlantRenderStudio(sectionId);} return; }
      const pick = event.target.closest('[data-spstudio-pick]'); if (pick) { dialog.querySelector(`[data-spstudio-file="${pick.dataset.spstudioPick}"]`)?.click(); return; }
      const clear = event.target.closest('[data-spstudio-clear]'); if (clear && ctx.selected) { ctx.selected[clear.dataset.spstudioClear]=''; smartPlantRenderStudio(sectionId); return; }
    });
    document.addEventListener('input', (event) => {
      const themeField = event.target.closest('#smartPlantStudioDialog [data-spstudio-theme]');
      if (themeField) {
        const dialog = themeField.closest('#smartPlantStudioDialog'); const sectionId = dialog.dataset.sectionId; const ctx = smartPlantCurrent(sectionId); if (!ctx) return;
        smartPlantTheme(sectionId, ctx.section)[themeField.dataset.spstudioTheme] = themeField.value;
        clearTimeout(dialog._spPreviewTimer); dialog._spPreviewTimer=setTimeout(()=>smartPlantRenderStudio(sectionId),60); return;
      }
      const field = event.target.closest('#smartPlantStudioDialog [data-spstudio-field]');
      if (!field) return;
      const dialog = field.closest('#smartPlantStudioDialog');
      const sectionId = dialog.dataset.sectionId;
      // Atualiza apenas o draft enquanto o usuário digita.
      // NÃO reconstrói o modal no evento input: reconstruir o innerHTML aqui
      // removia o input focado do DOM a cada tecla e obrigava um novo clique.
      smartPlantSetField(sectionId, field.dataset.spstudioField, field.value);
    });
    document.addEventListener('change', (event) => {
      const field = event.target.closest('#smartPlantStudioDialog [data-spstudio-field]');
      if (field) {
        const dialog = field.closest('#smartPlantStudioDialog');
        const sectionId = dialog.dataset.sectionId;
        smartPlantSetField(sectionId, field.dataset.spstudioField, field.value);
        // Só reconstrói a prévia quando a edição do campo foi concluída (change/blur).
        smartPlantRenderStudio(sectionId);
        return;
      }
      const input = event.target.closest('#smartPlantStudioDialog [data-spstudio-file]'); if (!input) return; const file=input.files?.[0]; const dialog=input.closest('#smartPlantStudioDialog'); const sectionId=dialog.dataset.sectionId; const key=input.dataset.spstudioFile; smartPlantReadFile(file,(data)=>{ smartPlantSetField(sectionId,key,data); smartPlantRenderStudio(sectionId); });
    });
    document.addEventListener('dragover', (event) => { const drop=event.target.closest('#smartPlantStudioDialog [data-spstudio-drop]'); if(!drop)return; event.preventDefault(); drop.classList.add('is-over'); });
    document.addEventListener('dragleave', (event) => { const drop=event.target.closest('#smartPlantStudioDialog [data-spstudio-drop]'); drop?.classList.remove('is-over'); });
    document.addEventListener('drop', (event) => { const drop=event.target.closest('#smartPlantStudioDialog [data-spstudio-drop]'); if(!drop)return; event.preventDefault(); drop.classList.remove('is-over'); const dialog=drop.closest('#smartPlantStudioDialog'); const sectionId=dialog.dataset.sectionId; smartPlantReadFile(event.dataTransfer?.files?.[0],(data)=>{smartPlantSetField(sectionId,drop.dataset.spstudioDrop,data);smartPlantRenderStudio(sectionId);}); });
    document.addEventListener('paste', (event) => { const dialog=document.getElementById('smartPlantStudioDialog'); if(!dialog?.open)return; const file=[...(event.clipboardData?.files||[])].find((item)=>String(item.type||'').startsWith('image/')); if(!file)return; const active=dialog.querySelector('.spstudio__drop:hover') || dialog.querySelector('[data-spstudio-drop="image"]'); if(!active)return; event.preventDefault(); const sectionId=dialog.dataset.sectionId; smartPlantReadFile(file,(data)=>{smartPlantSetField(sectionId,active.dataset.spstudioDrop,data);smartPlantRenderStudio(sectionId);}); });

    bindPanelResizer($('#leftPanelResizer'), 'left');
    bindPanelResizer($('#rightPanelResizer'), 'right');
    addEventListener('resize', () => {
      if (window.innerWidth > 820) {
        applyPanelWidth('left', currentPanelWidth('left'), false);
        applyPanelWidth('right', currentPanelWidth('right'), false);
      }
    });
    addEventListener('message', (event) => {
      const previewWindow = $('#previewFrame')?.contentWindow;
      const fullPreviewWindow = $('#fullPreviewFrame')?.contentWindow;
      if (event.source !== previewWindow && event.source !== fullPreviewWindow) return;
      if (event.data?.type === 'imobify-select' && typeof event.data.id === 'string') selectSection(event.data.id);
      if (event.data?.type === 'imobify-editor-action') handleEditorAction(event.data);
      if (event.data?.type === 'parallax-metadata') applyParallaxMetadata(event.data.detail || event.data);
      if (event.data?.type === 'imobify-editor-viewport' && event.source === previewWindow) previewViewport = { scrollY:Number(event.data.scrollY) || 0, selectedId:event.data.selectedId || state.selectedSectionId || null };
    });
    addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveProjectToDisk(); } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); } });
  }

  async function boot() {
    await window.ImobifyPluginLoader.ready;
    await window.ImobifyPresetLoader.ready;
    state = loadState();
    restorePanelLayout();
    bindEvents();
    saveState({ dirty:false });
    refresh(true);
    setProjectDiskStatus(false);
    if (location.protocol === 'file:') toast('Abra pelo servidor local indicado no README para carregar os plugins.', 'error');
  }


  // Editor avançado: tipografia e opacidade do overlay são editadas somente neste modal.
  const parallaxDesignDefaults = {widthPct:0,bannerHeight:0,padding:28,radius:24,borderWidth:1,borderColor:'#ffffff',bgColor:'#080c12',bgOpacity:72,blur:12,shadow:28,overlayOpacity:30,heroAnimation:'inherit',heroDuration:650,heroDelay:0};
  const parallaxDesignElements = ['eyebrow','title','subtitle','text','button'];
  let parallaxDesignSession = null;
  const parallaxDesignEscape = (v)=>catalog.esc(String(v??''));
  function parallaxDesignOpen(index) {
    const section=state.sections.find(x=>x.id===state.selectedSectionId);
    if(!section || section.type!=='parallax') return;
    const items=parseParallaxBanners(section.props.heroPoints);
    if(!items[index])return;
    const point=JSON.parse(JSON.stringify(items[index]));
    point.design??={};point.design.elements??={};
    const legacy={eyebrow:{fontPx:'eyebrowSize',fontFamily:'eyebrowFontFamily'},title:{fontPx:'titleSize',fontFamily:'titleFontFamily',weight:'titleWeight',lineHeight:'titleLineHeight'},subtitle:{fontPx:'subtitleSize'},text:{fontPx:'textSize',fontFamily:'textFontFamily',weight:'textWeight',lineHeight:'textLineHeight'},button:{fontPx:'buttonSize'}};
    for(const [el,fields] of Object.entries(legacy)){
      const target=point.design.elements[el]??={};
      for(const [prop,source] of Object.entries(fields)) if(target[prop]==null && point[source]!=null && point[source]!=='' && point[source]!==0)target[prop]=point[source];
      if(target.fontFamily==null && point.fontFamily)target.fontFamily=point.fontFamily;
      const globalFallback={eyebrow:{fontPx:'bannerEyebrowSize'},title:{fontPx:'bannerTitleSize',weight:'bannerTitleWeight',lineHeight:'bannerTitleLineHeight'},subtitle:{fontPx:'bannerSubtitleSize'},text:{fontPx:'bannerTextSize',weight:'bannerTextWeight',lineHeight:'bannerTextLineHeight'},button:{fontPx:'bannerButtonSize'}};
      for(const [prop,key] of Object.entries(globalFallback[el]||{}))if(target[prop]==null && section.props[key]!=null && section.props[key]!==0)target[prop]=section.props[key];
      if(target.fontFamily==null && section.props.bannerFontFamily)target.fontFamily=section.props.bannerFontFamily;
    }
    if(!point.design.heroAnimation || point.design.heroAnimation==='inherit')point.design.heroAnimation=point.animation||'fade-up';
    if(point.design.overlayOpacity==null)point.design.overlayOpacity=Number(section.props.overlayOpacity??30);
    parallaxDesignSession={sectionId:section.id,index,point};
    parallaxDesignRender();
  }
  const parallaxGoogleFallback=['Roboto','Open Sans','Lato','Montserrat','Poppins','Inter','Nunito','Raleway','Oswald','Merriweather','Playfair Display','Source Sans 3','DM Sans','Manrope','Outfit','Rubik','Work Sans','Ubuntu','Noto Sans','Noto Serif','Libre Baskerville','Cormorant Garamond','Archivo','Barlow','Josefin Sans','Quicksand','Plus Jakarta Sans','Bebas Neue','Pacifico','Roboto Mono','Dancing Script','Lobster','Abril Fatface','Cinzel','Great Vibes','Anton','Space Grotesk','Fira Sans','IBM Plex Sans','IBM Plex Serif','IBM Plex Mono','Karla','Mulish','Cabin','Jost','Sora','Urbanist','Prata','Vollkorn','Alegreya','Figtree','Syne','Fraunces','Crimson Text','Spectral','PT Serif','PT Sans','Inconsolata','Caveat','Satisfy','Sacramento','Permanent Marker','Righteous','Alfa Slab One','Cormorant','Exo 2','Titillium Web'];
  let parallaxGoogleCatalog=null;
  const parallaxGoogleLoads=new Set();
  const parallaxFontCategory={ 'Playfair Display':'Serif','Merriweather':'Serif','Noto Serif':'Serif','Libre Baskerville':'Serif','Cormorant Garamond':'Serif','IBM Plex Serif':'Serif','Prata':'Serif','Vollkorn':'Serif','Alegreya':'Serif','Fraunces':'Serif','Crimson Text':'Serif','Spectral':'Serif','PT Serif':'Serif','Cormorant':'Serif','Roboto Mono':'Monospace','IBM Plex Mono':'Monospace','Inconsolata':'Monospace','Pacifico':'Handwriting','Dancing Script':'Handwriting','Lobster':'Handwriting','Great Vibes':'Handwriting','Caveat':'Handwriting','Satisfy':'Handwriting','Sacramento':'Handwriting','Permanent Marker':'Handwriting','Bebas Neue':'Display','Abril Fatface':'Display','Cinzel':'Display','Anton':'Display','Righteous':'Display','Alfa Slab One':'Display'};
  function parallaxGoogleFontName(value){const x=String(value||'').trim().replace(/^['"]|['"]$/g,'');return x&&x!=='inherit'&&!/[{},;<>]/.test(x)&&x.length<110?x:null;}
  function parallaxGoogleLoad(value){const name=parallaxGoogleFontName(value);if(!name||parallaxGoogleLoads.has(name))return;parallaxGoogleLoads.add(name);const link=document.createElement('link');link.rel='stylesheet';link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(name).replace(/%20/g,'+')+'&display=swap';link.onerror=()=>parallaxGoogleLoads.delete(name);document.head.append(link);}
  async function parallaxGoogleCatalogLoad(){
    if(!parallaxGoogleCatalog){parallaxGoogleCatalog=parallaxGoogleFallback.map(family=>({family,category:parallaxFontCategory[family]||'Sans Serif'}));try{const response=await fetch('https://fonts.google.com/metadata/fonts');if(response.ok){const raw=(await response.text()).replace(/^\)\]\}'\n?/,'');const parsed=JSON.parse(raw);const rows=(parsed.familyMetadataList||[]).map(x=>({family:x.family,category:({SERIF:'Serif',SANS_SERIF:'Sans Serif',DISPLAY:'Display',HANDWRITING:'Handwriting',MONOSPACE:'Monospace'})[String(x.category||'').toUpperCase().replace(/[ -]/g,'_')]||parallaxFontCategory[x.family]||'Sans Serif'})).filter(x=>x.family);if(rows.length>100)parallaxGoogleCatalog=rows.sort((a,b)=>a.family.localeCompare(b.family));}}catch(_){/* searchable fallback if offline */}}
    const dl=document.getElementById('pd-google-fonts');if(dl)dl.innerHTML=parallaxGoogleCatalog.map(x=>'<option value="'+parallaxDesignEscape(x.family)+'"></option>').join('');
    parallaxFontGalleryUpdate();
  }
  let parallaxFontTarget=null,parallaxFontFilter='Todas',parallaxFontSearch='';
  function parallaxFontGalleryUpdate(){
    const root=document.querySelector('#pd-font-gallery');if(!root)return;
    const all=parallaxGoogleCatalog||parallaxGoogleFallback.map(family=>({family,category:parallaxFontCategory[family]||'Sans Serif'}));
    const filtered=all.filter(x=>(parallaxFontFilter==='Todas'||x.category===parallaxFontFilter)&&x.family.toLocaleLowerCase().includes(parallaxFontSearch.toLocaleLowerCase()));
    const grid=root.querySelector('.pd-font-results');if(!grid)return;
    grid.innerHTML=filtered.slice(0,60).map(x=>`<button type="button" class="pd-font-card" data-pd-font-choice="${parallaxDesignEscape(x.family)}"><small>${parallaxDesignEscape(x.family)} · ${x.category}</small><span style="font-family:'${parallaxDesignEscape(x.family)}',sans-serif">Aa — Viva o extraordinário</span></button>`).join('')||'<p>Nenhuma fonte encontrada.</p>';
    const count=root.querySelector('.pd-font-count');if(count)count.textContent=`${filtered.length} fonte(s) encontradas · exibindo até 60`;
    filtered.slice(0,24).forEach(x=>parallaxGoogleLoad(x.family));
    root.querySelectorAll('[data-pd-font-cat]').forEach(x=>x.classList.toggle('active',x.dataset.pdFontCat===parallaxFontFilter));
  }
  function parallaxFontGalleryOpen(el){parallaxFontTarget=el;parallaxFontFilter='Todas';parallaxFontSearch='';const modal=document.querySelector('#parallax-design-modal');if(!modal)return;const root=modal.querySelector('#pd-font-gallery');root.hidden=false;root.querySelector('[data-pd-font-search]').value='';root.querySelector('.pd-font-target').textContent={eyebrow:'Eyebrow',title:'Headline',subtitle:'Subheadline',text:'Body Text',button:'CTA'}[el]||el;parallaxGoogleCatalogLoad();parallaxFontGalleryUpdate();}
  function parallaxDesignRender(){
    const session=parallaxDesignSession;if(!session)return;
    const p=session.point, d={...parallaxDesignDefaults,...p.design};
    const field=(key,label,min,max,step=1)=>`<label class="pd-field">${label}<input type="range" min="${min}" max="${max}" step="${step}" value="${d[key]}" data-pd-field="${key}"><output data-pd-output="${key}">${d[key]}</output></label>`;
    const color=(key,label)=>`<label class="pd-field">${label}<input type="color" value="${parallaxDesignEscape(d[key])}" data-pd-field="${key}"></label>`;
    const selector=(key,label,options)=>`<label class="pd-field">${label}<select data-pd-field="${key}">${options.map(([v,l])=>`<option value="${v}" ${String(d[key])===v?'selected':''}>${l}</option>`).join('')}</select></label>`;
    const animations=[['inherit','Herdar animação atual'],['none','Sem animação'],['fade','Fade'],['fade-up','Fade para cima'],['slide-left','Slide esquerda'],['slide-right','Slide direita'],['zoom-in','Zoom'],['blur-in','Blur'],['mask-reveal','Mask reveal'],['soft-focus','Soft focus'],['ripple-reveal','Ripple']];
    const elFields=parallaxDesignElements.map((el)=>{const x=d.elements?.[el]||{};return `<details class="pd-element" data-pd-group="${el}"><summary>${{eyebrow:'Eyebrow',title:'Headline',subtitle:'Subheadline',text:'Body text',button:'CTA'}[el]}</summary><div class="pd-grid"><label class="pd-field">Fonte relativa ao banner (%)<input type="number" min="0" max="18" step="0.1" value="${x.fontPct||0}" data-pd-element="${el}" data-pd-prop="fontPct"><small>0 = tamanho original</small></label><label class="pd-field">Família tipográfica · Google Fonts<input type="text" readonly value="${parallaxDesignEscape(x.fontFamily||'inherit')}" data-pd-element="${el}" data-pd-prop="fontFamily"><button type="button" data-pd-font-open="${el}">🔎 Buscar e pré-visualizar fontes</button><small>Galeria Google Fonts por categoria</small></label><label class="pd-field">Tamanho fixo (px, 0 = relativo)<input type="number" min="0" max="140" step="1" value="${x.fontPx||0}" data-pd-element="${el}" data-pd-prop="fontPx"></label><label class="pd-field">Peso (100–900)<input type="number" min="100" max="900" step="100" value="${x.weight||0}" data-pd-element="${el}" data-pd-prop="weight"><small>0 = original</small></label><label class="pd-field">Altura de linha (0 = original)<input type="number" min="0" max="3.5" step="0.05" value="${x.lineHeight||0}" data-pd-element="${el}" data-pd-prop="lineHeight"></label><label class="pd-field">Aproximar linhas (px)<input type="number" min="-40" max="20" step="1" value="${x.lineSpacingPx??0}" data-pd-element="${el}" data-pd-prop="lineSpacingPx"><small>Negativo aproxima · 0 = normal</small></label><label class="pd-field">Espaçamento entre letras (px)<input type="number" min="-10" max="30" step="0.1" value="${x.letterSpacing??0}" data-pd-element="${el}" data-pd-prop="letterSpacing"></label><label class="pd-field">Espaçamento entre palavras (px)<input type="number" min="-10" max="40" step="0.5" value="${x.wordSpacing??0}" data-pd-element="${el}" data-pd-prop="wordSpacing"></label><label class="pd-field">Cor do texto<input type="color" value="${/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:'#ffffff'}" data-pd-element="${el}" data-pd-prop="color"></label>${el==='button'?`<label class="pd-field">Cor de fundo do CTA<input type="color" value="${/^#[0-9a-f]{6}$/i.test(x.backgroundColor||'')?x.backgroundColor:'#ffffff'}" data-pd-element="button" data-pd-prop="backgroundColor"></label>`:''}<label class="pd-field">Opacidade (%)<input type="number" min="0" max="100" step="1" value="${x.opacity??100}" data-pd-element="${el}" data-pd-prop="opacity"></label><label class="pd-field">Sombra de texto (px)<input type="number" min="0" max="30" step="1" value="${x.textShadow??0}" data-pd-element="${el}" data-pd-prop="textShadow"></label><label class="pd-field">Transformação<select data-pd-element="${el}" data-pd-prop="textTransform">${[['inherit','Original'],['uppercase','Maiúsculas'],['lowercase','Minúsculas'],['capitalize','Iniciais maiúsculas']].map(([v,l])=>`<option value="${v}" ${String(x.textTransform||'inherit')===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="pd-field">Alinhamento<select data-pd-element="${el}" data-pd-prop="align">${['inherit','left','center','right','justify'].map(v=>`<option value="${v}" ${String(x.align||'inherit')===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="pd-field">Transição<select data-pd-element="${el}" data-pd-prop="animation">${animations.map(([v,l])=>`<option value="${v}" ${String(x.animation||'inherit')===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="pd-field">Atraso (ms)<input type="number" min="0" max="3000" step="50" value="${x.delay||0}" data-pd-element="${el}" data-pd-prop="delay"></label></div></details>`}).join('');
    document.getElementById('parallax-design-modal')?.remove();
    const overlay=document.createElement('div');overlay.id='parallax-design-modal';overlay.innerHTML=`<datalist id="pd-google-fonts"></datalist><div id="pd-font-gallery" hidden><div class="pd-font-shell"><header><strong>Google Fonts · <span class="pd-font-target"></span></strong><button type="button" data-pd-font-close>✕</button></header><input type="search" data-pd-font-search placeholder="Buscar entre todas as fontes do Google"><div class="pd-font-categories">${['Todas','Serif','Sans Serif','Display','Handwriting','Monospace'].map(c=>`<button type="button" data-pd-font-cat="${c}">${c}</button>`).join('')}</div><small class="pd-font-count"></small><div class="pd-font-results"></div></div></div><div class="pd-panel" role="dialog" aria-modal="true" aria-label="Configuração avançada do Parallax"><header><strong>Configuração avançada do Parallax · Slide ${session.index+1}</strong><button type="button" data-pd-close>✕</button></header><div class="pd-layout"><div class="pd-controls"><details open><summary>Banner · tamanho e acabamento</summary><div class="pd-grid">${field('widthPct','Largura em % da tela (0 = atual)',0,100)}${field('bannerHeight','Altura mínima (% da tela)',0,90)}${field('padding','Espaçamento interno (px)',0,90)}${field('radius','Arredondamento (px)',0,80)}${field('borderWidth','Borda (px)',0,12)}${color('borderColor','Cor da borda')}${color('bgColor','Cor de fundo')}${field('bgOpacity','Opacidade do fundo (%)',0,100)}${field('blur','Blur de fundo (px)',0,40)}${field('shadow','Sombra (%)',0,100)}${field('overlayOpacity','Opacidade do overlay (%)',0,90)}</div></details><details open><summary>Hero · animação conjunta</summary><div class="pd-grid">${selector('heroAnimation','Efeito geral',animations)}${field('heroDuration','Duração (ms)',100,3000,50)}${field('heroDelay','Atraso (ms)',0,3000,50)}</div></details><details open><summary>Elementos individuais</summary>${elFields}</details></div><div class="pd-preview-wrap"><div class="pd-devices"><button data-pd-device="desktop" class="active">Desktop</button><button data-pd-device="mobile">Mobile</button><button data-pd-replay>↻ Reproduzir</button></div><div class="pd-stage"><div class="pd-reference-canvas"><div class="pd-card" id="pd-live-card"><span data-pd-sample="eyebrow">${parallaxDesignEscape(p.eyebrow||'CATEGORIA')}</span><h2 data-pd-sample="title">${parallaxDesignEscape(p.title||'Título do empreendimento')}</h2><h3 data-pd-sample="subtitle">${parallaxDesignEscape(p.subtitle||'Seu subtítulo')}</h3><p data-pd-sample="text">${parallaxDesignEscape(p.text||'Texto descritivo do seu banner.')}</p><a data-pd-sample="button">${parallaxDesignEscape(p.buttonText||'Saiba mais')}</a></div></div></div><small>Prévia proporcional do slide selecionado · mesma referência dimensional do Parallax.</small></div></div><footer><button data-pd-reset>Restaurar ajustes novos</button><button data-pd-all>Aplicar a todos os slides</button><button data-pd-save class="primary">Aplicar ao slide</button></footer></div>`;
    document.body.appendChild(overlay);parallaxGoogleCatalogLoad();parallaxDesignPreview();if(window.ResizeObserver){const ro=new ResizeObserver(()=>{if(document.getElementById('parallax-design-modal'))parallaxDesignPreview(false);else ro.disconnect();});ro.observe(overlay.querySelector('.pd-stage'));}
    overlay.querySelectorAll('[data-pd-group]').forEach(group=>group.addEventListener('click',()=>parallaxDesignHighlight(group.dataset.pdGroup)));
    overlay.querySelectorAll('[data-pd-group] summary').forEach(summary=>summary.addEventListener('click',()=>parallaxDesignHighlight(summary.closest('[data-pd-group]').dataset.pdGroup))); 
  }
  function parallaxDesignHighlight(el){
    const modal=document.getElementById('parallax-design-modal');if(!modal)return;
    modal.querySelectorAll('[data-pd-sample]').forEach(node=>{const active=node.dataset.pdSample===el;node.style.outline=active?'2px dashed #39bafa':'';node.style.outlineOffset=active?'5px':'';node.style.backgroundClip=active?'padding-box':'';});
    modal.querySelectorAll('[data-pd-group]').forEach(group=>group.classList.toggle('pd-selected-element',group.dataset.pdGroup===el));
  }
  function parallaxDesignPreview(replay=false){
    const session=parallaxDesignSession,root=document.getElementById('parallax-design-modal');if(!session||!root)return;
    const d={...parallaxDesignDefaults,...session.point.design},card=root.querySelector('#pd-live-card');if(!card)return;
    // Maintain a constant design viewport and scale the entire composition only for display.
    const stage=root.querySelector('.pd-stage'),canvas=root.querySelector('.pd-reference-canvas');
    const mobile=stage.classList.contains('mobile');
    const refWidth=1280,refHeight=720; // A mesma referência editorial, inclusive na simulação mobile
    const designWidth=Number(d.widthPct)>0?Math.min(100,Number(d.widthPct))/100:Math.min(0.92,620/1280);
    const bannerWidth=Math.min(refWidth-24,refWidth*designWidth);
    const typeScale=1; // escala visual somente no canvas, nunca em elementos isolados
    const available=Math.max(1,stage.clientWidth-12);
    const factor=Math.min(1,(mobile?Math.min(available,390):available)/refWidth);
    stage.style.height=`${Math.round(refHeight*factor)}px`;
    canvas.style.cssText=`position:absolute;left:50%;top:0;width:${refWidth}px;height:${refHeight}px;transform:translateX(-50%) scale(${factor});transform-origin:top center;display:flex;justify-content:center;align-items:center;box-sizing:border-box;overflow:hidden;`;
    stage.style.position='relative';stage.style.overflow='hidden';
    const color=d.bgColor||'#080c12';const alpha=Math.round(Math.max(0,Math.min(100,d.bgOpacity))*2.55).toString(16).padStart(2,'0');
    card.style.cssText=`width:${bannerWidth}px;max-width:calc(100% - 24px);min-height:${d.bannerHeight?Math.round(refHeight*d.bannerHeight/100)+'px':0};padding:${Math.max(6,d.padding*typeScale)}px;border:${d.borderWidth}px solid ${d.borderColor};border-radius:${d.radius}px;background:${color}${alpha};backdrop-filter:blur(${d.blur}px);box-shadow:0 15px 50px rgba(0,0,0,${d.shadow/100});container-type:inline-size;`;
    const valid=['fade','fade-up','slide-left','slide-right','zoom-in','blur-in','mask-reveal','soft-focus','ripple-reveal'];
    const animate=(node,animation,delay)=>{
      node.style.animation='none';node.style.opacity='';node.style.clipPath='';node.style.filter='';node.style.transform='';
      if(animation==='none')return;
      const effect=valid.includes(animation)?animation:'fade';
      void node.offsetWidth; // restart live preview after each adjustment
      node.style.animation=`pd-effect-${effect} ${d.heroDuration}ms ease ${delay}ms both`;
    };
    parallaxDesignElements.forEach(el=>{
      const node=root.querySelector(`[data-pd-sample="${el}"]`),opts=d.elements?.[el]||{};if(!node)return;
      node.style.textAlign=opts.align==='inherit'?'':opts.align||'';
      node.style.fontSize=Number(opts.fontPx)>0?`${Math.max(7,opts.fontPx)}px`:Number(opts.fontPct)>0?`${Math.max(7,bannerWidth*opts.fontPct/100)}px`:(Number(session.point[({eyebrow:'eyebrowSize',title:'titleSize',subtitle:'subtitleSize',text:'textSize',button:'buttonSize'})[el]])>0?`${Math.max(7,session.point[({eyebrow:'eyebrowSize',title:'titleSize',subtitle:'subtitleSize',text:'textSize',button:'buttonSize'})[el]]*typeScale)}px`:'');
      node.style.fontFamily=opts.fontFamily&&opts.fontFamily!=='inherit'?`\"${String(opts.fontFamily).replace(/[\"<>;]/g,'')}\", sans-serif`:'';
      node.style.fontWeight=Number(opts.weight)>0?String(opts.weight):'';
      node.style.lineHeight=Number(opts.lineSpacingPx)!==0?`calc(${Number(opts.lineHeight)>0?opts.lineHeight:1.2}em + ${Math.max(-40,Math.min(20,Number(opts.lineSpacingPx)||0))}px)`:Number(opts.lineHeight)>0?String(opts.lineHeight):'';
      node.style.letterSpacing=Number(opts.letterSpacing)?`${opts.letterSpacing}px`:'';
      node.style.wordSpacing=Number(opts.wordSpacing)?`${opts.wordSpacing}px`:'';
      node.style.color=/^#[0-9a-f]{6}$/i.test(opts.color||'')?opts.color:'';
      if(el==='button')node.style.backgroundColor=/^#[0-9a-f]{6}$/i.test(opts.backgroundColor||'')?opts.backgroundColor:'#ffffff';
      node.style.opacity=opts.opacity!=null?String(Math.max(0,Math.min(100,Number(opts.opacity)))/100):'';
      node.style.textShadow=Number(opts.textShadow)>0?`0 2px ${Number(opts.textShadow)}px rgba(0,0,0,.7)`:'';
      node.style.textTransform=['uppercase','lowercase','capitalize'].includes(opts.textTransform)?opts.textTransform:'';
      parallaxGoogleLoad(opts.fontFamily);
      node.style.alignSelf=opts.align==='center'?'center':opts.align==='right'?'flex-end':opts.align==='left'?'flex-start':'';
      const effect=opts.animation&&opts.animation!=='inherit'?opts.animation:d.heroAnimation;
      animate(node,effect==='inherit'?'none':effect,Number(d.heroDelay||0)+Number(opts.delay||0));
    });
    // Hero animation controls the whole banner, independent of individual animations.
    animate(card,d.heroAnimation==='inherit'?'none':d.heroAnimation,Number(d.heroDelay||0));
    if(replay){void card.offsetWidth;card.style.animationPlayState='running';}
  }
  document.addEventListener('click',event=>{
    const launch=event.target.closest('[data-parallax-design-open]');if(launch){parallaxDesignOpen(Number(launch.dataset.parallaxDesignOpen));return;}
    const modal=event.target.closest('#parallax-design-modal');if(!modal)return;
    const fontOpen=event.target.closest('[data-pd-font-open]');if(fontOpen){parallaxFontGalleryOpen(fontOpen.dataset.pdFontOpen);return;}
    if(event.target.closest('[data-pd-font-close]')){modal.querySelector('#pd-font-gallery').hidden=true;return;}
    const cat=event.target.closest('[data-pd-font-cat]');if(cat){parallaxFontFilter=cat.dataset.pdFontCat;parallaxFontGalleryUpdate();return;}
    const choice=event.target.closest('[data-pd-font-choice]');if(choice&&parallaxFontTarget){const name=choice.dataset.pdFontChoice;const el=parallaxFontTarget;const d=parallaxDesignSession.point.design??={};const opts=(d.elements??={})[el]??={};opts.fontFamily=name;const input=modal.querySelector(`[data-pd-element="${el}"][data-pd-prop="fontFamily"]`);if(input)input.value=name;parallaxGoogleLoad(name);modal.querySelector('#pd-font-gallery').hidden=true;parallaxDesignPreview(true);return;}
    if(event.target.closest('[data-pd-close]')){modal.remove();parallaxDesignSession=null;return;}
    // Cliques no backdrop não fecham o modal nem descartam alterações em andamento.
    if(event.target.id==='parallax-design-modal')return;
    if(event.target.closest('[data-pd-device]')){modal.querySelectorAll('[data-pd-device]').forEach(x=>x.classList.remove('active'));event.target.classList.add('active');modal.querySelector('.pd-stage').classList.toggle('mobile',event.target.dataset.pdDevice==='mobile');parallaxDesignPreview(true);return;}
    if(event.target.closest('[data-pd-replay]')){const nodes=modal.querySelectorAll('#pd-live-card,[data-pd-sample]');nodes.forEach(n=>n.style.animation='none');void modal.offsetWidth;parallaxDesignPreview(true);return;}
    if(event.target.closest('[data-pd-reset]')){parallaxDesignSession.point.design={};parallaxDesignRender();return;}
    const all=event.target.closest('[data-pd-all]'),save=event.target.closest('[data-pd-save]');if(!save&&!all)return;
    const session=parallaxDesignSession,design=JSON.parse(JSON.stringify(session.point.design||{}));
    commit(draft=>{const section=draft.sections.find(x=>x.id===session.sectionId);if(!section)return;const items=parseParallaxBanners(section.props.heroPoints);if(all){items.forEach(item=>item.design=JSON.parse(JSON.stringify(design)));}else if(items[session.index])items[session.index].design=design;section.props.heroPoints=JSON.stringify(items);/* A opacidade local permanece no slide; a opacidade global é independente. */});
    modal.remove();parallaxDesignSession=null;
  });
  document.addEventListener('focusin',event=>{
    if(!parallaxDesignSession)return;
    const group=event.target.closest('#parallax-design-modal [data-pd-group]');
    if(group)parallaxDesignHighlight(group.dataset.pdGroup);
  });
  document.addEventListener('input',event=>{
    if(!parallaxDesignSession||!event.target.closest('#parallax-design-modal'))return;
    if(event.target.matches('[data-pd-font-search]')){parallaxFontSearch=event.target.value;parallaxFontGalleryUpdate();return;}
    const t=event.target,key=t.dataset.pdField,el=t.dataset.pdElement;
    if(key){const numberKeys=['widthPct','bannerHeight','padding','radius','borderWidth','bgOpacity','blur','shadow','overlayOpacity','heroDuration','heroDelay'];parallaxDesignSession.point.design??={};parallaxDesignSession.point.design[key]=numberKeys.includes(key)?Number(t.value):t.value;if(key==='overlayOpacity')parallaxDesignSession.point.design.overlayOpacityCustomized=true;const output=document.querySelector(`[data-pd-output="${key}"]`);if(output)output.textContent=t.value;}
    if(el){parallaxDesignSession.point.design??={};const e=parallaxDesignSession.point.design.elements??={};e[el]??={};e[el][t.dataset.pdProp]=['fontPct','fontPx','weight','lineHeight','lineSpacingPx','delay','letterSpacing','wordSpacing','opacity','textShadow'].includes(t.dataset.pdProp)?Number(t.value):t.value;}
    if(el)parallaxDesignHighlight(el);
    parallaxDesignPreview(true);
  });

  // 7.4.0 — Ponte somente para complementos do editor (ex.: Auditoria de seções).
  // Usa as mesmas funções internas: commit mantém desfazer/refazer e salvamento.
  const studioBridgeListeners = new Set();
  window.ImobifyStudioBridge = Object.freeze({
    version: '1.0.0',
    getState: () => state,
    selectSection: (id) => selectSection(id),
    activateTab: (name) => activateTab(name),
    commit: (mutator, options) => commit(mutator, options),
    toast: (message, type) => toast(message, type),
    onChange: (fn) => { studioBridgeListeners.add(fn); return () => studioBridgeListeners.delete(fn); },
    notify: () => studioBridgeListeners.forEach((fn) => { try { fn(state); } catch (error) { console.error('[ImobifyStudioBridge]', error); } }),
  });

  boot();
})();

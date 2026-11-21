/**
 * Tour 360 Editor (base reutilizada) — v3.2.4
 * Copyright © Roberto Fettuccia
 * Direitos reservados.
 * contato: corretor.fettuccia@gmail.com
 * Utilização somente mediante autorização do proprietário.
 */

const APP_FORMAT = 'ImobStudioTour360';
const APP_VERSION = 7;
const PACKAGE_VERSION = '1.0.0';
const AUTOSAVE_DB = 'tour360-editor-db';
const AUTOSAVE_STORE = 'projects';
const AUTOSAVE_KEY = 'autosave';
const MAX_HISTORY = 24;
const EMBED_MODE = document.documentElement.classList.contains('imobify-embed') || new URLSearchParams(location.search).get('embed') === '1';
const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
const JSZIP_JS = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
let pannellumPromise = null;
let jszipPromise = null;
function loadStylesheetOnce(url, marker) {
  if (document.querySelector(`link[${marker}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = url; link.setAttribute(marker, '1');
  document.head.appendChild(link);
}
function loadScriptOnce(url, marker, readyCheck) {
  if (readyCheck()) return Promise.resolve();
  const existing = document.querySelector(`script[${marker}]`);
  if (existing) return new Promise((resolve, reject) => {
    existing.addEventListener('load', resolve, { once:true });
    existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${url}`)), { once:true });
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url; script.async = true; script.setAttribute(marker, '1');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar ${url}`));
    document.head.appendChild(script);
  });
}
function ensurePannellum() {
  if (window.pannellum) return Promise.resolve(window.pannellum);
  if (pannellumPromise) return pannellumPromise;
  loadStylesheetOnce(PANNELLUM_CSS, 'data-tour360-pannellum-css');
  pannellumPromise = loadScriptOnce(PANNELLUM_JS, 'data-tour360-pannellum-js', () => !!window.pannellum)
    .then(() => window.pannellum)
    .catch((err) => { pannellumPromise = null; throw err; });
  return pannellumPromise;
}
function ensureJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = loadScriptOnce(JSZIP_JS, 'data-tour360-jszip', () => !!window.JSZip)
    .then(() => window.JSZip)
    .catch((err) => { jszipPromise = null; throw err; });
  return jszipPromise;
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
const uid = (prefix = 'id') => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
const deepClone = (obj) => typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

// Fast project snapshot: clones mutable metadata but intentionally reuses panorama strings.
// This avoids duplicating multi-megabyte data: URLs on every undo / redo entry.
function cloneProjectFast(project) {
  const out = {
    ...project,
    project: { ...(project.project || {}) },
    settings: { ...(project.settings || {}) },
    branding: { ...(project.branding || {}) },
    sceneOrder: [...(project.sceneOrder || [])],
    scenes: {}
  };
  for (const [id, scene] of Object.entries(project.scenes || {})) {
    out.scenes[id] = {
      ...scene,
      panorama: scene.panorama,
      initialView: { ...(scene.initialView || {}) },
      hotspots: (scene.hotspots || []).map(h => ({
        ...h,
        targetView: h.targetView ? { ...h.targetView } : null
      }))
    };
  }
  return out;
}
const escapeScriptJson = (json) => JSON.stringify(json).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');

function slugify(value) {
  return String(value || 'cena')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cena';
}

function makeProject() {
  return {
    format: APP_FORMAT,
    version: APP_VERSION,
    project: {
      id: uid('project'),
      name: 'Novo Parallax 360',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    settings: {
      firstSceneId: null,
      preloadAdjacent: true,
      showCompass: true,
      showZoomControls: true,
      showFullscreenControl: true,
      autoLoad: true,
      defaultHfov: 100,
      minHfov: 50,
      maxHfov: 120,
      authoringGrid: false
    },
    branding: {
      enabled: false,
      banner: '',
      bannerName: '',
      position: 'bottom-right',
      floatingEnabled: false,
      floatingText: '',
      floatingLink: ''
    },
    sceneOrder: [],
    scenes: {}
  };
}

function migrateProject(input) {
  if (!input || typeof input !== 'object') throw new Error('JSON inválido.');

  if (input.format === APP_FORMAT) {
    const p = deepClone(input);
    p.version = Number(p.version || 1);
    p.project ||= {};
    p.settings ||= {};
    p.branding ||= {};
    // v3.2.4: `enabled` é a chave mestra do branding.
    // `floatingEnabled` continua apenas como alias de compatibilidade.
    const legacyBrandEnabled = p.branding.floatingEnabled;
    p.branding.enabled = Boolean(p.branding.enabled ?? legacyBrandEnabled ?? false);
    p.branding.floatingEnabled = p.branding.enabled;
    p.branding.banner ||= '';
    p.branding.bannerName ||= '';
    p.branding.position ||= 'bottom-right';
    p.branding.floatingText ||= '';
    p.branding.floatingLink ||= '';
    p.scenes ||= {};
    p.sceneOrder ||= Object.keys(p.scenes);
    p.settings.defaultHfov ??= 100;
    p.settings.minHfov ??= 50;
    p.settings.maxHfov ??= 120;
    p.settings.preloadAdjacent ??= true;
    p.settings.showCompass ??= true;
    p.settings.showZoomControls ??= true;
    p.settings.showFullscreenControl ??= true;
    p.settings.autoLoad ??= true;

    for (const [id, scene] of Object.entries(p.scenes)) {
      scene.id ||= id;
      scene.title ||= id;
      scene.panorama ||= '';
      scene.initialView ||= { yaw: 0, pitch: 0, hfov: p.settings.defaultHfov };
      scene.hotspots ||= [];
      scene.hotspots = scene.hotspots.map((h) => ({
        id: h.id || uid('hotspot'),
        type: h.type || 'navigation',
        yaw: Number(h.yaw || 0),
        pitch: Number(h.pitch || 0),
        rotation: Number(h.rotation || h.iconRotation || 0),
        perspective: h.perspective !== false,
        perspectiveStrength: Number(h.perspectiveStrength ?? 1),
        scale: Number(h.scale ?? 1),
        text: h.text || '',
        targetSceneId: h.targetSceneId || h.sceneId || null,
        targetView: h.targetView || null,
        url: h.url || '',
        info: h.info || ''
      }));
    }
    p.version = APP_VERSION;
    p.project.updatedAt = new Date().toISOString();
    return p;
  }

  // Legacy format: { firstScene, scenes: { id: { title, panorama, hotspots:[{sceneId,...}] } } }
  if (input.scenes && typeof input.scenes === 'object') {
    const p = makeProject();
    p.project.name = input.title || 'Tour importado';
    const idMap = {};

    for (const legacyId of Object.keys(input.scenes)) {
      const normalized = legacyId || uid('scene');
      idMap[legacyId] = normalized;
      p.sceneOrder.push(normalized);
    }

    for (const [legacyId, scene] of Object.entries(input.scenes)) {
      const id = idMap[legacyId];
      p.scenes[id] = {
        id,
        title: scene.title || legacyId,
        panorama: scene.panorama || '',
        initialView: {
          yaw: Number(scene.yaw ?? 0),
          pitch: Number(scene.pitch ?? 0),
          hfov: Number(scene.hfov ?? 100)
        },
        hotspots: (scene.hotspots || []).map((h) => ({
          id: uid('hotspot'),
          type: 'navigation',
          yaw: Number(h.yaw || 0),
          pitch: Number(h.pitch || 0),
          rotation: Number(h.rotation || 0),
          perspective: h.perspective !== false,
          perspectiveStrength: Number(h.perspectiveStrength ?? 1),
          scale: Number(h.scale ?? 1),
          text: h.text || '',
          targetSceneId: idMap[h.sceneId] || h.sceneId || null,
          targetView: null,
          url: '',
          info: ''
        }))
      };
    }
    p.settings.firstSceneId = idMap[input.firstScene] || p.sceneOrder[0] || null;
    return p;
  }

  throw new Error('Formato de projeto não reconhecido.');
}

class HistoryManager {
  constructor(onApply) {
    this.stack = [];
    this.index = -1;
    this.onApply = onApply;
    this.locked = false;
  }
  seed(state) {
    this.stack = [cloneProjectFast(state)];
    this.index = 0;
    this.emit();
  }
  push(state) {
    if (this.locked) return;
    const snapshot = cloneProjectFast(state);
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(snapshot);
    if (this.stack.length > MAX_HISTORY) this.stack.shift();
    this.index = this.stack.length - 1;
    this.emit();
  }
  undo() {
    if (!this.canUndo()) return;
    this.index -= 1;
    this.apply();
  }
  redo() {
    if (!this.canRedo()) return;
    this.index += 1;
    this.apply();
  }
  canUndo() { return this.index > 0; }
  canRedo() { return this.index >= 0 && this.index < this.stack.length - 1; }
  apply() {
    this.locked = true;
    this.onApply(cloneProjectFast(this.stack[this.index]));
    this.locked = false;
    this.emit();
  }
  emit() {
    $('#undoBtn').disabled = !this.canUndo();
    $('#redoBtn').disabled = !this.canRedo();
  }
}

class AutosaveStore {
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(AUTOSAVE_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(AUTOSAVE_STORE)) db.createObjectStore(AUTOSAVE_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async save(project) {
    try {
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(AUTOSAVE_STORE, 'readwrite');
        tx.objectStore(AUTOSAVE_STORE).put(project, AUTOSAVE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (err) {
      console.warn('Autosave indisponível:', err);
    }
  }
  async load() {
    try {
      const db = await this.open();
      const result = await new Promise((resolve, reject) => {
        const tx = db.transaction(AUTOSAVE_STORE, 'readonly');
        const req = tx.objectStore(AUTOSAVE_STORE).get(AUTOSAVE_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return result;
    } catch {
      return null;
    }
  }
}

class TourEditor {
  constructor() {
    this.project = makeProject();
    this.activeSceneId = null;
    this.selectedHotspotId = null;
    this.viewer = null;
    this.viewerScenes = new Set();
    this.addHotspotMode = false;
    this.sceneEditMode = false;
    this.sceneEditSnapshot = null;
    this.hotspotEditId = null;
    this.hotspotEditSnapshot = null;
    this.draggedSceneId = null;
    this.dragHotspot = null;
    this.autosaveTimer = null;
    this.validationTimer = null;
    this.preloadIdleHandle = null;
    this.preloadCache = new Map();
    this.validationCache = null;
    this.validationDirty = true;
    this.autosaveDirty = false;
    this.store = new AutosaveStore();
    this.embedMode = EMBED_MODE;
    this.engineLoading = false;
    this.history = new HistoryManager((project) => {
      const previousActive = this.activeSceneId;
      this.project = project;
      this.activeSceneId = this.project.scenes[previousActive] ? previousActive : this.project.settings.firstSceneId || this.project.sceneOrder[0] || null;
      this.selectedHotspotId = null;
      this.refreshAll({ rebuildViewer: true, preserveView: false });
      this.scheduleAutosave(false);
    });
  }

  async init() {
    this.bindStaticEvents();
    if (!this.embedMode) {
      const saved = await this.store.load();
      if (saved?.format === APP_FORMAT) {
        try {
          this.project = migrateProject(saved);
          this.activeSceneId = this.project.settings.firstSceneId || this.project.sceneOrder[0] || null;
        } catch {}
      }
    }
    this.history.seed(this.project);
    this.refreshAll({ rebuildViewer: true, preserveView: false });
  }

  bindStaticEvents() {
    $('#addSceneBtn').addEventListener('click', () => this.openAddScene());
    $('#viewer').addEventListener('click', (e) => this.onViewerClick(e), true);
    $('#viewer').addEventListener('pointermove', (e) => this.onInsertPreviewMove(e), true);
    $('#viewer').addEventListener('pointermove', (e) => this.onHotspotPointerMove(e));
    $('#viewer').addEventListener('pointerup', (e) => this.onHotspotPointerUp(e));
    $('#viewer').addEventListener('pointercancel', (e) => this.onHotspotPointerUp(e));
    $('#emptyAddSceneBtn').addEventListener('click', () => this.openAddScene());
    $('#sceneForm').addEventListener('submit', (e) => this.addSceneFromDialog(e));
    $('#sceneFilter').addEventListener('input', () => this.renderSceneList());
    $('#undoBtn').addEventListener('click', () => this.history.undo());
    $('#redoBtn').addEventListener('click', () => this.history.redo());
    $('#captureViewBtn').addEventListener('click', () => this.captureSceneView());
    $('#addHotspotModeBtn').addEventListener('click', () => this.toggleAddHotspotMode());
    $('#validateBtn').addEventListener('click', () => this.showValidation());
    $('#connectionsBtn').addEventListener('click', () => this.showConnections());
    $('#exportJsonBtn').addEventListener('click', () => this.exportJson());
    $('#exportHtmlBtn').addEventListener('click', () => this.exportHtml());
    $('#importJsonInput').addEventListener('change', (e) => this.importJson(e));
    $('#newProjectBtn').addEventListener('click', async () => {
      const ok = await this.confirm('Novo projeto', 'Isso substituirá o projeto atual no editor. Exporte o projeto antes se quiser guardar uma cópia.');
      if (!ok) return;
      const name = window.prompt('Nome do novo projeto:', 'Novo Parallax 360');
      if (name === null) return;
      this.resetProject(name.trim() || 'Novo Parallax 360');
    });

    $$('.tab').forEach((tab) => tab.addEventListener('click', () => this.activateTab(tab.dataset.tab)));
    $$('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', () => document.getElementById(btn.dataset.closeDialog)?.close()));

    window.addEventListener('keydown', (e) => {
      const isInput = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
      if (e.key === 'Escape' && this.addHotspotMode) this.toggleAddHotspotMode(false);
      if ((e.ctrlKey || e.metaKey) && !isInput && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.history.redo() : this.history.undo(); }
      if ((e.ctrlKey || e.metaKey) && !isInput && e.key.toLowerCase() === 'y') { e.preventDefault(); this.history.redo(); }
    });
  }

  openAddScene() {
    $('#sceneForm').reset();
    $('#sceneDialog').showModal();
    requestAnimationFrame(() => $('#newSceneTitle').focus());
  }

  async addSceneFromDialog(e) {
    e.preventDefault();
    const title = $('#newSceneTitle').value.trim();
    const url = $('#newSceneUrl').value.trim();
    const file = $('#newSceneFile').files?.[0];
    if (!title) return;
    if (!url && !file) {
      alert('Informe uma URL ou escolha um arquivo de imagem.');
      return;
    }

    let panorama = url;
    if (file) panorama = await this.fileToDataUrl(file);

    let base = slugify(title);
    let id = base;
    let n = 2;
    while (this.project.scenes[id]) id = `${base}-${n++}`;

    this.project.scenes[id] = {
      id,
      title,
      panorama,
      initialView: { yaw: 0, pitch: 0, hfov: this.project.settings.defaultHfov },
      hotspots: []
    };
    this.project.sceneOrder.push(id);
    if (!this.project.settings.firstSceneId) this.project.settings.firstSceneId = id;
    this.activeSceneId = id;
    this.selectedHotspotId = null;
    this.sceneEditMode = false;
    this.sceneEditSnapshot = null;
    this.hotspotEditId = null;
    this.hotspotEditSnapshot = null;
    $('#sceneDialog').close();
    this.commit('add-scene', { rebuildViewer: true, preserveView: false });
  }

  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  resetProject(projectName = 'Novo Parallax 360') {
    if (this.viewer) { this.viewer.destroy(); this.viewer = null; }
    this.project = makeProject();
    this.project.project.name = projectName;
    this.activeSceneId = null;
    this.selectedHotspotId = null;
    this.viewerScenes.clear();
    this.preloadCache.clear();
    this.history.seed(this.project);
    this.refreshAll({ rebuildViewer: true, preserveView: false });
    this.scheduleAutosave();
  }

  commit(_reason, options = {}) {
    this.project.project.updatedAt = new Date().toISOString();
    this.history.push(this.project);
    this.validationDirty = true;
    this.autosaveDirty = true;

    // Avoid repainting the entire editor for every small property change.
    const refresh = options.refresh || 'all';
    if (refresh === 'all') this.refreshAll(options);
    else {
      if (refresh.includes('sceneList')) this.renderSceneList();
      if (refresh.includes('scene')) this.renderSceneProperties();
      if (refresh.includes('hotspot')) this.renderHotspotProperties();
      if (refresh.includes('project')) this.renderProjectProperties();
      this.updateToolbar();
      this.scheduleValidationBar();
      if (options.rebuildViewer) this.rebuildViewer({ preserveView: options.preserveView !== false });
      else if (options.syncViewer !== false) this.syncViewerScene();
    }
    this.scheduleAutosave();
  }

  scheduleAutosave(showStatus = true) {
    if (this.embedMode) return;
    clearTimeout(this.autosaveTimer);
    if (showStatus) this.setStatus('Alterações pendentes…');
    this.autosaveTimer = setTimeout(async () => {
      if (!this.autosaveDirty) return;
      this.autosaveDirty = false;
      // IndexedDB already performs structured cloning; avoid cloning the whole project twice.
      await this.store.save(this.project);
      this.setStatus(`Salvo automaticamente · ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`);
    }, 1600);
  }

  setStatus(text) { $('#projectStatus').textContent = text; }

  refreshAll({ rebuildViewer = false, preserveView = true } = {}) {
    this.validationDirty = true;
    this.renderSceneList();
    this.renderSceneProperties();
    this.renderHotspotProperties();
    this.renderProjectProperties();
    this.updateToolbar();
    this.renderValidationBar();
    if (rebuildViewer) this.rebuildViewer({ preserveView });
    else this.syncViewerScene();
  }

  renderSceneList() {
    const list = $('#sceneList');
    list.textContent = '';
    const filter = $('#sceneFilter').value.trim().toLowerCase();
    const ids = this.project.sceneOrder.filter(id => this.project.scenes[id]);
    $('#sceneCount').textContent = `${ids.length} ${ids.length === 1 ? 'cena' : 'cenas'}`;

    for (const id of ids) {
      const scene = this.project.scenes[id];
      if (filter && !`${scene.title} ${id}`.toLowerCase().includes(filter)) continue;
      const item = document.createElement('div');
      item.className = `scene-item${id === this.activeSceneId ? ' active' : ''}`;
      item.draggable = true;
      item.dataset.sceneId = id;
      item.innerHTML = `
        <div class="scene-grip" title="Arraste para reordenar">⋮⋮</div>
        <div class="scene-name"><strong></strong><small></small></div>
        <div class="scene-badges"></div>`;
      $('strong', item).textContent = scene.title || id;
      $('small', item).textContent = `${scene.hotspots?.length || 0} hotspot${scene.hotspots?.length === 1 ? '' : 's'}`;
      const badges = $('.scene-badges', item);
      if (id === this.project.settings.firstSceneId) {
        const b = document.createElement('span'); b.className = 'badge primary'; b.textContent = 'INÍCIO'; badges.appendChild(b);
      }
      const editBtn = document.createElement('button');
      editBtn.className = `icon-btn scene-edit-pencil${id === this.activeSceneId && this.sceneEditMode ? ' editing' : ''}`;
      editBtn.title = id === this.activeSceneId && this.sceneEditMode ? 'Cena em edição' : 'Editar cena';
      editBtn.setAttribute('aria-label', 'Editar cena');
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (id !== this.activeSceneId) this.selectScene(id);
        const current = this.project.scenes[id];
        if (!current) return;
        if (!this.sceneEditMode) {
          this.sceneEditSnapshot = cloneProjectFast(this.project).scenes[id];
          this.sceneEditMode = true;
        }
        this.activateTab('scene');
        this.renderSceneList(); this.renderSceneProperties(); this.renderHotspotProperties(); this.updateToolbar(); this.syncHotspotSelection();
      });
      badges.appendChild(editBtn);
      item.addEventListener('click', () => this.selectScene(id));
      item.addEventListener('dragstart', () => { this.draggedSceneId = id; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => { this.draggedSceneId = null; $$('.scene-item').forEach(el => el.classList.remove('dragging','drop-target')); });
      item.addEventListener('dragover', (e) => { e.preventDefault(); if (this.draggedSceneId && this.draggedSceneId !== id) item.classList.add('drop-target'); });
      item.addEventListener('dragleave', () => item.classList.remove('drop-target'));
      item.addEventListener('drop', (e) => { e.preventDefault(); item.classList.remove('drop-target'); this.reorderScene(this.draggedSceneId, id); });
      list.appendChild(item);
    }
  }

  reorderScene(fromId, toId) {
    if (!fromId || fromId === toId) return;
    const order = this.project.sceneOrder.filter(id => id !== fromId);
    const index = order.indexOf(toId);
    order.splice(index, 0, fromId);
    this.project.sceneOrder = order;
    this.commit('reorder-scene', { refresh: ['sceneList'], syncViewer: false });
  }

  selectScene(id) {
    if (!this.project.scenes[id]) return;
    this.activeSceneId = id;
    this.selectedHotspotId = null;
    this.sceneEditMode = false;
    this.sceneEditSnapshot = null;
    this.hotspotEditId = null;
    this.hotspotEditSnapshot = null;
    this.addHotspotMode = false;
    $('#viewer').classList.remove('hotspot-insert-mode');
    this.removeInsertPreview();
    this.updateModeBadge();
    this.refreshAll({ rebuildViewer: false });
    this.syncViewerScene(true);
  }

  activeScene() { return this.project.scenes[this.activeSceneId] || null; }
  selectedHotspot() { return this.activeScene()?.hotspots?.find(h => h.id === this.selectedHotspotId) || null; }

  updateToolbar() {
    const scene = this.activeScene();
    $('#activeSceneTitle').textContent = scene ? `${scene.title}${this.sceneEditMode ? ' · EDIÇÃO' : ''}` : 'Nenhuma cena selecionada';
    $('#captureViewBtn').disabled = !scene || !this.viewer || !this.sceneEditMode || Boolean(this.hotspotEditId);
    $('#addHotspotModeBtn').disabled = !scene || !this.viewer || !this.sceneEditMode || Boolean(this.hotspotEditId);
    $('#addHotspotModeBtn').classList.toggle('primary', this.addHotspotMode);
    $('#emptyViewer').classList.toggle('hidden', Boolean(scene));
  }

  activateTab(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    $(`#${name}Tab`).classList.add('active');
  }

  renderSceneProperties() {
    const root = $('#sceneTab'); root.textContent = '';
    const scene = this.activeScene();
    if (!scene) { root.innerHTML = '<div class="empty-mini">Selecione uma cena.</div>'; return; }
    const editing = this.sceneEditMode;

    root.innerHTML = `
      <div class="section editor-mode-head">
        <div><h3>Cena</h3><div class="mode-label ${editing ? 'editing' : ''}">${editing ? 'EDIÇÃO ATIVA' : 'VISUALIZAÇÃO'}</div></div>
        <div class="inline-actions">
          ${editing ? '<button class="btn ghost compact" data-cancel-scene>Cancelar</button><button class="btn primary compact" data-save-scene>Salvar</button>' : '<button class="icon-btn edit-pencil" data-edit-scene title="Editar cena" aria-label="Editar cena">✎</button>'}
        </div>
      </div>
      <div class="section ${editing ? '' : 'readonly-section'}">
        <h3>Identificação</h3>
        <label class="field"><span>Nome</span><input class="input" data-scene-field="title" maxlength="80"></label>
        <label class="field"><span>ID</span><input class="input" value="${this.escapeAttr(scene.id)}" disabled></label>
        <label class="field"><span>Panorâmica</span><textarea class="textarea" data-scene-field="panorama"></textarea></label>
        <div class="inline-actions edit-only">
          <label class="btn ghost file-btn">Substituir por arquivo<input data-scene-image-file type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
          <button class="btn danger" data-delete-scene>Excluir cena</button>
        </div>
      </div>
      <div class="section ${editing ? '' : 'readonly-section'}">
        <h3>Visualização inicial salva</h3>
        <div class="inline-grid three">
          <label class="field"><span>Yaw</span><input class="input" type="number" step="0.1" data-view="yaw"></label>
          <label class="field"><span>Pitch</span><input class="input" type="number" step="0.1" data-view="pitch"></label>
          <label class="field"><span>Zoom (HFOV)</span><input class="input" type="number" step="1" min="30" max="140" data-view="hfov"></label>
        </div>
        <div class="hint">Em edição, mova livremente a câmera e o zoom. Ao salvar a cena, a posição atual da câmera é gravada como visualização inicial.</div>
        ${editing ? '<div class="inline-actions scene-edit-hotspot-action"><button class="btn secondary full" data-add-hotspot-from-scene>＋ Adicionar hotspot nesta cena</button></div>' : ''}
      </div>
      <div class="section ${editing ? '' : 'readonly-section'}">
        <h3>Comportamento</h3>
        <label class="switch-row"><span>Definir como cena inicial</span><input type="checkbox" data-first-scene ${this.project.settings.firstSceneId === scene.id ? 'checked' : ''}></label>
      </div>`;

    $('[data-scene-field="title"]', root).value = scene.title;
    $('[data-scene-field="panorama"]', root).value = scene.panorama;
    ['yaw','pitch','hfov'].forEach(k => $(`[data-view="${k}"]`, root).value = scene.initialView?.[k] ?? (k === 'hfov' ? 100 : 0));

    if (!editing) {
      $$('[data-scene-field], [data-view], [data-first-scene]', root).forEach(el => el.disabled = true);
      $('[data-edit-scene]', root)?.addEventListener('click', () => {
        this.sceneEditSnapshot = cloneProjectFast(this.project).scenes[scene.id];
        this.sceneEditMode = true;
        this.renderSceneList(); this.renderSceneProperties(); this.renderHotspotProperties(); this.updateToolbar(); this.syncHotspotSelection();
      });
      return;
    }

    $$('[data-scene-field]', root).forEach(input => input.addEventListener('input', () => {
      scene[input.dataset.sceneField] = input.value.trim();
    }));
    $$('[data-view]', root).forEach(input => input.addEventListener('change', () => {
      scene.initialView[input.dataset.view] = Number(input.value || 0);
    }));
    $('[data-first-scene]', root).addEventListener('change', (e) => {
      if (e.target.checked) this.project.settings.firstSceneId = scene.id;
      else if (this.project.settings.firstSceneId === scene.id) this.project.settings.firstSceneId = this.project.sceneOrder.find(id => id !== scene.id) || scene.id;
    });
    $('[data-scene-image-file]', root)?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      scene.panorama = await this.fileToDataUrl(file);
      this.rebuildViewer({ preserveView: true });
    });
    $('[data-add-hotspot-from-scene]', root)?.addEventListener('click', () => {
      this.activateTab('hotspot');
      this.selectedHotspotId = null;
      this.renderHotspotProperties();
      this.toggleAddHotspotMode(true);
    });
    $('[data-delete-scene]', root)?.addEventListener('click', async () => {
      const ok = await this.confirm('Excluir cena', `Excluir “${scene.title}”? Hotspots de outras cenas que apontam para ela ficarão inválidos até serem corrigidos.`);
      if (ok) { this.sceneEditMode = false; this.sceneEditSnapshot = null; this.deleteScene(scene.id); }
    });
    $('[data-cancel-scene]', root)?.addEventListener('click', () => {
      if (this.sceneEditSnapshot) this.project.scenes[scene.id] = cloneProjectFast({project:{},settings:{},sceneOrder:[scene.id],scenes:{[scene.id]:this.sceneEditSnapshot}}).scenes[scene.id];
      this.sceneEditMode = false; this.sceneEditSnapshot = null; this.addHotspotMode = false; this.removeInsertPreview();
      this.refreshAll({ rebuildViewer: true, preserveView: false });
      this.renderSceneList();
    });
    $('[data-save-scene]', root)?.addEventListener('click', () => {
      if (this.viewer) scene.initialView = { yaw:this.round(this.viewer.getYaw()), pitch:this.round(this.viewer.getPitch()), hfov:this.round(this.viewer.getHfov()) };
      this.sceneEditMode = false; this.sceneEditSnapshot = null; this.addHotspotMode = false; this.removeInsertPreview();
      this.commit('save-scene', { refresh:['sceneList','scene','hotspot'], syncViewer:false });
      this.updateToolbar(); this.renderSceneList(); this.renderSceneProperties(); this.renderHotspotProperties();
    });
  }

  deleteScene(id) {
    delete this.project.scenes[id];
    this.project.sceneOrder = this.project.sceneOrder.filter(x => x !== id);
    if (this.project.settings.firstSceneId === id) this.project.settings.firstSceneId = this.project.sceneOrder[0] || null;
    this.activeSceneId = this.project.sceneOrder[0] || null;
    this.selectedHotspotId = null;
    this.commit('delete-scene', { rebuildViewer: true, preserveView: false });
  }

  renderHotspotProperties() {
    const root = $('#hotspotTab'); root.textContent = '';
    const scene = this.activeScene();
    if (!scene) { root.innerHTML = '<div class="empty-mini">Selecione uma cena.</div>'; return; }
    const hotspot = this.selectedHotspot();
    if (!hotspot) {
      root.innerHTML = `<div class="section"><h3>Hotspots da cena</h3><div id="hotspotListMini"></div></div>${this.sceneEditMode ? '<button class="btn primary full" data-add-hotspot-from-panel>＋ Adicionar hotspot no panorama</button>' : '<div class="hint">Clique na caneta da cena para adicionar novos hotspots.</div>'}`;
      const list = $('#hotspotListMini', root);
      if (!scene.hotspots.length) list.innerHTML = '<div class="empty-mini">Nenhum hotspot nesta cena.</div>';
      scene.hotspots.forEach(h => {
        const row = document.createElement('div'); row.className='hotspot-list-row';
        const btn = document.createElement('button'); btn.className='btn ghost grow hotspot-open-btn';
        btn.textContent = `${this.hotspotTypeLabel(h.type)} · ${h.text || this.project.scenes[h.targetSceneId]?.title || 'Sem descrição'}`;
        btn.addEventListener('click', () => { this.hotspotEditId=null; this.hotspotEditSnapshot=null; this.selectedHotspotId=h.id; this.renderHotspotProperties(); this.activateTab('hotspot'); this.syncHotspotSelection(); });
        const pencil=document.createElement('button'); pencil.className='icon-btn edit-pencil'; pencil.title='Editar hotspot'; pencil.textContent='✎';
        pencil.addEventListener('click', (e)=>{e.stopPropagation(); this.selectedHotspotId=h.id; this.hotspotEditId=h.id; this.hotspotEditSnapshot=deepClone(h); this.renderHotspotProperties(); this.activateTab('hotspot'); this.syncHotspotSelection(); this.updateToolbar();});
        row.append(btn,pencil); list.appendChild(row);
      });
      $('[data-add-hotspot-from-panel]', root)?.addEventListener('click', () => this.toggleAddHotspotMode(true));
      return;
    }

    const editing = this.hotspotEditId === hotspot.id;
    root.innerHTML = `
      <div class="section hotspot-detail-nav">
        <button class="btn ghost compact hotspot-back-btn" data-back-hotspot-list>← Voltar aos hotspots</button>
      </div>
      <div class="section editor-mode-head">
        <div><h3>Hotspot</h3><div class="mode-label ${editing ? 'editing' : ''}">${editing ? 'EDIÇÃO ATIVA' : 'VISUALIZAÇÃO'}</div></div>
        <div class="inline-actions">${editing ? '<button class="btn ghost compact" data-cancel-hotspot>Cancelar</button><button class="btn primary compact" data-save-hotspot>Salvar</button>' : '<button class="icon-btn edit-pencil" data-edit-hotspot title="Editar hotspot">✎</button>'}</div>
      </div>
      <div class="section ${editing ? '' : 'readonly-section'}">
        <h3>Tipo e conteúdo</h3>
        <label class="field"><span>Tipo</span><select class="select" data-hs="type"><option value="navigation">Navegação</option><option value="info">Informação</option><option value="external">Link externo</option></select></label>
        <label class="field"><span>Texto</span><input class="input" data-hs="text" maxlength="140"></label>
        <div data-nav-fields><label class="field"><span>Destino</span><select class="select" data-hs="targetSceneId"></select></label></div>
        <div data-info-fields><label class="field"><span>Texto de apresentação (banner)</span><textarea class="textarea" data-hs="info" maxlength="1000"></textarea></label></div>
        <div data-external-fields><label class="field"><span>URL</span><input class="input" type="url" data-hs="url"></label></div>
      </div>
      <div class="section ${editing ? '' : 'readonly-section'}">
        <h3>Posição e orientação</h3>
        <div class="inline-grid three"><label class="field"><span>Yaw</span><input class="input" type="number" step="0.1" data-hs="yaw"></label><label class="field"><span>Pitch</span><input class="input" type="number" step="0.1" data-hs="pitch"></label><label class="field"><span>Rotação</span><input class="input" type="number" step="1" data-hs="rotation"></label></div>
        <label class="switch-row"><span>Perspectiva automática</span><input type="checkbox" data-hs-bool="perspective"></label>
        <div class="inline-grid two"><label class="field"><span>Intensidade</span><input class="input" type="number" min="0" max="2" step="0.05" data-hs="perspectiveStrength"></label><label class="field"><span>Escala</span><input class="input" type="number" min="0.5" max="2" step="0.05" data-hs="scale"></label></div>
        <div class="hint">O hotspot só pode ser movido no panorama quando esta edição estiver ativa.</div>
      </div>
      <div class="section ${editing ? '' : 'readonly-section'}" data-target-view-section>
        <h3>Visão ao chegar</h3>
        <div class="inline-grid three"><label class="field"><span>Yaw</span><input class="input" type="number" step="0.1" data-target-view="yaw"></label><label class="field"><span>Pitch</span><input class="input" type="number" step="0.1" data-target-view="pitch"></label><label class="field"><span>HFOV</span><input class="input" type="number" step="1" data-target-view="hfov"></label></div>
        <div class="inline-actions edit-only"><button class="btn ghost" data-clear-target-view>Usar padrão da cena</button><button class="btn secondary" data-use-target-scene-view>Copiar visão inicial do destino</button></div>
      </div>
      ${editing ? '<button class="btn danger full" data-delete-hotspot>Excluir hotspot</button>' : ''}`;

    $('[data-hs="type"]', root).value=hotspot.type; $('[data-hs="text"]',root).value=hotspot.text||''; $('[data-hs="info"]',root).value=hotspot.info||''; $('[data-hs="url"]',root).value=hotspot.url||'';
    ['yaw','pitch','rotation','perspectiveStrength','scale'].forEach(k=>$(`[data-hs="${k}"]`,root).value=hotspot[k]??(k==='scale'||k==='perspectiveStrength'?1:0));
    $('[data-hs-bool="perspective"]',root).checked=hotspot.perspective!==false;
    const targetSelect=$('[data-hs="targetSceneId"]',root); const emptyOpt=document.createElement('option'); emptyOpt.value=''; emptyOpt.textContent='Selecione…'; targetSelect.appendChild(emptyOpt);
    this.project.sceneOrder.filter(id=>id!==scene.id&&this.project.scenes[id]).forEach(id=>{const opt=document.createElement('option');opt.value=id;opt.textContent=this.project.scenes[id].title;targetSelect.appendChild(opt)}); targetSelect.value=hotspot.targetSceneId||'';
    const tv=hotspot.targetView||{yaw:'',pitch:'',hfov:''}; ['yaw','pitch','hfov'].forEach(k=>$(`[data-target-view="${k}"]`,root).value=tv[k]??'');
    const updateVisibility=()=>{const type=$('[data-hs="type"]',root).value;$('[data-nav-fields]',root).classList.toggle('hidden',type!=='navigation');/* Apresentação disponível em todos os tipos de hotspot */$('[data-external-fields]',root).classList.toggle('hidden',type!=='external');$('[data-target-view-section]',root).classList.toggle('hidden',type!=='navigation')}; updateVisibility();

    $('[data-back-hotspot-list]', root)?.addEventListener('click', () => {
      if (editing && this.hotspotEditSnapshot) {
        const idx = scene.hotspots.findIndex(h => h.id === hotspot.id);
        if (idx >= 0) scene.hotspots[idx] = deepClone(this.hotspotEditSnapshot);
        this.refreshViewerHotspot(hotspot.id);
      }
      this.hotspotEditId = null;
      this.hotspotEditSnapshot = null;
      this.selectedHotspotId = null;
      this.renderHotspotProperties();
      this.updateToolbar();
      this.syncHotspotSelection();
    });

    if (!editing) {
      $$('[data-hs], [data-hs-bool], [data-target-view]',root).forEach(el=>el.disabled=true);
      $('[data-edit-hotspot]',root)?.addEventListener('click',()=>{this.hotspotEditId=hotspot.id;this.hotspotEditSnapshot=deepClone(hotspot);this.renderHotspotProperties();this.updateToolbar();this.syncHotspotSelection();});
      return;
    }

    $$('[data-hs]',root).forEach(input=>input.addEventListener('input',()=>{const key=input.dataset.hs;hotspot[key]=['yaw','pitch','rotation','perspectiveStrength','scale'].includes(key)?Number(input.value||0):input.value;updateVisibility();if(['type','yaw','pitch','rotation','text','perspectiveStrength','scale'].includes(key))this.refreshViewerHotspot(hotspot.id);this.selectedHotspotId=hotspot.id;}));
    $$('[data-hs-bool]',root).forEach(input=>input.addEventListener('change',()=>{hotspot[input.dataset.hsBool]=input.checked;this.refreshViewerHotspot(hotspot.id);}));
    $$('[data-target-view]',root).forEach(input=>input.addEventListener('change',()=>{hotspot.targetView||={};hotspot.targetView[input.dataset.targetView]=Number(input.value||0);}));
    $('[data-clear-target-view]',root)?.addEventListener('click',()=>{hotspot.targetView=null;this.renderHotspotProperties();});
    $('[data-use-target-scene-view]',root)?.addEventListener('click',()=>{const target=this.project.scenes[hotspot.targetSceneId];if(target){hotspot.targetView=deepClone(target.initialView);this.renderHotspotProperties();}});
    $('[data-cancel-hotspot]',root)?.addEventListener('click',()=>{if(this.hotspotEditSnapshot){const idx=scene.hotspots.findIndex(h=>h.id===hotspot.id);if(idx>=0)scene.hotspots[idx]=deepClone(this.hotspotEditSnapshot);}this.hotspotEditId=null;this.hotspotEditSnapshot=null;this.refreshViewerHotspot(hotspot.id);this.renderHotspotProperties();this.updateToolbar();this.syncHotspotSelection();});
    $('[data-save-hotspot]',root)?.addEventListener('click',()=>{this.hotspotEditId=null;this.hotspotEditSnapshot=null;this.commit('save-hotspot',{refresh:['sceneList','hotspot'],syncViewer:false});this.refreshViewerHotspot(hotspot.id);this.renderHotspotProperties();this.updateToolbar();this.syncHotspotSelection();});
    $('[data-delete-hotspot]',root)?.addEventListener('click',()=>{this.hotspotEditId=null;this.hotspotEditSnapshot=null;this.deleteHotspot(hotspot.id)});
  }

  renderProjectProperties() {
    const root = $('#projectTab'); root.textContent = '';
    root.innerHTML = `
      <div class="section">
        <h3>Projeto</h3>
        <label class="field"><span>Nome</span><input class="input" data-project-name maxlength="100"></label>
        <label class="field"><span>Formato</span><input class="input" value="${APP_FORMAT} v${APP_VERSION} · pacote ${PACKAGE_VERSION}" disabled></label>
      </div>
      <div class="section">
        <h3>Player</h3>
        <label class="switch-row"><span>Pré-carregar cenas adjacentes</span><input type="checkbox" data-setting="preloadAdjacent"></label>
        <label class="switch-row"><span>Mostrar bússola</span><input type="checkbox" data-setting="showCompass"></label>
        <label class="switch-row"><span>Controle de zoom</span><input type="checkbox" data-setting="showZoomControls"></label>
        <label class="switch-row"><span>Tela cheia</span><input type="checkbox" data-setting="showFullscreenControl"></label>
        <div class="inline-grid three">
          <label class="field"><span>HFOV padrão</span><input class="input" type="number" data-setting-number="defaultHfov" min="30" max="140"></label>
          <label class="field"><span>Zoom mínimo</span><input class="input" type="number" data-setting-number="minHfov" min="30" max="140"></label>
          <label class="field"><span>Zoom máximo</span><input class="input" type="number" data-setting-number="maxHfov" min="30" max="140"></label>
        </div>
      </div>
      <div class="section">
        <h3>Branding do tour exportado</h3>
        <label class="switch-row"><span>Exibir branding</span><input type="checkbox" data-branding-enabled></label>
        <label class="field"><span>Texto da marca</span><input class="input" type="text" maxlength="120" data-branding-floating-text placeholder="Ex.: Roberto Fettuccia · Especialista em Terreno e Construção"></label>
        <label class="field"><span>Link do branding</span><input class="input" type="url" data-branding-floating-link placeholder="https://..."></label>
        <label class="field"><span>Imagem / logotipo por URL (opcional)</span><input class="input" type="url" data-branding-url placeholder="https://.../logo.png"></label>
        <label class="field file-drop"><span>Ou carregar imagem / logotipo (opcional)</span><input type="file" data-branding-file accept="image/png,image/jpeg,image/webp,image/svg+xml"><small>Na exportação, a imagem é salva fisicamente em branding/; nunca em Base64.</small></label>
        <label class="field"><span>Posição</span><select class="input" data-branding-position><option value="bottom-right">Inferior direito</option><option value="bottom-left">Inferior esquerdo</option><option value="top-right">Superior direito</option><option value="top-left">Superior esquerdo</option></select></label>
        <div class="branding-preview-wrap"><img data-branding-preview alt="Prévia da marca" class="branding-preview"></div>
        <button class="btn ghost full" data-branding-remove>Remover imagem da marca</button>
        <div class="hint">O branding é uma peça única e compacta: texto + imagem opcional + link. O player reposiciona a peça quando necessário para nunca cobrir controles, bússola ou menu.</div>
      </div>
      <div class="section">
        <h3>Manutenção</h3>
        <button class="btn ghost full" data-clear-preload>Limpar cache de pré-carregamento</button>
      </div>`;
    $('[data-project-name]', root).value = this.project.project.name || '';
    $('[data-branding-url]', root).value = this.project.branding?.banner && !String(this.project.branding.banner).startsWith('data:') ? this.project.branding.banner : '';
    $('[data-branding-position]', root).value = this.project.branding?.position || 'bottom-right';
    $('[data-branding-enabled]', root).checked = Boolean(this.project.branding?.enabled);
    $('[data-branding-floating-text]', root).value = this.project.branding?.floatingText || '';
    $('[data-branding-floating-link]', root).value = this.project.branding?.floatingLink || '';
    const brandingPreview = $('[data-branding-preview]', root);
    if (this.project.branding?.banner) { brandingPreview.src = this.project.branding.banner; brandingPreview.style.display = 'block'; } else brandingPreview.style.display = 'none';
    $$('[data-setting]', root).forEach(input => input.checked = Boolean(this.project.settings[input.dataset.setting]));
    $$('[data-setting-number]', root).forEach(input => input.value = this.project.settings[input.dataset.settingNumber]);
    $('[data-project-name]', root).addEventListener('change', (e) => { this.project.project.name = e.target.value.trim() || 'Tour 360'; this.commit('project-name', { refresh: [], syncViewer: false }); });
    $$('[data-setting]', root).forEach(input => input.addEventListener('change', () => { this.project.settings[input.dataset.setting] = input.checked; this.commit('setting', { rebuildViewer: true, preserveView: true }); }));
    $$('[data-setting-number]', root).forEach(input => input.addEventListener('change', () => { this.project.settings[input.dataset.settingNumber] = Number(input.value || 0); this.commit('setting-number', { rebuildViewer: true, preserveView: true }); }));
    $('[data-branding-url]', root).addEventListener('change', (e) => { const url=e.target.value.trim(); this.project.branding.banner=url; if(url)this.project.branding.bannerName=''; this.commit('branding-url', { refresh:['project'], syncViewer:false }); });
    $('[data-branding-position]', root).addEventListener('change', (e) => { this.project.branding.position=e.target.value; this.commit('branding-position',{refresh:[],syncViewer:false}); });
    $('[data-branding-enabled]', root).addEventListener('change', (e) => {
      this.project.branding.enabled = e.target.checked;
      this.project.branding.floatingEnabled = e.target.checked;
      this.commit('branding-enabled',{refresh:[],syncViewer:false});
    });
    $('[data-branding-floating-text]', root).addEventListener('change', (e) => { this.project.branding.floatingText=e.target.value.trim(); this.commit('branding-floating-text',{refresh:[],syncViewer:false}); });
    $('[data-branding-floating-link]', root).addEventListener('change', (e) => { this.project.branding.floatingLink=e.target.value.trim(); this.commit('branding-floating-link',{refresh:[],syncViewer:false}); });
    $('[data-branding-file]', root).addEventListener('change', async (e) => { const file=e.target.files?.[0]; e.target.value=''; if(!file)return; const data=await this.fileToDataUrl(file); this.project.branding.banner=data; this.project.branding.bannerName=file.name; this.commit('branding-file',{refresh:['project'],syncViewer:false}); });
    $('[data-branding-remove]', root).addEventListener('click', () => { this.project.branding.banner=''; this.project.branding.bannerName=''; this.commit('branding-remove',{refresh:['project'],syncViewer:false}); });
    $('[data-clear-preload]', root).addEventListener('click', () => { this.preloadCache.clear(); this.setStatus('Cache de pré-carregamento limpo'); });
  }

  navigateHotspot(h) {
    if (!h) return;
    if (h.type === 'external') {
      if (h.url) window.open(h.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (h.type === 'info') {
      alert(h.info || h.text || 'Informação');
      return;
    }
    const targetId = h.targetSceneId;
    if (!targetId || !this.project.scenes[targetId] || !this.viewer) return;
    const target = this.project.scenes[targetId];
    const v = h.targetView || target.initialView || {};
    try {
      this.viewer.loadScene(targetId, v.pitch ?? 0, v.yaw ?? 0, v.hfov ?? this.project.settings.defaultHfov);
    } catch (err) {
      console.error('Falha ao navegar para a cena', targetId, err);
    }
  }

  captureSceneView() {
    const scene = this.activeScene(); if (!scene || !this.viewer) return;
    scene.initialView = { yaw: this.round(this.viewer.getYaw()), pitch: this.round(this.viewer.getPitch()), hfov: this.round(this.viewer.getHfov()) };
    this.commit('capture-view');
  }

  toggleAddHotspotMode(force) {
    const scene = this.activeScene(); if (!scene || !this.viewer || !this.sceneEditMode) return;
    this.addHotspotMode = typeof force === 'boolean' ? force : !this.addHotspotMode;
    const viewerEl = $('#viewer');
    viewerEl.classList.toggle('hotspot-insert-mode', this.addHotspotMode);
    if (this.addHotspotMode) this.ensureInsertPreview(); else this.removeInsertPreview();
    this.updateModeBadge();
    this.updateToolbar();
  }

  updateModeBadge() { $('#modeBadge').classList.toggle('hidden', !this.addHotspotMode); }

  ensureInsertPreview() {
    let el = $('#hotspotInsertPreview');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'hotspotInsertPreview';
    el.className = 'hotspot-insert-preview';
    el.innerHTML = this.hotspotSvg('navigation');
    $('#viewer').appendChild(el);
    return el;
  }

  removeInsertPreview() {
    $('#hotspotInsertPreview')?.remove();
  }

  onInsertPreviewMove(event) {
    if (!this.addHotspotMode) return;
    if (event.target.closest?.('.pnlm-controls')) return;
    const el = this.ensureInsertPreview();
    const rect = $('#viewer').getBoundingClientRect();
    el.style.left = `${event.clientX - rect.left}px`;
    el.style.top = `${event.clientY - rect.top}px`;
    el.classList.add('visible');
    try {
      const coords = this.viewer?.mouseEventToCoords(event);
      if (coords?.length >= 2) {
        const [pitch] = coords;
        const pseudo = { perspective:true, perspectiveStrength:1, scale:1, pitch };
        const v = this.hotspotPerspective(pseudo, pitch);
        el.style.transform = `translate(-50%, -50%) perspective(220px) rotateX(${v.tilt}deg) scale(${v.scale}, ${v.scale * v.verticalScale})`;
      }
    } catch {}
  }

  onViewerClick(event) {
    if (!this.addHotspotMode || !this.viewer || !this.activeScene()) return;
    const target = event.target;
    if (target.closest?.('.tour-hotspot') || target.closest?.('.pnlm-controls')) return;
    event.preventDefault();
    event.stopPropagation();
    const coords = this.viewer.mouseEventToCoords(event);
    if (!coords || coords.length < 2) return;
    const [pitch, yaw] = coords;
    const hotspot = {
      id: uid('hotspot'), type: 'navigation', yaw: this.round(yaw), pitch: this.round(pitch), rotation: 0,
      perspective: true, perspectiveStrength: 1, scale: 1,
      text: '', targetSceneId: null, targetView: null, url: '', info: ''
    };
    const scene = this.activeScene();
    scene.hotspots.push(hotspot);
    this.selectedHotspotId = hotspot.id;
    this.hotspotEditId = hotspot.id;
    this.hotspotEditSnapshot = deepClone(hotspot);
    this.addHotspotMode = false;
    $('#viewer').classList.remove('hotspot-insert-mode');
    this.removeInsertPreview();
    this.updateModeBadge();
    this.updateToolbar();
    this.commit('add-hotspot', { refresh: ['sceneList'], syncViewer: false });
    // Renderiza imediatamente. Se a API incremental do Pannellum não montar o DOM,
    // fazemos um fallback seguro reconstruindo o viewer uma única vez.
    try {
      this.viewer?.addHotSpot(this.makePannellumHotspot(hotspot), scene.id);
      requestAnimationFrame(() => {
        const mounted = document.querySelector(`.tour-hotspot[data-hotspot-id="${hotspot.id}"]`);
        if (!mounted) this.rebuildViewer({ preserveView: true });
        else this.syncHotspotSelection();
      });
    } catch { this.rebuildViewer({ preserveView: true }); }
    this.renderHotspotProperties();
    this.activateTab('hotspot');
  }

  deleteHotspot(id) {
    const scene = this.activeScene(); if (!scene) return;
    scene.hotspots = scene.hotspots.filter(h => h.id !== id);
    this.selectedHotspotId = null;
    try { this.viewer?.removeHotSpot(id, scene.id); } catch {}
    this.commit('delete-hotspot', { refresh: ['sceneList','hotspot'], syncViewer: false });
  }

  rebuildViewer({ preserveView = true } = {}) {
    const scene = this.activeScene();
    const oldView = this.viewer && preserveView ? { yaw: this.viewer.getYaw(), pitch: this.viewer.getPitch(), hfov: this.viewer.getHfov() } : null;
    if (this.viewer) { this.viewer.destroy(); this.viewer = null; }
    this.viewerScenes.clear();
    $('#viewer').textContent = '';
    if (!scene) { this.updateToolbar(); return; }
    if (!window.pannellum) {
      if (!this.engineLoading) {
        this.engineLoading = true;
        this.renderValidationBar('Carregando motor 360…');
        ensurePannellum().then(() => {
          this.engineLoading = false;
          if (this.activeScene()) this.rebuildViewer({ preserveView: false });
        }).catch((err) => {
          this.engineLoading = false;
          console.warn('Motor 360 indisponível.', err);
          this.renderValidationBar('Cena salva. Motor 360 indisponível; verifique a conexão.');
        });
      }
      this.updateToolbar();
      return;
    }

    const scenesConfig = {};
    for (const id of this.project.sceneOrder) {
      const s = this.project.scenes[id]; if (!s) continue;
      scenesConfig[id] = this.makePannellumSceneConfig(s);
      this.viewerScenes.add(id);
    }

    const view = oldView || scene.initialView || { yaw: 0, pitch: 0, hfov: this.project.settings.defaultHfov };
    const config = {
      default: {
        firstScene: this.activeSceneId,
        sceneFadeDuration: 260,
        autoLoad: this.project.settings.autoLoad,
        showZoomCtrl: this.project.settings.showZoomControls,
        showFullscreenCtrl: this.project.settings.showFullscreenControl,
        compass: this.project.settings.showCompass,
        minHfov: this.project.settings.minHfov,
        maxHfov: this.project.settings.maxHfov
      },
      scenes: scenesConfig
    };

    try {
      this.viewer = pannellum.viewer('viewer', config);
      this.viewer.on('load', () => {
        if (oldView) this.viewer.lookAt(oldView.pitch, oldView.yaw, oldView.hfov, false);
        this.syncHotspotSelection();
        this.preloadAdjacent();
      });
      this.viewer.on('scenechange', (id) => {
        if (this.project.scenes[id]) {
          this.activeSceneId = id;
          this.selectedHotspotId = null;
          this.renderSceneList(); this.renderSceneProperties(); this.renderHotspotProperties(); this.updateToolbar();
          this.preloadAdjacent();
        }
      });
    } catch (err) {
      console.error(err);
      this.viewer = null;
      this.renderValidationBar(`Falha ao abrir a cena: ${err.message || err}`);
    }
  }

  syncViewerScene(force = false) {
    const scene = this.activeScene(); if (!scene || !this.viewer) return;
    try {
      if (force || this.viewer.getScene() !== scene.id) {
        const v = scene.initialView || {};
        this.viewer.loadScene(scene.id, v.pitch ?? 0, v.yaw ?? 0, v.hfov ?? this.project.settings.defaultHfov);
      }
      this.preloadAdjacent();
    } catch {
      this.rebuildViewer({ preserveView: false });
    }
  }

  refreshViewerHotspot(hotspotId) {
    const scene = this.activeScene();
    if (!scene || !this.viewer) return;
    try {
      this.viewer.removeHotSpot(hotspotId, scene.id);
      const hotspot = scene.hotspots.find(h => h.id === hotspotId);
      if (hotspot) this.viewer.addHotSpot(this.makePannellumHotspot(hotspot), scene.id);
      queueMicrotask(() => this.syncHotspotSelection());
    } catch (err) {
      console.warn('Atualização incremental de hotspot falhou; reconstruindo viewer.', err);
      this.rebuildViewer({ preserveView: true });
    }
  }

  makePannellumSceneConfig(scene) {
    return {
      type: 'equirectangular',
      panorama: scene.panorama,
      title: scene.title,
      yaw: scene.initialView?.yaw ?? 0,
      pitch: scene.initialView?.pitch ?? 0,
      hfov: scene.initialView?.hfov ?? this.project.settings.defaultHfov,
      minHfov: this.project.settings.minHfov,
      maxHfov: this.project.settings.maxHfov,
      hotSpots: (scene.hotspots || []).map(h => this.makePannellumHotspot(h))
    };
  }

  makePannellumHotspot(h) {
    return {
      id: h.id,
      pitch: Number(h.pitch || 0),
      yaw: Number(h.yaw || 0),
      cssClass: `tour-hotspot ${h.type || 'navigation'}`,
      createTooltipFunc: (div) => this.buildHotspotElement(div, h)
    };
  }

  hotspotPerspective(h, pitch = h.pitch) {
    const strength = clamp(h.perspectiveStrength ?? 1, 0, 2);
    const userScale = clamp(h.scale ?? 1, .5, 2);
    const floorAmount = clamp((-Number(pitch || 0)) / 48, 0, 1);
    // Quanto mais baixo no panorama, mais o SVG deita no plano do piso.
    const tilt = h.perspective === false ? 0 : (6 + floorAmount * 70) * strength;
    const depthScale = h.perspective === false ? 1 : 1 - floorAmount * .18 * strength;
    const verticalScale = h.perspective === false ? 1 : 1 - floorAmount * .22 * strength;
    return { tilt, scale: userScale * depthScale, verticalScale };
  }

  applyHotspotPerspective(div, h, pitch = h.pitch) {
    const p = $('.hotspot-perspective', div);
    if (!p) return;
    const v = this.hotspotPerspective(h, pitch);
    p.style.transform = `perspective(220px) rotateX(${v.tilt}deg) scale(${v.scale}, ${v.scale * v.verticalScale})`;
  }

  hotspotSvg(type) {
    if (type === 'info') return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><circle cx="32" cy="21" r="3.5" class="hs-fill"/><path d="M32 29v18" class="hs-stroke"/></svg>`;
    if (type === 'external') return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><path d="M25 39 42 22M31 22h11v11" class="hs-stroke"/></svg>`;
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="18" ry="6" class="hs-shadow"/><path d="M32 8 49 33H39v18H25V33H15Z" class="hs-arrow"/><path d="M32 11 45 31H36v17h-8V31h-9Z" class="hs-highlight"/></svg>`;
  }

  buildHotspotElement(div, h) {
    div.dataset.hotspotId = h.id;
    div.title = h.text || this.hotspotTypeLabel(h.type);
    const scale = document.createElement('div'); scale.className = 'hotspot-scale';
    const perspective = document.createElement('div'); perspective.className = 'hotspot-perspective';
    const pulse = document.createElement('span'); pulse.className = 'hotspot-pulse'; perspective.appendChild(pulse);
    const rotate = document.createElement('div'); rotate.className = 'hotspot-rotate'; rotate.style.transform = `rotate(${Number(h.rotation || 0)}deg)`;
    const icon = document.createElement('div'); icon.className = 'hotspot-icon'; icon.innerHTML = this.hotspotSvg(h.type);
    rotate.appendChild(icon); perspective.appendChild(rotate); scale.appendChild(perspective); div.appendChild(scale);
    this.applyHotspotPerspective(div, h);

    // Navegação é o comportamento padrão. Somente a caneta do hotspot habilita reposicionamento/edição.
    div.addEventListener('pointerdown', (e) => {
      if (this.hotspotEditId !== h.id) return;
      this.onHotspotPointerDown(e, h, div);
    });
    div.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (this.hotspotEditId !== h.id) { this.navigateHotspot(h); return; }
      this.selectedHotspotId = h.id;
      this.renderHotspotProperties();
      this.activateTab('hotspot');
      this.syncHotspotSelection();
    });
  }

  onHotspotPointerDown(e, h, div) {
    if (this.hotspotEditId !== h.id) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    this.selectedHotspotId = h.id;
    const viewerRect = $('#viewer').getBoundingClientRect();
    const hotspotRect = div.getBoundingClientRect();
    this.dragHotspot = {
      id: h.id, div, pointerId: e.pointerId,
      startPitch: h.pitch, startYaw: h.yaw,
      anchorX: hotspotRect.left + hotspotRect.width / 2 - viewerRect.left,
      anchorY: hotspotRect.top + hotspotRect.height / 2 - viewerRect.top,
      dx: 0, dy: 0, moved: false, pitch: h.pitch, yaw: h.yaw
    };
    try { div.setPointerCapture?.(e.pointerId); } catch {}
    div.classList.add('dragging');
    this.syncHotspotSelection();
  }

  onHotspotPointerMove(e) {
    const d = this.dragHotspot;
    if (!d || !this.viewer) return;
    if (d.pointerId != null && e.pointerId !== d.pointerId) return;
    e.preventDefault();
    const coords = this.viewer.mouseEventToCoords(e);
    if (!coords || coords.length < 2) return;
    const [pitch, yaw] = coords;
    d.pitch = this.round(pitch); d.yaw = this.round(yaw);
    const rect = $('#viewer').getBoundingClientRect();
    d.dx = e.clientX - rect.left - d.anchorX;
    d.dy = e.clientY - rect.top - d.anchorY;
    d.moved ||= Math.hypot(d.dx, d.dy) > 3;
    const scale = $('.hotspot-scale', d.div);
    if (scale) scale.style.translate = `${d.dx}px ${d.dy}px`;
    const h = this.activeScene()?.hotspots?.find(x => x.id === d.id);
    if (h) this.applyHotspotPerspective(d.div, h, d.pitch);
  }

  onHotspotPointerUp(e) {
    const d = this.dragHotspot;
    if (!d) return;
    if (d.pointerId != null && e.pointerId !== d.pointerId) return;
    const h = this.activeScene()?.hotspots?.find(x => x.id === d.id);
    d.div?.classList.remove('dragging');
    this.dragHotspot = null;
    if (!h || !d.moved) return;
    h.pitch = d.pitch; h.yaw = d.yaw;
    this.commit('drag-hotspot', { refresh: ['hotspot'], syncViewer: false });
    this.refreshViewerHotspot(h.id);
    this.selectedHotspotId = h.id;
    this.renderHotspotProperties();
    this.activateTab('hotspot');
  }

  handleHotspotClick(h) {
    if (h.type === 'navigation' && h.targetSceneId && this.project.scenes[h.targetSceneId]) {
      const target = h.targetView || this.project.scenes[h.targetSceneId].initialView || {};
      this.activeSceneId = h.targetSceneId;
      this.selectedHotspotId = null;
      this.renderSceneList(); this.renderSceneProperties(); this.renderHotspotProperties(); this.updateToolbar();
      this.viewer?.loadScene(h.targetSceneId, target.pitch ?? 0, target.yaw ?? 0, target.hfov ?? this.project.settings.defaultHfov);
    } else if (h.type === 'external' && h.url) {
      window.open(h.url, '_blank', 'noopener,noreferrer');
    } else if (h.type === 'info') {
      alert(h.info || h.text || 'Informação');
    }
  }

  syncHotspotSelection() {
    $$('.tour-hotspot').forEach(el => {
      const id = el.dataset.hotspotId;
      el.classList.toggle('selected', id === this.selectedHotspotId);
      el.classList.toggle('edit-active', id === this.hotspotEditId);
    });
  }

  preloadAdjacent() {
    if (!this.project.settings.preloadAdjacent) return;
    const scene = this.activeScene(); if (!scene) return;
    const urls = [...new Set(scene.hotspots
      .filter(h => h.type === 'navigation' && h.targetSceneId && this.project.scenes[h.targetSceneId])
      .map(h => this.project.scenes[h.targetSceneId].panorama)
      .filter(Boolean)
      .filter(url => !String(url).startsWith('data:')))]
      .filter(url => !this.preloadCache.has(url))
      .slice(0, 2);
    if (!urls.length) return;

    const work = () => {
      for (const url of urls) {
        if (this.preloadCache.has(url)) continue;
        const image = new Image();
        image.decoding = 'async';
        image.fetchPriority = 'low';
        image.loading = 'lazy';
        image.src = url;
        this.preloadCache.set(url, image);
      }
      this.preloadIdleHandle = null;
    };

    // Do not compete with WebGL decoding / user interaction.
    if ('requestIdleCallback' in window) {
      if (this.preloadIdleHandle) cancelIdleCallback(this.preloadIdleHandle);
      this.preloadIdleHandle = requestIdleCallback(work, { timeout: 1800 });
    } else {
      setTimeout(work, 500);
    }
  }

  validateProject() {
    if (!this.validationDirty && this.validationCache) return this.validationCache;
    const items = [];
    const ids = this.project.sceneOrder.filter(id => this.project.scenes[id]);
    const add = (level, title, detail) => items.push({ level, title, detail });
    if (!ids.length) add('error', 'Projeto sem cenas', 'Adicione ao menos uma cena panorâmica.');
    if (ids.length && !this.project.scenes[this.project.settings.firstSceneId]) add('error', 'Cena inicial inválida', 'Defina uma cena inicial existente.');

    for (const id of ids) {
      const scene = this.project.scenes[id];
      if (!scene.panorama) add('error', `Cena sem panorâmica: ${scene.title}`, `A cena “${scene.title}” não possui imagem.`);
      if (!scene.title?.trim()) add('warning', `Cena sem nome: ${id}`, 'Defina um nome para facilitar a edição.');
      for (const h of scene.hotspots || []) {
        if (!Number.isFinite(Number(h.yaw)) || !Number.isFinite(Number(h.pitch))) add('error', `Hotspot inválido em ${scene.title}`, 'Yaw e pitch precisam ser numéricos.');
        if (h.type === 'navigation' && !this.project.scenes[h.targetSceneId]) add('error', `Destino inexistente em ${scene.title}`, `Hotspot “${h.text || h.id}” aponta para uma cena inexistente ou não selecionada.`);
        if (h.type === 'external' && h.url && !/^https?:\/\//i.test(h.url)) add('warning', `Link externo incomum em ${scene.title}`, `Use uma URL começando por http:// ou https://.`);
      }
    }

    if (ids.length && this.project.scenes[this.project.settings.firstSceneId]) {
      const reachable = new Set();
      const stack = [this.project.settings.firstSceneId];
      while (stack.length) {
        const id = stack.pop(); if (reachable.has(id) || !this.project.scenes[id]) continue;
        reachable.add(id);
        for (const h of this.project.scenes[id].hotspots || []) if (h.type === 'navigation' && h.targetSceneId) stack.push(h.targetSceneId);
      }
      for (const id of ids) if (!reachable.has(id)) add('warning', `Cena inalcançável: ${this.project.scenes[id].title}`, 'Não existe caminho de navegação até esta cena a partir da cena inicial.');
    }

    const incoming = new Set();
    for (const otherId of ids) {
      for (const h of this.project.scenes[otherId].hotspots || []) {
        if (h.type === 'navigation' && h.targetSceneId) incoming.add(h.targetSceneId);
      }
    }
    for (const id of ids) {
      if (id !== this.project.settings.firstSceneId && !incoming.has(id)) add('warning', `Cena sem entrada: ${this.project.scenes[id].title}`, 'Nenhum hotspot aponta para esta cena.');
    }

    if (!items.length) add('ok', 'Projeto consistente', `${ids.length} cena${ids.length === 1 ? '' : 's'} e todas as conexões principais passaram na validação.`);
    this.validationCache = items;
    this.validationDirty = false;
    return items;
  }

  renderValidationBar(forcedText = '') {
    const bar = $('#validationBar');
    if (forcedText) { bar.textContent = forcedText; bar.className = 'validation-bar error'; return; }
    const items = this.validateProject();
    const errors = items.filter(x => x.level === 'error').length;
    const warnings = items.filter(x => x.level === 'warning').length;
    bar.classList.remove('hidden','error','ok');
    if (!this.project.sceneOrder.length) { bar.classList.add('hidden'); return; }
    if (errors) { bar.textContent = `${errors} erro${errors > 1 ? 's' : ''} · ${warnings} aviso${warnings !== 1 ? 's' : ''}`; bar.classList.add('error'); }
    else { bar.textContent = warnings ? `Projeto válido com ${warnings} aviso${warnings > 1 ? 's' : ''}` : 'Projeto válido'; bar.classList.add('ok'); }
  }

  scheduleValidationBar() {
    clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => this.renderValidationBar(), 180);
  }

  showValidation() {
    const items = this.validateProject();
    const root = $('#validationResults'); root.textContent = '';
    const errors = items.filter(x => x.level === 'error').length;
    const warnings = items.filter(x => x.level === 'warning').length;
    $('#validationSummary').textContent = errors ? `${errors} erro(s) e ${warnings} aviso(s).` : warnings ? `Sem erros; ${warnings} aviso(s).` : 'Nenhum problema encontrado.';
    for (const item of items) {
      const el = document.createElement('div'); el.className = `validation-item ${item.level}`;
      const icon = item.level === 'error' ? '✕' : item.level === 'warning' ? '!' : '✓';
      el.innerHTML = `<div class="validation-icon">${icon}</div><div><strong></strong><p></p></div>`;
      $('strong', el).textContent = item.title; $('p', el).textContent = item.detail;
      root.appendChild(el);
    }
    $('#validationDialog').showModal();
  }

  showConnections() {
    const root = $('#connectionsMap'); root.textContent = '';
    for (const id of this.project.sceneOrder) {
      const scene = this.project.scenes[id]; if (!scene) continue;
      const node = document.createElement('section'); node.className = 'connection-node';
      const header = document.createElement('header');
      const title = document.createElement('strong'); title.textContent = scene.title;
      const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = `${scene.hotspots.filter(h=>h.type==='navigation').length} saída(s)`;
      header.append(title,badge); node.appendChild(header);
      const ul = document.createElement('ul');
      const navs = scene.hotspots.filter(h => h.type === 'navigation');
      if (!navs.length) { const li=document.createElement('li'); li.textContent='Sem conexões de navegação.'; ul.appendChild(li); }
      for (const h of navs) {
        const li = document.createElement('li');
        const target = this.project.scenes[h.targetSceneId]?.title || 'Destino inválido';
        li.innerHTML = '<b></b> → <span></span>';
        $('b', li).textContent = h.text || 'Hotspot'; $('span', li).textContent = target;
        ul.appendChild(li);
      }
      node.appendChild(ul); root.appendChild(node);
    }
    $('#connectionsDialog').showModal();
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.project, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${slugify(this.project.project.name)}.tour.json`);
  }

  async exportHtml() {
    const validation = this.validateProject();
    if (validation.some(x => x.level === 'error')) {
      this.showValidation();
      return;
    }
    try { await ensureJSZip(); }
    catch (err) { alert('A biblioteca JSZip não pôde ser carregada. Verifique sua conexão e tente novamente.'); return; }

    try {
      this.setStatus('Gerando pacote de publicação…');
      const zip = new JSZip();
      const project = deepClone(this.project);
      const imagesDir = zip.folder('360');
      const usedNames = new Set();

      for (const id of project.sceneOrder) {
        const scene = project.scenes[id];
        if (!scene?.panorama || !scene.panorama.startsWith('data:')) continue;
        const parsed = this.parseDataUrl(scene.panorama);
        if (!parsed) throw new Error(`Imagem inválida na cena “${scene.title || id}”.`);
        const base = slugify(scene.title || id) || 'panorama';
        let filename = `${base}.${parsed.extension}`;
        let n = 2;
        while (usedNames.has(filename)) filename = `${base}-${n++}.${parsed.extension}`;
        usedNames.add(filename);
        imagesDir.file(filename, parsed.base64, { base64: true });
        scene.panorama = `360/${filename}`;
      }

      if (project.branding?.banner?.startsWith('data:')) {
        const parsed = this.parseDataUrl(project.branding.banner);
        if (!parsed) throw new Error('Banner de branding inválido.');
        const brandingDir = zip.folder('branding');
        const ext = parsed.extension === 'bin' ? 'png' : parsed.extension;
        const filename = `banner.${ext}`;
        brandingDir.file(filename, parsed.base64, { base64: true });
        project.branding.banner = `branding/${filename}`;
      }

      zip.file('tour.json', JSON.stringify(project, null, 2));
      zip.file('index.html', this.buildPublishedHtml(project.project.name));
      zip.file('tour.js', this.buildPublishedJs(project.project.name));
      zip.file('README.txt', this.buildPublishedReadme(project.project.name));

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      this.downloadBlob(blob, `${slugify(project.project.name)}.zip`);
      this.setStatus(`Pacote exportado · ${project.project.name}`);
    } catch (err) {
      console.error(err);
      alert(`Não foi possível gerar o pacote.\n\n${err.message || err}`);
      this.setStatus('Erro ao exportar pacote');
    }
  }

  parseDataUrl(dataUrl) {
    const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.*)$/i.exec(dataUrl || '');
    if (!match) return null;
    const mime = (match[1] || 'application/octet-stream').toLowerCase();
    const extension = ({
      'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
      'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg'
    })[mime] || 'bin';
    return { mime, extension, base64: match[2] };
  }

  buildPublishedHtml(projectName) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${this.escapeHtml(projectName || 'Tour 360')}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css">
  <style>
html,body,#viewer{width:100%;height:100%;margin:0;background:#000;overflow:hidden}#viewer{touch-action:none}.tour-hotspot{width:0;height:0;cursor:pointer;overflow:visible}.hotspot-scale{position:absolute;left:-26px;top:-26px}.hotspot-scale,.hotspot-perspective,.hotspot-rotate,.hotspot-icon{width:52px;height:52px}.hotspot-perspective{position:relative}.hotspot-pulse{position:absolute;inset:4px;border:2px solid rgba(255,255,255,.82);border-radius:50%;opacity:0;animation:hsRipple 1.8s ease-out infinite;pointer-events:none}@keyframes hsRipple{0%{transform:scale(.62);opacity:.72}70%{opacity:.16}100%{transform:scale(1.65);opacity:0}}.hotspot-scale{transition:transform .15s}.tour-hotspot:hover .hotspot-scale{transform:scale(1.1)}.hotspot-perspective{display:grid;place-items:center;transform-origin:50% 78%;will-change:transform}.hotspot-rotate{display:grid;place-items:center}.hotspot-icon svg{width:52px;height:52px;overflow:visible;filter:drop-shadow(0 4px 5px rgba(0,0,0,.38))}.hs-arrow{fill:#fff;stroke:#20252b;stroke-width:3.2;stroke-linejoin:round;paint-order:stroke fill}.hs-highlight{fill:rgba(255,255,255,.45)}.hs-shadow{fill:rgba(0,0,0,.25)}.hs-disc{fill:rgba(255,255,255,.96);stroke:#27313d;stroke-width:2}.hs-stroke{fill:none;stroke:#20252b;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.hs-fill{fill:#20252b}.info-box{position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99;max-width:min(90vw,620px);padding:13px 16px;border-radius:12px;background:rgba(17,19,24,.94);border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 40px rgba(0,0,0,.35);color:white;font:14px/1.45 system-ui;display:none}.info-box.show{display:block}.safe-overlay{position:fixed;z-index:120}.spots-toggle{border:1px solid rgba(255,255,255,.22);background:rgba(17,20,26,.88);color:#fff;border-radius:10px;padding:9px 12px;font:700 13px system-ui;cursor:pointer;backdrop-filter:blur(10px);white-space:nowrap}.spots-panel{position:fixed;z-index:119;width:min(320px,calc(100vw - 28px));max-height:min(68vh,560px);overflow:auto;background:rgba(17,20,26,.94);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;box-shadow:0 14px 44px rgba(0,0,0,.4);font-family:system-ui;opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease;transform:scale(.98)}.spots-panel.open{opacity:1;pointer-events:auto;transform:scale(1)}.spots-head{padding:13px 14px 10px;border-bottom:1px solid rgba(255,255,255,.12)}.spots-head strong{display:block;font-size:14px}.spots-head small{display:block;margin-top:3px;opacity:.65}.spots-list{padding:8px}.spot-nav-btn{width:100%;text-align:left;border:0;border-radius:9px;background:transparent;color:#fff;padding:10px 11px;cursor:pointer;font:13px system-ui}.spot-nav-btn:hover{background:rgba(255,255,255,.1)}.spot-nav-btn small{display:block;margin-top:3px;opacity:.6}.branding-floating{z-index:112;display:flex;align-items:center;gap:9px;max-width:min(360px,calc(100vw - 28px));padding:8px 10px;border-radius:12px;background:rgba(17,20,26,.88);border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 34px rgba(0,0,0,.38);backdrop-filter:blur(10px);color:#fff;text-decoration:none;font:600 12px/1.3 system-ui}.branding-floating img{width:auto;height:30px;max-width:110px;object-fit:contain;flex:none}.branding-floating span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.branding-floating:hover{background:rgba(26,30,38,.94)}@media(max-width:640px){.branding-floating{max-width:min(78vw,300px);padding:7px 9px;font-size:11px}.branding-floating img{height:26px;max-width:82px}.spots-panel{width:min(300px,calc(100vw - 20px));max-height:55vh}.spots-toggle{padding:8px 10px;font-size:12px}}
  </style>
</head>
<body>
  <div id="viewer"></div>
  <button id="spotsToggle" class="spots-toggle safe-overlay" aria-expanded="false">☰ Pontos</button>
  <aside id="spotsPanel" class="spots-panel"><div class="spots-head"><strong id="spotsSceneTitle">Pontos</strong><small id="spotsSceneMeta"></small></div><div id="spotsList" class="spots-list"></div></aside>
  <a id="brandingFloating" class="branding-floating safe-overlay" hidden target="_blank" rel="noopener noreferrer"><img id="brandingFloatingImg" alt=""><span id="brandingFloatingText"></span></a>
  <div id="info" class="info-box" role="status"></div>
  <script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"><\/script>
  <script src="tour.js"><\/script>
</body>
</html>`;
  }

  buildPublishedJs(projectName) {
    const safeName = String(projectName || 'Tour 360').replace(/\*\//g, '* /');
    return `/**
 * Tour 360 Player — v3.2.6
 * Projeto: ${safeName}
 * Gerado pelo Tour 360 Editor (base reutilizada) v3.2.6
 *
 * Copyright © Roberto Fettuccia
 * Direitos reservados.
 * contato: corretor.fettuccia@gmail.com
 *
 * Utilização somente mediante autorização do proprietário.
 * Reprodução, distribuição ou modificação não autorizada é proibida.
 */

(async function () {
  'use strict';
  const response = await fetch('tour.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar tour.json');
  const project = await response.json();
  let viewer;
  const cache = new Map();
  const info = document.getElementById('info');
  const spotsToggle=document.getElementById('spotsToggle'),spotsPanel=document.getElementById('spotsPanel'),spotsList=document.getElementById('spotsList'),spotsSceneTitle=document.getElementById('spotsSceneTitle'),spotsSceneMeta=document.getElementById('spotsSceneMeta'),brandingFloating=document.getElementById('brandingFloating'),brandingFloatingImg=document.getElementById('brandingFloatingImg'),brandingFloatingText=document.getElementById('brandingFloatingText');
  const MARGIN=14,GAP=10;
  function intersects(a,b,pad=6){return !(a.right+pad<=b.left||a.left>=b.right+pad||a.bottom+pad<=b.top||a.top>=b.bottom+pad)}
  function controlRects(){return [...document.querySelectorAll('.pnlm-controls-container,.pnlm-zoom-controls,.pnlm-fullscreen-toggle-button,.pnlm-compass')].filter(el=>{const st=getComputedStyle(el),r=el.getBoundingClientRect();return st.display!=='none'&&st.visibility!=='hidden'&&r.width>0&&r.height>0}).map(el=>el.getBoundingClientRect())}
  function setCorner(el,corner,offset=0){el.style.left='auto';el.style.right='auto';el.style.top='auto';el.style.bottom='auto';const top=corner.startsWith('top'),right=corner.endsWith('right');if(top)el.style.top=(MARGIN+offset)+'px';else el.style.bottom=(MARGIN+offset)+'px';if(right)el.style.right=MARGIN+'px';else el.style.left=MARGIN+'px'}
  function placePinned(el,preferred,extra=[]){if(!el||el.hidden)return;const blocks=controlRects().concat(extra.filter(Boolean).map(x=>x.getBoundingClientRect()));for(let off=0;off<=352;off+=44){setCorner(el,preferred,off);const r=el.getBoundingClientRect();if(r.left>=4&&r.top>=4&&r.right<=innerWidth-4&&r.bottom<=innerHeight-4&&!blocks.some(b=>intersects(r,b))){el.dataset.safeCorner=preferred;return}}setCorner(el,preferred,0);el.dataset.safeCorner=preferred}
  function placeMenu(el,preferred,extra=[]){if(!el||el.hidden)return;const blocks=controlRects().concat(extra.filter(Boolean).map(x=>x.getBoundingClientRect()));for(let off=0;off<=352;off+=44){setCorner(el,preferred,off);const r=el.getBoundingClientRect();if(r.left>=4&&r.top>=4&&r.right<=innerWidth-4&&r.bottom<=innerHeight-4&&!blocks.some(b=>intersects(r,b)))return}setCorner(el,preferred,0)}
  function layoutOverlays(){const pref=project.branding?.position||'bottom-right';placePinned(brandingFloating,pref);placeMenu(spotsToggle,'top-right',brandingFloating.hidden?[]:[brandingFloating]);if(spotsPanel.classList.contains('open')){const t=spotsToggle.getBoundingClientRect();spotsPanel.style.left='auto';spotsPanel.style.right='auto';spotsPanel.style.top='auto';spotsPanel.style.bottom='auto';let right=t.left>innerWidth/2;if(right)spotsPanel.style.right=MARGIN+'px';else spotsPanel.style.left=MARGIN+'px';if(t.top<innerHeight/2)spotsPanel.style.top=Math.min(innerHeight-spotsPanel.offsetHeight-MARGIN,t.bottom+GAP)+'px';else spotsPanel.style.bottom=Math.min(innerHeight-spotsPanel.offsetHeight-MARGIN,innerHeight-t.top+GAP)+'px';const br=brandingFloating.hidden?null:brandingFloating.getBoundingClientRect();if(br&&intersects(spotsPanel.getBoundingClientRect(),br)){spotsPanel.style.left=spotsPanel.style.right='auto';right=!right;if(right)spotsPanel.style.right=MARGIN+'px';else spotsPanel.style.left=MARGIN+'px'}}}
  let layoutTimer;function scheduleLayout(){clearTimeout(layoutTimer);layoutTimer=setTimeout(layoutOverlays,30)}
  spotsToggle.addEventListener('click',()=>{const open=spotsPanel.classList.toggle('open');spotsToggle.setAttribute('aria-expanded',String(open));requestAnimationFrame(layoutOverlays)});
  addEventListener('resize',scheduleLayout,{passive:true});addEventListener('orientationchange',()=>setTimeout(layoutOverlays,120),{passive:true});
  function showInfo(text){info.textContent=text;info.classList.add('show');clearTimeout(showInfo.t);showInfo.t=setTimeout(()=>info.classList.remove('show'),4500)}
  function focusInfoHotspot(h,done){const pitch=Number.isFinite(+h.pitch)?+h.pitch:0,yaw=Number.isFinite(+h.yaw)?+h.yaw:0,hfov=(viewer&&typeof viewer.getHfov==='function'?viewer.getHfov():project.settings.defaultHfov)||100;try{if(viewer&&typeof viewer.lookAt==='function'){viewer.lookAt(pitch,yaw,hfov,650,()=>done&&done());return}}catch(e){}try{viewer.setPitch(pitch);viewer.setYaw(yaw)}catch(e){}setTimeout(()=>done&&done(),180)}
  function closeSpotsPanel(){spotsPanel.classList.remove('open');spotsToggle.setAttribute('aria-expanded','false');scheduleLayout()}
  function runHotspot(h){if(h.type==='navigation'&&project.scenes[h.targetSceneId]){const t=h.targetView||project.scenes[h.targetSceneId].initialView||{};viewer.loadScene(h.targetSceneId,t.pitch||0,t.yaw||0,t.hfov||project.settings.defaultHfov)}else if(h.type==='external'&&h.url){window.open(h.url,'_blank','noopener,noreferrer')}else if(h.type==='info'){showInfo(h.info||h.text||'Informação')}}
  function runHotspotFromMenu(h){closeSpotsPanel();if(h.type==='info')focusInfoHotspot(h,()=>showInfo(h.info||h.text||'Informação'));else runHotspot(h)}
  function renderSpots(id){const s=project.scenes[id];if(!s)return;spotsSceneTitle.textContent=s.title||'Cena';const list=s.hotspots||[];spotsSceneMeta.textContent=list.length+' ponto'+(list.length===1?'':'s');spotsList.textContent='';if(!list.length){const e=document.createElement('div');e.style.cssText='padding:12px;opacity:.6;font:13px system-ui';e.textContent='Nenhum ponto nesta cena.';spotsList.appendChild(e);scheduleLayout();return}for(const h of list){const b=document.createElement('button');b.className='spot-nav-btn';const label=h.text||(h.type==='navigation'?(project.scenes[h.targetSceneId]?.title||'Navegação'):h.type==='external'?'Link externo':'Informação');b.textContent=label;const sm=document.createElement('small');sm.textContent=h.type==='navigation'?'Ir para '+(project.scenes[h.targetSceneId]?.title||'destino'):h.type==='external'?'Abrir link':'Ver informação';b.appendChild(sm);b.addEventListener('click',()=>runHotspotFromMenu(h));spotsList.appendChild(b)}scheduleLayout()}
  function makeHotspot(h){return{id:h.id,pitch:+h.pitch||0,yaw:+h.yaw||0,cssClass:'tour-hotspot '+(h.type||'navigation'),createTooltipFunc:(div)=>{div.title=h.text||'';const s=document.createElement('div');s.className='hotspot-scale';const p=document.createElement('div');p.className='hotspot-perspective';const st=Math.max(0,Math.min(2,+(h.perspectiveStrength??1)));const us=Math.max(.5,Math.min(2,+(h.scale??1)));const fa=Math.max(0,Math.min(1,(-(+h.pitch||0))/48));const tilt=h.perspective===false?0:(6+fa*70)*st;const ds=h.perspective===false?1:1-fa*.18*st;const vs=h.perspective===false?1:1-fa*.22*st;p.style.transform='perspective(220px) rotateX('+tilt+'deg) scale('+(us*ds)+','+(us*ds*vs)+')';const pulse=document.createElement('span');pulse.className='hotspot-pulse';p.appendChild(pulse);const r=document.createElement('div');r.className='hotspot-rotate';r.style.transform='rotate('+(+h.rotation||0)+'deg)';const i=document.createElement('div');i.className='hotspot-icon';const svg=h.type==='info'?'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" class="hs-disc"/><circle cx="32" cy="21" r="3.5" class="hs-fill"/><path d="M32 29v18" class="hs-stroke"/></svg>':h.type==='external'?'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" class="hs-disc"/><path d="M25 39 42 22M31 22h11v11" class="hs-stroke"/></svg>':'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="50" rx="18" ry="6" class="hs-shadow"/><path d="M32 8 49 33H39v18H25V33H15Z" class="hs-arrow"/><path d="M32 11 45 31H36v17h-8V31h-9Z" class="hs-highlight"/></svg>';i.innerHTML=svg;r.appendChild(i);p.appendChild(r);s.appendChild(p);div.appendChild(s)},clickHandlerFunc:()=>runHotspot(h)}}
  function cfgScene(s){return{type:'equirectangular',panorama:s.panorama,title:s.title,yaw:s.initialView?.yaw||0,pitch:s.initialView?.pitch||0,hfov:s.initialView?.hfov||project.settings.defaultHfov,minHfov:project.settings.minHfov,maxHfov:project.settings.maxHfov,hotSpots:(s.hotspots||[]).map(makeHotspot)}}
  function preload(id){if(!project.settings.preloadAdjacent)return;const s=project.scenes[id];if(!s)return;const urls=[...new Set((s.hotspots||[]).filter(h=>h.type==='navigation').map(h=>project.scenes[h.targetSceneId]?.panorama).filter(u=>u&&!cache.has(u)))].slice(0,2);const work=()=>{for(const u of urls){if(cache.has(u))continue;const im=new Image;im.decoding='async';im.fetchPriority='low';im.src=u;cache.set(u,im)}};if('requestIdleCallback'in window)requestIdleCallback(work,{timeout:1800});else setTimeout(work,500)}
  const brandEnabled=project.branding?.enabled===true||(project.branding?.enabled==null&&project.branding?.floatingEnabled===true);const brandText=(project.branding?.floatingText||'').trim();const brandImage=(project.branding?.banner||'').trim();if(brandEnabled&&(brandImage||brandText)){if(brandImage){brandingFloatingImg.src=brandImage;brandingFloatingImg.hidden=false;brandingFloatingImg.onerror=()=>{brandingFloatingImg.hidden=true;scheduleLayout()}}else brandingFloatingImg.hidden=true;brandingFloatingText.textContent=brandText;const link=(project.branding?.floatingLink||'').trim();if(link){brandingFloating.href=link;brandingFloating.target='_blank';brandingFloating.style.cursor='pointer'}else{brandingFloating.removeAttribute('href');brandingFloating.removeAttribute('target');brandingFloating.style.cursor='default'}brandingFloating.hidden=false}else brandingFloating.hidden=true
  const scenes={};for(const id of project.sceneOrder){if(project.scenes[id])scenes[id]=cfgScene(project.scenes[id])}
  viewer=pannellum.viewer('viewer',{default:{firstScene:project.settings.firstSceneId||project.sceneOrder[0],sceneFadeDuration:260,autoLoad:true,showZoomCtrl:project.settings.showZoomControls,showFullscreenCtrl:project.settings.showFullscreenControl,compass:project.settings.showCompass,minHfov:project.settings.minHfov,maxHfov:project.settings.maxHfov},scenes});
  viewer.on('load',()=>{const id=viewer.getScene();preload(id);renderSpots(id);setTimeout(layoutOverlays,60)});viewer.on('scenechange',id=>{preload(id);renderSpots(id);setTimeout(layoutOverlays,60)});renderSpots(project.settings.firstSceneId||project.sceneOrder[0]);setTimeout(layoutOverlays,100);
})().catch(err=>{console.error(err);document.body.innerHTML='<div style="padding:24px;color:white;font-family:system-ui;background:#111;min-height:100vh">Erro ao carregar o Tour 360. Publique esta pasta em um servidor web e preserve index.html, tour.js, tour.json e a pasta 360/ juntos.</div>'});`;
  }

  buildPublishedReadme(projectName) {
    return `Tour 360 — ${projectName || 'Projeto'}\n\nPacote de publicação gerado pelo Tour 360 Editor (base reutilizada) v3.2.6.\n\nEstrutura:\n- index.html\n- tour.js\n- tour.json\n- 360/ (imagens panorâmicas locais)\n- branding/ (banner local da marca, quando configurado)\n\nFaça upload de toda a estrutura para o mesmo diretório no servidor. Não altere os caminhos relativos entre os arquivos.\n\nCopyright © Roberto Fettuccia\nDireitos reservados.\ncontato: corretor.fettuccia@gmail.com\nUtilização somente mediante autorização do proprietário.\n`;
  }

  async importJson(e) {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const project = migrateProject(parsed);
      this.project = project;
      this.activeSceneId = project.settings.firstSceneId || project.sceneOrder[0] || null;
      this.selectedHotspotId = null;
      this.history.seed(this.project);
      this.refreshAll({ rebuildViewer: true, preserveView: false });
      this.scheduleAutosave();
      this.setStatus(`Importado: ${file.name}`);
    } catch (err) {
      alert(`Não foi possível importar o JSON.\n\n${err.message || err}`);
    }
  }

  downloadBlob(blob, filename) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async confirm(title, text) {
    const dlg = $('#confirmDialog'); $('#confirmTitle').textContent = title; $('#confirmText').textContent = text;
    return new Promise(resolve => {
      const ok = $('#confirmOkBtn'), cancel = $('#confirmCancelBtn');
      const cleanup = (result) => { ok.onclick = null; cancel.onclick = null; if (dlg.open) dlg.close(); resolve(result); };
      ok.onclick = () => cleanup(true); cancel.onclick = () => cleanup(false); dlg.showModal();
    });
  }

  round(n) { return Math.round(Number(n || 0) * 10) / 10; }
  hotspotTypeLabel(type) { return ({navigation:'Navegação',info:'Informação',external:'Link externo'})[type] || 'Hotspot'; }
  escapeAttr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  escapeHtml(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
}

const editor = new TourEditor();
let editorReady = false;
let pendingHostConfig;
function applyHostConfig(raw) {
  let source = raw;
  if (typeof source === 'string') {
    try { source = source.trim() ? JSON.parse(source) : null; }
    catch (_) { source = null; }
  }
  const next = migrateProject(source || makeProject());
  editor.project = next;
  editor.activeSceneId = next.settings?.firstSceneId || next.sceneOrder?.[0] || null;
  editor.selectedHotspotId = null;
  editor.sceneEditMode = false;
  editor.hotspotEditMode = false;
  editor.addHotspotMode = false;
  editor.history.seed(editor.project);
  editor.refreshAll({ rebuildViewer:true, preserveView:false });
  editor.setStatus('Integrado ao ImobStudio 5.12.4');
}
window.tour360Editor = editor;
window.ImobifyPluginEditor = {
  load(raw) {
    pendingHostConfig = raw;
    if (editorReady) applyHostConfig(raw);
    return true;
  },
  save() {
    if (!editorReady && pendingHostConfig !== undefined) {
      let source = pendingHostConfig;
      if (typeof source === 'string') { try { source = source.trim() ? JSON.parse(source) : null; } catch (_) { source = null; } }
      return JSON.stringify(migrateProject(source || makeProject()));
    }
    editor.project.project ||= {};
    editor.project.project.updatedAt = new Date().toISOString();
    return JSON.stringify(editor.project);
  },
  isReady() { return editorReady; }
};
editor.init().then(() => {
  editorReady = true;
  if (pendingHostConfig !== undefined) applyHostConfig(pendingHostConfig);
}).catch((err) => {
  editorReady = true;
  console.error('Falha ao iniciar Parallax360Tour Studio.', err);
  if (pendingHostConfig !== undefined) applyHostConfig(pendingHostConfig);
});

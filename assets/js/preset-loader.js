(function () {
  const REGISTRY_URL = 'presets/presets.json';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let registry = { schemaVersion:1, presets:[] };
  let loadError = null;

  async function fetchJson(url) {
    const response = await fetch(url, { cache:'no-store' });
    if (!response.ok) throw new Error(`Não foi possível carregar ${url} (${response.status}).`);
    return response.json();
  }

  function normalizeEntry(entry, index = 0) {
    if (!entry || !entry.id || !entry.directory) return null;
    return {
      id:String(entry.id),
      name:String(entry.name || entry.id),
      description:String(entry.description || ''),
      category:String(entry.category || 'Outros'),
      subcategory:entry.subcategory ? String(entry.subcategory) : '',
      directory:String(entry.directory).replace(/\/$/, ''),
      file:String(entry.file || 'preset.json'),
      order:Number(entry.order) || index + 1
    };
  }

  async function loadRegistry() {
    try {
      const data = await fetchJson(REGISTRY_URL);
      registry = {
        schemaVersion:Number(data.schemaVersion) || 1,
        description:String(data.description || ''),
        presets:(Array.isArray(data.presets) ? data.presets : []).map(normalizeEntry).filter(Boolean)
      };
      loadError = null;
    } catch (error) {
      loadError = error;
      console.warn('[Preset Loader]', error);
      registry = { schemaVersion:1, presets:[] };
    }
    return registry;
  }

  const ready = loadRegistry();

  function list() {
    return [...registry.presets].sort((a,b) => (a.order - b.order) || a.name.localeCompare(b.name, 'pt-BR'));
  }

  function get(id) { return registry.presets.find((entry) => entry.id === id) || null; }

  async function load(id) {
    const entry = get(id);
    if (!entry) throw new Error('Preset não encontrado no presets/presets.json.');
    const data = await fetchJson(`${entry.directory}/${entry.file}`);
    return { entry, data };
  }

  function mergeObject(target, source) {
    const output = clone(target || {});
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) output[key] = mergeObject(output[key], value);
      else output[key] = clone(value);
    });
    return output;
  }

  async function createProject(id) {
    const { entry, data } = await load(id);
    let state;
    if (data.project && typeof data.project === 'object') state = clone(data.project);
    else {
      const blueprint = data.baseBlueprint || 'launch';
      state = window.ImobifyCatalog.createFromBlueprint(blueprint);
      state = mergeObject(state, data.overrides || {});
    }
    state.templateMeta = mergeObject(state.templateMeta || {}, {
      presetId:entry.id,
      presetName:entry.name,
      presetCategory:entry.category,
      presetSubcategory:entry.subcategory || '',
      sourceDirectory:entry.directory
    });
    return state;
  }

  function projectPayload(meta, project) {
    const clean = clone(project);
    delete clean.projectId;
    delete clean.selectedSectionId;
    delete clean.updatedAt;
    clean.templateMeta = mergeObject(clean.templateMeta || {}, { presetId:meta.id, presetName:meta.name, presetCategory:meta.category || 'Personalizado' });
    return {
      schemaVersion:1,
      id:meta.id,
      name:meta.name,
      description:meta.description || '',
      category:meta.category || 'Personalizado',
      sourceVersion:project.version || '5.11.12',
      savedAt:new Date().toISOString(),
      project:clean
    };
  }

  function registryEntry(meta) {
    return {
      id:meta.id,
      name:meta.name,
      description:meta.description || '',
      category:meta.category || 'Personalizado',
      directory:`presets/${meta.id}`,
      file:'preset.json'
    };
  }

  async function writeTextFile(directoryHandle, name, text) {
    const fileHandle = await directoryHandle.getFileHandle(name, { create:true });
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  async function saveToStudio(meta, project) {
    if (!('showDirectoryPicker' in window)) throw new Error('Seu navegador não permite salvar diretamente na pasta do Studio. Use Exportar ZIP.');
    const studioHandle = await window.showDirectoryPicker({ mode:'readwrite' });
    const presetsHandle = studioHandle.name.toLowerCase() === 'presets'
      ? studioHandle
      : await studioHandle.getDirectoryHandle('presets', { create:true });
    const presetDir = await presetsHandle.getDirectoryHandle(meta.id, { create:true });
    const payload = projectPayload(meta, project);
    await writeTextFile(presetDir, 'preset.json', JSON.stringify(payload, null, 2));

    let current = { schemaVersion:1, description:'Registro de presets de projeto do Imobify Studio 5.11.12.', presets:[] };
    try {
      const handle = await presetsHandle.getFileHandle('presets.json');
      current = JSON.parse(await (await handle.getFile()).text());
    } catch (_) {}
    current.schemaVersion = Number(current.schemaVersion) || 1;
    current.presets = Array.isArray(current.presets) ? current.presets : [];
    const entry = registryEntry(meta);
    const index = current.presets.findIndex((item) => item.id === meta.id);
    if (index >= 0) current.presets[index] = { ...current.presets[index], ...entry };
    else current.presets.push({ ...entry, order:current.presets.length + 1 });
    await writeTextFile(presetsHandle, 'presets.json', JSON.stringify(current, null, 2));
    registry = {
      schemaVersion:current.schemaVersion,
      description:current.description || '',
      presets:current.presets.map(normalizeEntry).filter(Boolean)
    };
    return { entry, payload };
  }

  async function exportZip(meta, project) {
    if (!window.JSZip) throw new Error('JSZip não está disponível.');
    const zip = new JSZip();
    const payload = projectPayload(meta, project);
    const entry = registryEntry(meta);
    zip.file(`presets/${meta.id}/preset.json`, JSON.stringify(payload, null, 2));
    zip.file('registry-entry.json', JSON.stringify(entry, null, 2));
    zip.file('README-PRESET.txt', `PRESET IMOBIFY STUDIO 5.11.12\n\n1. Copie a pasta presets/${meta.id} para o diretório presets do Studio.\n2. Adicione o conteúdo de registry-entry.json ao array presets de presets/presets.json.\n\nAlternativa: use o botão “Salvar no Studio” no editor para fazer isso automaticamente em navegadores compatíveis.`);
    return zip.generateAsync({ type:'blob' });
  }

  function slug(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64) || `preset-${Date.now()}`;
  }

  window.ImobifyPresetLoader = { ready, reload:loadRegistry, list, get, load, createProject, saveToStudio, exportZip, slug, get loadError(){ return loadError; } };
})();

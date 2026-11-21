(function () {
  const catalog = window.ImobifyCatalog;
  const DB_NAME = 'imobify-plugin-play';
  const STORE_NAME = 'packages';
  const memoryPackages = new Map();
  const bundledPackages = new Map();
  const reservedIds = new Set();
  const { escapeHtml, truthy, compareVersions } = window.ImobifyUtil;

  function templateTruthy(value) {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return Boolean(normalized) && !['0', 'false', 'off', 'no', 'null', 'undefined'].includes(normalized);
    }
    if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
    return Boolean(value);
  }

  function renderConditionals(template, props) {
    let output = String(template || '');
    for (let pass = 0; pass < 500; pass += 1) {
      const tokenPattern = /{{#(if|unless)\s+([\w.-]+)}}|{{\/(if|unless)}}/g;
      const stack = [];
      let match;
      let replaced = false;
      while ((match = tokenPattern.exec(output))) {
        if (match[1]) {
          stack.push({ kind:match[1], key:match[2], start:match.index, contentStart:tokenPattern.lastIndex });
          continue;
        }
        const frame = stack[stack.length - 1];
        if (!frame || frame.kind !== match[3]) continue;
        const content = output.slice(frame.contentStart, match.index);
        const visible = frame.kind === 'if' ? templateTruthy(props[frame.key]) : !templateTruthy(props[frame.key]);
        output = output.slice(0, frame.start) + (visible ? content : '') + output.slice(tokenPattern.lastIndex);
        replaced = true;
        break;
      }
      if (!replaced) break;
    }
    // Um manifesto externo malformado nunca deve vazar marcadores {{/if}} na página.
    return output.replace(/{{#(?:if|unless)\s+[\w.-]+}}|{{\/(?:if|unless)}}/g, '');
  }

  function safeHref(value) {
    const raw = String(value || '').trim();
    if (/^#[A-Za-z][\w:.-]*$/.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^(?:https?:|mailto:|tel:)/i.test(raw)) return raw;
    return '#';
  }

  function safeDomToken(value, fallback = 'item') {
    const token = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    return token || fallback;
  }

  function benefitParagraphs(value) {
    const parts = String(value || '').replace(/\r/g, '').split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
    if (!parts.length) return '<p>Mais informações sobre este benefício estarão disponíveis em breve.</p>';
    return parts.map((item) => `<p>${escapeHtml(item).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function renderBenefitItems(value, props = {}) {
    let items = [];
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
      if (Array.isArray(parsed)) items = parsed;
    } catch {}
    const instance = safeDomToken(props.benefitsId || 'beneficios', 'beneficios');
    const normalized = items.slice(0, 120).map((item, index) => {
      item = item && typeof item === 'object' ? item : {};
      const id = safeDomToken(item.id || `item-${index + 1}`, `item-${index + 1}`);
      const title = String(item.title || `Benefício ${index + 1}`).trim();
      const description = String(item.description || '').trim();
      const rawIcon = String(item.icon || 'fa-solid fa-circle-check').trim();
      const cls = window.ImobifyIconLibrary?.safeClass?.(rawIcon) || '';
      const icon = cls && window.ImobifyIconLibrary?.isFontAwesome?.(cls)
        ? `<i class="${escapeHtml(cls)}" aria-hidden="true"></i>`
        : `<span class="bmp-icon-text" aria-hidden="true">${escapeHtml(rawIcon || '•')}</span>`;
      const dialogId = `${instance}-${id}-modal`;
      const titleId = `${dialogId}-title`;
      return { id, title, description, icon, dialogId, titleId };
    });
    if (!normalized.length) return '<p class="bmp-empty">Adicione benefícios no inspetor do componente.</p>';
    const cards = normalized.map((item) => `<li class="bmp-item"><button class="bmp-trigger" type="button" data-benefit-open aria-haspopup="dialog" aria-controls="${escapeHtml(item.dialogId)}" aria-label="Saiba mais sobre ${escapeHtml(item.title)}"><span class="bmp-icon-shell">${item.icon}</span><span class="bmp-item-title">${escapeHtml(item.title)}</span></button></li>`).join('');
    const dialogs = normalized.map((item) => `<dialog class="bmp-dialog" id="${escapeHtml(item.dialogId)}" aria-labelledby="${escapeHtml(item.titleId)}"><article class="bmp-dialog-inner"><button class="bmp-close" type="button" data-benefit-close aria-label="Fechar detalhes de ${escapeHtml(item.title)}"><span aria-hidden="true">×</span></button><div class="bmp-modal-icon">${item.icon}</div><div class="bmp-dialog-content"><h3 id="${escapeHtml(item.titleId)}">${escapeHtml(item.title)}</h3><div class="bmp-dialog-copy">${benefitParagraphs(item.description)}</div></div></article></dialog>`).join('');
    return `<ul class="bmp-list" role="list">${cards}</ul><div class="bmp-dialogs">${dialogs}</div>`;
  }

  function renderTemplate(template, props) {
    props = props || {};
    let output = renderConditionals(template, props);
    output = output.replace(/{{{\s*([\w.-]+)\s*}}}/g, (_, key) => String(props[key] ?? ''));
    output = output.replace(/{{\s*([\w.-]+)(?:\|([\w-]+))?\s*}}/g, (_, key, filter) => {
      const value = props[key] ?? '';
      if (filter === 'list') return String(value).split(/\n+/).map((item) => item.trim()).filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      if (filter === 'pairs') return String(value).split(/\n+/).map((item) => item.trim()).filter(Boolean).map((item) => {
        const separator = item.indexOf('|');
        if (separator < 0) return `<li><span>${escapeHtml(item)}</span></li>`;
        const label = item.slice(0, separator).trim();
        const text = item.slice(separator + 1).trim();
        return `<li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(text)}</span></li>`;
      }).join('');
      if (filter === 'br') return escapeHtml(value).replace(/\n/g, '<br>');
      if (filter === 'checked') return truthy(value) ? 'checked' : '';
      if (filter === 'hidden') return truthy(value) ? '' : 'hidden';
      if (filter === 'json') return escapeHtml(JSON.stringify(value));
      if (filter === 'href') return escapeHtml(safeHref(value));
      if (filter === 'icon') {
        const lib = window.ImobifyIconLibrary;
        const raw = String(value ?? '').trim();
        const cls = lib?.safeClass?.(raw) || '';
        return cls && lib?.isFontAwesome?.(cls) ? `<i class="${escapeHtml(cls)}" aria-hidden="true"></i>` : escapeHtml(raw);
      }
      if (filter === 'benefits') return renderBenefitItems(value, props);
      return escapeHtml(value);
    });
    return output;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storePut(record) {
    memoryPackages.set(record.id, record);
    const db = await openDatabase();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function storeDelete(id) {
    memoryPackages.delete(id);
    const db = await openDatabase();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function storeList() {
    const db = await openDatabase();
    if (!db) return [...memoryPackages.values()];
    const rows = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    rows.forEach((row) => memoryPackages.set(row.id, row));
    return rows;
  }

  function safeEntry(path) {
    return typeof path === 'string' && path.length < 180 && !path.startsWith('/') && !path.includes('..') && !path.includes('\\');
  }

  function entryFiles(manifest, singular, plural) {
    const many = manifest?.entry?.[plural];
    if (Array.isArray(many)) return many.filter(Boolean);
    const one = manifest?.entry?.[singular];
    return one ? [one] : [];
  }

  function validateManifest(manifest) {
    const errors = [];
    if (!manifest || typeof manifest !== 'object') errors.push('plugin.json ausente ou inválido');
    if (!/^[a-z][a-z0-9-]{2,48}$/.test(manifest?.id || '')) errors.push('id deve usar letras minúsculas, números e hífens');
    if (!manifest?.name) errors.push('name é obrigatório');
    if (!manifest?.version) errors.push('version é obrigatório');
    if (!['section', 'behavior'].includes(manifest?.type)) errors.push('type deve ser section ou behavior');
    if (manifest?.composition?.role && !['section', 'item', 'both'].includes(manifest.composition.role)) errors.push('composition.role deve ser section, item ou both');
    if (manifest?.composition?.cardinality && !['single', 'multiple'].includes(manifest.composition.cardinality)) errors.push('composition.cardinality deve ser single ou multiple');
    if (manifest?.type === 'section' && !safeEntry(manifest?.entry?.template)) errors.push('entry.template inválido');
    const styles = entryFiles(manifest, 'style', 'styles');
    const scripts = entryFiles(manifest, 'script', 'scripts');
    if (!styles.length || styles.some((entry) => !safeEntry(entry))) errors.push('entry.style/styles inválido');
    if (!scripts.length || scripts.some((entry) => !safeEntry(entry))) errors.push('entry.script/scripts inválido');
    if (!Array.isArray(manifest?.fields)) errors.push('fields deve ser uma lista');
    if (manifest?.editor) {
      if (manifest.editor.mode !== 'modal') errors.push('editor.mode deve ser modal');
      if (!safeEntry(manifest.editor.template)) errors.push('editor.template inválido');
      if (!safeEntry(manifest.editor.style)) errors.push('editor.style inválido');
      if (!safeEntry(manifest.editor.script)) errors.push('editor.script inválido');
      if (!manifest.editor.field || typeof manifest.editor.field !== 'string') errors.push('editor.field é obrigatório');
    }
    if (errors.length) throw new Error(`Plugin incompatível: ${errors.join('; ')}.`);
    return manifest;
  }


  function isRemoteOrSpecial(value) {
    return /^(?:[a-z]+:|\/\/|#)/i.test(String(value || ''));
  }

  function resolveBundledAssetValue(value, base) {
    if (typeof value === 'string') {
      const clean = value.trim();
      if (!clean || isRemoteOrSpecial(clean)) return value;
      if (/^(?:\.\/)?assets\//i.test(clean)) return base + clean.replace(/^\.\//, '');
      return value;
    }
    if (Array.isArray(value)) return value.map((item) => resolveBundledAssetValue(item, base));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveBundledAssetValue(item, base)]));
    }
    return value;
  }

  function resolveBundledSourceText(text, base) {
    return String(text || '').replace(/(^|[\s('"=,:])((?:\.\/)?assets\/)/gm, (match, prefix, assetPath) => `${prefix}${base}${assetPath.replace(/^\.\//, '')}`);
  }

  function publicPluginSchema(manifest) {
    const defaults = JSON.parse(JSON.stringify(manifest.defaults || {}));
    let fields = (manifest.fields || []).map((field) => ({ group: 'Plugin', type: 'text', ...field }));
    if (manifest.composition?.cardinality !== 'single') return { defaults, fields };

    /* As chaves antigas continuam no manifesto apenas para migrar projetos
       existentes. Novas instâncias e o inspetor expõem somente um cartão. */
    const legacy = manifest.migration?.legacyGrid || {};
    const gridKeys = new Set([legacy.columnsField || 'gridColumns', legacy.gapField || 'gridGap']);
    const isLegacyKey = (key) => gridKeys.has(key) || /^card[2-9](?:[A-Z]|$)/.test(String(key || ''));
    Object.keys(defaults).forEach((key) => { if (isLegacyKey(key)) delete defaults[key]; });
    fields = fields
      .filter((field) => !isLegacyKey(field.key))
      .map((field) => ({ ...field, group: /^Card 1$/i.test(field.group || '') ? 'Conteúdo' : field.group }));
    return { defaults, fields };
  }

  function registerPackage(record, source = 'installed') {
    const manifest = validateManifest(record.manifest);
    const schema = publicPluginSchema(manifest);
    const plugin = {
      name: manifest.name,
      icon: manifest.icon || '⬡',
      category: manifest.category || 'Plugin Play',
      description: manifest.description || `Componente ${manifest.name}`,
      kind: manifest.type,
      compositionRole: manifest.composition?.role || (manifest.type === 'section' ? 'both' : 'behavior'),
      compositionCardinality: manifest.composition?.cardinality || 'multiple',
      defaults: schema.defaults,
      fields: schema.fields,
      cssText: record.css || '',
      jsText: record.js || '',
      templateText: record.template || '',
      manifest,
      manifestPath: record.manifestPath || `installed:${manifest.id}`,
      pluginSource: source,
      assetBase: record.assetBase || '',
      editorBundle: record.editor || null,
      render: (props, state, sectionId) => {
        if (manifest.type !== 'section') return '';
        // Compatibilidade progressiva: se uma instância do plugin foi criada antes
        // de novos campos/defaults existirem, o template ainda recebe os defaults
        // atuais. Valores realmente gravados na seção sempre têm prioridade,
        // inclusive false, string vazia e zero.
        const effectiveProps = { ...schema.defaults, ...(props || {}) };
        // Migration 6.0.69: older Agendamento Sender projects retain their saved
        // weekend availability and local palette. New instances inherit the global theme.
        if (manifest.id === 'agendamento-sender' && props && !Object.prototype.hasOwnProperty.call(props, 'themeMode')) {
          effectiveProps.themeMode = 'custom';
          if (!Object.prototype.hasOwnProperty.call(props, 'allowSaturday') && Object.prototype.hasOwnProperty.call(props, 'skipSaturday')) {
            effectiveProps.allowSaturday = !truthy(props.skipSaturday);
          }
          if (!Object.prototype.hasOwnProperty.call(props, 'allowSunday') && Object.prototype.hasOwnProperty.call(props, 'skipSunday')) {
            effectiveProps.allowSunday = !truthy(props.skipSunday);
          }
        }
        const markup = renderTemplate(record.template, { ...effectiveProps, __sectionId: sectionId, __projectProfile: state?.strategy?.profile || 'consultive' });
        return `<section class="section-shell plugin-play-section" data-section-id="${escapeHtml(sectionId)}" data-plugin="${escapeHtml(manifest.id)}" data-plugin-version="${escapeHtml(manifest.version)}">${markup}</section>`;
      }
    };
    catalog.plugins[manifest.id] = plugin;
    return plugin;
  }

  function layoutForest(sections) {
    const parse = (index) => {
      const section = sections[index];
      const plugin = catalog.plugins[section?.type];
      const layout = plugin?.manifest?.layout;
      const node = { section, children: [] };
      let cursor = index + 1;
      if (layout?.mode === 'next-sections' || layout?.mode === 'segment-slots') {
        const maxChildren = Math.max(0, Number(layout.maxChildren) || 8);
        const requested = Math.max(0, Math.min(maxChildren, Number(section?.props?.itemCount ?? plugin?.defaults?.itemCount ?? 0) || 0));
        const excludedTypes = new Set(Array.isArray(layout.excludeTypes) ? layout.excludeTypes : []);
        while (cursor < sections.length && node.children.length < requested) {
          if (excludedTypes.has(sections[cursor]?.type)) break;
          const child = parse(cursor);
          node.children.push(child.node);
          cursor = child.next;
        }
      }
      return { node, next: cursor };
    };
    const roots = [];
    let cursor = 0;
    while (cursor < sections.length) {
      const parsed = parse(cursor);
      roots.push(parsed.node);
      cursor = Math.max(cursor + 1, parsed.next);
    }
    return roots;
  }

  function splitLegacyGridSection(section, legacy) {
    const props = { ...(section.props || {}) };
    const slots = Math.max(1, Math.min(9, Number(legacy.slots) || 4));
    const columnsField = legacy.columnsField || 'gridColumns';
    const gapField = legacy.gapField || 'gridGap';
    const isLegacyKey = (key) => key === columnsField || key === gapField || /^card[2-9](?:[A-Z]|$)/.test(key);
    const baseProps = Object.fromEntries(Object.entries(props).filter(([key]) => !isLegacyKey(key)));
    const cards = [{ ...section, props: baseProps, settings: { ...(section.settings || {}) } }];

    for (let slot = 2; slot <= slots; slot += 1) {
      const prefix = `card${slot}`;
      if (!truthy(props[`${prefix}Enabled`])) continue;
      const cardProps = { ...baseProps };
      Object.entries(props).forEach(([key, value]) => {
        if (!key.startsWith(prefix) || key === `${prefix}Enabled`) return;
        const suffix = key.slice(prefix.length);
        if (!suffix) return;
        cardProps[suffix.charAt(0).toLowerCase() + suffix.slice(1)] = value;
      });
      const card = { ...section, id: '', props: cardProps, settings: { ...(section.settings || {}), anchorId: '' } };
      catalog.refreshSectionIdentity(card);
      cards.push(card);
    }
    return { cards, gap: Number(props[gapField]) };
  }

  function migrateLegacyCardGrids(sections) {
    if (!Array.isArray(sections) || !sections.length) return Array.isArray(sections) ? sections : [];
    const cloned = JSON.parse(JSON.stringify(sections));
    const roots = layoutForest(cloned);
    let changed = false;

    const transform = (node, parent = null) => {
      const plugin = catalog.plugins[node.section?.type];
      const legacy = plugin?.manifest?.migration?.legacyGrid;
      const props = node.section?.props || {};
      const columnsField = legacy?.columnsField || 'gridColumns';
      const gapField = legacy?.gapField || 'gridGap';
      const hasLegacyProps = legacy && Object.keys(props).some((key) => key === columnsField || key === gapField || /^card[2-9](?:[A-Z]|$)/.test(key));

      if (hasLegacyProps) {
        changed = true;
        const { cards, gap } = splitLegacyGridSection(node.section, legacy);
        if (cards.length === 1) return [{ section: cards[0], children: [] }];

        const parentPlugin = catalog.plugins[parent?.section?.type];
        const parentLayout = parentPlugin?.manifest?.layout;
        if (parentLayout?.mode === 'segment-slots') {
          const tracks = Math.max(1, Math.min(Number(parentLayout.maxTracks) || 5, Number(parent.section?.props?.tracks) || 1));
          const originalSlot = Math.max(0, Math.min(tracks - 1, Number(node.section.settings?.layoutSlot) || 0));
          return cards.map((card, index) => ({
            section: {
              ...card,
              settings: { ...(card.settings || {}), layoutSlot: (originalSlot + index) % tracks, anchorId: index ? '' : (card.settings?.anchorId || '') }
            },
            children: []
          }));
        }

        const segment = catalog.createSection('segment-layout');
        if (!segment) return cards.map((card) => ({ section: card, children: [] }));
        const tracks = Math.max(1, Math.min(5, cards.length));
        segment.props = {
          ...(segment.props || {}),
          direction: 'columns',
          tracks,
          itemCount: cards.length,
          ...(Number.isFinite(gap) ? { gap } : {})
        };
        segment.settings = { ...(node.section.settings || {}) };
        const neutralSettings = { visible: true, hideMobile: false, hideDesktop: false, transition: 'none', cssClass: '', anchorId: '' };
        const children = cards.map((card, index) => ({
          section: { ...card, settings: { ...neutralSettings, layoutSlot: index } },
          children: []
        }));
        return [{ section: segment, children }];
      }

      const children = node.children.flatMap((child) => transform(child, node));
      node.children = children;
      const layout = plugin?.manifest?.layout;
      if ((layout?.mode === 'next-sections' || layout?.mode === 'segment-slots') && node.section?.props) {
        node.section.props.itemCount = children.length;
      }
      return [node];
    };

    const transformed = roots.flatMap((node) => transform(node));
    if (!changed) return cloned;
    const flattened = [];
    const append = (node) => {
      flattened.push(node.section);
      node.children.forEach(append);
    };
    transformed.forEach(append);
    return flattened;
  }

  async function loadBundledPackages() {
    const response = await fetch('plugins/registry.json');
    if (!response.ok) return [];
    const registry = await response.json();
    (registry.corePlugins || []).forEach((id) => reservedIds.add(id));
    const packages = registry.packages || [];
    const loaded = [];
    for (const descriptor of packages) {
      try {
        const manifestPath = descriptor.manifest;
        const manifestResponse = await fetch(manifestPath);
        if (!manifestResponse.ok) throw new Error(`Manifesto indisponível: ${manifestPath}`);
        const manifest = validateManifest(await manifestResponse.json());
        const base = manifestPath.slice(0, manifestPath.lastIndexOf('/') + 1);
        const [template, cssParts, jsParts] = await Promise.all([
          manifest.type === 'section' ? fetch(base + manifest.entry.template).then((item) => item.text()) : Promise.resolve(''),
          Promise.all(entryFiles(manifest, 'style', 'styles').map((entry) => fetch(base + entry).then((item) => {
            if (!item.ok) throw new Error(`Estilo indisponível: ${entry}`);
            return item.text();
          }))),
          Promise.all(entryFiles(manifest, 'script', 'scripts').map((entry) => fetch(base + entry).then((item) => {
            if (!item.ok) throw new Error(`Script indisponível: ${entry}`);
            return item.text();
          })))
        ]);
        let editor = null;
        if (manifest.editor?.mode === 'modal') {
          const fetchEditor = async (entry) => {
            const response = await fetch(base + entry);
            if (!response.ok) throw new Error(`Editor do plugin indisponível: ${entry}`);
            return response.text();
          };
          const [html, css, js] = await Promise.all([
            fetchEditor(manifest.editor.template),
            fetchEditor(manifest.editor.style),
            fetchEditor(manifest.editor.script)
          ]);
          editor = { html, css, js };
        }
        manifest.defaults = resolveBundledAssetValue(manifest.defaults || {}, base);
        const record = {
          id: manifest.id,
          manifest,
          template: resolveBundledSourceText(template, base),
          css: resolveBundledSourceText(cssParts.join('\n\n'), base),
          js: resolveBundledSourceText(jsParts.join('\n\n'), base),
          editor,
          manifestPath,
          assetBase: base
        };
        bundledPackages.set(manifest.id, record);
        loaded.push(registerPackage(record, 'bundled'));
      } catch (error) {
        console.error('[Plugin Play] Falha ao carregar pacote incluído.', error);
      }
    }
    return loaded;
  }

  function mimeFor(path) {
    const ext = path.split('.').pop().toLowerCase();
    return ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', woff: 'font/woff', woff2: 'font/woff2' })[ext] || 'application/octet-stream';
  }

  async function inlineAssets(zip, base, sources, manifest) {
    const assetPrefix = `${base}assets/`;
    const assets = Object.keys(zip.files).filter((name) => !zip.files[name].dir && name.startsWith(assetPrefix));
    const replacements = new Map();
    for (const name of assets) {
      const relative = name.slice(base.length);
      const base64 = await zip.file(name).async('base64');
      replacements.set(relative, `data:${mimeFor(name)};base64,${base64}`);
    }
    const replaceText = (text) => {
      let output = String(text || '');
      replacements.forEach((dataUrl, relative) => {
        output = output.split(relative).join(dataUrl).split(`./${relative}`).join(dataUrl);
      });
      return output;
    };
    const replaceValues = (value) => {
      if (typeof value === 'string') return replacements.get(value) || replacements.get(value.replace(/^\.\//, '')) || value;
      if (Array.isArray(value)) return value.map(replaceValues);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceValues(item)]));
      return value;
    };
    manifest.defaults = replaceValues(manifest.defaults || {});
    return { template: replaceText(sources.template), css: replaceText(sources.css), js: replaceText(sources.js) };
  }

  async function packageFromZip(file) {
    if (!window.JSZip) throw new Error('A biblioteca ZIP não está disponível.');
    if (!file || file.size > 15 * 1024 * 1024) throw new Error('Use um plugin ZIP de até 15 MB.');
    const zip = await JSZip.loadAsync(file);
    const manifestCandidates = Object.keys(zip.files).filter((name) => !zip.files[name].dir && /(^|\/)plugin\.json$/i.test(name) && !name.includes('__MACOSX'));
    if (!manifestCandidates.length) throw new Error('O ZIP não contém plugin.json.');
    manifestCandidates.sort((a, b) => a.split('/').length - b.split('/').length);
    const manifestFile = manifestCandidates[0];
    const base = manifestFile.slice(0, manifestFile.lastIndexOf('/') + 1);
    const manifest = validateManifest(JSON.parse(await zip.file(manifestFile).async('text')));
    const read = async (entry, optional = false) => {
      if (!entry && optional) return '';
      const target = `${base}${entry}`;
      const item = zip.file(target);
      if (!item) throw new Error(`Arquivo obrigatório ausente: ${entry}`);
      return item.async('text');
    };
    const readMany = async (entries) => (await Promise.all(entries.map((entry) => read(entry)))).join('\n\n');
    let sources = {
      template: manifest.type === 'section' ? await read(manifest.entry.template) : '',
      css: await readMany(entryFiles(manifest, 'style', 'styles')),
      js: await readMany(entryFiles(manifest, 'script', 'scripts'))
    };
    sources = await inlineAssets(zip, base, sources, manifest);
    let editor = null;
    if (manifest.editor?.mode === 'modal') {
      editor = {
        html: await read(manifest.editor.template),
        css: await read(manifest.editor.style),
        js: await read(manifest.editor.script)
      };
    }
    return { id: manifest.id, manifest, ...sources, editor, manifestPath: `installed:${manifest.id}` };
  }

  async function installZip(file) {
    const record = await packageFromZip(file);
    if (reservedIds.has(record.id) && !bundledPackages.has(record.id)) {
      throw new Error(`O identificador “${record.id}” é reservado para um componente principal do framework e não pode ser instalado por ZIP.`);
    }
    const current = catalog.plugins[record.id];
    let question = `Instalar “${record.manifest.name}” v${record.manifest.version}? Plugins podem executar JavaScript na landing page; instale apenas pacotes confiáveis.`;
    if (current) {
      const comparison = compareVersions(record.manifest.version, current.manifest?.version);
      const versionNote = comparison < 0
        ? ` Atenção: isso é uma versão anterior à instalada (${current.manifest?.version || '?'}).`
        : comparison === 0
          ? ` A versão instalada já é ${current.manifest?.version || '?'}.`
          : '';
      question = `O plugin “${record.manifest.name}” já existe (v${current.manifest?.version || '?'}). Substituir pela versão ${record.manifest.version}?${versionNote}`;
    }
    if (!window.confirm(question)) throw new Error('Instalação cancelada.');
    await storePut(record);
    return registerPackage(record, 'installed');
  }

  async function uninstall(id) {
    const plugin = catalog.plugins[id];
    if (!plugin || plugin.pluginSource !== 'installed') throw new Error('Somente plugins importados podem ser desinstalados.');
    await storeDelete(id);
    if (bundledPackages.has(id)) registerPackage(bundledPackages.get(id), 'bundled');
    else delete catalog.plugins[id];
  }

  async function loadInstalledPackages() {
    const rows = await storeList();
    const loaded = [];
    for (const record of rows) {
      const bundled = bundledPackages.get(record.id);
      if (bundled && compareVersions(record.manifest?.version, bundled.manifest?.version) < 0) {
        /* Não deixa um ZIP antigo persistido no IndexedDB sobrescrever uma correção
           de estabilidade que já vem incluída no framework. */
        console.warn(`[Plugin Play] Ignorando ${record.id} v${record.manifest?.version || '?'}; o framework inclui v${bundled.manifest?.version || '?'}.`);
        try { await storeDelete(record.id); } catch (_) {}
        continue;
      }
      loaded.push(registerPackage(record, 'installed'));
    }
    return loaded;
  }

  const ready = (async () => {
    /* Ordem determinística: primeiro bundled, depois plugins persistidos compatíveis. */
    await loadBundledPackages();
    return loadInstalledPackages();
  })().catch((error) => {
    console.error('[Plugin Play] Inicialização incompleta.', error);
    return [];
  });

  window.ImobifyPluginLoader = { ready, installZip, uninstall, packageFromZip, validateManifest, renderTemplate, migrateLegacyCardGrids, storeList, entryFiles, reservedIds };
})();

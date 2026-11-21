(function () {
  'use strict';

  const SCHEMA = 'imobify-component-preset';
  const SCHEMA_VERSION = 1;
  const MAX_COMPONENTS = 100;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

  function normalizeEntry(entry, index) {
    if (!isRecord(entry) || !/^[a-z][a-z0-9-]{2,48}$/.test(String(entry.type || ''))) {
      throw new Error(`Componente ${index + 1} possui um identificador inválido.`);
    }
    if (!isRecord(entry.props) || !isRecord(entry.settings)) {
      throw new Error(`Componente ${index + 1} não possui um estado válido.`);
    }
    return {
      type: String(entry.type),
      pluginVersion: String(entry.pluginVersion || '1.0.0'),
      props: clone(entry.props),
      settings: clone(entry.settings)
    };
  }

  function parsePreset(input) {
    if (!isRecord(input) || input.schema !== SCHEMA) throw new Error('Este JSON não é um preset de componente Imobify.');
    if (Number(input.schemaVersion) !== SCHEMA_VERSION) throw new Error('Versão do preset de componente não suportada.');
    if (!['component', 'group'].includes(input.scope)) throw new Error('O escopo do preset é inválido.');
    if (!Array.isArray(input.components) || !input.components.length || input.components.length > MAX_COMPONENTS) {
      throw new Error(`O preset precisa conter entre 1 e ${MAX_COMPONENTS} componentes.`);
    }
    if (input.scope === 'component' && input.components.length !== 1) throw new Error('Um preset individual deve conter exatamente um componente.');
    const components = input.components.map(normalizeEntry);
    const rootType = String(input.rootType || components[0].type);
    if (rootType !== components[0].type) throw new Error('O componente raiz do preset é inconsistente.');
    return {
      schema: SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      frameworkVersion: String(input.frameworkVersion || ''),
      scope: input.scope,
      name: String(input.name || rootType),
      rootType,
      exportedAt: String(input.exportedAt || ''),
      components
    };
  }

  function createPreset({ scope = 'component', sections = [], plugins = {}, frameworkVersion = '' } = {}) {
    if (!['component', 'group'].includes(scope)) throw new Error('Escopo de exportação inválido.');
    if (!Array.isArray(sections) || !sections.length) throw new Error('Selecione um componente para exportar.');
    if (scope === 'component' && sections.length !== 1) throw new Error('A exportação individual aceita somente um componente.');
    const rootPlugin = plugins[sections[0].type];
    const components = sections.map((section, index) => {
      const plugin = plugins[section.type];
      if (!plugin) throw new Error(`O plugin ${section.type} não está disponível.`);
      const props = clone(section.props || {});
      const settings = clone(section.settings || {});
      if (scope === 'component' || index === 0) delete settings.layoutSlot;
      if (scope === 'component' && plugin.manifest?.layout) props.itemCount = 0;
      return {
        type: section.type,
        pluginVersion: plugin.manifest?.version || '1.0.0',
        props,
        settings
      };
    });
    return parsePreset({
      schema: SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      frameworkVersion,
      scope,
      name: rootPlugin?.name || sections[0].type,
      rootType: sections[0].type,
      exportedAt: new Date().toISOString(),
      components
    });
  }

  function hydratePreset(input, plugins = {}, refreshIdentity) {
    const preset = parsePreset(input);
    return preset.components.map((entry) => {
      const plugin = plugins[entry.type];
      if (!plugin) throw new Error(`Instale o plugin ${entry.type} antes de carregar este preset.`);
      const section = {
        id: '',
        type: entry.type,
        props: { ...clone(plugin.defaults || {}), ...clone(entry.props) },
        settings: {
          visible: true,
          hideMobile: false,
          hideDesktop: false,
          transition: 'default',
          cssClass: '',
          anchorId: '',
          ...clone(entry.settings)
        }
      };
      if (typeof refreshIdentity === 'function') refreshIdentity(section);
      else section.id = `${section.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return section;
    });
  }

  function filename(input, slugger) {
    const preset = parsePreset(input);
    const fallback = preset.rootType || 'componente';
    const raw = preset.name || fallback;
    const slug = typeof slugger === 'function'
      ? slugger(raw)
      : String(raw).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${slug || fallback}.saved.json`;
  }

  window.ImobifyComponentState = { SCHEMA, SCHEMA_VERSION, createPreset, parsePreset, hydratePreset, filename };
})();

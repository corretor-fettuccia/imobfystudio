const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const JSZip = require(path.join(ROOT, 'vendor/jszip.min.js'));

global.JSZip = JSZip;
global.window = {
  JSZip,
  indexedDB: null,
  confirm: () => true
};

global.fetch = async (resource) => {
  const source = String(resource);
  if (/^https?:\/\//.test(source)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
  const fullPath = path.resolve(ROOT, source.replace(/^\.\//, ''));
  if (!fullPath.startsWith(ROOT) || !fs.existsSync(fullPath)) return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
  const buffer = fs.readFileSync(fullPath);
  return {
    ok: true,
    status: 200,
    text: async () => buffer.toString('utf8'),
    json: async () => JSON.parse(buffer.toString('utf8')),
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  };
};

function loadScript(relativePath) {
  const filename = path.join(ROOT, relativePath);
  vm.runInThisContext(fs.readFileSync(filename, 'utf8'), { filename });
}

(async () => {
  loadScript('assets/js/util.js');
  loadScript('assets/js/catalog.js');
  loadScript('assets/js/icon-library.js');
  loadScript('assets/js/plugin-loader.js');
  loadScript('assets/js/component-state.js');
  await window.ImobifyPluginLoader.ready;

  assert.equal(window.ImobifyCatalog.plugins['flip-card-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['gallery-big-four'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['form-sender-v4'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['agendamento-sender'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['agendamento-sender'].manifest.version, '1.3.0');
  assert.ok(window.ImobifyCatalog.plugins['agendamento-sender'].fields.some(field => field.key === 'endpoint'));
  assert.ok(window.ImobifyCatalog.plugins['agendamento-sender'].fields.some(field => field.key === 'blockedDates'));
  assert.equal(window.ImobifyCatalog.plugins['property-slider'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['beneficios-modal'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['beneficios-modal'].manifest.version, '1.1.1');
  assert.equal(window.ImobifyCatalog.plugins['beneficios-modal'].manifest.instanceIdField, 'benefitsId');
  assert.ok(window.ImobifyCatalog.plugins['beneficios-modal'].fields.some((field) => field.key === 'showcaseProfile'), 'Benefícios + Modal deve expor Perfil da vitrine');
  assert.ok(window.ImobifyCatalog.plugins['beneficios-modal'].fields.some((field) => field.key === 'modalProfile'), 'Benefícios + Modal deve expor Perfil do modal');
  assert.ok(window.ImobifyCatalog.plugins['beneficios-modal'].fields.some((field) => field.key === 'modalContrastMode'), 'Benefícios + Modal deve expor contraste automático/manual');
  assert.equal(window.ImobifyCatalog.plugins['property-slider'].manifest.type, 'section');
  assert.equal(window.ImobifyCatalog.plugins['property-slider'].manifest.version, '1.4.0');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'textPadding'), 'Slider 1.2 deve expor área segura do conteúdo no desktop');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'mobileTextPadding'), 'Slider 1.2 deve expor área segura do conteúdo no mobile');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'fillHorizontal'), 'Slider 1.2 deve permitir preencher na horizontal');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'controlShape'), 'Slider 1.2 deve permitir formato dos controles');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'controlPosition'), 'Slider 1.2 deve permitir posição dos controles');

  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'titleSize'), 'Slider 1.3 deve expor tamanho do título');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'contentAlign'), 'Slider 1.3 deve expor alinhamento do conteúdo');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'imagePositionX'), 'Slider 1.3 deve expor enquadramento horizontal da imagem');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'transition'), 'Slider 1.3 deve expor transição');
  assert.ok(window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => field.key === 'arrowSize'), 'Slider 1.3 deve expor tamanho do botão das setas');
  assert.ok(!window.ImobifyCatalog.plugins['property-slider'].fields.some((field) => /^image[123]$/.test(field.key)), 'Slider 1.1 não deve expor os três slides fixos no inspetor genérico');
  assert.equal(window.ImobifyCatalog.plugins['location'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['location'].manifest.version, '1.1.0');
  assert.equal(window.ImobifyCatalog.plugins['parallax'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['magazine-text-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['magazine-text-pro'].manifest.version, '1.3.1');
  assert.equal(window.ImobifyCatalog.plugins['only-text-context'].manifest.version, '1.2.1');
  assert.equal(window.ImobifyCatalog.plugins['youtube'].manifest.version, '1.0.1');
  assert.equal(window.ImobifyCatalog.plugins['button-single'].manifest.version, '1.0.0');
  assert.equal(window.ImobifyCatalog.plugins['image-single'].manifest.version, '1.0.0');
  assert.equal(window.ImobifyCatalog.plugins['button-single'].compositionRole, 'both');
  assert.equal(window.ImobifyCatalog.plugins['button-single'].compositionCardinality, 'single');
  assert.equal(window.ImobifyCatalog.plugins['image-single'].compositionRole, 'both');
  assert.equal(window.ImobifyCatalog.plugins['image-single'].compositionCardinality, 'single');
  assert.equal(window.ImobifyCatalog.plugins['ar-card-popout-3d'].manifest.version, '1.2.0');
  assert.equal(window.ImobifyCatalog.plugins['ar-card-popout-3d-stage'].manifest.version, '1.0.0');
  assert.equal(window.ImobifyCatalog.plugins['ar-card-popout-3d-stage'].compositionCardinality, 'single');
  assert.equal(window.ImobifyCatalog.plugins['flip-card-pro'].manifest.version, '4.4.0');
  assert.equal(window.ImobifyCatalog.plugins['flipcard-3d-video-v1'].manifest.version, '1.1.0');
  assert.equal(window.ImobifyCatalog.plugins['only-text-context'].compositionRole, 'both');
  assert.equal(window.ImobifyCatalog.plugins['youtube'].compositionRole, 'both');
  assert.equal(window.ImobifyCatalog.plugins['possibility-path-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['possibility-path-pro'].manifest.version, '1.0.0');
  assert.equal(window.ImobifyCatalog.plugins['tag-installer-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['tag-installer-pro'].manifest.output, 'document-tag');
  assert.equal(window.ImobifyCatalog.plugins['floating-container-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['floating-container-pro'].manifest.instanceIdField, 'panelId');
  assert.equal(window.ImobifyCatalog.plugins['parallax'].manifest.version, '2.10.3');
  assert.equal(window.ImobifyCatalog.plugins['section-layout-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['spacer-divider-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['offer-price-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['timeline-process-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['hotspot-plant-pro'].pluginSource, 'bundled');
  assert.equal(window.ImobifyCatalog.plugins['financing-simulator-pro'].pluginSource, 'bundled');
  assert.match(window.ImobifyCatalog.plugins['parallax'].defaults.poster, /^plugins\/parallax\/assets\/images\/poster\.jpg$/);
  assert.equal(window.ImobifyPluginLoader.renderTemplate('{{icon|icon}}', { icon:'fa-solid fa-house' }), '<i class="fa-solid fa-house" aria-hidden="true"></i>');
  assert.equal(window.ImobifyPluginLoader.renderTemplate('{{icon|icon}}', { icon:'R$' }), 'R$');
  assert.ok(window.ImobifyIconLibrary.flat.length >= 100, 'biblioteca Font Awesome deve oferecer variedade de ícones');
  assert.ok(window.ImobifyIconLibrary.flat.some((item) => item.value === 'fa-solid fa-water-ladder'), 'biblioteca deve incluir infraestrutura de piscina');
  {
    const benefits = window.ImobifyCatalog.plugins['beneficios-modal'];
    const markup = benefits.render({ ...benefits.defaults, benefitsId:'beneficios-teste' }, {}, 'beneficios-test');
    assert.match(markup, /data-plugin="beneficios-modal"/);
    assert.match(markup, /aria-haspopup="dialog"/);
    assert.match(markup, /<dialog class="bmp-dialog"/);
    assert.match(markup, /Piscina descoberta/);
    assert.match(markup, /integrada à área de lazer/);
  }

  for (const [id, plugin] of Object.entries(window.ImobifyCatalog.plugins)) {
    if (plugin.kind !== 'section' || typeof plugin.render !== 'function') continue;
    const markup = plugin.render(plugin.defaults, {}, `conditional-${id}`);
    assert.doesNotMatch(markup, /{{#(?:if|unless)\b|{{\/(?:if|unless)}}/, `${id} não pode vazar condicionais do template`);
  }

  // v5.1.30: condicionais aninhadas não podem vazar {{/if}} para a página.
  assert.equal(window.ImobifyPluginLoader.renderTemplate('{{#if outer}}A{{#if inner}}B{{/if}}C{{/if}}', { outer:true, inner:true }), 'ABC');
  assert.equal(window.ImobifyPluginLoader.renderTemplate('{{#if outer}}A{{#if inner}}B{{/if}}C{{/if}}', { outer:true, inner:false }), 'AC');
  assert.equal(window.ImobifyPluginLoader.renderTemplate('{{#if outer}}A{{#if inner}}B{{/if}}C{{/if}}', { outer:false, inner:true }), '');
  assert.equal(window.ImobifyPluginLoader.renderTemplate('<a href="{{href|href}}">A</a>', { href:'javascript:alert(1)' }), '<a href="#">A</a>');
  {
    const floating = window.ImobifyCatalog.plugins['floating-container-pro'];
    const floatingMarkup = floating.render({ ...floating.defaults, showHeader:true, title:'Uma linha', subtitle:'' }, {}, 'floating-test');
    assert.match(floatingMarkup, /<h2>Uma linha<\/h2>/);
    assert.doesNotMatch(floatingMarkup, /{{\/?(?:if|unless)\b|{{\/if}}/, 'Floating Container não pode exibir marcadores do template');

    const button = window.ImobifyCatalog.plugins['button-single'];
    const buttonMarkup = button.render({ ...button.defaults, href:'javascript:alert(1)', openNewTab:true }, {}, 'button-test');
    assert.match(buttonMarkup, /data-plugin="button-single"/);
    assert.match(buttonMarkup, /href="#"/);
    assert.match(buttonMarkup, /target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(buttonMarkup, /javascript:/i);

    const image = window.ImobifyCatalog.plugins['image-single'];
    const imageMarkup = image.render({ ...image.defaults, linkUrl:'https://example.com/imovel', openNewTab:true, caption:'Fachada' }, {}, 'image-test');
    assert.match(imageMarkup, /data-plugin="image-single"/);
    assert.match(imageMarkup, /<figcaption>Fachada<\/figcaption>/);
    assert.match(imageMarkup, /target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(imageMarkup, /{{\/?(?:if|unless)\b|{{\/if}}/);
  }

  // v5.1.30: presets transportam somente um componente ou um grupo explícito.
  {
    const service = window.ImobifyComponentState;
    const catalog = window.ImobifyCatalog;
    const button = catalog.createSection('button-single');
    button.props.label = 'Simular agora';
    button.settings.layoutSlot = 2;
    const componentPreset = service.createPreset({ scope:'component', sections:[button], plugins:catalog.plugins, frameworkVersion:'5.1.30' });
    assert.equal(componentPreset.schema, 'imobify-component-preset');
    assert.equal(componentPreset.components.length, 1);
    assert.equal(componentPreset.components[0].props.label, 'Simular agora');
    assert.equal(componentPreset.components[0].settings.layoutSlot, undefined, 'posição externa não deve contaminar o preset individual');
    assert.equal(service.filename(componentPreset), 'botao.saved.json');
    assert.throws(() => service.parsePreset({ sections:[] }), /não é um preset/);

    const segment = catalog.createSection('segment-layout');
    const image = catalog.createSection('image-single');
    segment.props.itemCount = 2;
    button.settings.layoutSlot = 0;
    image.settings.layoutSlot = 1;
    const groupPreset = service.createPreset({ scope:'group', sections:[segment, button, image], plugins:catalog.plugins, frameworkVersion:'5.1.30' });
    assert.equal(groupPreset.components.length, 3);
    assert.equal(groupPreset.components[0].settings.layoutSlot, undefined);
    assert.deepEqual(groupPreset.components.slice(1).map((item) => item.settings.layoutSlot), [0, 1]);
    assert.equal(service.filename(groupPreset), 'segmento.saved.json');
    const hydrated = service.hydratePreset(groupPreset, catalog.plugins, catalog.refreshSectionIdentity);
    assert.deepEqual(hydrated.map((item) => item.type), ['segment-layout', 'button-single', 'image-single']);
    assert.equal(new Set(hydrated.map((item) => item.id)).size, 3);
  }


  // v4.0: property-slider não deve mais existir como definição hardcoded duplicada em catalog.js.
  // A única fonte agora é o pacote Plugin Play carregado via plugins/registry.json.
  const catalogSource = fs.readFileSync(path.join(ROOT, 'assets/js/catalog.js'), 'utf8');
  assert.doesNotMatch(catalogSource, /'property-slider':\s*{/, 'property-slider não deve estar hardcoded em catalog.js (v4.0 removeu a duplicação)');
  assert.doesNotMatch(catalogSource, /\blocation:\s*{/, 'location deve ser um pacote Plugin Play, não uma definição hardcoded');

  // v4.0: IDs reservados (plugins core hardcoded em catalog.js) não podem ser sobrescritos por um ZIP instalado.
  assert.ok(window.ImobifyPluginLoader.reservedIds.has('hero'), 'registry.corePlugins deve alimentar reservedIds');
  assert.ok(!window.ImobifyPluginLoader.reservedIds.has('property-slider'), 'property-slider não é mais um ID reservado/hardcoded');
  assert.ok(!window.ImobifyPluginLoader.reservedIds.has('location'), 'location Plugin Play não pode permanecer reservado como core hardcoded');
  assert.ok(!window.ImobifyPluginLoader.reservedIds.has('sticky-nav'), 'Menu fixo nativo deve ter sido removido do core');
  assert.ok(!window.ImobifyPluginLoader.reservedIds.has('floating-whatsapp'), 'WhatsApp flutuante nativo deve ter sido removido do core');
  assert.equal(window.ImobifyCatalog.plugins['sticky-nav'], undefined, 'Menu fixo nativo não deve aparecer no catálogo');
  assert.equal(window.ImobifyCatalog.plugins['floating-whatsapp'], undefined, 'WhatsApp flutuante nativo não deve aparecer no catálogo');
  {
    const zip = new JSZip();
    zip.file('plugin.json', JSON.stringify({
      schemaVersion: 3, id: 'hero', name: 'Hero falso', version: '9.9.9', type: 'section',
      entry: { template: 'template.html', style: 'plugin.css', script: 'plugin.js' }, defaults: {}, fields: []
    }));
    zip.file('template.html', '<div>hijack</div>');
    zip.file('plugin.css', '.hijack{color:red}');
    zip.file('plugin.js', '(function(){})();');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    Object.defineProperty(buffer, 'size', { value: buffer.length });
    await assert.rejects(
      () => window.ImobifyPluginLoader.installZip(buffer),
      /reservado/,
      'instalar um ZIP com id="hero" deve ser bloqueado'
    );
    assert.equal(window.ImobifyCatalog.plugins['hero'].pluginSource, undefined, 'o hero core não deve ter sido substituído');
  }

  // v4.0: todos os plugins "core" (hardcoded em catalog.js) devem renderizar HTML válido com data-plugin.
  for (const [id, plugin] of Object.entries(window.ImobifyCatalog.plugins)) {
    if (plugin.kind !== 'section' || typeof plugin.render !== 'function') continue;
    if (plugin.pluginSource) continue; // plugins Plugin Play já são cobertos separadamente
    const markup = plugin.render(plugin.defaults, {}, 'teste-id');
    assert.match(markup, new RegExp(`data-plugin="${id}"`), `${id} deve renderizar com data-plugin correto`);
    assert.match(markup, /<section|<footer/, `${id} deve renderizar uma tag de seção`);
  }

  const protectedFiles = {
    'plugins/form-sender-v4/css/formulario.css': '904c671708387b03aeae77c87c9df978cc776d4a72b1cd1404bc339aa5e2155b',
    'plugins/form-sender-v4/css/notify-send.css': 'c9ee5d8fc09bb6705dd0109eb752b62852fac508ad15ab08caa3334febf2d65a',
    'plugins/form-sender-v4/js/formulario.js': 'd0a11cc5bbcf7ead2e65f9b7f373d7df1fe0cc4af3ac79f3924a5d848b921b2b',
    'plugins/form-sender-v4/js/notify-send.js': '7f6fa63da666267d41899e95bf338a08d9c02406c56d4775ff7c3b1d8165b7de'
  };
  for (const [filename, hash] of Object.entries(protectedFiles)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, filename))).digest('hex');
    assert.equal(actual, hash, `${filename} deve permanecer idêntico ao Form.v4 original`);
  }

  // v4.1.0: todo ZIP distribuído em plugin-packs deve passar pelo mesmo parser real do Plugin Play.
  const expectedPackIds = {
    'anti-ia-copy-policy-v1.0.0.zip':'anti-ia-copy-policy',
    'ar-card-popout-3d-single-v1.2.0.zip':'ar-card-popout-3d',
    'ar-card-popout-3d-stage-v1.0.0.zip':'ar-card-popout-3d-stage',
    'button-single-v1.0.0.zip':'button-single',
    'beneficios-modal-v1.1.1.zip':'beneficios-modal',
    'flip-card-pro.zip':'flip-card-pro',
    'flipcard-3d-video-single-v1.1.0.zip':'flipcard-3d-video-v1',
    'form-sender-v4.zip':'form-sender-v4',
    'agendamento-sender-v1.3.0.zip':'agendamento-sender',
    'editorial-motion-v1.0.1.zip':'editorial-motion',
    'gallery-big-four.zip':'gallery-big-four',
    'hero360-tour-v1.1.2.zip':'hero360-tour',
    'hero360-tour-v1.1.3.zip':'hero360-tour',
    'hero360-tour-v1.2.1.zip':'hero360-tour',
    'parallax360-tour-v1.0.2.zip':'parallax360-tour',
    'location.zip':'location',
    'plugin-starter.zip':'meu-componente',
    'property-slider.zip':'property-slider',
    'professional-branding-pro-v1.2.0.zip':'professional-branding-pro',
    'parallax-v2.10.1.zip':'parallax',
    'possibility-path-pro-v1.0.0.zip':'possibility-path-pro',
    'magazine-text-pro-v1.3.1.zip':'magazine-text-pro',
    'whatsapp-flutuante-pro-v1.1.0.zip':'whatsapp-flutuante-pro',
    'section-layout-pro-v1.0.1.zip':'section-layout-pro',
    'spacer-divider-pro-v1.0.0.zip':'spacer-divider-pro',
    'offer-price-pro-v1.0.0.zip':'offer-price-pro',
    'timeline-process-pro-v1.0.0.zip':'timeline-process-pro',
    'tour360-pro-v3.2.1.zip':'tour360-pro',
    'hotspot-plant-pro-v1.0.0.zip':'hotspot-plant-pro',
    'image-single-v1.0.0.zip':'image-single',
    'financing-simulator-pro-v1.0.0.zip':'financing-simulator-pro',
    'tag-installer-pro-v1.0.0.zip':'tag-installer-pro',
    'floating-container-pro-v1.3.0.zip':'floating-container-pro',
    'segment-layout-v1.1.0.zip':'segment-layout',
    'smart-plant-v1.4.2.zip':'smart-plant',
    'smart-plant-v1.4.3.zip':'smart-plant',
    'smart-plant-v1.4.4.zip':'smart-plant',
    'hero360-tour-v1.2.2.zip':'hero360-tour',
    'hero360-tour-v1.2.3.zip':'hero360-tour',
    'hero360-tour-v1.2.5.zip':'hero360-tour',
    'hero360-tour-v1.2.6.zip':'hero360-tour',
    'hero360-tour-v1.2.7.zip':'hero360-tour',
    // Pacotes legados preservados para instalação e reversão (não são o manifesto ativo).
    'scheduled-popup-pro-v1.2.1.zip':'scheduled-popup-pro',
    'scheduled-popup-pro-v1.3.0.zip':'scheduled-popup-pro',
    'scheduled-popup-pro-v1.3.1.zip':'scheduled-popup-pro',
    'scheduled-popup-pro-v1.3.2.zip':'scheduled-popup-pro',
    'scheduled-popup-pro-v1.3.3.zip':'scheduled-popup-pro',
    'scheduled-popup-pro-v1.3.4.zip':'scheduled-popup-pro',
    'tour360-pro-v3.2.3.zip':'tour360-pro',
    'tour360-pro-v3.2.4.zip':'tour360-pro',
    'only-text-context-v1.2.1.zip':'only-text-context',
    'youtube-v1.0.1.zip':'youtube',
  };
  const packFiles = fs.readdirSync(path.join(ROOT, 'plugin-packs')).filter((name) => name.endsWith('.zip')).sort();
  assert.deepEqual(packFiles, Object.keys(expectedPackIds).sort(), 'a lista de pacotes mudou: atualize a cobertura deste teste conscientemente');
  for (const filename of packFiles) {
    const expectedId = expectedPackIds[filename];
    const buffer = fs.readFileSync(path.join(ROOT, 'plugin-packs', filename));
    Object.defineProperty(buffer, 'size', { value: buffer.length });
    const parsed = await window.ImobifyPluginLoader.packageFromZip(buffer);
    assert.equal(parsed.id, expectedId, `${filename} deve ter id esperado`);
    assert.ok(parsed.manifest.version, `${filename} deve declarar version`);
    if (expectedId === 'flip-card-pro') assert.equal(parsed.manifest.composition.cardinality, 'single');
    if (expectedId === 'property-slider') assert.match(parsed.manifest.defaults.image1, /^data:image\/jpeg;base64,/);
    if (expectedId === 'parallax') assert.match(parsed.manifest.defaults.poster, /^data:image\/jpeg;base64,/);
    if (expectedId === 'tour360-pro') {
      assert.equal(parsed.manifest.editor?.mode, 'modal');
      assert.ok(parsed.editor?.html?.includes('Tour 360 Studio'), 'Tour360 deve carregar HTML do editor no pacote instalado');
      assert.ok(parsed.editor?.css?.includes('.app-shell'), 'Tour360 deve carregar CSS do editor no pacote instalado');
      assert.ok(parsed.editor?.js?.includes('window.ImobifyPluginEditor'), 'Tour360 deve carregar contrato do editor modal');
    }
  }

  const whatsappManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/whatsapp-flutuante-pro/plugin.json'), 'utf8'));
  assert.equal(whatsappManifest.version, '1.1.0');
  assert.equal(whatsappManifest.fields.find((field) => field.key === 'hoverImage')?.type, 'image', 'WhatsApp Pro deve aceitar URL ou mídia local/Base64 no hover');
  const whatsappTemplate = fs.readFileSync(path.join(ROOT, 'plugins/whatsapp-flutuante-pro/template.html'), 'utf8');
  assert.match(whatsappTemplate, /data-hover-image="{{hoverImage}}"/);
  assert.match(whatsappTemplate, /iwfp-hover-image/);

  const flipBuffer = fs.readFileSync(path.join(ROOT, 'plugin-packs/flip-card-pro.zip'));
  Object.defineProperty(flipBuffer, 'size', { value: flipBuffer.length });
  await window.ImobifyPluginLoader.installZip(flipBuffer);
  assert.equal(window.ImobifyCatalog.plugins['flip-card-pro'].pluginSource, 'installed');
  await window.ImobifyPluginLoader.uninstall('flip-card-pro');
  assert.equal(window.ImobifyCatalog.plugins['flip-card-pro'].pluginSource, 'bundled');

  const starterBuffer = fs.readFileSync(path.join(ROOT, 'plugin-packs/plugin-starter.zip'));
  Object.defineProperty(starterBuffer, 'size', { value: starterBuffer.length });
  const installed = await window.ImobifyPluginLoader.installZip(starterBuffer);
  assert.equal(installed.name, 'Meu componente');
  assert.equal(window.ImobifyCatalog.plugins['meu-componente'].pluginSource, 'installed');

  loadScript('assets/js/renderer.js');
  loadScript('assets/js/compiler.js');

  // v5.0.1.29: Rodapé profissional com canais sociais editáveis e extensíveis.
  {
    const footerCatalog = window.ImobifyCatalog;
    const footerRenderer = window.ImobifyRenderer;
    const footerPlugin = footerCatalog.plugins.footer;
    const footerManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/footer/plugin.json'), 'utf8'));
    assert.equal(footerManifest.version, '1.1.2');
    assert.equal(footerPlugin.manifest.version, '1.1.2');

    const expectedSocialUrls = {
      facebookUrl: 'https://www.facebook.com/roberto.fettuccia',
      whatsappUrl: 'https://wa.me/?phone=5551998111078',
      instagramUrl: 'https://www.instagram.com/roberto.fettuccia',
      tiktokUrl: 'https://www.tiktok.com/@roberto.fettuccia7',
      youtubeUrl: 'https://www.youtube.com/@Corretor-RobertoFettuccia',
      googleBusinessUrl: 'https://g.page/r/CSVAh5ZZppPREAE/review',
      linkedinUrl: 'https://www.linkedin.com/in/roberto-fettuccia/'
    };
    for (const [key, url] of Object.entries(expectedSocialUrls)) {
      assert.equal(footerPlugin.defaults[key], url, `${key} deve vir pré-configurado`);
      assert.equal(footerPlugin.fields.find((item) => item.key === key)?.type, 'url', `${key} deve ser editável como URL`);
    }
    assert.equal(footerPlugin.defaults.socialHeading, 'Você nos encontra também em nossos canais.');
    assert.equal(footerPlugin.fields.find((item) => item.key === 'additionalSocials')?.type, 'textarea');

    const footerState = footerCatalog.defaultState();
    footerState.behaviorPlugins = [];
    const footerSection = footerCatalog.createSection('footer');
    footerState.sections = [footerSection];
    const footerMarkup = footerRenderer.bodyMarkup(footerState);
    assert.match(footerMarkup, /class="footer-socials"/);
    assert.match(footerMarkup, /Você nos encontra também em nossos canais\./);
    assert.equal((footerMarkup.match(/class="footer-social-link"/g) || []).length, 7, 'rodapé padrão deve renderizar sete canais');
    assert.match(footerMarkup, /fa-brands fa-facebook-f/);
    assert.match(footerMarkup, /fa-brands fa-whatsapp/);
    assert.match(footerMarkup, /fa-brands fa-instagram/);
    assert.match(footerMarkup, /fa-brands fa-tiktok/);
    assert.match(footerMarkup, /fa-brands fa-youtube/);
    assert.match(footerMarkup, /fa-brands fa-google/);
    assert.match(footerMarkup, /fa-brands fa-linkedin-in/);
    assert.match(footerMarkup, /target="_blank" rel="noopener noreferrer"/);
    assert.match(footerMarkup, /aria-label="Google Meu Negócio"/);
    assert.match(footerRenderer.head(footerState), /font-awesome\/6\.5\.2\/css\/all\.min\.css/);

    footerSection.props.additionalSocials = [
      'Pinterest | https://cdn.example.com/pinterest.svg | https://www.pinterest.com/roberto',
      'Canal sem ícone | javascript:alert(1) | https://example.com/perfil',
      'Canal inválido | https://cdn.example.com/invalido.svg | javascript:alert(1)'
    ].join('\n');
    const extendedMarkup = footerRenderer.bodyMarkup(footerState);
    assert.equal((extendedMarkup.match(/class="footer-social-link"/g) || []).length, 9, 'duas redes adicionais válidas devem ser renderizadas');
    assert.match(extendedMarkup, /src="https:\/\/cdn\.example\.com\/pinterest\.svg"/);
    assert.match(extendedMarkup, /href="https:\/\/www\.pinterest\.com\/roberto"/);
    assert.match(extendedMarkup, /href="https:\/\/example\.com\/perfil"/);
    assert.match(extendedMarkup, /fa-solid fa-link/);
    assert.doesNotMatch(extendedMarkup, /javascript:/i, 'protocolos executáveis devem ser descartados');

    const legacyMarkup = footerPlugin.render({
      brand:'Marca antiga', role:'Atendimento', license:'CRECI 1', phone:'(51) 0000-0000', email:'contato@example.com', disclaimer:'Aviso antigo'
    }, {}, 'footer-legado');
    assert.doesNotMatch(legacyMarkup, /footer-socials/, 'rodapés salvos antes da versão 1.1.0 devem continuar válidos sem canais');

    const footerCss = fs.readFileSync(path.join(ROOT, 'plugins/footer/plugin.css'), 'utf8');
    const footerJs = fs.readFileSync(path.join(ROOT, 'plugins/footer/plugin.js'), 'utf8');
    assert.match(footerCss, /footer-social-link:focus-visible/, 'links sociais precisam de foco visível');
    assert.match(footerCss, /prefers-reduced-motion:reduce/, 'animações devem respeitar redução de movimento');
    assert.match(footerJs, /fa-solid fa-link/, 'ícones remotos precisam de fallback');

    const footerCompiled = await window.ImobifyCompiler.compile(footerState);
    const footerZip = await JSZip.loadAsync(await footerCompiled.blob.arrayBuffer());
    const footerHtml = await footerZip.file('index.html').async('text');
    const footerInventory = JSON.parse(await footerZip.file('content/plugins-enabled.json').async('text'));
    assert.match(footerHtml, /data-plugin="footer"/);
    assert.match(footerHtml, /font-awesome\/6\.5\.2\/css\/all\.min\.css/);
    assert.equal(footerInventory.find((item) => item.id === 'footer')?.version, '1.1.2');
  }

  // v5.0.1.25: schema imobiliário não deve disparar Product snippets inválidos.
  {
    const schemaState = window.ImobifyCatalog.defaultState();
    const structured = window.ImobifyRenderer.schema(schemaState);
    const graph = structured['@graph'];
    const listing = graph.find((item) => item['@type'] === 'RealEstateListing');
    const propertyPlace = graph.find((item) => item['@type'] === 'Place');
    const agent = graph.find((item) => Array.isArray(item['@type']) && item['@type'].includes('RealEstateAgent'));
    assert.ok(listing, 'schema deve representar a página como RealEstateListing');
    assert.ok(propertyPlace, 'schema deve representar o imóvel com tipo Schema.org configurável e seguro');
    assert.equal(graph.some((item) => item['@type'] === 'Product'), false, 'landing imobiliária não deve emitir Product automaticamente');
    assert.equal(listing.offers.price, '389900', 'preço numérico simples deve permanecer correto');
    schemaState.seo.propertySchemaType = 'ApartmentComplex';
    assert.ok(window.ImobifyRenderer.schema(schemaState)['@graph'].some((item) => item['@type'] === 'ApartmentComplex'), 'tipo do imóvel deve ser configurável entre tipos Schema.org permitidos');
    schemaState.seo.propertySchemaType = 'Product';
    assert.ok(window.ImobifyRenderer.schema(schemaState)['@graph'].some((item) => item['@type'] === 'Place'), 'Product não deve ser aceito como tipo imobiliário pelo editor');
    assert.equal(agent.address, undefined, 'endereço do imóvel não pode ser atribuído ao corretor/imobiliária');

    schemaState.seo.price = 'R$ 389.900,00';
    assert.equal(window.ImobifyRenderer.schema(schemaState)['@graph'].find((item) => item['@type'] === 'RealEstateListing').offers.price, '389900.00', 'moeda brasileira deve ser normalizada sem reduzir milhares');
    schemaState.seo.price = 'R$ 389.900';
    assert.equal(window.ImobifyRenderer.schema(schemaState)['@graph'].find((item) => item['@type'] === 'RealEstateListing').offers.price, '389900', 'separador de milhar brasileiro não pode virar decimal');
    schemaState.seo.price = 'Sob consulta';
    assert.equal(window.ImobifyRenderer.schema(schemaState)['@graph'].find((item) => item['@type'] === 'RealEstateListing').offers, undefined, 'preço não numérico deve omitir Offer em vez de gerar marcação inválida');
  }

  // v4.1.0: perfil visual global deve gerar tokens e carregar a ponte depois dos plugins.
  {
    const designState = window.ImobifyCatalog.defaultState();
    Object.assign(designState.brand, { contrastMode:'manual', headingColor:'#123456', bodyColor:'#234567', actionButtonBackground:'#ff0066', actionButtonText:'#ffffff', h1Size:120, containerWidth:1320, sectionSpace:160, contentGap:64, componentPadding:42 });
    const vars = window.ImobifyRenderer.variables(designState);
    assert.match(vars, /--heading-color:/);
    assert.match(vars, /--body-color:/);
    assert.match(vars, /--action-button-bg:#ff0066/);
    assert.match(vars, /--action-button-text:#ffffff/);
    assert.match(vars, /--h1-max:/);
    assert.match(vars, /--content-gap:/);
    assert.match(vars, /--component-padding:42px/);
    assert.match(vars, /--heading-color:#123456/);
    assert.match(vars, /--h1-max:120px/);
    assert.match(vars, /--container:1320px/);
    assert.match(vars, /--section-space-set:160px;--section-space:160px/);
    assert.match(vars, /@media\(max-width:720px\)\{:root\{--section-space:clamp\(32px,calc\(160px \* \.55\),110px\)\}\}/);
    const protectedState = window.ImobifyCatalog.defaultState();
    Object.assign(protectedState.brand, { contrastMode:'aa', actionButtonBackground:'#ff0066', actionButtonText:'#ffffff' });
    const protectedVars = window.ImobifyRenderer.variables(protectedState);
    assert.doesNotMatch(protectedVars, /--action-button-text:#ffffff/, 'modo AA deve corrigir CTA branco sem contraste suficiente');
    assert.match(protectedVars, /--primary-on-surface:/, 'modo AA deve gerar cor funcional para primary usada como texto');
    assert.match(protectedVars, /--accent-contrast:/, 'modo AA deve gerar foreground para fundos accent');
    const designSources = await window.ImobifyRenderer.loadSources(designState);
    assert.match(designSources.css, /Imobify Design System 5\.0\.0/);
    assert.ok(designSources.css.lastIndexOf('Imobify Design System 5.0.0') > designSources.css.lastIndexOf('.hero-shade{'), 'design-system deve ser carregado depois dos plugins');
    assert.match(designSources.css, /plugin-play-section:not\(\[data-plugin="scheduled-popup-pro"\]\)/, 'Plugin Play comum deve herdar o ritmo vertical do projeto');
    assert.match(designSources.css, /\.opp-card,.fsp-form,.fsp-result,.hpp-stage,.hpp-panel,.spp-dialog,.svp-hero/, 'superfícies estruturais devem herdar o arredondamento global');
    assert.match(designSources.css, /\[data-plugin="location"\]>\.location-section,\[data-plugin="form-sender-v4"\]>\.formsenderV4_section\{padding-block:0\}/, 'wrappers legados não podem duplicar espaçamento');
  }

  const catalog = window.ImobifyCatalog;
  const state = catalog.defaultState();
  state.brand.actionButtonBackground = '#112233';
  state.brand.actionButtonText = '#fefefe';
  state.sections = [
    catalog.createSection('flip-card-pro'),
    catalog.createSection('gallery-big-four'),
    catalog.createSection('form-sender-v4'),
    catalog.createSection('property-slider'),
    catalog.createSection('location'),
    catalog.createSection('parallax')
  ];
  const scrolly = state.sections.find((section) => section.type === 'parallax');
  scrolly.props.videoSrc = 'data:video/mp4;base64,AAECAwQFBgc=';
  scrolly.props.audioSrc = 'data:audio/mpeg;base64,AAECAwQFBgc=';
  state.behaviorPlugins = [];

  const markup = window.ImobifyRenderer.bodyMarkup(state);
  assert.match(markup, /data-plugin="flip-card-pro"/);
  assert.match(markup, /data-plugin="gallery-big-four"/);
  assert.match(markup, /data-plugin="form-sender-v4"/);
  assert.match(markup, /data-plugin="property-slider"/);
  assert.match(markup, /data-plugin="location"/);
  assert.match(markup, /<strong>2 min<\/strong><span>ParkShopping Canoas<\/span>/, 'location deve renderizar tempo | ponto no HTML estático');
  assert.match(markup, /data-plugin="parallax"/);
  const editorMarkup = window.ImobifyRenderer.bodyMarkup(state, { editor: true });
  assert.match(editorMarkup, /imobify-block-toolbar/);
  state.sections[0].settings.visible = false;
  assert.doesNotMatch(window.ImobifyRenderer.bodyMarkup(state), /data-plugin="flip-card-pro"/);
  const publishedSources = await window.ImobifyRenderer.loadSources(state);
  assert.doesNotMatch(publishedSources.css, /flipcard\.4\.0\.css - Efeito 3D/, 'plugin de seção oculta não deve entrar no CSS publicado');
  const editorSources = await window.ImobifyRenderer.loadSources(state, { includeHidden:true });
  assert.match(editorSources.css, /flipcard\.4\.0\.css - Efeito 3D/, 'o editor ainda precisa do CSS da seção oculta');
  state.sections[0].settings.visible = true;

  // v5.0.1: qualquer plugin de seção pode ser ocultado apenas no mobile.
  state.sections[0].settings.hideMobile = true;
  const mobileHiddenMarkup = window.ImobifyRenderer.bodyMarkup(state);
  assert.match(mobileHiddenMarkup, /data-plugin="flip-card-pro"[^>]*data-hide-mobile="true"|data-hide-mobile="true"[^>]*data-plugin="flip-card-pro"/, 'seção deve carregar marcador responsivo no HTML publicado');
  assert.match(fs.readFileSync(path.join(ROOT, 'core/base.css'), 'utf8'), /\[data-hide-mobile="true"\]\{display:none!important\}/, 'núcleo deve ocultar o bloco no breakpoint mobile');
  const mobileEditorMarkup = window.ImobifyRenderer.bodyMarkup(state, { editor:true });
  assert.match(mobileEditorMarkup, /is-mobile-hidden/, 'editor deve manter marcador para seção oculta no mobile');
  state.sections[0].settings.hideMobile = false;

  // v5.0.1.18: qualquer plugin de seção também pode ser ocultado apenas no desktop.
  state.sections[0].settings.hideDesktop = true;
  const desktopHiddenMarkup = window.ImobifyRenderer.bodyMarkup(state);
  assert.match(desktopHiddenMarkup, /data-plugin="flip-card-pro"[^>]*data-hide-desktop="true"|data-hide-desktop="true"[^>]*data-plugin="flip-card-pro"/, 'seção deve carregar marcador desktop no HTML publicado');
  assert.match(fs.readFileSync(path.join(ROOT, 'core/base.css'), 'utf8'), /@media\(min-width:721px\)\{\[data-hide-desktop="true"\]\{display:none!important\}\}/, 'núcleo deve ocultar o bloco acima do breakpoint mobile');
  const desktopEditorMarkup = window.ImobifyRenderer.bodyMarkup(state, { editor:true });
  assert.match(desktopEditorMarkup, /is-desktop-hidden/, 'editor deve manter marcador para seção oculta no desktop');
  state.sections[0].settings.hideDesktop = false;

  // Compatibilidade: ambos os controles podem coexistir e são serializados no projeto.
  state.sections[0].settings.hideMobile = true;
  state.sections[0].settings.hideDesktop = true;
  const bothHiddenMarkup = window.ImobifyRenderer.bodyMarkup(state);
  assert.match(bothHiddenMarkup, /data-hide-mobile="true"/);
  assert.match(bothHiddenMarkup, /data-hide-desktop="true"/);
  state.sections[0].settings.hideMobile = false;
  state.sections[0].settings.hideDesktop = false;


  // v5.0.1.11: toda seção pode receber âncora global sem depender do plugin.
  state.sections[0].settings.anchorId = 'condicoes especiais';
  const anchoredMarkup = window.ImobifyRenderer.bodyMarkup(state);
  assert.match(anchoredMarkup, /data-plugin="flip-card-pro"[^>]*><span id="condicoes-especiais" class="imobify-anchor-start" data-imobify-anchor-start/, 'renderer deve inserir âncora normalizada no INÍCIO da seção');
  state.sections[0].settings.anchorId = '';

  // Layout vazio é permitido para que um bloco possa ser arrastado para fora sem capturar a próxima seção.
  const emptyLayoutState = catalog.defaultState();
  const emptyLayout = catalog.createSection('section-layout-pro');
  emptyLayout.props.itemCount = 0;
  emptyLayoutState.sections = [emptyLayout, catalog.createSection('footer')];
  emptyLayoutState.behaviorPlugins = [];
  const emptyLayoutMarkup = window.ImobifyRenderer.bodyMarkup(emptyLayoutState);
  assert.ok(emptyLayoutMarkup.indexOf('data-plugin="footer"') > emptyLayoutMarkup.indexOf('data-plugin="section-layout-pro"'), 'footer deve permanecer fora de layout com itemCount zero');

  const sources = await window.ImobifyRenderer.loadSources(state);
  assert.match(sources.css, /flipcard\.4\.0\.css - Efeito 3D/);
  assert.match(sources.css, /pp-big-four/);
  assert.match(sources.css, /formsenderCSS_form/);
  assert.match(sources.css, /ns-notification-container/);
  assert.match(sources.css, /formsenderV4_section/);
  assert.match(sources.css, /property-slider-track/);
  assert.match(sources.js, /window\.formsenderJS\.Plugin/);
  assert.match(sources.js, /notify_Send_notification/);
  assert.match(sources.js, /formsenderV4_mount/);
  assert.match(sources.js, /location-map-frame/);
  assert.match(sources.js, /svp-video/);

  const result = await window.ImobifyCompiler.compile(state);
  const output = await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.ok(output.file('index.html'));
  assert.ok(output.file('assets/css/site.css'));
  const compiledCss = await output.file('assets/css/site.css').async('text');
  assert.match(compiledCss, /--action-button-bg:#112233/);
  assert.match(compiledCss, /--action-button-text:#fefefe/);
  assert.ok(output.file('assets/js/site.js'));
  assert.ok(output.file('content/plugins-enabled.json'));
  assert.ok(output.file('_headers'));
  assert.ok(output.file('security/headers.conf'));
  assert.ok(output.file('robots.txt'), 'v5 deve gerar robots.txt');
  assert.ok(output.file('sitemap.xml'), 'v5 deve gerar sitemap.xml quando há canonical');
  assert.ok(output.file('content/seo-readiness.json'), 'v5 deve registrar readiness estrutural');
  assert.ok(output.file('SEO-READINESS.txt'), 'v5 deve entregar diagnóstico de prontidão');
  assert.ok(Object.keys(output.files).some((name) => name.startsWith('assets/images/')));
  assert.ok(Object.keys(output.files).some((name) => name.startsWith('assets/video/')), 'vídeo local/data URL deve ser incorporado');
  assert.ok(Object.keys(output.files).some((name) => name.startsWith('assets/audio/')), 'áudio local/data URL deve ser incorporado');
  const packagedState = JSON.parse(await output.file('content/project.json').async('text'));
  assert.equal(packagedState.sections[0].settings.hideDesktop, false, 'hideDesktop deve ser serializado/normalizado no projeto compilado');
  const packagedScrolly = packagedState.sections.find((section) => section.type === 'parallax');
  assert.match(packagedScrolly.props.videoSrc, /^assets\/video\//);
  assert.match(packagedScrolly.props.audioSrc, /^assets\/audio\//);
  assert.match(packagedScrolly.props.poster, /^assets\/images\//);

  // v4.1.0: a CSP em meta usa apenas diretivas suportadas por meta; frame-ancestors vai como header real.
  const compiledHtml = await output.file('index.html').async('text');
  assert.match(compiledHtml, /http-equiv="Content-Security-Policy"/, 'HTML compilado deve incluir CSP');
  assert.match(compiledHtml, /object-src 'none'/);
  assert.doesNotMatch(compiledHtml, /frame-ancestors/, 'frame-ancestors não funciona em CSP via meta');
  assert.match(compiledHtml, /<main id="conteudo-principal" role="main">/, 'v5 deve estruturar o conteúdo principal semanticamente');
  assert.match(compiledHtml, /"@graph"/, 'dados estruturados v5 devem usar @graph');
  assert.match(compiledHtml, /RealEstateAgent/, 'dados estruturados devem identificar o agente imobiliário');
  const robots = await output.file('robots.txt').async('text');
  assert.match(robots, /User-agent: OAI-SearchBot[\s\S]*Allow: \//, 'busca ChatGPT deve ser permitida por padrão');
  assert.match(robots, /User-agent: GPTBot[\s\S]*Disallow: \//, 'treinamento deve poder ser bloqueado separadamente');
  const sitemap = await output.file('sitemap.xml').async('text');
  assert.match(sitemap, /<loc>https:\/\/residencialaurora\.com\.br\/<\/loc>/);
  assert.match(sitemap, /xmlns:image=/, 'sitemap deve suportar descoberta de imagens');
  assert.doesNotMatch(sitemap, /<changefreq>/, 'Google ignora changefreq; não incluir dados sem utilidade');
  assert.doesNotMatch(sitemap, /<priority>/, 'Google ignora priority; não incluir dados sem utilidade');
  assert.match(robots, /Sitemap: https:\/\/residencialaurora\.com\.br\/sitemap\.xml/, 'robots deve apontar para o sitemap compilado');
  const invalidSitemapState = catalog.defaultState();
  invalidSitemapState.seo.canonical = '';
  await assert.rejects(() => window.ImobifyCompiler.compile(invalidSitemapState), /Sitemap XML automático/, 'sitemap habilitado não pode compilar com URL pública inválida');
  invalidSitemapState.seo.sitemapEnabled = 'no';
  const noSitemapResult = await window.ImobifyCompiler.compile(invalidSitemapState);
  const noSitemapZip = await JSZip.loadAsync(await noSitemapResult.blob.arrayBuffer());
  assert.equal(noSitemapZip.file('sitemap.xml'), null, 'sitemap desativado não deve ser incluído no ZIP');

  const readiness = JSON.parse(await output.file('content/seo-readiness.json').async('text'));
  assert.ok(readiness.average >= 7, 'projetos sem hero ainda devem receber auditoria estrutural coerente');
  const defaultV5 = catalog.defaultState();
  defaultV5.behaviorPlugins = [];
  const defaultResult = await window.ImobifyCompiler.compile(defaultV5);
  const defaultOutput = await JSZip.loadAsync(await defaultResult.blob.arrayBuffer());
  const defaultHtml = await defaultOutput.file('index.html').async('text');
  assert.match(defaultHtml, /rel="preload" as="image"/, 'v5 deve priorizar a imagem LCP do hero');
  assert.match(defaultHtml, /fetchpriority="high"/, 'hero deve marcar a imagem LCP com prioridade alta');
  assert.match(defaultHtml, /class="hero-media"/, 'hero deve usar imagem HTML indexável em vez de background CSS');
  const defaultReadiness = JSON.parse(await defaultOutput.file('content/seo-readiness.json').async('text'));
  assert.equal(defaultReadiness.average, 9.2, 'baseline estrutural padrão da v5 deve permanecer em 9.2/10');

  const headers = await output.file('_headers').async('text');
  assert.match(headers, /frame-ancestors 'self'/);

  // v4.1.0: select aceita tanto string quanto {label,value}.
  assert.deepEqual(window.ImobifyUtil.normalizeSelectOptions(['auto', { label:'Normal', value:'forward' }]), [
    { label:'auto', value:'auto' }, { label:'Normal', value:'forward' }
  ]);

  // v4.1.0: versionamento e isolamento das prévias.
  assert.equal(catalog.defaultState().version, '6.0.83');
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, 'project.json'), 'utf8')).version, '6.0.83');
  const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(indexSource, /id="previewFrame"[^>]+sandbox="allow-scripts allow-forms"/);
  assert.match(indexSource, /id="fullPreviewFrame"[^>]+sandbox="allow-scripts allow-forms allow-popups"/);
  const appSource = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
  const parallaxRuntimeSource = fs.readFileSync(path.join(ROOT, 'plugins/parallax/plugin.js'), 'utf8');
  const componentStateSource = fs.readFileSync(path.join(ROOT, 'assets/js/component-state.js'), 'utf8');
  assert.match(appSource, /data-parallax-key-marker/, 'Parallax deve editar uma chave selecionada por vez');
  assert.match(appSource, /data-parallax-release-marker/, 'Parallax deve ter marcador terminal independente para liberar o scroll');
  assert.match(appSource, /Deseja criar um ponto-chave/, 'duplo clique na timeline deve confirmar a criação da chave');
  assert.match(appSource, /parallax-metadata/, 'Studio deve receber a duração real do vídeo');
  assert.doesNotMatch(appSource, /data-parallax-add-pause/, 'pausas adicionais não devem competir com pontos-chave no editor 2.7');
  assert.match(parallaxRuntimeSource, /postMessage\(\{ type:"parallax-metadata"/, 'runtime deve sincronizar metadata mesmo em sandbox');
  assert.equal(catalog.plugins.parallax.fields.find((field) => field.key === 'videoSrc')?.type, 'video', 'Parallax deve usar o seletor nativo de vídeo do Studio');
  assert.match(appSource, /section\.type === 'parallax' && key === 'videoSrc'/, 'troca de vídeo deve invalidar duração anterior');
  assert.match(parallaxRuntimeSource, /durationchange/, 'runtime deve retentar duração de WebM exposta tardiamente');
  assert.match(parallaxRuntimeSource, /raw\.githubusercontent\.com/, 'runtime deve normalizar links raw/blob do GitHub');
  assert.match(parallaxRuntimeSource, /video\/webm/, 'runtime deve informar MIME explícito para WebM');
  const compilerSourceParallax = fs.readFileSync(path.join(ROOT, 'assets/js/compiler.js'), 'utf8');
  assert.match(compilerSourceParallax, /section\.type === 'parallax' && key === 'videoSrc'/, 'exportador deve tratar vídeo remoto do Parallax de forma especial');
  assert.match(compilerSourceParallax, /raw\.githubusercontent\.com/, 'exportador deve normalizar URL GitHub raw/blob');
  assert.match(compilerSourceParallax, /allowRemote/, 'exportador deve poder incorporar vídeo remoto do Parallax');
  assert.match(compilerSourceParallax, /assets\/plugins\/parallax\/plugin\.js/, 'exportação deve incluir runtime isolado do Parallax como fallback crítico');
  assert.match(compilerSourceParallax, /validateParallaxExport/, 'exportação deve validar o pacote crítico do Parallax antes de gerar o ZIP');
  const revealCss = fs.readFileSync(path.join(ROOT, 'plugins/reveal/plugin.css'), 'utf8');
  const revealJs = fs.readFileSync(path.join(ROOT, 'plugins/reveal/plugin.js'), 'utf8');
  const baseCss = fs.readFileSync(path.join(ROOT, 'core/base.css'), 'utf8');
  assert.match(revealCss, /:not\(\[data-plugin="parallax"\]\)/, 'Reveal global deve excluir o Parallax');
  assert.match(revealJs, /function excluded\(el\)/, 'Reveal deve excluir componentes que gerenciam seu próprio scroll');
  assert.match(revealJs, /el\.matches\('\[data-plugin="parallax"\]/, 'Reveal deve excluir Parallax explicitamente');
  assert.match(baseCss, /:not\(\[data-plugin="parallax"\]\).*content-visibility:auto/, 'content-visibility não deve ser aplicado ao Parallax sticky');
  assert.match(parallaxRuntimeSource, /pointDecelMs/, 'runtime deve permitir desaceleração específica da chave');
  assert.match(parallaxRuntimeSource, /handoffPastStickyBoundary/, 'runtime deve preservar o handoff para a próxima section');
  assert.doesNotMatch(parallaxRuntimeSource, /installInspectorBridge/, 'editor legado injetado pela prévia deve permanecer removido');
  assert.doesNotMatch(indexSource, /collapseInspector/, 'o botão sem função de recolher o inspetor deve ser removido');
  assert.doesNotMatch(appSource, /collapseInspector/);
  assert.match(indexSource, /Studio 6\.0\.83/, 'a versão atual deve permanecer visível no editor');
  assert.match(indexSource, /id="saveBtn"[\s\S]*?<span>Projeto<\/span>/, 'o botão principal deve se chamar Projeto');
  assert.match(indexSource, /data-project-file-action="load"/, 'o menu Projeto deve oferecer Carregar');
  assert.match(indexSource, /data-project-file-action="save"/, 'o menu Projeto deve oferecer Salvar');
  assert.doesNotMatch(indexSource, /id="exportProjectBtn"|id="importProjectInput"/, 'importação/exportação duplicada deve sair da aba Projeto');
  assert.match(appSource, /showSaveFilePicker/, 'salvamento local deve usar o seletor nativo quando disponível');
  assert.match(appSource, /showOpenFilePicker/, 'carregamento local deve usar o seletor nativo quando disponível');
  assert.doesNotMatch(appSource, /imobify-studio-project-v5|indexedDB/, 'o projeto não deve persistir automaticamente no navegador');
  assert.match(indexSource, /id="inspectorStateMenuButton"/);
  assert.match(indexSource, /id="componentStateInput"/);
  assert.match(appSource, /exportComponentState/);
  assert.match(appSource, /groupForSelection/);
  assert.match(componentStateSource, /\.saved\.json/);
  assert.match(appSource, /event\.source !== previewWindow && event\.source !== fullPreviewWindow/);

  // v5.2.0: estilo local por seção herda o projeto por padrão e gera CSS escopado quando ativado.
  const localStyleState = catalog.defaultState();
  const localSection = localStyleState.sections.find((section) => section.type === 'highlights') || localStyleState.sections[0];
  assert.equal(localSection.settings.style.enabled, false, 'override local deve nascer desativado');
  localSection.settings.style = {
    ...catalog.sectionStyleDefaults(),
    enabled:true,
    backgroundMode:'dark',
    headingFont:'Playfair Display',
    bodyFont:'Inter',
    titleEffect:'cinematic',
    paddingMode:'custom',
    paddingTop:80,
    paddingBottom:120
  };
  const localCss = window.ImobifyRenderer.sectionOverrides(localStyleState);
  assert.match(localCss, new RegExp(`\\[data-section-id=\"${localSection.id}\"\\]`));
  assert.match(localCss, /background:var\(--dark\)!important/);
  assert.match(localCss, /--component-title-color:var\(--inverse-heading-color\)/, 'contraste automático deve reagir ao fundo escuro');
  assert.match(localCss, /--heading:'Playfair Display'/);
  assert.match(localCss, /padding-top:80px!important/);
  assert.match(localCss, /#__imobify_local_style_priority_never__/, 'override local deve usar escopo autoritativo contra CSS interno do plugin');
  localSection.settings.style.primaryMode = 'custom';
  localSection.settings.style.primaryColor = '#123456';
  localSection.settings.style.actionBackgroundMode = 'auto';
  localSection.settings.style.actionTextMode = 'auto';
  const localActionCss = window.ImobifyRenderer.sectionOverrides(localStyleState);
  assert.match(localActionCss, /--action-button-bg:#123456/, 'primária local deve alimentar CTAs no modo automático');
  assert.match(localActionCss, /--action-button-fill:#123456/, 'fill real do Button Kit deve receber a cor local');
  assert.match(localActionCss, /background:#123456!important;background-image:none!important/, 'CTA deve receber override visual autoritativo');
  assert.match(appSource, /data-section-style-panel-toggle/, 'painel local deve permitir expandir e recolher');
  assert.match(appSource, /current\.panelOpen = current\.enabled === true/, 'ativar personalização deve abrir o painel automaticamente');
  const editorCssSource = fs.readFileSync(path.join(ROOT, 'assets/css/editor.css'), 'utf8');
  assert.match(editorCssSource, /section-style-controls\[hidden\]\{display:none!important\}/, 'controles desativados/recolhidos não devem ocupar espaço');
  const localMarkup = window.ImobifyRenderer.bodyMarkup(localStyleState);
  assert.match(localMarkup, new RegExp(`data-section-id=\"${localSection.id}\"`), 'root publicado precisa carregar o escopo da seção');
  assert.match(appSource, /Estilo do elemento/);
  assert.match(appSource, /data-benefit-add/, 'Benefícios + Modal deve ter painel para adicionar itens ilimitados');
  assert.match(appSource, /data-benefit-open-icon-picker/, 'Benefícios + Modal deve abrir seletor visual de ícones');
  assert.match(appSource, /benefitsIconPickerContext/, 'Benefícios + Modal deve preservar contexto do item ao escolher ícone');
  const benefitsTemplateSource = fs.readFileSync(path.join(ROOT, 'plugins/beneficios-modal/template.html'), 'utf8');
  const benefitsScriptSource = fs.readFileSync(path.join(ROOT, 'plugins/beneficios-modal/plugin.js'), 'utf8');
  assert.match(benefitsTemplateSource, /data-showcase-profile="{{showcaseProfile}}"/, 'vitrine deve receber perfil de cor');
  assert.match(benefitsTemplateSource, /data-modal-profile="{{modalProfile}}"/, 'modal deve receber perfil de cor independente');
  assert.match(benefitsTemplateSource, /data-modal-contrast="{{modalContrastMode}}"/, 'modal deve receber modo de contraste');
  assert.match(benefitsScriptSource, /function applyAutoContrast\(/, 'plugin deve recalcular contraste conforme o fundo');
  assert.match(benefitsScriptSource, /secondaryForeground\(foreground, background, 4\.7\)/, 'descrição do modal deve manter contraste confortável');
  assert.match(benefitsScriptSource, /applyProfileColor\(component, '--bmp-modal-bg'/, 'fundo manual deve poder sobrescrever a paleta do perfil');
  assert.match(benefitsScriptSource, /sameColor\(authored, defaultValue\)/, 'perfil só deve substituir a cor enquanto o atributo estiver no valor sentinela padrão');
  assert.match(benefitsScriptSource, /cor EFETIVA do modal/, 'contraste automático deve usar a cor efetiva após perfil + ajuste manual');
  assert.match(appSource, /data-property-slide-add/, 'Slider 1.1 deve ter painel para adicionar slides');
  assert.match(appSource, /data-property-slide-move/, 'Slider 1.1 deve permitir ordenar slides');
  assert.match(appSource, /data-property-slide-button-toggle/, 'Slider 1.1 deve manter CTA opcional por slide');
  const sliderTemplateSource = fs.readFileSync(path.join(ROOT, 'plugins/property-slider/template.html'), 'utf8');
  assert.match(sliderTemplateSource, /data-slides="{{slides}}"/, 'template do Slider deve receber coleção dinâmica de slides');
  assert.match(sliderTemplateSource, /data-fill-horizontal="{{fillHorizontal}}"/, 'Slider deve receber opção de preenchimento horizontal');
  assert.match(sliderTemplateSource, /data-control-shape="{{controlShape}}"/, 'Slider deve receber formato dos controles');
  assert.match(sliderTemplateSource, /data-control-position="{{controlPosition}}"/, 'Slider deve receber posição dos controles');
  const sliderCssSource = fs.readFileSync(path.join(ROOT, 'plugins/property-slider/plugin.css'), 'utf8');
  assert.match(sliderCssSource, /calc\(100% - \(var\(--slider-text-padding/, 'área segura deve descontar margem dos dois lados');
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'plugins/property-slider/plugin.js'), 'utf8'), /site-container property-slide-content/, 'conteúdo do Slider não deve depender do site-container global');
  const compilerSource = fs.readFileSync(path.join(ROOT, 'assets/js/compiler.js'), 'utf8');
  assert.match(compilerSource, /section\.type === 'property-slider'.*slides/s, 'compilador deve empacotar imagens dos slides dinâmicos');
  assert.match(appSource, /data-section-style=/);
  const localCompiled = await window.ImobifyCompiler.compile(localStyleState);
  const localCompiledZip = await JSZip.loadAsync(await localCompiled.blob.arrayBuffer());
  const localCompiledCss = await localCompiledZip.file('assets/css/site.css').async('text');
  const localCompiledHtml = await localCompiledZip.file('index.html').async('text');
  assert.match(localCompiledCss, /background:var\(--dark\)!important/, 'override local deve chegar ao CSS compilado');
  assert.match(localCompiledCss, /padding-bottom:120px!important/);
  assert.match(localCompiledHtml, /Playfair\+Display/, 'fonte usada apenas na seção local deve ser carregada no documento compilado');

  // v5.1.31: Hero Imobiliário Plus preserva o Hero clássico e adiciona Studio avançado.
  assert.ok(catalog.plugins.hero, 'Hero Imobiliário clássico deve continuar disponível');
  assert.ok(catalog.plugins['hero-plus'], 'Hero Imobiliário Plus deve estar registrado separadamente');
  assert.ok(window.ImobifyPluginLoader.reservedIds.has('hero-plus'), 'Hero Plus nativo deve usar ID reservado');
  const heroPlus = catalog.createSection('hero-plus');
  heroPlus.props.exploreText = 'Conheça o empreendimento';
  heroPlus.props.exploreLink = '#galeria';
  heroPlus.props.particlesEnabled = true;
  heroPlus.props.bgMotion = 'perspective';
  heroPlus.props.titleFont = 'Playfair Display';
  const heroPlusState = catalog.defaultState();
  heroPlusState.behaviorPlugins = [];
  heroPlusState.sections = [heroPlus];
  const heroPlusHtml = await window.ImobifyRenderer.buildInlineDocument(heroPlusState, { editor:false });
  assert.match(heroPlusHtml, /data-plugin="hero-plus"/);
  assert.match(heroPlusHtml, /Conheça o empreendimento/);
  assert.match(heroPlusHtml, /href="#galeria"/);
  assert.match(heroPlusHtml, /data-bg-motion="perspective"/);
  assert.match(heroPlusHtml, /data-particles="true"/);
  assert.match(heroPlusHtml, /Playfair\+Display|Playfair%20Display|Playfair Display/);
  const heroPlusCompiled = await window.ImobifyCompiler.compile(heroPlusState);
  const heroPlusZip = await JSZip.loadAsync(await heroPlusCompiled.blob.arrayBuffer());
  const heroPlusSiteCss = await heroPlusZip.file('assets/css/site.css').async('text');
  const heroPlusSiteJs = await heroPlusZip.file('assets/js/site.js').async('text');
  assert.match(heroPlusSiteCss, /hero-plus-section/);
  assert.match(heroPlusSiteJs, /setupParticles/);
  assert.match(indexSource, /id="heroPlusStudioDialog"/);
  assert.match(appSource, /openHeroPlusStudio/);
  assert.doesNotMatch(appSource, /imobify-studio-project-v4/, '5.11.1 não deve restaurar projeto persistido no navegador');
  assert.match(appSource, /keepEditingSectionVisible/, 'preview principal deve manter a seção selecionada como alvo de foco');
  const rendererSource = fs.readFileSync(path.join(ROOT, 'assets/js/renderer.js'), 'utf8');
  assert.match(rendererSource, /focusSelectedBlock/, 'bridge do editor deve refocar o bloco selecionado');
  assert.match(rendererSource, /ResizeObserver/, 'preview deve reagir a mudanças de altura da seção em edição');

  // v5.0.1.11: Design System guiado e estratégias específicas para produto popular/MCMV.
  assert.ok(catalog.presets.popularBlue, 'preset Casa Própria Azul deve existir');
  assert.ok(catalog.presets.whiteEssential, 'preset Branco Essencial deve existir');
  assert.equal(catalog.presets.whiteEssential.surface, '#ffffff', 'preset Branco deve usar superfície branca real');
  assert.equal(catalog.defaultState().brand.textEffect, 'auto', 'destaque óptico automático deve ser o padrão');
  assert.match(rendererSource, /--text-shadow-inverse-heading/, 'renderer deve gerar tokens de destaque para texto em fundo escuro');
  assert.match(fs.readFileSync(path.join(ROOT, 'core/design-system.css'), 'utf8'), /semantic text emphasis/, 'Design System deve aplicar destaque óptico sem depender do plugin');

  // v5.0.1.14: efeitos proporcionais de texto e materiais globais de CTA.
  {
    const effectState = catalog.defaultState();
    effectState.brand.titleOutlineWidth = 1.5;
    effectState.brand.subtitleOutlineWidth = .5;
    effectState.brand.titleShadowStyle = 'cinematic';
    effectState.brand.actionButtonEffect = 'glass';
    effectState.brand.actionButtonGlassOpacity = 42;
    const tokens = window.ImobifyRenderer.variables(effectState);
    assert.match(tokens, /--title-outline:0\.0150em/, 'borda do título deve ser proporcional ao tamanho da fonte');
    assert.match(tokens, /--subtitle-outline:0\.0050em/, 'borda do subtítulo deve ser proporcional ao tamanho da fonte');
    assert.match(tokens, /--title-shadow:/, 'renderer deve gerar sombra independente para títulos');
    assert.match(tokens, /--action-button-effect:glass/, 'renderer deve registrar o material de botão selecionado');
    assert.match(tokens, /--action-button-backdrop:blur\(/, 'efeito vidro deve gerar backdrop blur');
    const designSource = fs.readFileSync(path.join(ROOT, 'core/design-system.css'), 'utf8');
    assert.match(designSource, /proportional title\/subtitle contrast effects/, 'Design System deve aplicar os novos efeitos tipográficos');
    assert.match(designSource, /global CTA material system/, 'Design System deve aplicar materiais globais aos CTAs');
    assert.match(indexSource, /data-brand="titleOutlineWidth"/, 'editor deve expor espessura da borda do título');
    assert.match(indexSource, /data-brand="subtitleShadowStyle"/, 'editor deve expor sombra independente do subtítulo');
    assert.match(indexSource, /data-brand="actionButtonEffect"/, 'editor deve expor o efeito do botão');
    assert.match(indexSource, /id="designEffectPreview"/, 'editor deve exibir prévia dos efeitos');
    const runtimeSource = fs.readFileSync(path.join(ROOT, 'core/runtime.js'), 'utf8');
    assert.match(runtimeSource, /applyDesignSemantics/, 'runtime deve identificar títulos, subtítulos e CTAs reais do projeto');
    assert.match(runtimeSource, /imobify-design-title/, 'runtime deve marcar títulos para aplicação autoritativa');
    assert.match(runtimeSource, /imobify-design-cta/, 'runtime deve marcar CTAs para aplicação autoritativa');
    assert.match(designSource, /authoritative project application layer/, 'Design System deve ter camada final autoritativa');
    assert.match(designSource, /text-shadow:var\(--title-shadow\)!important/, 'sombra de título deve vencer CSS local do plugin');
    assert.match(designSource, /background:var\(--action-button-fill\)!important/, 'material do CTA deve vencer fundo local do plugin');
  }

  // v5.0.1.18: kit global de botões, Font Awesome e compatibilidade semântica.
  {
    assert.ok(catalog.buttonKits?.liquidGlass, 'kit Liquid Glass deve existir');
    assert.ok(catalog.buttonKits?.magnetic, 'kit Magnetic Hover deve existir');
    const kitState = catalog.defaultState();
    Object.assign(kitState.brand, catalog.buttonKits.ripple.settings, { actionButtonClickEffect:'ripple' });
    const kitTokens = window.ImobifyRenderer.variables(kitState);
    assert.match(kitTokens, /--action-button-effect:ripple/, 'renderer deve publicar efeito de botão');
    assert.match(kitTokens, /--action-button-click-effect:ripple/, 'renderer deve publicar efeito de clique');
    assert.match(kitTokens, /--action-button-speed:/, 'renderer deve publicar velocidade do kit');
    const runtimeSource2 = fs.readFileSync(path.join(ROOT, 'core/runtime.js'), 'utf8');
    assert.match(runtimeSource2, /registerCTA/, 'runtime deve expor registro semântico de CTA');
    assert.match(runtimeSource2, /magnetic/i, 'runtime deve implementar hover magnético');
    assert.match(runtimeSource2, /imobify-button-ripple/, 'runtime deve implementar ripple');
    const designSource2 = fs.readFileSync(path.join(ROOT, 'core/design-system.css'), 'utf8');
    assert.match(designSource2, /BUTTON KIT GLOBAL/, 'Design System deve conter o kit global');
    assert.match(indexSource, /id="buttonKitSelect"/, 'editor deve expor modelos rápidos de botão');
    assert.match(indexSource, /value="liquid-glass"/, 'editor deve expor Liquid Glass');
    assert.match(indexSource, /data-brand="actionButtonClickEffect"/, 'editor deve expor efeito de clique');
    // Alguns kits expõem nomes comerciais no catálogo e IDs de efeito internos no CSS.
    const canonicalEffects = {
      'kinetic-outline':'outline-minimal', 'satin-reveal':'satin-luxury',
      'industrial-impact':'industrial-plate', 'liquid-jelly':'jelly',
      'cyber-pixel':'pixel', 'neon-explosion':'neon-trace',
      'editorial-stamp':'underline-editorial', 'mechanical-switch':'machined-steel',
      'aurora-spark':'aurora', 'glass-prism':'holographic',
      'magnet-shock':'magnet-orbit', 'playful-confetti':'bubble'
    };
    for (const [kitKey, kit] of Object.entries(catalog.buttonKits || {})) {
      const stateForKit = catalog.defaultState();
      Object.assign(stateForKit.brand, kit.settings || {});
      const kitCss = window.ImobifyRenderer.variables(stateForKit);
      assert.doesNotMatch(kitCss, /(?:undefined|NaN)/, `kit ${kitKey} não pode gerar token inválido`);
      const expectedEffect = canonicalEffects[kit.settings.actionButtonEffect] || kit.settings.actionButtonEffect;
      assert.match(kitCss, new RegExp(`--action-button-effect:${expectedEffect}`), `kit ${kitKey} deve publicar seu efeito canônico`);
    }
  }

  assert.ok(catalog.presets.patioTerracotta, 'preset Casa + Pátio deve existir');
  assert.ok(catalog.typographyProfiles?.popular, 'perfil tipográfico Popular clara deve existir');
  assert.ok(catalog.strategies.mcmvResult, 'estratégia MCMV Resultado primeiro deve existir');
  assert.ok(catalog.strategies.mcmvConstruction, 'estratégia MCMV Terreno + Construção deve existir');
  const mcmvBlueprint = catalog.createFromBlueprint('mcmvPatio');
  assert.equal(mcmvBlueprint.strategy.method, 'mcmvPatio');
  assert.equal(mcmvBlueprint.preset, 'patioTerracotta');
  assert.match(mcmvBlueprint.sections.find((section) => section.type === 'hero')?.props?.title || '', /pátio/i, 'modelo MCMV Casa + pátio deve carregar copy coerente');

  // v5.0.1.19: tags documentais independentes, identificadas e posicionáveis.
  {
    const tagPlugin = catalog.plugins['tag-installer-pro'];
    assert.ok(tagPlugin, 'Tag Installer Pro deve estar registrado');
    const tagState = catalog.defaultState();
    tagState.behaviorPlugins = [];
    const searchTag = catalog.createSection('tag-installer-pro');
    searchTag.props.label = 'Search Console';
    searchTag.props.service = 'google-search-console';
    searchTag.props.placement = 'head';
    searchTag.props.code = '<meta name="google-site-verification" content="abc123">';
    const bodyTag = catalog.createSection('tag-installer-pro');
    bodyTag.props.label = 'GTM noscript';
    bodyTag.props.placement = 'body-start';
    bodyTag.props.code = '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TEST"></iframe></noscript>';
    tagState.sections = [searchTag, bodyTag, catalog.createSection('footer')];

    assert.notEqual(searchTag.id, bodyTag.id, 'cada tag deve receber ID próprio no projeto');
    const external = window.ImobifyRenderer.buildExternalDocument(tagState);
    assert.match(external, new RegExp(`IMOBIFY TAG \| id: ${searchTag.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), 'HTML deve documentar o ID da tag');
    assert.match(external, /<head>[\s\S]*google-site-verification/, 'tag HEAD deve ser injetada no HEAD');
    assert.match(external, /<body[^>]*>[\s\S]*GTM-TEST[\s\S]*skip-link/, 'tag body-start deve vir antes do conteúdo da página');
    assert.doesNotMatch(window.ImobifyRenderer.bodyMarkup(tagState), /tag-installer-card/, 'tag documental não deve ocupar espaço na publicação');
    assert.match(window.ImobifyRenderer.bodyMarkup(tagState, { editor:true }), /tag-installer-card/, 'editor deve manter cartão configurável da tag');

    searchTag.props.runInPreview = false;
    assert.equal(window.ImobifyRenderer.documentTagInjections(tagState, { preview:true }).head, '', 'tag não deve executar na prévia por padrão');
    searchTag.props.runInPreview = true;
    assert.match(window.ImobifyRenderer.documentTagInjections(tagState, { preview:true }).head, /google-site-verification/, 'tag pode ser habilitada explicitamente na prévia');

    const compiledTags = await window.ImobifyCompiler.compile(tagState);
    const compiledZip = await JSZip.loadAsync(await compiledTags.blob.arrayBuffer());
    const compiledHtml = await compiledZip.file('index.html').async('text');
    const enabledPlugins = JSON.parse(await compiledZip.file('content/plugins-enabled.json').async('text'));
    assert.match(compiledHtml, /google-site-verification/, 'compilador deve preservar a tag HEAD');
    assert.match(compiledHtml, /GTM-TEST/, 'compilador deve preservar a tag BODY');
    assert.ok(enabledPlugins.some((item) => item.id === 'tag-installer-pro'), 'inventário do pacote deve listar Tag Installer Pro');
    const publishedCss = await compiledZip.file('assets/css/site.css').async('text');
    assert.doesNotMatch(publishedCss, /tag-installer-card/, 'CSS exclusivo do cartão do editor não deve ir para produção');
  }


  // v5.0.1.24: Floating Container Pro — HREF direto, portal real no BODY e layout seguro.
  {
    const floatingPlugin = catalog.plugins['floating-container-pro'];
    assert.ok(floatingPlugin, 'Floating Container Pro deve estar registrado');
    assert.equal(floatingPlugin.manifest.layout.mode, 'next-sections');
    assert.equal(floatingPlugin.manifest.layout.maxChildren, 12);
    assert.deepEqual(floatingPlugin.manifest.layout.excludeTypes, ['footer'], 'container não deve capturar o rodapé como filho');
    assert.equal(floatingPlugin.defaults.itemCount, 0, 'novo container deve iniciar vazio');
    assert.equal(floatingPlugin.manifest.inspectorGuide?.kind, 'href-container');
    assert.equal(floatingPlugin.manifest.inspectorGuide?.targetField, 'panelId');
    const hrefField = floatingPlugin.fields.find((field) => field.key === 'hrefTarget');
    assert.equal(hrefField?.type, 'computed');
    assert.equal(hrefField?.template, '#{{panelId}}');
    const editorIndex = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const editorApp = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
    assert.match(editorIndex, /id="floatingHelpDialog"/, 'editor deve possuir popup Como usar');
    assert.match(editorApp, /data-inspector-how-use/, 'inspetor deve expor o botão Como usar');
    assert.match(editorApp, /function floatingHelpSnapshot\(section\)/, 'ajuda deve ser contextual e calculada pela instância selecionada');
    assert.match(editorApp, /computedInspectorValue/, 'inspetor deve suportar campos derivados autodeclarados');
    assert.match(editorApp, /HREF \/ Destino do CTA/, 'ajuda deve orientar o fluxo oficial por HREF');
    assert.match(editorApp, /data-floating-help-copy/, 'exemplos da ajuda devem ser copiáveis');
    const floatingA = catalog.createSection('floating-container-pro');
    const floatingB = catalog.createSection('floating-container-pro');
    assert.match(floatingA.props.panelId, /^floating-box-/, 'nova instância deve receber ID público automaticamente');
    assert.notEqual(floatingA.props.panelId, floatingB.props.panelId, 'cada container precisa de ID de chamada próprio');
    const oldPublicId = floatingA.props.panelId;
    const oldSectionId = floatingA.id;
    catalog.refreshSectionIdentity(floatingA);
    assert.notEqual(floatingA.id, oldSectionId, 'duplicações/reidentificações precisam trocar o ID interno');
    assert.notEqual(floatingA.props.panelId, oldPublicId, 'duplicações/reidentificações precisam trocar o ID público');

    const floatingState = catalog.defaultState();
    floatingA.props.itemCount = 2;
    floatingA.props.columns = 2;
    floatingState.sections = [floatingA, catalog.createSection('offer-price-pro'), catalog.createSection('form-sender-v4'), catalog.createSection('footer')];
    floatingState.behaviorPlugins = [];
    const floatingMarkup = window.ImobifyRenderer.bodyMarkup(floatingState);
    assert.match(floatingMarkup, /data-plugin="floating-container-pro"/);
    assert.match(floatingMarkup, new RegExp(`data-ifcp-id="${floatingA.props.panelId}"`));
    assert.match(floatingMarkup, new RegExp(`id="${floatingA.props.panelId}"`), 'ID público deve existir no DOM');
    assert.match(floatingMarkup, /data-plugin="offer-price-pro"[\s\S]*data-plugin="form-sender-v4"/, 'filhos devem ficar dentro do container flutuante');
    assert.equal((floatingMarkup.match(/data-plugin="offer-price-pro"/g)||[]).length, 1, 'filho do floating container não pode duplicar');
    const floatingSources = await window.ImobifyRenderer.loadSources(floatingState);
    assert.match(floatingSources.css, /ifcp-layer/);
    assert.match(floatingSources.js, /window\.ImobifyFloating/);
    assert.match(floatingSources.js, /data-floating-open/);
    assert.match(floatingSources.js, /document\.body\.appendChild\(layer\)/, 'publicação deve portar a camada para o BODY');
    assert.match(floatingSources.css, /content-visibility:visible!important/, 'wrapper do floating não pode ser virtualizado');
    assert.doesNotMatch(floatingSources.css, /data-mobile-mode="inherit"\]\)\{[^}]*pointer-events:auto/, 'camada mobile oculta não pode bloquear cliques');
    assert.match(floatingSources.js, /href\^="#"/);

    const runtimeSourceHref = fs.readFileSync(path.join(ROOT, 'core/runtime.js'), 'utf8');
    assert.match(runtimeSourceHref, /ImobifyFloating\?\.get/, 'runtime deve reconhecer HREF de floating container antes de aplicar smooth-scroll');
    const floatingCompiled = await window.ImobifyCompiler.compile(floatingState);
    const floatingZip = await JSZip.loadAsync(await floatingCompiled.blob.arrayBuffer());
    const floatingHtml = await floatingZip.file('index.html').async('text');
    const floatingJs = await floatingZip.file('assets/js/site.js').async('text');
    assert.match(floatingHtml, new RegExp(`data-ifcp-id="${floatingA.props.panelId}"`), 'ID público deve chegar ao HTML publicado');
    assert.match(floatingJs, /ImobifyFloating/, 'API de abertura deve chegar ao JS publicado');
  }

  // v4.0: comparador de versão semântica usado no fluxo de reinstalação.
  // v5.0.1.27: Only TEXT — Context e YouTube funcionam como seção ou item de Segmento.
  {
    const textPlugin = catalog.plugins['only-text-context'];
    const youtubePlugin = catalog.plugins.youtube;
    assert.ok(textPlugin && youtubePlugin, 'os dois novos plugins devem estar registrados');
    assert.equal(textPlugin.manifest.composition.role, 'both');
    assert.equal(youtubePlugin.manifest.composition.role, 'both');
    assert.deepEqual(
      ['title','subtitle','lead','body'].filter((key) => textPlugin.fields.some((field) => field.key === key)),
      ['title','subtitle','lead','body'],
      'Only TEXT deve expor os quatro elementos editoriais solicitados'
    );
    assert.ok(textPlugin.fields.some((field) => field.key === 'textAlign'));
    assert.ok(textPlugin.fields.some((field) => field.key === 'titleEffect'));
    assert.ok(youtubePlugin.fields.some((field) => field.key === 'videoId'));
    assert.ok(youtubePlugin.fields.some((field) => field.key === 'autoplay'));
    assert.ok(youtubePlugin.fields.some((field) => field.key === 'controls'));

    const textSection = catalog.createSection('only-text-context');
    textSection.props.title = 'Título <script>alert(1)</script>';
    textSection.props.bodyColumns = '3';
    const youtubeSection = catalog.createSection('youtube');
    youtubeSection.props.videoId = 'https://youtu.be/M7lc1UVf-VE';
    youtubeSection.props.autoplay = true;
    const pluginState = catalog.defaultState();
    pluginState.behaviorPlugins = [];
    pluginState.sections = [textSection, youtubeSection];
    const pluginMarkup = window.ImobifyRenderer.bodyMarkup(pluginState);
    assert.match(pluginMarkup, /data-plugin="only-text-context"/);
    assert.match(pluginMarkup, /class="otc-title"/);
    assert.match(pluginMarkup, /Título &lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'conteúdo editorial deve permanecer escapado');
    assert.doesNotMatch(pluginMarkup, /<script>alert\(1\)<\/script>/);
    assert.match(pluginMarkup, /data-columns="3"/);
    assert.match(pluginMarkup, /data-plugin="youtube"/);
    assert.match(pluginMarkup, /data-video-id="https:\/\/youtu\.be\/M7lc1UVf-VE"/);
    assert.match(pluginMarkup, /data-autoplay="true"/);
    assert.match(pluginMarkup, /<iframe class="ytp-frame"[^>]+title=/);

    const frameAttributes = new Map();
    const fakeFrame = {
      getAttribute:(name)=>frameAttributes.has(name)?frameAttributes.get(name):null,
      setAttribute:(name,value)=>frameAttributes.set(name,String(value)),
      removeAttribute:(name)=>frameAttributes.delete(name)
    };
    const fakeRoot = {
      dataset:{
        videoId:'https://youtu.be/M7lc1UVf-VE?t=10', autoplay:'true', controls:'false', muted:'true', loop:'true', start:'12', end:'42',
        fullscreen:'true', keyboardControls:'true', playsInline:'true', captions:'true', captionsLanguage:'pt', interfaceLanguage:'pt-BR',
        relatedVideos:'false', privacyEnhanced:'true', lazyLoad:'true'
      },
      querySelector:(selector)=>selector==='.ytp-frame'?fakeFrame:null
    };
    const fakeDocument = { readyState:'complete', querySelectorAll:()=>[fakeRoot] };
    const youtubeSource = fs.readFileSync(path.join(ROOT, 'plugins/youtube/plugin.js'), 'utf8');
    vm.runInNewContext(youtubeSource, { document:fakeDocument, URL, URLSearchParams });
    const embedUrl = new URL(frameAttributes.get('src'));
    assert.equal(embedUrl.hostname, 'www.youtube-nocookie.com');
    assert.equal(embedUrl.pathname, '/embed/M7lc1UVf-VE');
    assert.equal(embedUrl.searchParams.get('autoplay'), '1');
    assert.equal(embedUrl.searchParams.get('controls'), '0');
    assert.equal(embedUrl.searchParams.get('mute'), '1');
    assert.equal(embedUrl.searchParams.get('loop'), '1');
    assert.equal(embedUrl.searchParams.get('playlist'), 'M7lc1UVf-VE');
    assert.equal(embedUrl.searchParams.get('start'), '12');
    assert.equal(embedUrl.searchParams.get('end'), '42');
    assert.equal(embedUrl.searchParams.get('cc_load_policy'), '1');
    assert.equal(fakeRoot.dataset.playerState, 'ready');

    fakeRoot.dataset.videoId = 'https://example.com/watch?v=M7lc1UVf-VE';
    vm.runInNewContext(youtubeSource, { document:fakeDocument, URL, URLSearchParams });
    assert.equal(fakeRoot.dataset.playerState, 'invalid', 'URL externa não pode virar iframe arbitrário');
    assert.equal(frameAttributes.has('src'), false);
    assert.doesNotMatch(youtubeSource, /modestbranding|showinfo/, 'parâmetros obsoletos não devem ser publicados');

    const pluginSources = await window.ImobifyRenderer.loadSources(pluginState);
    assert.match(pluginSources.css, /otc-title/);
    assert.match(pluginSources.css, /ytp-frame-shell/);
    assert.match(pluginSources.js, /youtube-nocookie\.com/);
    const pluginCompiled = await window.ImobifyCompiler.compile(pluginState);
    const pluginZip = await JSZip.loadAsync(await pluginCompiled.blob.arrayBuffer());
    const pluginHtml = await pluginZip.file('index.html').async('text');
    const pluginJs = await pluginZip.file('assets/js/site.js').async('text');
    const pluginInventory = JSON.parse(await pluginZip.file('content/plugins-enabled.json').async('text'));
    assert.match(pluginHtml, /data-plugin="only-text-context"/);
    assert.match(pluginHtml, /data-plugin="youtube"/);
    assert.match(pluginJs, /www\.youtube-nocookie\.com/);
    assert.equal(pluginInventory.find((item) => item.id === 'only-text-context')?.compositionRole, 'both');
    assert.equal(pluginInventory.find((item) => item.id === 'youtube')?.compositionRole, 'both');
  }

  // v5.1.30: Botão e Imagem Single chegam completos ao pacote publicado.
  {
    const componentPluginState = catalog.defaultState();
    componentPluginState.behaviorPlugins = [];
    const buttonSection = catalog.createSection('button-single');
    buttonSection.props.label = 'Abrir condições';
    buttonSection.props.href = '#condicoes';
    const imageSection = catalog.createSection('image-single');
    imageSection.props.caption = 'Perspectiva ilustrativa';
    componentPluginState.sections = [buttonSection, imageSection];

    const componentMarkup = window.ImobifyRenderer.bodyMarkup(componentPluginState);
    assert.match(componentMarkup, /data-plugin="button-single"/);
    assert.match(componentMarkup, /data-plugin="image-single"/);
    assert.match(componentMarkup, /href="#condicoes"/);
    assert.doesNotMatch(componentMarkup, /{{\/?(?:if|unless)\b|{{\/if}}/);

    const componentSources = await window.ImobifyRenderer.loadSources(componentPluginState);
    assert.match(componentSources.css, /\.ibs-button/);
    assert.match(componentSources.css, /\.iis-figure/);
    const componentCompiled = await window.ImobifyCompiler.compile(componentPluginState);
    const componentZip = await JSZip.loadAsync(await componentCompiled.blob.arrayBuffer());
    const componentHtml = await componentZip.file('index.html').async('text');
    const componentInventory = JSON.parse(await componentZip.file('content/plugins-enabled.json').async('text'));
    assert.match(componentHtml, /data-plugin="button-single"/);
    assert.match(componentHtml, /data-plugin="image-single"/);
    assert.ok(Object.keys(componentZip.files).some((name) => /^assets\/images\/.*\.svg$/.test(name)), 'a imagem padrão deve ser incorporada ao pacote');
    assert.equal(componentInventory.find((item) => item.id === 'button-single')?.compositionCardinality, 'single');
    assert.equal(componentInventory.find((item) => item.id === 'image-single')?.compositionCardinality, 'single');
  }

  // v5.0.1.28: cards unitários e migração das grades internas legadas.
  {
    const singleIds = ['ar-card-popout-3d', 'flip-card-pro', 'flipcard-3d-video-v1'];
    for (const id of singleIds) {
      const plugin = catalog.plugins[id];
      assert.ok(plugin, `${id} deve permanecer registrado`);
      assert.equal(plugin.manifest.composition.role, 'both');
      assert.equal(plugin.manifest.composition.cardinality, 'single');
      assert.equal(plugin.compositionCardinality, 'single');
      assert.equal(Object.hasOwn(plugin.defaults, 'gridColumns'), false, `${id} não deve criar grade interna`);
      assert.equal(Object.hasOwn(plugin.defaults, 'gridGap'), false, `${id} não deve criar espaçamento de grade interno`);
      assert.equal(Object.keys(plugin.defaults).some((key) => /^card[2-9]/.test(key)), false, `${id} deve expor somente um card nos defaults`);
      assert.equal(plugin.fields.some((field) => /^card[2-9]/.test(field.key) || ['gridColumns','gridGap'].includes(field.key)), false, `${id} deve expor somente campos single no inspetor`);

      const section = catalog.createSection(id);
      const singleMarkup = plugin.render(section.props, catalog.defaultState(), section.id);
      assert.equal((singleMarkup.match(/data-card-slot="1"/g) || []).length, 1, `${id} deve renderizar exatamente um card`);
      assert.doesNotMatch(singleMarkup, /data-card-slot="[234]"/, `${id} não pode renderizar cards adicionais`);
    }

    const singleState = catalog.defaultState();
    singleState.behaviorPlugins = [];
    singleState.sections = singleIds.map((id) => catalog.createSection(id));
    const singleStateMarkup = window.ImobifyRenderer.bodyMarkup(singleState);
    assert.equal((singleStateMarkup.match(/data-plugin="ar-card-popout-3d"/g) || []).length, 1);
    assert.equal((singleStateMarkup.match(/data-plugin="flip-card-pro"/g) || []).length, 1);
    assert.equal((singleStateMarkup.match(/data-plugin="flipcard-3d-video-v1"/g) || []).length, 1);
    assert.equal((singleStateMarkup.match(/class="flip-card"/g) || []).length, 2, 'cada variante Flip Card deve renderizar somente um card');
    assert.equal((singleStateMarkup.match(/class="flip-card__video"/g) || []).length, 2, 'variante de vídeo deve manter uma camada por face');

    const flipPlugin = catalog.plugins['flip-card-pro'];
    const legacyProps = JSON.parse(JSON.stringify(flipPlugin.manifest.defaults));
    Object.assign(legacyProps, {
      gridColumns: '3', gridGap: 34,
      frontTitle: 'Card legado 1',
      card2Enabled: true, card2FrontTitle: 'Card legado 2',
      card3Enabled: true, card3FrontTitle: 'Card legado 3',
      card4Enabled: false
    });
    const legacySection = {
      id: 'flip-legado',
      type: 'flip-card-pro',
      props: legacyProps,
      settings: { visible:true, hideMobile:false, hideDesktop:false, transition:'fade', cssClass:'legado', anchorId:'cards-legados' }
    };
    const migrated = window.ImobifyPluginLoader.migrateLegacyCardGrids([legacySection]);
    assert.equal(migrated.length, 4, 'grade com três cards deve virar Segmento + três instâncias');
    assert.equal(migrated[0].type, 'segment-layout');
    assert.equal(migrated[0].props.itemCount, 3);
    assert.equal(migrated[0].props.tracks, 3);
    assert.equal(migrated[0].props.gap, 34);
    assert.equal(migrated[0].settings.anchorId, 'cards-legados', 'configuração externa deve passar para o Segmento');
    assert.deepEqual(migrated.slice(1).map((section) => section.type), ['flip-card-pro','flip-card-pro','flip-card-pro']);
    assert.deepEqual(migrated.slice(1).map((section) => section.props.frontTitle), ['Card legado 1','Card legado 2','Card legado 3']);
    assert.deepEqual(migrated.slice(1).map((section) => section.settings.layoutSlot), [0,1,2]);
    assert.equal(migrated[1].id, 'flip-legado', 'primeiro card deve preservar a identidade selecionável');
    assert.equal(new Set(migrated.slice(1).map((section) => section.id)).size, 3, 'cards desmembrados precisam de IDs independentes');
    assert.equal(migrated.slice(1).some((section) => Object.keys(section.props).some((key) => /^card[2-9]/.test(key) || ['gridColumns','gridGap'].includes(key))), false, 'propriedades legadas devem ser removidas depois da migração');

    const migratedState = catalog.defaultState();
    migratedState.behaviorPlugins = [];
    migratedState.sections = migrated;
    const migratedMarkup = window.ImobifyRenderer.bodyMarkup(migratedState);
    assert.equal((migratedMarkup.match(/data-plugin="segment-layout"/g) || []).length, 1);
    assert.equal((migratedMarkup.match(/data-plugin="flip-card-pro"/g) || []).length, 3);
    assert.equal((migratedMarkup.match(/class="flip-card"/g) || []).length, 3, 'migração deve renderizar três instâncias single');

    const existingSegment = catalog.createSection('segment-layout');
    existingSegment.props.tracks = 3;
    existingSegment.props.itemCount = 1;
    const legacyChild = JSON.parse(JSON.stringify(legacySection));
    legacyChild.id = 'flip-filho-legado';
    legacyChild.props.card3Enabled = false;
    legacyChild.settings.layoutSlot = 1;
    const migratedInside = window.ImobifyPluginLoader.migrateLegacyCardGrids([existingSegment, legacyChild]);
    assert.equal(migratedInside.length, 3, 'Segmento existente deve receber os dois cards sem wrapper adicional');
    assert.equal(migratedInside.filter((section) => section.type === 'segment-layout').length, 1);
    assert.equal(migratedInside[0].props.itemCount, 2);
    assert.deepEqual(migratedInside.slice(1).map((section) => section.settings.layoutSlot), [1,2]);

    const compiledSingles = await window.ImobifyCompiler.compile(singleState);
    const compiledSinglesZip = await JSZip.loadAsync(await compiledSingles.blob.arrayBuffer());
    const singleInventory = JSON.parse(await compiledSinglesZip.file('content/plugins-enabled.json').async('text'));
    assert.equal(singleInventory.find((item) => item.id === 'flip-card-pro')?.compositionCardinality, 'single');
  }

  // v5.0.1.26: Segmentos nativos com 1–5 colunas/linhas e slots explícitos.
  {
    const segmentPlugin = catalog.plugins['segment-layout'];
    assert.ok(segmentPlugin, 'Segmento deve estar registrado como Plugin Play incluído');
    assert.equal(segmentPlugin.manifest.layout.mode, 'segment-slots');
    assert.equal(segmentPlugin.manifest.layout.maxTracks, 5);
    assert.equal(segmentPlugin.manifest.composition.role, 'both');
    assert.equal(catalog.compositionRole(segmentPlugin), 'both');
    assert.equal(catalog.compositionRole(catalog.plugins['offer-price-pro']), 'item');
    assert.equal(catalog.compositionRole(catalog.plugins['form-sender-v4']), 'both');
    assert.match(indexSource, /id="segmentComposer"/, 'editor deve expor o criador visual de Segmentos');
    assert.match(indexSource, /data-segment-tracks="5"/, 'criador visual deve oferecer até cinco divisões');
    assert.match(appSource, /function createSegment\(/, 'aplicação deve criar Segmentos nativos');
    assert.match(appSource, /function moveSectionSlot\(/, 'aplicação deve reposicionar itens entre células');
    assert.match(appSource, /pendingSegmentTarget/, 'seletor de plugins deve preservar o slot de destino');
    assert.match(appSource, /plugin\.manifest\?\.id !== 'segment-layout'/, 'editor deve liberar somente Segmento entre os plugins de layout aninháveis');
    assert.match(appSource, /splice\(source\.index, source\.span\)/, 'remoção deve apagar a árvore lógica inteira do Segmento aninhado');
    const verticalField = segmentPlugin.fields.find((field) => field.key === 'verticalAlign');
    const horizontalField = segmentPlugin.fields.find((field) => field.key === 'horizontalAlign');
    assert.deepEqual(verticalField.options.map((item) => item.value), ['stretch','start','center','end']);
    assert.deepEqual(horizontalField.options.map((item) => item.value), ['stretch','start','center','end','baseline']);

    const segmentState = catalog.defaultState();
    segmentState.behaviorPlugins = [];
    const segment = catalog.createSection('segment-layout');
    segment.props.direction = 'columns';
    segment.props.tracks = 3;
    segment.props.itemCount = 3;
    const offer = catalog.createSection('offer-price-pro');
    const spacer = catalog.createSection('spacer-divider-pro');
    const form = catalog.createSection('form-sender-v4');
    offer.settings.layoutSlot = 0;
    spacer.settings.layoutSlot = 1;
    form.settings.layoutSlot = 2;
    segmentState.sections = [segment, offer, spacer, form, catalog.createSection('footer')];

    const segmentMarkup = window.ImobifyRenderer.bodyMarkup(segmentState);
    assert.match(segmentMarkup, /data-plugin="segment-layout"/);
    assert.equal((segmentMarkup.match(/class="ims-segment-slot imobify-segment-slot/g) || []).length, 3, 'renderer deve materializar uma célula por divisão');
    assert.match(segmentMarkup, /data-segment-slot="0"[\s\S]*data-plugin="offer-price-pro"/);
    assert.match(segmentMarkup, /data-segment-slot="1"[\s\S]*data-plugin="spacer-divider-pro"/);
    assert.match(segmentMarkup, /data-segment-slot="2"[\s\S]*data-plugin="form-sender-v4"/);
    assert.equal((segmentMarkup.match(/data-plugin="offer-price-pro"/g) || []).length, 1, 'item do Segmento não pode duplicar na página');
    const segmentEditor = window.ImobifyRenderer.bodyMarkup(segmentState, { editor:true });
    assert.equal((segmentEditor.match(/data-editor-action="insert-segment-item"/g) || []).length, 3, 'cada célula deve oferecer inserção contextual na prévia');
    assert.match(segmentEditor, new RegExp(`data-segment-id="${segment.id}"`));
    assert.equal((segmentEditor.match(/data-insert-index="4"/g) || []).length, 1, 'botão abaixo do Segmento deve inserir depois de todos os filhos');

    segment.props.direction = 'rows';
    segment.props.tracks = 5;
    const rowMarkup = window.ImobifyRenderer.bodyMarkup(segmentState);
    assert.match(rowMarkup, /data-direction="rows"/);
    assert.match(rowMarkup, /data-tracks="5"/);
    assert.equal((rowMarkup.match(/class="ims-segment-slot imobify-segment-slot/g) || []).length, 5, 'Segmento deve aceitar até cinco linhas');

    // 5.2.3: um Segmento pode ocupar uma célula de outro Segmento e manter filhos próprios.
    const nestedState = catalog.defaultState();
    nestedState.behaviorPlugins = [];
    const outer = catalog.createSection('segment-layout');
    outer.props.direction = 'columns';
    outer.props.tracks = 2;
    outer.props.itemCount = 2;
    outer.props.verticalAlign = 'center';
    outer.props.horizontalAlign = 'end';
    const nested = catalog.createSection('segment-layout');
    nested.props.direction = 'rows';
    nested.props.tracks = 2;
    nested.props.itemCount = 2;
    nested.props.verticalAlign = 'start';
    nested.props.horizontalAlign = 'center';
    nested.settings.layoutSlot = 0;
    const nestedOffer = catalog.createSection('offer-price-pro');
    nestedOffer.settings.layoutSlot = 0;
    const nestedText = catalog.createSection('only-text-context');
    nestedText.settings.layoutSlot = 1;
    const siblingForm = catalog.createSection('form-sender-v4');
    siblingForm.settings.layoutSlot = 1;
    nestedState.sections = [outer, nested, nestedOffer, nestedText, siblingForm, catalog.createSection('footer')];
    const nestedMarkup = window.ImobifyRenderer.bodyMarkup(nestedState);
    assert.equal((nestedMarkup.match(/data-plugin="segment-layout"/g) || []).length, 2, 'renderer deve renderizar Segmento pai e filho');
    assert.equal((nestedMarkup.match(/data-plugin="offer-price-pro"/g) || []).length, 1, 'filho do Segmento aninhado não pode duplicar');
    assert.equal((nestedMarkup.match(/data-plugin="only-text-context"/g) || []).length, 1, 'segundo filho aninhado deve ser consumido pelo Segmento interno');
    assert.equal((nestedMarkup.match(/data-plugin="form-sender-v4"/g) || []).length, 1, 'irmão do Segmento interno deve permanecer no Segmento externo');
    assert.match(nestedMarkup, /data-v-align="center" data-h-align="end"/);
    assert.match(nestedMarkup, /data-v-align="start" data-h-align="center"/);

    const segmentSources = await window.ImobifyRenderer.loadSources(segmentState);
    assert.match(segmentSources.css, /ims-segment__grid/, 'CSS do Segmento deve entrar apenas quando usado');
    const segmentCompiled = await window.ImobifyCompiler.compile(segmentState);
    const segmentZip = await JSZip.loadAsync(await segmentCompiled.blob.arrayBuffer());
    const segmentHtml = await segmentZip.file('index.html').async('text');
    const segmentInventory = JSON.parse(await segmentZip.file('content/plugins-enabled.json').async('text'));
    assert.match(segmentHtml, /data-plugin="segment-layout"/);
    assert.equal((segmentHtml.match(/data-plugin="form-sender-v4"/g) || []).length, 1, 'compilação deve preservar o plugin filho uma única vez');
    assert.equal(segmentInventory.find((item) => item.id === 'segment-layout')?.compositionRole, 'both', 'inventário deve registrar o papel flexível de composição');
  }

  const cmp = window.ImobifyUtil.compareVersions;
  assert.equal(cmp('1.2.0', '1.10.0'), -1, 'comparação deve ser numérica por segmento, não lexicográfica');
  assert.equal(cmp('2.0.0', '1.9.9'), 1);
  assert.equal(cmp('1.0.0', '1.0.0'), 0);

  // v4.1.0: novos plugins devem renderizar e o Section Layout deve compor os próximos blocos.
  {
    const newIds = ['section-layout-pro','spacer-divider-pro','offer-price-pro','timeline-process-pro','hotspot-plant-pro','financing-simulator-pro'];
    for (const id of newIds) {
      const plugin = catalog.plugins[id];
      assert.ok(plugin, `${id} deve estar registrado`);
      const section = catalog.createSection(id);
      const single = window.ImobifyRenderer.bodyMarkup({ ...catalog.defaultState(), sections:[section], behaviorPlugins:[] });
      assert.match(single, new RegExp(`data-plugin="${id}"`), `${id} deve renderizar data-plugin`);
    }
    const layoutState = catalog.defaultState();
    const layout = catalog.createSection('section-layout-pro');
    layout.props.itemCount = 2;
    layout.props.columns = 2;
    layoutState.sections = [layout, catalog.createSection('offer-price-pro'), catalog.createSection('timeline-process-pro'), catalog.createSection('footer')];
    layoutState.behaviorPlugins = [];
    const layoutMarkup = window.ImobifyRenderer.bodyMarkup(layoutState);
    const layoutStart = layoutMarkup.indexOf('data-plugin="section-layout-pro"');
    const offerPos = layoutMarkup.indexOf('data-plugin="offer-price-pro"');
    const timelinePos = layoutMarkup.indexOf('data-plugin="timeline-process-pro"');
    const footerPos = layoutMarkup.indexOf('data-plugin="footer"');
    assert.ok(layoutStart >= 0 && offerPos > layoutStart && timelinePos > offerPos, 'filhos devem ser injetados após o container');
    assert.ok(footerPos > timelinePos, 'footer deve ficar depois dos dois filhos configurados');
    assert.equal((layoutMarkup.match(/data-plugin="offer-price-pro"/g)||[]).length,1,'filho não pode renderizar duplicado');
    const layoutSources = await window.ImobifyRenderer.loadSources(layoutState);
    assert.match(layoutSources.css, /slp-grid/);
    assert.match(layoutSources.css, /opp-card/);
    assert.match(layoutSources.css, /tpp-track/);
    const layoutCompiled = await window.ImobifyCompiler.compile(layoutState);
    const layoutZip = await JSZip.loadAsync(await layoutCompiled.blob.arrayBuffer());
    const layoutHtml = await layoutZip.file('index.html').async('text');
    assert.match(layoutHtml, /data-plugin="section-layout-pro"/);
    assert.match(layoutHtml, /data-plugin="offer-price-pro"/);
  }

  const second = catalog.createFromBlueprint('quick');
  second.projectName = 'Residencial Aurora — Oferta 2';
  const batchResult = await window.ImobifyCompiler.compileBatch([state, second]);
  const batch = await JSZip.loadAsync(await batchResult.blob.arrayBuffer());
  assert.ok(batch.file('RELATORIO-CONTEUDO-REPETITIVO.csv'), 'v5 deve gerar relatório de similaridade no lote');
  assert.equal(Object.keys(batch.files).filter((name) => name.endsWith('.zip')).length, 2);
  assert.ok(batch.file('LEIA-ME.txt'));

  await window.ImobifyPluginLoader.uninstall('meu-componente');
  assert.equal(window.ImobifyCatalog.plugins['meu-componente'], undefined);
  console.log(`Plugin Play OK: ${result.files.length} arquivos compilados.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

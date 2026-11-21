(function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  var SAMPLE_ASSET = {
    p1:'assets/images/plant-1.png', p1full:'assets/images/plant-1-full.png',
    p2:'assets/images/plant-2.png', p3:'assets/images/plant-3.png', pos1:'assets/images/position-1.png'
  };
  function resolveSampleAsset(raw) {
    var key = String(raw || '').trim();
    var prefix = ['assets','images'].join('/') + '/';
    if (key === prefix + 'plant-1.png') return SAMPLE_ASSET.p1;
    if (key === prefix + 'plant-1-full.png') return SAMPLE_ASSET.p1full;
    if (key === prefix + 'plant-2.png') return SAMPLE_ASSET.p2;
    if (key === prefix + 'plant-3.png') return SAMPLE_ASSET.p3;
    if (key === prefix + 'smart-plant-position-1.png' || key === prefix + 'position-1.png') return SAMPLE_ASSET.pos1;
    return key;
  }
  function safeImage(value) {
    var raw = resolveSampleAsset(value);
    if (!raw) return '';
    if (/^data:image\//i.test(raw) || /^(?:https?:)?\/\//i.test(raw) || /^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw) || /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.~%+@()-]+)+/.test(raw)) return raw;
    return '';
  }
  function normalizePlant(item, index) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id:String(item.id || ('planta-' + (index + 1))),
      code:String(item.code || item.identifier || ''),
      title:String(item.title || ('Planta ' + (index + 1))),
      description:String(item.description || ''),
      area:String(item.area || ''),
      composition:String(item.composition || ''),
      bathrooms:String(item.bathrooms || ''),
      features:Array.isArray(item.features) ? item.features.join('|') : String(item.features || ''),
      image:String(item.image || ''),
      fullImage:String(item.fullImage || item.image || ''),
      positionImage:String(item.positionImage || ''),
      position:String(item.position || '')
    };
  }
  function readPlants(root) {
    try {
      var list = JSON.parse(root.dataset.plants || '[]');
      if (Array.isArray(list)) return list.map(normalizePlant);
    } catch (_) {}
    return [];
  }
  function badges(plant) {
    return [plant.area, plant.composition, plant.bathrooms].concat(String(plant.features || '').split('|').map(function (v) { return v.trim(); })).filter(Boolean);
  }
  function cardMarkup(plant, index, buttonText) {
    var image = safeImage(plant.image || plant.fullImage);
    return '<article class="smart-plant__card" data-smart-plant-card="' + esc(plant.id) + '">' +
      '<div class="smart-plant__card-media">' + (image ? '<img src="' + esc(image) + '" alt="' + esc(plant.title) + '"' + (index ? ' loading="lazy"' : '') + ' decoding="async">' : '') + '</div>' +
      '<div class="smart-plant__card-body"><h3>' + esc(plant.title) + '</h3>' +
      (plant.description ? '<p>' + esc(plant.description) + '</p>' : '') +
      '<div class="smart-plant__badges">' + badges(plant).map(function (item) { return '<span class="smart-plant__badge">' + esc(item) + '</span>'; }).join('') + '</div>' +
      '<button class="smart-plant__card-button" type="button" data-design-role="cta" data-smart-plant-open="' + esc(plant.id) + '"><span>' + esc(buttonText || 'Ver planta completa') + '</span></button>' +
      '</div></article>';
  }
  function fillTemplate(template, root, plant) {
    return String(template || '')
      .replace(/\{empreendimento\}/gi, root.dataset.empreendimento || '')
      .replace(/\{planta\}/gi, plant.title || '')
      .replace(/\{metragem\}/gi, plant.area || '');
  }
  function init(wrapper) {
    if (wrapper.dataset.smartPlantReady === 'true') return;
    wrapper.dataset.smartPlantReady = 'true';
    var root = wrapper.querySelector('.smart-plant') || wrapper;
    // Tema local é uma exceção explícita. O contraste é calculado a partir
    // da cor escolhida; no modo projeto a decisão continua com o Core.
    if (root.getAttribute('data-local-theme') === 'true') {
      var customAccent = (root.style.getPropertyValue('--sp-local-accent') || '').trim();
      var hex = /^#([a-f0-9]{6})$/i.exec(customAccent);
      if (hex) {
        var channel = [0,2,4].map(function(i) {
          var v = parseInt(hex[1].slice(i,i+2),16) / 255;
          return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
        });
        var luminance = .2126*channel[0] + .7152*channel[1] + .0722*channel[2];
        var onAccent = luminance > .1791 ? '#101318' : '#ffffff';
        root.style.setProperty('--sp-cta-text', onAccent);
        root.style.setProperty('--action-button-bg', customAccent);
        root.style.setProperty('--action-button-text', onAccent);
      }
    }
    var plants = readPlants(root);
    var grid = root.querySelector('[data-smart-plant-grid]');
    var modal = root.querySelector('[data-smart-plant-modal]');
    var active = null;
    var lockedScrollY = 0;
    var viewportHandler = null;
    var modalPortal = null;
    var lastTrigger = null;
    var closing = false;
    var magnifierCleanup = null;
    if (grid) grid.innerHTML = plants.map(function (plant, index) { return cardMarkup(plant, index, root.dataset.cardButtonText); }).join('');

    // O modal público é portado para o <body> para não herdar transform,
    // overflow, contain ou contexto de posicionamento da section Smart Plant.
    // Isso é essencial no Safari/iPhone, onde um ancestral transformado pode
    // transformar position:fixed em posicionamento relativo ao bloco ancestral.
    function ensureModalPortal() {
      if (!modal || modalPortal) return modalPortal;
      modalPortal = document.createElement('div');
      modalPortal.className = 'smart-plant-modal-portal';
      modalPortal.setAttribute('data-plugin', 'smart-plant');
      modalPortal.setAttribute('data-smart-plant-portal', '');
      var owningSection = wrapper.closest('[data-section-id]') || wrapper;
      if (owningSection.hasAttribute('data-section-id')) modalPortal.setAttribute('data-section-id', owningSection.getAttribute('data-section-id'));
      if (owningSection.getAttribute('data-ib-type-mode') === 'local') modalPortal.setAttribute('data-ib-type-mode', 'local');
      modalPortal.setAttribute('data-local-theme', root.getAttribute('data-local-theme') || 'false');
      document.body.appendChild(modalPortal);
      modalPortal.appendChild(modal);
      return modalPortal;
    }
    function syncPortalTheme() {
      if (!modalPortal) return;
      // A section pode estar com um estilo local ativo. Como o modal é portado
      // para o body, seu contexto visual deve ser explicitamente replicado.
      // Copiar somente --heading perdia tamanho, peso, tracking, botão e cores.
      var cs = window.getComputedStyle(root);
      var section = wrapper.closest('[data-section-id]') || wrapper;
      if (section.hasAttribute('data-section-id')) modalPortal.setAttribute('data-section-id', section.getAttribute('data-section-id'));
      if (section.getAttribute('data-ib-type-mode') === 'local') modalPortal.setAttribute('data-ib-type-mode', 'local');
      else modalPortal.removeAttribute('data-ib-type-mode');
      modalPortal.setAttribute('data-local-theme', root.getAttribute('data-local-theme') || 'false');
      var tokens = [
        '--heading','--body','--heading-weight','--heading-line','--heading-tracking',
        '--heading-color','--body-color','--muted-color','--body-size','--body-line',
        '--h2-max','--h3-max','--section-space','--content-gap','--element-gap',
        '--component-padding','--radius','--surface','--primary','--accent',
        '--component-title-color','--component-text-color','--component-muted-color',
        '--action-button-bg','--action-button-text','--action-button-fill',
        '--action-button-border-width','--action-button-border-color',
        '--action-button-effect','--action-button-click-effect',
        '--sp-accent','--sp-cta-text','--sp-modal','--sp-text','--sp-muted',
        '--sp-local-accent','--sp-local-section','--sp-local-card',
        '--sp-local-modal','--sp-local-text','--sp-local-muted'
      ];
      ['eyebrow','headline','subheadline','body','cta'].forEach(function(role) {
        ['font','size','weight','line','tracking','color','transform'].forEach(function(suffix) {
          tokens.push('--ib-' + role + '-' + suffix);
        });
      });
      tokens.forEach(function(name) {
        var value = cs.getPropertyValue(name).trim();
        if (value) modalPortal.style.setProperty(name, value);
        else modalPortal.style.removeProperty(name);
      });
      modalPortal.style.fontFamily = cs.fontFamily || '';
      modalPortal.style.fontSize = cs.fontSize || '';
      modalPortal.style.lineHeight = cs.lineHeight || '';
    }
    function syncVisualViewportBox() {
      if (!modal) return;
      var vv = window.visualViewport;
      var left = vv ? vv.offsetLeft : 0;
      var top = vv ? vv.offsetTop : 0;
      var width = vv ? vv.width : window.innerWidth;
      var height = vv ? vv.height : window.innerHeight;
      modal.style.left = Math.round(left) + 'px';
      modal.style.top = Math.round(top) + 'px';
      modal.style.width = Math.round(width) + 'px';
      modal.style.height = Math.round(height) + 'px';
      modal.style.right = 'auto';
      modal.style.bottom = 'auto';
    }

    function unlockPage(restorePlantPosition) {
      document.documentElement.classList.remove('smart-plant-modal-open');
      document.body.classList.remove('smart-plant-body-locked');
      document.body.style.top = '';
      document.body.style.width = '';
      if (window.visualViewport && viewportHandler) {
        window.visualViewport.removeEventListener('resize', viewportHandler);
        window.visualViewport.removeEventListener('scroll', viewportHandler);
      }
      window.removeEventListener('resize', viewportHandler);
      window.removeEventListener('orientationchange', viewportHandler);
      viewportHandler = null;
      // O Core aplica html{scroll-behavior:smooth}. A chamada antiga a
      // scrollTo(0, lockedScrollY) iniciava uma rolagem suave de volta às
      // plantas, concorrendo com o salto posterior para #contato. Restaurar
      // a posição SOMENTE no fechamento manual, e sempre de modo imediato.
      if (restorePlantPosition) {
        var html = document.documentElement;
        var old = html.style.getPropertyValue('scroll-behavior');
        var priority = html.style.getPropertyPriority('scroll-behavior');
        html.style.setProperty('scroll-behavior', 'auto', 'important');
        try { window.scrollTo(0, lockedScrollY || 0); }
        finally {
          if (old) html.style.setProperty('scroll-behavior', old, priority);
          else html.style.removeProperty('scroll-behavior');
        }
      }
    }
    function fitModalToViewport() {
      if (!modal || !modal.classList.contains('is-open')) return;
      syncVisualViewportBox();
      var dialog = modal.querySelector('.smart-plant__dialog');
      if (!dialog) return;
      dialog.style.setProperty('--sp-modal-scale', '1');
      var vv = window.visualViewport;
      var vw = vv ? vv.width : window.innerWidth;
      var vh = vv ? vv.height : window.innerHeight;
      var padX = vw <= 640 ? 16 : 36;
      var padY = vw <= 640 ? 16 : 36;
      var naturalW = dialog.offsetWidth || 1;
      var naturalH = dialog.offsetHeight || 1;
      var scale = Math.min(1, (vw - padX) / naturalW, (vh - padY) / naturalH);
      if (!Number.isFinite(scale) || scale <= 0) scale = 1;
      // Sem barra interna: em telas realmente pequenas o conteúdo reduz como bloco.
      dialog.style.setProperty('--sp-modal-scale', String(Math.max(.32, scale)));
    }
    function lockPage() {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('smart-plant-modal-open');
      document.body.classList.add('smart-plant-body-locked');
      document.body.style.top = (-lockedScrollY) + 'px';
      document.body.style.width = '100%';
      viewportHandler = function () {
        window.requestAnimationFrame(function () {
          syncVisualViewportBox();
          fitModalToViewport();
        });
      };
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', viewportHandler, { passive:true });
        window.visualViewport.addEventListener('scroll', viewportHandler, { passive:true });
      }
      window.addEventListener('resize', viewportHandler, { passive:true });
      window.addEventListener('orientationchange', viewportHandler, { passive:true });
    }
    function setupMagnifier(image) {
      if (magnifierCleanup) { try { magnifierCleanup(); } catch (_) {} magnifierCleanup = null; }
      if (!modal || !image) return;
      var stage = modal.querySelector('[data-smart-plant-magnifier-stage]');
      var lens = modal.querySelector('[data-smart-plant-magnifier]');
      var settingsToggle = modal.querySelector('[data-smart-plant-magnifier-settings-toggle]');
      var settingsPanel = modal.querySelector('[data-smart-plant-magnifier-settings]');
      var zoomButtons = Array.prototype.slice.call(modal.querySelectorAll('[data-smart-plant-zoom]'));
      if (!stage || !lens) return;

      function boolData(name, fallback) {
        var value = String(root.dataset[name] == null ? '' : root.dataset[name]).trim().toLowerCase();
        if (!value) return fallback;
        return !['false','0','no','off'].includes(value);
      }
      var touchToggle = boolData('magnifierTouchToggle', true);
      var clickPosition = boolData('magnifierClickPosition', true);
      var dragPosition = boolData('magnifierDragPosition', true);
      var followMouse = boolData('magnifierFollowMouse', false);
      var holdMode = boolData('magnifierStartHidden', true);
      var hint = modal.querySelector('[data-smart-plant-magnifier-hint]');
      if (hint) hint.hidden = !holdMode;
      stage.dataset.holdMode = String(holdMode);
      lens.classList.toggle('is-hold-mode', holdMode);
      var zoom = String(root.dataset.magnifierZoom || '3') === '2' ? 2 : 3;
      var dragging = false;
      var pointerId = null;
      var dragMoved = false;
      var downX = 0, downY = 0;
      var suppressLensClick = false;
      var touchStart = null;
      var lastTouchToggleAt = 0;

      lens.dataset.dragEnabled = dragPosition ? 'true' : 'false';

      function sourceUrl() { return safeImage(image.currentSrc || image.src || ''); }
      function updateZoomUi() {
        lens.setAttribute('aria-label', 'Lupa ' + zoom + ' vezes');
        zoomButtons.forEach(function (button) {
          button.classList.toggle('is-active', Number(button.dataset.smartPlantZoom) === zoom);
        });
      }
      function place(clientX, clientY) {
        var rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        var y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        lens.style.left = x + 'px'; lens.style.top = y + 'px';
        lens.style.backgroundImage = 'url("' + sourceUrl().replace(/"/g,'\\"') + '")';
        lens.style.backgroundSize = (rect.width * zoom) + 'px ' + (rect.height * zoom) + 'px';
        lens.style.backgroundPosition = ((75 - x * zoom)) + 'px ' + ((75 - y * zoom)) + 'px';
      }
      function refreshAtCurrentPosition() {
        var rect = stage.getBoundingClientRect();
        var left = parseFloat(lens.style.left), top = parseFloat(lens.style.top);
        if (!Number.isFinite(left)) left = rect.width / 2;
        if (!Number.isFinite(top)) top = rect.height / 2;
        place(rect.left + left, rect.top + top);
      }
      function center() { var r = stage.getBoundingClientRect(); place(r.left + r.width/2, r.top + r.height/2); }
      function setVisible(visible) { lens.classList.toggle('is-hidden', !visible); }
      function toggleVisible() { setVisible(lens.classList.contains('is-hidden')); }
      function setSettingsOpen(open) {
        if (!settingsPanel) return;
        settingsPanel.classList.toggle('is-open', !!open);
        settingsPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (settingsToggle) settingsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      function toggleSettings() { setSettingsOpen(!(settingsPanel && settingsPanel.classList.contains('is-open'))); }
      function chooseZoom(event) {
        var button = event.currentTarget;
        zoom = Number(button.dataset.smartPlantZoom) === 2 ? 2 : 3;
        updateZoomUi();
        refreshAtCurrentPosition();
        event.preventDefault(); event.stopPropagation();
      }
      function down(event) {
        if (!dragPosition) return;
        dragging = true; pointerId = event.pointerId; dragMoved = false; downX = event.clientX; downY = event.clientY;
        lens.classList.add('is-dragging');
        try { lens.setPointerCapture(pointerId); } catch (_) {}
        place(event.clientX,event.clientY); event.preventDefault(); event.stopPropagation();
      }
      function move(event) {
        if (!dragging || (pointerId != null && event.pointerId !== pointerId)) return;
        if (Math.abs(event.clientX-downX) > 3 || Math.abs(event.clientY-downY) > 3) dragMoved = true;
        place(event.clientX,event.clientY); event.preventDefault(); event.stopPropagation();
      }
      function up(event) {
        if (!dragging || (pointerId != null && event.pointerId !== pointerId)) return;
        suppressLensClick = true;
        if (!dragMoved) toggleSettings();
        dragging=false; lens.classList.remove('is-dragging');
        try { lens.releasePointerCapture(pointerId); } catch (_) {} pointerId=null;
        event.preventDefault(); event.stopPropagation();
        setTimeout(function () { suppressLensClick = false; }, 0);
      }
      function lensClick(event) {
        if (suppressLensClick) return;
        toggleSettings();
        event.preventDefault(); event.stopPropagation();
      }
      function stageClick(event) {
        if (holdMode) return;
        if (!clickPosition || (Date.now() - lastTouchToggleAt) < 500) return;
        if (event.target.closest('[data-smart-plant-magnifier], [data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) return;
        if (event.pointerType === 'touch') return;
        setVisible(true); place(event.clientX,event.clientY);
      }
      function stagePointerMove(event) {
        if (holdMode) return;
        if (!followMouse || dragging || event.pointerType !== 'mouse') return;
        if (event.target.closest('[data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) return;
        setVisible(true); place(event.clientX,event.clientY);
      }
      function stagePointerDown(event) {
        if (holdMode) return;
        if (!touchToggle || event.pointerType !== 'touch') return;
        if (event.target.closest('[data-smart-plant-magnifier], [data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) return;
        touchStart = { id:event.pointerId, x:event.clientX, y:event.clientY };
      }
      function stagePointerUp(event) {
        if (holdMode) return;
        if (!touchToggle || event.pointerType !== 'touch' || !touchStart || touchStart.id !== event.pointerId) return;
        if (event.target.closest('[data-smart-plant-magnifier], [data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]')) { touchStart=null; return; }
        var moved = Math.abs(event.clientX-touchStart.x) > 8 || Math.abs(event.clientY-touchStart.y) > 8;
        touchStart = null;
        if (moved) return;
        lastTouchToggleAt = Date.now();
        if (lens.classList.contains('is-hidden')) { setVisible(true); place(event.clientX,event.clientY); }
        else toggleVisible();
        event.preventDefault();
      }
      // Modality-independent press-and-hold: no persistent floating lens on entry.
      // Do not hijack native vertical scrolling on touch devices.
      var holdPointer = null;
      function isMagnifierControl(target) {
        return !!(target && target.closest && target.closest('[data-smart-plant-magnifier-settings], [data-smart-plant-magnifier-settings-toggle]'));
      }
      function holdDown(event) {
        if (!holdMode || event.button > 0 || isMagnifierControl(event.target)) return;
        holdPointer = event.pointerId;
        setVisible(true); place(event.clientX, event.clientY);
      }
      function holdMove(event) {
        if (!holdMode || holdPointer !== event.pointerId) return;
        place(event.clientX, event.clientY);
      }
      function holdRelease(event) {
        if (!holdMode || holdPointer !== event.pointerId) return;
        holdPointer = null; setVisible(false);
      }
      function holdKeyDown(event) {
        if (!holdMode || event.target !== stage || (event.key !== ' ' && event.key !== 'Enter') || event.repeat) return;
        event.preventDefault(); center(); setVisible(true);
      }
      function holdKeyUp(event) {
        if (!holdMode || event.target !== stage || (event.key !== ' ' && event.key !== 'Enter')) return;
        event.preventDefault(); setVisible(false);
      }
      function holdBlur() { if (holdMode) {holdPointer=null;setVisible(false);} }
      function toggleSettingsButton(event) { toggleSettings(); event.preventDefault(); event.stopPropagation(); }

      lens.addEventListener('pointerdown', down); lens.addEventListener('pointermove', move); lens.addEventListener('pointerup', up); lens.addEventListener('pointercancel', up); lens.addEventListener('click', lensClick);
      stage.addEventListener('pointerdown', holdDown); stage.addEventListener('pointermove', holdMove); stage.addEventListener('pointerup', holdRelease); stage.addEventListener('pointercancel', holdRelease);
      stage.addEventListener('keydown',holdKeyDown); stage.addEventListener('keyup',holdKeyUp); stage.addEventListener('blur',holdBlur);
      document.addEventListener('pointerup', holdRelease); document.addEventListener('pointercancel', holdRelease);
      stage.addEventListener('click', stageClick); stage.addEventListener('pointermove', stagePointerMove); stage.addEventListener('pointerdown', stagePointerDown); stage.addEventListener('pointerup', stagePointerUp); stage.addEventListener('pointercancel', function(){ touchStart=null; });
      if (settingsToggle) settingsToggle.addEventListener('click', toggleSettingsButton);
      zoomButtons.forEach(function (button) { button.addEventListener('click', chooseZoom); });
      lens.classList.add('is-ready'); setVisible(!holdMode); updateZoomUi(); center(); setSettingsOpen(false);

      magnifierCleanup = function () {
        lens.removeEventListener('pointerdown',down); lens.removeEventListener('pointermove',move); lens.removeEventListener('pointerup',up); lens.removeEventListener('pointercancel',up); lens.removeEventListener('click',lensClick);
        stage.removeEventListener('pointerdown',holdDown); stage.removeEventListener('pointermove',holdMove); stage.removeEventListener('pointerup',holdRelease); stage.removeEventListener('pointercancel',holdRelease);
        stage.removeEventListener('keydown',holdKeyDown); stage.removeEventListener('keyup',holdKeyUp); stage.removeEventListener('blur',holdBlur);
        document.removeEventListener('pointerup',holdRelease); document.removeEventListener('pointercancel',holdRelease);
        stage.removeEventListener('click',stageClick); stage.removeEventListener('pointermove',stagePointerMove); stage.removeEventListener('pointerdown',stagePointerDown); stage.removeEventListener('pointerup',stagePointerUp);
        if (settingsToggle) settingsToggle.removeEventListener('click',toggleSettingsButton);
        zoomButtons.forEach(function (button) { button.removeEventListener('click',chooseZoom); });
        lens.classList.remove('is-ready','is-dragging','is-hidden','is-hold-mode'); setSettingsOpen(false);
      };
    }

    function closeModal(navigateToForm) {
      if (!modal || closing || !modal.classList.contains('is-open')) return;
      closing = true;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      if (magnifierCleanup) { try { magnifierCleanup(); } catch (_) {} magnifierCleanup = null; }
      // CTA de formulário: não provocar qualquer retorno às plantas.
      // Fechamento manual (X/Escape/fundo): preservar o scroll anterior.
      unlockPage(!navigateToForm);
      active = null;
      var restore = navigateToForm ? null : lastTrigger;
      lastTrigger = null;
      window.setTimeout(function () {
        closing = false;
        if (restore && restore.isConnected && restore.focus) {
          try { restore.focus({ preventScroll:true }); } catch (_) { restore.focus(); }
        }
      }, 30);
    }
    function openModal(id, trigger) {
      active = plants.find(function (item) { return String(item.id) === String(id); }) || null;
      if (!active || !modal) return;
      ensureModalPortal();
      syncPortalTheme();
      syncVisualViewportBox();
      lastTrigger = trigger || document.activeElement || null;
      closing = false;
      var image = modal.querySelector('[data-smart-plant-modal-image]');
      var title = modal.querySelector('[data-smart-plant-modal-title]');
      var badgeWrap = modal.querySelector('[data-smart-plant-modal-badges]');
      var positionImage = modal.querySelector('[data-smart-plant-position-image]');
      var position = modal.querySelector('[data-smart-plant-position]');
      var positionBlock = modal.querySelector('[data-smart-plant-position-block]');
      var action = modal.querySelector('[data-smart-plant-action]');
      var full = safeImage(active.fullImage || active.image);
      if (image) { image.src = full; image.alt = active.title || 'Planta'; }
      if (title) title.textContent = active.title;
      if (badgeWrap) badgeWrap.innerHTML = badges(active).map(function (item) { return '<span class="smart-plant__badge">' + esc(item) + '</span>'; }).join('');
      if (positionImage) {
        var posSrc = safeImage(active.positionImage);
        positionImage.src = posSrc;
        positionImage.style.display = posSrc ? 'block' : 'none';
      }
      if (position) position.textContent = active.position || '';
      if (positionBlock) positionBlock.style.display = (active.position || active.positionImage) ? '' : 'none';
      var actionStatus = modal.querySelector('[data-smart-plant-action-status]');
      if (actionStatus) actionStatus.textContent = '';
      if (action) action.textContent = root.dataset.actionMode === 'form' ? (root.dataset.actionLabelForm || 'Gostei desta planta. Quero mais informações') : (root.dataset.actionLabelWhats || 'Gostei desta! Quero mais informações');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      lockPage();
      window.requestAnimationFrame(function () {
        fitModalToViewport();
        window.requestAnimationFrame(fitModalToViewport);
      });
      if (image) {
        // Initialize controls and the hidden state immediately, even while the
        // high-resolution image is still loading (or if the image is unavailable).
        setupMagnifier(image);
        image.onload = function () { fitModalToViewport(); setupMagnifier(image); };
      }
      setTimeout(function () {
        fitModalToViewport();
        var closeButton = modal.querySelector('[data-smart-plant-close].smart-plant__close');
        if (closeButton && closeButton.focus) closeButton.focus({ preventScroll:true });
      }, 40);
    }
    function sendAction() {
      if (!active) return;
      var mode = root.dataset.actionMode === 'form' ? 'form' : 'whatsapp';
      if (mode === 'whatsapp') {
        var number = String(root.dataset.whatsNumber || '').replace(/\D+/g,'');
        var message = fillTemplate(root.dataset.whatsMessage, root, active);
        var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank', 'noopener');
        return;
      }
      var detail = {
        source:'smart-plant',
        empreendimento:root.dataset.empreendimento || '',
        plantId:active.id,
        plantCode:active.code || '',
        plantTitle:active.title,
        area:active.area,
        message:fillTemplate(root.dataset.formContextMessage, root, active),
        targetAnchor:String(root.dataset.formAnchor || '').trim().replace(/^#/,'')
      };

      // A âncora configurada identifica primeiro o destino real; a existência de
      // um Popup em outra parte da página não deve sequestrar o clique do V4.
      // 1.5.0 — Uma página pode ter a mesma âncora em várias seções (ex.: botões
      // e formulário com "contato"). getElementById devolvia o PRIMEIRO, um botão,
      // e a navegação parava antes do formulário. Agora todos os candidatos são
      // avaliados e o que pertence a um formulário tem prioridade.
      function anchorCandidates() {
        var anchor = detail.targetAnchor;
        if (!anchor) return [];
        try { return Array.prototype.slice.call(document.querySelectorAll('[id="' + anchor.replace(/["\\]/g, '\\$&') + '"]')); }
        catch (_) { var one = document.getElementById(anchor); return one ? [one] : []; }
      }
      function targetScope() {
        var list = anchorCandidates();
        for (var i = 0; i < list.length; i++) {
          if (pluginFor(list[i], 'form-sender-v4') || pluginFor(list[i], 'agendamento-sender') || pluginFor(list[i], 'form-sender-popup')) return list[i];
        }
        return list[0] || null;
      }
      function pluginFor(scope, pluginName) {
        if (!scope) return null;
        var selector = '[data-plugin="' + pluginName + '"]';
        if (scope.matches && scope.matches(selector)) return scope;
        if (scope.closest) {
          var parent = scope.closest(selector);
          if (parent) return parent;
        }
        return scope.querySelector ? scope.querySelector(selector) : null;
      }
      function findMount(section) {
        return section && section.querySelector ? section.querySelector('.formsenderV4_mount') : null;
      }
      function popupEligible(section) {
        if (!section) return null;
        var mount = section.querySelector('[data-fsp-mount]');
        if (!mount) return null;
        return /^(?:true|1|on)$/i.test(mount.dataset.smartPlantIntegration || '') ? mount : null;
      }
      function showError(message) {
        var status = modal.querySelector('[data-smart-plant-action-status]');
        if (status) status.textContent = message;
        else console.warn('[Smart Plant] ' + message);
      }
      function writeFormSenderV4Context(mount) {
        var form = mount && (mount.formsenderV4 && mount.formsenderV4.form || mount.querySelector('form'));
        if (!form) return false;
        function setHidden(name, value) {
          var field = form.querySelector('[name="' + name + '"]');
          if (!field) {
            field = document.createElement('input');
            field.type = 'hidden';
            field.name = name;
            form.appendChild(field);
          }
          field.value = String(value || '');
        }
        setHidden('origem', 'Smart Plant');
        setHidden('smartPlantId', detail.plantId);
        setHidden('smartPlantCode', detail.plantCode);
        setHidden('smartPlant', detail.plantTitle);
        setHidden('smartPlantArea', detail.area);

        var msg = form.querySelector('[name="msg"]');
        if (!msg) {
          msg = document.createElement('input');
          msg.type = 'hidden';
          msg.name = 'msg';
          form.appendChild(msg);
        }
        // Troca a seleção anterior em vez de acumular múltiplas plantas.
        var current = String(msg.value || '').trim();
        var previous = String(form.dataset.smartPlantMessage || '');
        if (previous && current.indexOf(previous) >= 0) current = current.replace(previous, '').trim();
        var lines = [
          detail.plantTitle ? 'Planta: ' + detail.plantTitle : '',
          detail.area ? 'Metragem: ' + detail.area : '',
          detail.plantCode ? 'Identificador: ' + detail.plantCode : ''
        ].filter(Boolean);
        if (detail.message) lines.push('', detail.message);
        var block = lines.join('\n').trim();
        form.dataset.smartPlantMessage = block;
        msg.value = [current, block].filter(Boolean).join('\n\n');
        mount.dataset.smartPlantSelected = detail.plantId || detail.plantTitle || 'true';
        return true;
      }

      // Resolve o DESTINO pelo componente vinculado à âncora. O Form Sender V4,
      // o Agendamento Sender e o Popup são independentes, mas usam o mesmo CTA.
      // O modo automático preserva projetos antigos configurados somente com
      // actionMode=form e formAnchor=contato.
      var anchorElement = targetScope();
      var requestedType = String(root.dataset.formDestination || 'auto').toLowerCase();
      var knownTypes = ['form-sender-v4','agendamento-sender','form-sender-popup'];
      if (knownTypes.indexOf(requestedType) === -1) requestedType = 'auto';
      var matched = {
        'form-sender-v4':pluginFor(anchorElement, 'form-sender-v4'),
        'agendamento-sender':pluginFor(anchorElement, 'agendamento-sender'),
        'form-sender-popup':pluginFor(anchorElement, 'form-sender-popup')
      };
      function mountFor(type, section) {
        if (!section) return null;
        if (type === 'form-sender-v4') return section.querySelector('.formsenderV4_mount');
        if (type === 'agendamento-sender') return section.querySelector('[data-ags-mount]');
        if (type === 'form-sender-popup') return popupEligible(section);
        return null;
      }
      function firstAvailable(type) {
        var sections = document.querySelectorAll('[data-plugin="' + type + '"]');
        for (var i = 0; i < sections.length; i++) {
          var mount = mountFor(type, sections[i]);
          if (mount) return {type:type, section:sections[i], mount:mount};
        }
        return null;
      }
      var chosen = null;
      var matchedType = knownTypes.filter(function(type){return !!matched[type];})[0] || '';
      if (matchedType && (requestedType === 'auto' || requestedType === matchedType)) {
        var selectedMount = mountFor(matchedType, matched[matchedType]);
        if (selectedMount) chosen = {type:matchedType, section:matched[matchedType], mount:selectedMount};
      }
      // Quando o usuário seleciona explicitamente um tipo, a escolha prevalece
      // sobre uma âncora antiga (ex.: "contato" ainda apontando ao V4).
      if (!chosen && requestedType !== 'auto') chosen = firstAvailable(requestedType);
      if (!chosen && requestedType === 'auto') {
        // Compatibilidade: com mais de um formulário, V4 é o padrão histórico;
        // a âncora do Agendamento Sender prevalece sempre que configurada.
        chosen = firstAvailable('form-sender-v4') || firstAvailable('agendamento-sender') || firstAvailable('form-sender-popup');
      }
      if (!chosen) {
        showError('Formulário não encontrado. Adicione um Form Sender V4 ou Agendamento Sender e configure a âncora correspondente.');
        return;
      }
      if (chosen.type === 'form-sender-v4' && !(chosen.mount.formsenderV4 && chosen.mount.formsenderV4.form || chosen.mount.querySelector('form'))) {
        showError('Form Sender V4 ainda não foi inicializado. Verifique o carregamento do formulário.');
        return;
      }
      if (chosen.type === 'agendamento-sender' && chosen.mount.dataset.agsReady !== 'true') {
        showError('Agendamento Sender ainda não foi inicializado. Verifique o carregamento do plugin.');
        return;
      }
      if (chosen.type === 'form-sender-popup') {
        closeModal();
        window.requestAnimationFrame(function(){
          window.requestAnimationFrame(function(){
            window.dispatchEvent(new CustomEvent('imobify:smart-plant-popup', {
              detail:Object.assign({}, detail, {targetPopupMount:chosen.mount, explicitAction:true})
            }));
          });
        });
        return;
      }
      // 7.3.5 — Sequência sem rolagem concorrente:
      // 1. Fecha o modal e libera o body, SEM retornar às plantas.
      // 2. Atualiza o texto da planta no formulário de destino.
      // 3. Navega à âncora após a liberação do body.
      // A ancora e o formulario sao conceitos independentes: o plugin de
      // formulario selecionado recebe o contexto, mas a navegacao deve ir
      // SEMPRE ao ID configurado no Smart Plant (ex.: #contato). Na versao
      // anterior, uma ancora pertencente a outro componente era ignorada.
      var configuredAnchor = detail.targetAnchor || 'contato';
      // 1.5.0 — O destino da rolagem é SEMPRE o formulário que recebeu a planta.
      // A âncora configurada é usada quando está no próprio formulário, ou quando
      // marca um título logo acima dele (até 1,5 tela antes). Uma âncora em outro
      // componente distante (ex.: um botão com "contato") não desvia mais o clique.
      function currentDestination() {
        var form = chosen.section && chosen.section.isConnected ? chosen.section : null;
        var list = anchorCandidates();
        if (!form) return list[0] || null;
        for (var i = 0; i < list.length; i++) {
          if (form.contains(list[i]) || list[i].contains(form)) return list[i];
        }
        var formTop = form.getBoundingClientRect().top;
        var limit = (window.innerHeight || 800) * 1.5;
        for (var j = 0; j < list.length; j++) {
          var gap = formTop - list[j].getBoundingClientRect().top;
          if (gap >= 0 && gap <= limit) return list[j];
        }
        return form;
      }
      var selectedMount = chosen.mount;
      // Na prévia de edição, desativa o auto-foco da seção selecionada
      // enquanto o visitante segue para o formulário.
      document.dispatchEvent(new CustomEvent('imobify:smart-plant-navigation', {
        detail:{destination:chosen.type, targetAnchor:detail.targetAnchor}
      }));
      closeModal(true);
      if (chosen.type === 'form-sender-v4') {
        if (!writeFormSenderV4Context(chosen.mount)) {
          console.warn('[Smart Plant] Form Sender V4 não aceitou o contexto da planta.');
          return;
        }
        window.dispatchEvent(new CustomEvent('imobify:smart-plant-form', { detail:Object.assign({}, detail, {handled:true, destination:'form-sender-v4'}) }));
      } else if (chosen.type === 'agendamento-sender') {
        chosen.mount.dispatchEvent(new CustomEvent('imobify:smart-plant-select', {
          bubbles:true,
          detail:Object.assign({}, detail, {handled:true, destination:'agendamento-sender'})
        }));
      }
      // Atualiza a URL sem acionar uma navegacao nativa concorrente, depois
      // calcula a posicao real do ID configurado (nao do formulario ou de
      // uma section arbitraria). O destino pode ser um span absoluto do Core.
      function jumpToAnchor() {
        var target = currentDestination();
        if (!target || !target.isConnected) return false;
        var doc = document.documentElement;
        var old = doc.style.getPropertyValue('scroll-behavior');
        var priority = doc.style.getPropertyPriority('scroll-behavior');
        var oldBody = document.body.style.getPropertyValue('scroll-behavior');
        var bodyPriority = document.body.style.getPropertyPriority('scroll-behavior');
        doc.style.setProperty('scroll-behavior', 'auto', 'important');
        document.body.style.setProperty('scroll-behavior', 'auto', 'important');
        try {
          var top = Math.max(0, Math.round(target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0)));
          window.scrollTo({top:top, left:0, behavior:'instant'});
        } catch (_) {
          try { target.scrollIntoView({behavior:'auto',block:'start'}); } catch (_) {}
        } finally {
          if (old) doc.style.setProperty('scroll-behavior',old,priority);
          else doc.style.removeProperty('scroll-behavior');
          if (oldBody) document.body.style.setProperty('scroll-behavior',oldBody,bodyPriority);
          else document.body.style.removeProperty('scroll-behavior');
        }
        return true;
      }
      // O #contato deve aparecer na URL, inclusive quando nao e descendente
      // do Form Sender/Agendamento Sender selecionado.
      if (anchorElement && configuredAnchor) {
        try { window.history.replaceState(window.history.state, '', '#' + encodeURIComponent(configuredAnchor)); }
        catch (_) { /* URLs locais/sandbox podem bloquear history.replaceState. */ }
      }
      // O modal ja foi fechado sem uma rolagem suave concorrente. A primeira
      // rolagem ocorre no frame seguinte, seguida por verificacoes curtas
      // para ajustes de layout apos remover position:fixed no body.
      function focusRecipient() {
        var input = selectedMount.querySelector('[name="nome"]') || selectedMount.querySelector('input:not([type="hidden"])');
        if (input && input.focus) {
          try { input.focus({preventScroll:true}); }
          catch (_) { try { input.focus(); } catch (ignored) {} jumpToAnchor(); }
        }
      }
      window.requestAnimationFrame(function () {
        jumpToAnchor();
        window.requestAnimationFrame(function () {
          jumpToAnchor();
          focusRecipient();
          [90, 260, 500].forEach(function (delay) {
            window.setTimeout(function () {
              var target = currentDestination();
              if (!target || !target.isConnected) return;
              var top = target.getBoundingClientRect().top;
              // Nunca voltar para as plantas por causa de um reflow do modal
              // ou de uma transformacao/animacao de entrada da secao.
              if (top < -65 || top > Math.min(140, window.innerHeight * .2)) jumpToAnchor();
            }, delay);
          });
        });
      });
    }
    root.addEventListener('click', function (event) {
      var open = event.target.closest('[data-smart-plant-open]');
      if (open) { openModal(open.dataset.smartPlantOpen, open); return; }
    });
    if (modal) {
      // Listener próprio porque o modal é movido para um portal fora da section.
      // Click é intencional: evita o duplo disparo touchend + click no Safari iOS.
      modal.addEventListener('click', function (event) {
        var closeControl = event.target.closest('[data-smart-plant-close]');
        if (closeControl) {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }
        var actionControl = event.target.closest('[data-smart-plant-action]');
        if (actionControl) {
          event.preventDefault();
          event.stopPropagation();
          sendAction();
        }
      });
    }
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal(); });
  }
  function boot() { document.querySelectorAll('[data-plugin="smart-plant"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

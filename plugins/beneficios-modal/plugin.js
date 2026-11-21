(function () {
  'use strict';

  var SHOWCASE_PROFILES = {
    signature: { title:'#1f2a2e', heading:'#17242a', accent:'#6f8f62', icon:'#ffffff', surface:'#18232d', border:'#7f9c73' },
    ivory: { title:'#332e28', heading:'#211f1b', accent:'#8b6f47', icon:'#fbf7ef', surface:'#6d5a40', border:'#b79c72' },
    mineral: { title:'#28323a', heading:'#1a232b', accent:'#6f8796', icon:'#f7fafc', surface:'#314553', border:'#8ba1ae' },
    forest: { title:'#233029', heading:'#15231b', accent:'#6f8b64', icon:'#f6f7f2', surface:'#254332', border:'#8ca684' },
    monochrome: { title:'#181b1e', heading:'#0e1113', accent:'#6e7478', icon:'#ffffff', surface:'#15191c', border:'#555e63' }
  };

  var MODAL_PROFILES = {
    obsidian: { background:'#111619', accent:'#bfa06a', border:'#6e5e45', iconSurface:'#252a2d' },
    ivory: { background:'#f3efe7', accent:'#8a6c43', border:'#bca783', iconSurface:'#e1d6c3' },
    forest: { background:'#142019', accent:'#9eb68d', border:'#526a4d', iconSurface:'#24352b' },
    midnight: { background:'#111a28', accent:'#8faec7', border:'#465f75', iconSurface:'#1e2c3f' },
    mineral: { background:'#2c3033', accent:'#c0b49b', border:'#69645b', iconSurface:'#3b4145' }
  };

  // Valores sentinela do manifesto. Enquanto o usuário não alterar uma cor,
  // o perfil visual pode fornecer a paleta-base. Depois que a cor é alterada
  // no Inspetor, ela passa a ter prioridade sobre o perfil naquele atributo.
  var DEFAULT_SHOWCASE_COLORS = {
    title:'#1d2730', icon:'#ffffff', surface:'#18232d', border:'#6f8f62'
  };
  var DEFAULT_MODAL_COLORS = {
    background:'#0f171d', accent:'#83a873', border:'#83a873', iconSurface:'#18232d'
  };

  function setVar(node, name, value) {
    if (node && value) node.style.setProperty(name, value);
  }

  function inlineVar(component, name) {
    return component && component.style ? String(component.style.getPropertyValue(name) || '').trim() : '';
  }

  function sameColor(a, b) {
    var ca = parseColor(a), cb = parseColor(b);
    return Boolean(ca && cb && ca[0] === cb[0] && ca[1] === cb[1] && ca[2] === cb[2]);
  }

  function applyProfileColor(component, name, paletteValue, defaultValue) {
    var authored = inlineVar(component, name);
    // Sem valor próprio, ou ainda com o default original do componente: usa o perfil.
    // Se o usuário escolheu outra cor no Inspetor, ela é preservada.
    if (!authored || sameColor(authored, defaultValue)) setVar(component, name, paletteValue);
  }

  function applyShowcaseProfile(component) {
    var profile = String(component.dataset.showcaseProfile || 'custom').toLowerCase();
    var palette = SHOWCASE_PROFILES[profile];
    if (!palette) return;
    applyProfileColor(component, '--bmp-title-color', palette.title, DEFAULT_SHOWCASE_COLORS.title);
    setVar(component, '--bmp-showcase-heading', palette.heading);
    setVar(component, '--bmp-showcase-accent', palette.accent);
    applyProfileColor(component, '--bmp-icon-color', palette.icon, DEFAULT_SHOWCASE_COLORS.icon);
    applyProfileColor(component, '--bmp-icon-surface', palette.surface, DEFAULT_SHOWCASE_COLORS.surface);
    applyProfileColor(component, '--bmp-icon-border', palette.border, DEFAULT_SHOWCASE_COLORS.border);
  }

  function applyModalProfile(component) {
    var profile = String(component.dataset.modalProfile || 'custom').toLowerCase();
    var palette = MODAL_PROFILES[profile];
    if (!palette) return;
    applyProfileColor(component, '--bmp-modal-bg', palette.background, DEFAULT_MODAL_COLORS.background);
    applyProfileColor(component, '--bmp-modal-accent', palette.accent, DEFAULT_MODAL_COLORS.accent);
    applyProfileColor(component, '--bmp-modal-border', palette.border, DEFAULT_MODAL_COLORS.border);
    applyProfileColor(component, '--bmp-modal-icon-surface', palette.iconSurface, DEFAULT_MODAL_COLORS.iconSurface);
  }

  function parseColor(value) {
    var text = String(value || '').trim().toLowerCase();
    var match;
    if ((match = text.match(/^#([0-9a-f]{3})$/i))) {
      return match[1].split('').map(function (c) { return parseInt(c + c, 16); });
    }
    if ((match = text.match(/^#([0-9a-f]{6})$/i))) {
      return [parseInt(match[1].slice(0,2),16), parseInt(match[1].slice(2,4),16), parseInt(match[1].slice(4,6),16)];
    }
    if ((match = text.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i))) {
      return [Number(match[1]), Number(match[2]), Number(match[3])].map(function (v) { return Math.max(0, Math.min(255, v)); });
    }
    return null;
  }

  function linear(channel) {
    var c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
  }

  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function mix(foreground, background, weight) {
    return [0,1,2].map(function (i) { return Math.round(foreground[i] * weight + background[i] * (1 - weight)); });
  }

  function rgbCss(rgb) { return 'rgb(' + rgb[0] + ' ' + rgb[1] + ' ' + rgb[2] + ')'; }

  function bestForeground(background) {
    var light = [250, 251, 252];
    var dark = [18, 23, 27];
    return contrast(light, background) >= contrast(dark, background) ? light : dark;
  }

  function secondaryForeground(foreground, background, target) {
    var weight = 0.72;
    var candidate = mix(foreground, background, weight);
    while (weight < 1 && contrast(candidate, background) < target) {
      weight = Math.min(1, weight + 0.04);
      candidate = mix(foreground, background, weight);
    }
    return candidate;
  }

  function readVar(component, name, fallback) {
    var value = getComputedStyle(component).getPropertyValue(name).trim();
    return value || fallback;
  }

  function applyAutoContrast(component) {
    if (String(component.dataset.modalContrast || 'auto').toLowerCase() !== 'auto') return;
    // A decisão parte da cor EFETIVA do modal, já considerando perfil + ajuste manual.
    var background = parseColor(readVar(component, '--bmp-modal-bg', '#111619'));
    if (!background) return;

    var foreground = bestForeground(background);
    var secondary = secondaryForeground(foreground, background, 4.7);
    var tone = luminance(background) < 0.38 ? 'dark' : 'light';
    component.dataset.modalTone = tone;
    setVar(component, '--bmp-modal-title', rgbCss(foreground));
    setVar(component, '--bmp-modal-text', rgbCss(secondary));
    setVar(component, '--bmp-modal-close-fg', rgbCss(foreground));

    var iconBackground = parseColor(readVar(component, '--bmp-modal-icon-surface', '#252a2d')) || background;
    setVar(component, '--bmp-modal-icon', rgbCss(bestForeground(iconBackground)));
  }

  function applyColorProfiles(component) {
    applyShowcaseProfile(component);
    applyModalProfile(component);
    applyAutoContrast(component);
  }

  function dialogFromTrigger(root, trigger) {
    var id = trigger && trigger.getAttribute('aria-controls');
    if (!id) return null;
    try { return root.querySelector('#' + CSS.escape(id)); }
    catch (_) { return document.getElementById(id); }
  }

  function openDialog(dialog, trigger) {
    if (!dialog) return;
    dialog.__bmpTrigger = trigger || null;
    try {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } catch (_) { dialog.setAttribute('open', ''); }
    var close = dialog.querySelector('[data-benefit-close]');
    if (close) window.setTimeout(function () { try { close.focus({ preventScroll:true }); } catch (_) { close.focus(); } }, 0);
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    var trigger = dialog.__bmpTrigger;
    try {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    } catch (_) { dialog.removeAttribute('open'); }
    if (trigger && typeof trigger.focus === 'function') window.setTimeout(function () { try { trigger.focus({ preventScroll:true }); } catch (_) { trigger.focus(); } }, 0);
  }

  function init(root) {
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    var component = root.querySelector('.benefits-modal-pro');
    if (!component) return;

    applyColorProfiles(component);

    root.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-benefit-open]');
      if (trigger && root.contains(trigger)) {
        event.preventDefault();
        openDialog(dialogFromTrigger(root, trigger), trigger);
        return;
      }
      var close = event.target.closest('[data-benefit-close]');
      if (close && root.contains(close)) {
        event.preventDefault();
        closeDialog(close.closest('dialog'));
      }
    });

    root.querySelectorAll('.bmp-dialog').forEach(function (dialog) {
      dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        if (String(component.dataset.closeBackdrop).toLowerCase() !== 'true') return;
        closeDialog(dialog);
      });
      dialog.addEventListener('cancel', function (event) {
        event.preventDefault();
        closeDialog(dialog);
      });
      dialog.addEventListener('close', function () {
        var trigger = dialog.__bmpTrigger;
        dialog.__bmpTrigger = null;
        if (trigger && typeof trigger.focus === 'function' && document.activeElement !== trigger) {
          try { trigger.focus({ preventScroll:true }); } catch (_) {}
        }
      });
    });
  }

  function boot() { document.querySelectorAll('[data-plugin="beneficios-modal"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

(function () {
  const { plugins, esc } = window.ImobifyCatalog;
  const cache = new Map();

  async function fetchText(path) {
    if (cache.has(path)) return cache.get(path);
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Não foi possível carregar ${path}`);
    const text = await response.text();
    cache.set(path, text);
    return text;
  }

  function activePluginKeys(state, options = {}) {
    const sections = (state.sections || []).filter((section) => options.includeHidden || section.settings?.visible !== false);
    return [...new Set([...sections.map((section) => section.type), ...(state.behaviorPlugins || []), 'reveal'])].filter((key) => plugins[key]);
  }

  async function loadSources(state, options = {}) {
    const keys = activePluginKeys(state, options);
    // Plugins documentais (ex.: Tag Installer) precisam constar no inventário do
    // projeto, mas não devem levar CSS/JS de interface para a landing publicada.
    const resourceKeys = keys.filter((key) => plugins[key]?.manifest?.output !== 'document-tag' || options.editor);
    const cssParts = await Promise.all([
      fetchText('core/base.css'),
      fetchText('core/element-motion.css'),
      ...resourceKeys.map((key) => plugins[key].cssText != null ? Promise.resolve(plugins[key].cssText) : fetchText(plugins[key].cssPath)),
      fetchText('core/design-system.css'),
      fetchText('core/responsive-typography.css')
    ]);
    const jsParts = await Promise.all([
      fetchText('core/runtime.js'),
      fetchText('core/element-motion.js'),
      ...resourceKeys.map((key) => plugins[key].jsText != null ? Promise.resolve(plugins[key].jsText) : fetchText(plugins[key].jsPath))
    ]);
    return { css: cssParts.join('\n\n'), js: jsParts.join('\n\n'), keys };
  }

  function fontStack(font) {
    return `'${String(font || 'Inter').replace(/'/g, '')}', system-ui, sans-serif`;
  }

  function hexToRgb(hex) {
    const raw = String(hex || '').trim().replace('#','');
    if (!/^[0-9a-f]{6}$/i.test(raw)) return null;
    return { r:parseInt(raw.slice(0,2),16), g:parseInt(raw.slice(2,4),16), b:parseInt(raw.slice(4,6),16) };
  }

  function rgbToHex(rgb) {
    const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2,'0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const channel = (value) => { value /= 255; return value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); };
    return channel(rgb.r) * .2126 + channel(rgb.g) * .7152 + channel(rgb.b) * .0722;
  }

  function contrastRatio(a, b) {
    const l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1,l2) + .05) / (Math.min(l1,l2) + .05);
  }

  function mixHex(a, b, amount) {
    const from = hexToRgb(a), to = hexToRgb(b);
    if (!from || !to) return a;
    const t = Math.max(0, Math.min(1, Number(amount) || 0));
    return rgbToHex({ r:from.r + (to.r-from.r)*t, g:from.g + (to.g-from.g)*t, b:from.b + (to.b-from.b)*t });
  }

  function safestText(background) {
    return contrastRatio('#ffffff', background) >= contrastRatio('#000000', background) ? '#ffffff' : '#000000';
  }

  function ensureContrast(preferred, background, minimum = 4.5, enabled = true) {
    if (!enabled || !hexToRgb(preferred) || !hexToRgb(background) || contrastRatio(preferred, background) >= minimum) return preferred;
    const target = safestText(background);
    for (let step = 1; step <= 20; step += 1) {
      const candidate = mixHex(preferred, target, step / 20);
      if (contrastRatio(candidate, background) >= minimum) return candidate;
    }
    return target;
  }

  function variables(state) {
    const b = state.brand;
    const num = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, num(value, min)));
    const rgba = (hex, alpha, fallback = '#000000') => {
      const rgb = hexToRgb(hex) || hexToRgb(fallback) || { r:0, g:0, b:0 };
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0,Math.min(1,alpha)).toFixed(3)})`;
    };
    const shadowPreset = (style, color, strength) => {
      const amount = clamp(strength,0,100) / 100;
      if (style === 'none' || amount <= 0) return 'none';
      if (style === 'soft') return `0 .035em .11em ${rgba(color,.30*amount)}`;
      if (style === 'cinematic') return `0 .018em .012em ${rgba(color,.72*amount)},0 .07em .15em ${rgba(color,.46*amount)},0 .20em .48em ${rgba(color,.27*amount)}`;
      if (style === 'glow') return `0 0 .06em ${rgba(color,.52*amount)},0 0 .20em ${rgba(color,.38*amount)},0 0 .46em ${rgba(color,.20*amount)}`;
      return `0 .018em .018em ${rgba(color,.76*amount)},0 .055em .16em ${rgba(color,.48*amount)},0 .14em .34em ${rgba(color,.24*amount)}`;
    };
    const sectionSpace = num(b.sectionSpace,144);
    const contrastMode = b.contrastMode || 'aa';
    const protectContrast = contrastMode !== 'manual';
    const minimum = contrastMode === 'comfort' ? 7 : 4.5;
    const surface = b.surface || '#f5f7f8';
    const dark = b.dark || '#0e1218';
    const primary = b.primary || '#d7ff3f';
    const accent = b.accent || '#7ca1ff';
    const actionBg = b.actionButtonBackground || primary;
    const heading = ensureContrast(b.headingColor || b.ink || '#101318', surface, minimum, protectContrast);
    const body = ensureContrast(b.bodyColor || b.ink || '#30383d', surface, minimum, protectContrast);
    const muted = ensureContrast(b.mutedColor || '#6b747b', surface, minimum, protectContrast);
    const inverseHeading = ensureContrast(b.inverseHeadingColor || '#ffffff', dark, minimum, protectContrast);
    const inverseBody = ensureContrast(b.inverseBodyColor || '#dbe1e5', dark, minimum, protectContrast);
    const primaryOnSurface = ensureContrast(primary, surface, minimum, protectContrast);
    const primaryOnDark = ensureContrast(primary, dark, minimum, protectContrast);
    const accentOnSurface = ensureContrast(accent, surface, minimum, protectContrast);
    const accentOnDark = ensureContrast(accent, dark, minimum, protectContrast);
    const primaryOnWhite = ensureContrast(primary, '#ffffff', minimum, protectContrast);
    const accentOnWhite = ensureContrast(accent, '#ffffff', minimum, protectContrast);
    const actionOnSurface = ensureContrast(actionBg, surface, minimum, protectContrast);
    const actionOnDark = ensureContrast(actionBg, dark, minimum, protectContrast);
    const actionText = ensureContrast(b.actionButtonText || safestText(actionBg), actionBg, minimum, protectContrast);
    const primaryContrast = ensureContrast(safestText(primary), primary, minimum, protectContrast);
    const accentContrast = ensureContrast(safestText(accent), accent, minimum, protectContrast);
    const whiteHeading = ensureContrast(b.headingColor || b.ink || '#101318', '#ffffff', minimum, protectContrast);
    const whiteBody = ensureContrast(b.bodyColor || b.ink || '#30383d', '#ffffff', minimum, protectContrast);
    const whiteMuted = ensureContrast(b.mutedColor || '#6b747b', '#ffffff', minimum, protectContrast);

    /* Base optical separation from 5.0.1.12 remains available to body copy. */
    const textEffect = b.textEffect || 'auto';
    const effectStrength = clamp(b.textEffectStrength,0,100) / 100;
    const effectOff = textEffect === 'none' || effectStrength <= 0;
    const effectScale = textEffect === 'strong' ? 1.28 : textEffect === 'soft' ? .68 : 1;
    const alpha = (base) => Math.max(0, Math.min(.98, base * effectStrength * effectScale)).toFixed(3);
    const inverseHeadingShadow = effectOff ? 'none' : `0 1px 1px rgba(0,0,0,${alpha(.92)}),0 3px 8px rgba(0,0,0,${alpha(.62)}),0 10px 28px rgba(0,0,0,${alpha(.42)})`;
    const inverseBodyShadow = effectOff ? 'none' : `0 1px 2px rgba(0,0,0,${alpha(.78)}),0 4px 14px rgba(0,0,0,${alpha(.38)})`;
    const lightHeadingShadow = effectOff ? 'none' : `0 1px 0 rgba(255,255,255,${alpha(.70)}),0 1px 2px rgba(0,0,0,${alpha(textEffect === 'strong' ? .20 : .10)})`;
    const lightBodyShadow = effectOff || textEffect !== 'strong' ? 'none' : `0 1px 0 rgba(255,255,255,${alpha(.52)})`;
    const inverseStroke = effectOff || textEffect === 'soft' ? '0px transparent' : `${(textEffect === 'strong' ? .55 : .32) * effectStrength}px rgba(0,0,0,${alpha(.72)})`;
    const lightStroke = effectOff || textEffect !== 'strong' ? '0px transparent' : `${(.22 * effectStrength).toFixed(2)}px rgba(0,0,0,${alpha(.20)})`;

    /* 5.0.1.13 — title/subtitle effects scale with font size through em units.
       A width of 1 means 1% of the rendered font size. */
    const titleOutlinePct = clamp(b.titleOutlineWidth,0,8);
    const subtitleOutlinePct = clamp(b.subtitleOutlineWidth,0,6);
    const titleOutline = titleOutlinePct <= 0 ? '0em transparent' : `${(titleOutlinePct/100).toFixed(4)}em ${b.titleOutlineColor || '#000000'}`;
    const subtitleOutline = subtitleOutlinePct <= 0 ? '0em transparent' : `${(subtitleOutlinePct/100).toFixed(4)}em ${b.subtitleOutlineColor || '#000000'}`;
    const titleShadow = shadowPreset(b.titleShadowStyle || 'contrast', b.titleShadowColor || '#000000', b.titleShadowStrength ?? 72);
    const subtitleShadow = shadowPreset(b.subtitleShadowStyle || 'contrast', b.subtitleShadowColor || '#000000', b.subtitleShadowStrength ?? 52);

    /* 5.0.1.15 — Button Kit. O CTA continua semantico e o renderer converte
       o modelo escolhido em tokens CSS, sem depender do markup de cada plugin. */
    const buttonEffect = ({'kinetic-outline':'outline-minimal','satin-reveal':'satin-luxury','industrial-impact':'industrial-plate','liquid-jelly':'jelly','cyber-pixel':'pixel','neon-explosion':'neon-trace','editorial-stamp':'underline-editorial','mechanical-switch':'machined-steel','aurora-spark':'aurora','glass-prism':'holographic','magnet-shock':'magnet-orbit','playful-confetti':'bubble'})[b.actionButtonEffect] || b.actionButtonEffect || 'depth';
    const buttonClickEffect = b.actionButtonClickEffect || 'press';
    const buttonDepth = clamp(b.actionButtonDepth,0,20);
    const buttonGlow = clamp(b.actionButtonGlow,0,100) / 100;
    const buttonGlassOpacity = clamp(b.actionButtonGlassOpacity,8,100) / 100;
    const buttonGlassBlur = clamp(b.actionButtonGlassBlur,0,36);
    const buttonShine = clamp(b.actionButtonShine,0,100) / 100;
    const buttonBorderWidth = clamp(b.actionButtonBorderWidth,0,4);
    const buttonHoverScale = clamp(b.actionButtonHoverScale ?? 100,100,115) / 100;
    const buttonSpeed = clamp(b.actionButtonSpeed ?? 180,80,700);
    const actionAccent = b.accent || accent || actionBg;
    const actionDark = mixHex(actionBg,'#000000',.34);
    const actionLight = mixHex(actionBg,'#ffffff',.26);
    const actionRgb = hexToRgb(actionBg) || { r:215,g:255,b:63 };
    const accentRgb = hexToRgb(actionAccent) || actionRgb;
    const shineAlpha = (.08 + buttonShine*.34).toFixed(3);
    const shineShadow = buttonShine > 0 ? `inset 0 1px 0 rgba(255,255,255,${shineAlpha})` : '';
    const glowShadow = buttonGlow > 0 ? `0 0 ${Math.round(8 + buttonGlow*28)}px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${(.10 + buttonGlow*.42).toFixed(3)})` : '';
    const depthShadow = buttonDepth > 0 ? `0 ${buttonDepth}px 0 ${actionDark},0 ${Math.round(buttonDepth+6)}px ${Math.round(16+buttonDepth*2.2)}px rgba(0,0,0,.22)` : '';
    const ambientShadow = '0 10px 28px rgba(0,0,0,.16)';
    let actionFill = actionBg;
    let actionShadow = [shineShadow].filter(Boolean).join(',');
    let actionHoverShadow = actionShadow;
    let actionBackdrop = 'none';
    let actionBorderColor = 'transparent';
    let actionHoverBorderColor = actionBorderColor;
    let actionTextShadow = 'none';
    let actionHoverTransform = `translateY(-1px) scale(${buttonHoverScale.toFixed(3)})`;
    let actionActiveTransform = 'translateY(0) scale(.985)';
    let actionBackgroundSize = 'auto';
    let actionBackgroundPosition = 'center';
    let actionHoverBackgroundPosition = 'center';
    let actionAnimation = 'none';

    if (buttonEffect === 'flat') {
      actionShadow = [shineShadow].filter(Boolean).join(',') || 'none';
      actionHoverShadow = actionShadow;
    } else if (buttonEffect === 'soft-shadow') {
      actionShadow = [`0 8px 22px rgba(0,0,0,.14)`,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 13px 30px rgba(0,0,0,.19)`,shineShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'glow') {
      actionShadow = [glowShadow,ambientShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 0 ${Math.round(14+buttonGlow*38)}px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${(.18+buttonGlow*.48).toFixed(3)})`,ambientShadow,shineShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'glass' || buttonEffect === 'liquid-glass') {
      const liquid = buttonEffect === 'liquid-glass';
      actionFill = liquid
        ? `linear-gradient(145deg,rgba(255,255,255,${(.16+buttonShine*.28).toFixed(3)}) 0%,rgba(255,255,255,.03) 42%,rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${(.08+buttonGlow*.12).toFixed(3)}) 100%),rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${buttonGlassOpacity.toFixed(3)})`
        : `linear-gradient(135deg,rgba(255,255,255,${(.06+buttonShine*.20).toFixed(3)}),rgba(255,255,255,0) 58%),rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${buttonGlassOpacity.toFixed(3)})`;
      actionShadow = liquid
        ? [`inset 0 1px 0 rgba(255,255,255,${(.28+buttonShine*.36).toFixed(3)})`,`inset 0 -1px 0 rgba(0,0,0,.16)`,`0 14px 38px rgba(0,0,0,.20)`,glowShadow].filter(Boolean).join(',')
        : [ambientShadow,glowShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 18px 42px rgba(0,0,0,.24)`,glowShadow,`inset 0 1px 0 rgba(255,255,255,${(.24+buttonShine*.40).toFixed(3)})`].filter(Boolean).join(',');
      actionBackdrop = `blur(${buttonGlassBlur}px) saturate(${liquid ? 1.34 : 1.18})`;
      actionBorderColor = 'rgba(255,255,255,.28)';
      actionHoverBorderColor = 'rgba(255,255,255,.52)';
      actionTextShadow = `0 1px 3px rgba(0,0,0,.28)`;
    } else if (buttonEffect === 'depth-glow') {
      actionShadow = [depthShadow,glowShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 ${Math.max(1,buttonDepth-2)}px 0 ${actionDark}`,`0 0 ${Math.round(14+buttonGlow*34)}px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${(.16+buttonGlow*.44).toFixed(3)})`,`0 ${Math.round(buttonDepth+9)}px ${Math.round(20+buttonDepth*2.2)}px rgba(0,0,0,.22)`,shineShadow].filter(Boolean).join(',');
      actionActiveTransform = `translateY(${Math.min(4,Math.round(buttonDepth*.55))}px) scale(.985)`;
    } else if (buttonEffect === 'shine') {
      const sweep = `linear-gradient(110deg,transparent 0 35%,rgba(255,255,255,${(.16+buttonShine*.48).toFixed(3)}) 48%,transparent 61%)`;
      actionFill = `${sweep},linear-gradient(180deg,${actionLight},${actionBg} 45%,${actionDark})`;
      actionBackgroundSize = '240% 100%,100% 100%';
      actionBackgroundPosition = '140% 0,0 0';
      actionHoverBackgroundPosition = '-60% 0,0 0';
      actionShadow = [ambientShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 14px 34px rgba(0,0,0,.20)`,glowShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'gradient') {
      actionFill = `linear-gradient(120deg,${actionBg},${actionAccent},${actionBg})`;
      actionBackgroundSize = '220% 220%';
      actionBackgroundPosition = '0% 50%';
      actionHoverBackgroundPosition = '100% 50%';
      actionShadow = [ambientShadow,glowShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 15px 34px rgba(0,0,0,.20)`,glowShadow].filter(Boolean).join(',');
      actionAnimation = `imobify-button-gradient 6s ease infinite`;
    } else if (buttonEffect === 'pulse') {
      actionShadow = [glowShadow,ambientShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 0 ${Math.round(16+buttonGlow*38)}px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${(.18+buttonGlow*.46).toFixed(3)})`,ambientShadow].filter(Boolean).join(',');
      actionAnimation = 'imobify-button-pulse 2.1s ease-in-out infinite';
    } else if (buttonEffect === 'border-reveal') {
      actionShadow = [ambientShadow,shineShadow].filter(Boolean).join(',');
      actionBorderColor = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},.10)`;
      actionHoverBorderColor = actionAccent;
      actionHoverShadow = [`0 12px 30px rgba(0,0,0,.18)`,`0 0 ${Math.round(8+buttonGlow*22)}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${(.08+buttonGlow*.28).toFixed(3)})`].filter(Boolean).join(',');
    } else if (buttonEffect === 'fill-slide') {
      actionFill = `linear-gradient(90deg,${actionAccent} 0 49.5%,${actionBg} 50.5% 100%)`;
      actionBackgroundSize = '205% 100%';
      actionBackgroundPosition = '100% 0';
      actionHoverBackgroundPosition = '0% 0';
      actionShadow = [ambientShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 14px 32px rgba(0,0,0,.20)`,glowShadow].filter(Boolean).join(',');
    } else if (['magnet-orbit','tilt-3d','cursor-halo','liquid-follow','rubber-wobble','split-curtain','glitch-shift','orbit-ring','neon-trace','gravity-lift','flip-reveal','prism-shimmer','heartbeat','spring-pop'].includes(buttonEffect)) {
      actionShadow = [ambientShadow,glowShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 18px 42px rgba(0,0,0,.24)`,glowShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'magnetic') {
      actionShadow = [ambientShadow,glowShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 16px 36px rgba(0,0,0,.22)`,glowShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'scale-pop') {
      actionShadow = [ambientShadow,glowShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 16px 38px rgba(0,0,0,.22)`,glowShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'ripple') {
      actionShadow = [ambientShadow,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 14px 34px rgba(0,0,0,.20)`,glowShadow].filter(Boolean).join(',');
    } else if (buttonEffect === 'outline-minimal') {
      actionFill = `transparent`;
      actionShadow = `none`;
      actionHoverShadow = `0 0 0 1px ${actionBg}`;
      actionBorderColor = actionBg;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'ghost-minimal') {
      actionFill = `rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.10)`;
      actionShadow = `none`;
      actionHoverShadow = `0 0 0 1px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.32)`;
      actionBorderColor = actionBg;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'underline-editorial') {
      actionFill = `linear-gradient(to top,${actionBg} 0 2px,transparent 2px)`;
      actionShadow = `none`;
      actionHoverShadow = `none`;
      actionBorderColor = actionBg;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'satin-luxury') {
      actionFill = `linear-gradient(145deg,${actionLight},${actionBg} 45%,${actionDark})`;
      actionShadow = `0 11px 26px rgba(0,0,0,.19),inset 0 1px 0 rgba(255,255,255,.32)`;
      actionHoverShadow = `0 16px 34px rgba(0,0,0,.25)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'metal-gold') {
      actionFill = `linear-gradient(110deg,${actionDark},${actionLight} 21%,${actionBg} 35%,${actionLight} 49%,${actionDark} 72%,${actionBg})`;
      actionShadow = `inset 0 2px 2px rgba(255,255,255,.42),inset 0 -3px 3px rgba(0,0,0,.28),0 7px 0 ${actionDark},0 13px 22px rgba(0,0,0,.24)`;
      actionHoverShadow = `0 5px 0 ${actionDark},0 16px 32px rgba(0,0,0,.27)`;
      actionBorderColor = actionLight;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'machined-steel') {
      actionFill = `repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px),linear-gradient(155deg,${actionLight},${actionBg} 33%,${actionDark} 75%,${actionLight})`;
      actionShadow = `inset 0 2px 1px rgba(255,255,255,.36),inset 0 -2px 2px rgba(0,0,0,.28),0 5px 0 ${actionDark},0 11px 20px rgba(0,0,0,.22)`;
      actionHoverShadow = `0 3px 0 ${actionDark},0 13px 26px rgba(0,0,0,.30)`;
      actionBorderColor = actionLight;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'industrial-plate') {
      actionFill = `linear-gradient(180deg,${actionLight},${actionBg} 12%,${actionDark} 94%)`;
      actionShadow = `inset 0 2px 0 rgba(255,255,255,.30),inset 0 -2px 0 rgba(0,0,0,.35),0 8px 0 ${actionDark},0 14px 22px rgba(0,0,0,.28)`;
      actionHoverShadow = `0 5px 0 ${actionDark},0 16px 22px rgba(0,0,0,.32)`;
      actionBorderColor = actionDark;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'carbon-fiber') {
      actionFill = `repeating-linear-gradient(45deg,rgba(255,255,255,.09) 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,rgba(0,0,0,.12) 0 2px,transparent 2px 6px),linear-gradient(135deg,${actionLight},${actionDark})`;
      actionShadow = `inset 0 1px 0 rgba(255,255,255,.24),0 5px 0 ${actionDark},0 14px 25px rgba(0,0,0,.3)`;
      actionHoverShadow = `0 3px 0 ${actionDark},0 16px 30px rgba(0,0,0,.35)`;
      actionBorderColor = actionLight;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'embossed') {
      actionFill = `linear-gradient(160deg,${actionLight},${actionBg} 52%,${actionDark})`;
      actionShadow = `inset 2px 2px 3px rgba(255,255,255,.3),inset -3px -3px 5px rgba(0,0,0,.22),0 6px 13px rgba(0,0,0,.15)`;
      actionHoverShadow = `inset 1px 1px 2px rgba(255,255,255,.4),0 11px 21px rgba(0,0,0,.22)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'clay') {
      actionFill = `linear-gradient(150deg,${actionLight},${actionBg} 64%,${actionDark})`;
      actionShadow = `inset 0 3px 3px rgba(255,255,255,.36),inset 0 -4px 7px rgba(0,0,0,.12),0 11px 0 ${actionDark},0 18px 25px rgba(0,0,0,.2)`;
      actionHoverShadow = `0 8px 0 ${actionDark},0 23px 34px rgba(0,0,0,.22)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'bubble') {
      actionFill = `radial-gradient(ellipse at 32% 10%,rgba(255,255,255,.65),transparent 45%),linear-gradient(155deg,${actionLight},${actionBg} 60%,${actionDark})`;
      actionShadow = `inset 0 2px 3px rgba(255,255,255,.7),inset 0 -6px 9px rgba(0,0,0,.17),0 10px 20px rgba(0,0,0,.2)`;
      actionHoverShadow = `inset 0 2px 4px rgba(255,255,255,.8),0 15px 27px rgba(0,0,0,.25)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'jelly') {
      actionFill = `radial-gradient(ellipse at 30% 0%,rgba(255,255,255,.65),transparent 45%),linear-gradient(145deg,${actionLight},${actionBg} 55%,${actionDark})`;
      actionShadow = `inset 0 3px 5px rgba(255,255,255,.55),inset 0 -5px 9px rgba(0,0,0,.22),0 8px 23px rgba(0,0,0,.18)`;
      actionHoverShadow = `0 0 26px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.34),0 16px 26px rgba(0,0,0,.25)`;
      actionBorderColor = 'rgba(255,255,255,.38)';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'sticker') {
      actionShadow = `5px 6px 0 rgba(0,0,0,.8)`;
      actionHoverShadow = `8px 9px 0 rgba(0,0,0,.8)`;
      actionBorderColor = 'rgba(0,0,0,.85)';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'comic') {
      actionShadow = `7px 7px 0 ${actionDark}`;
      actionHoverShadow = `10px 10px 0 ${actionDark}`;
      actionBorderColor = actionDark;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'neumorph') {
      actionShadow = `-6px -6px 13px rgba(255,255,255,.36),7px 7px 14px rgba(0,0,0,.19)`;
      actionHoverShadow = `inset 3px 3px 7px rgba(0,0,0,.15),inset -3px -3px 8px rgba(255,255,255,.2)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'aurora') {
      actionFill = `linear-gradient(120deg,${actionBg},${actionAccent},${actionLight},${actionBg})`;
      actionShadow = `0 12px 32px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.25)`;
      actionHoverShadow = `0 18px 44px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.38)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
      actionBackgroundSize = '250% 250%';
      actionBackgroundPosition = '0% 50%';
      actionHoverBackgroundPosition = '100% 50%';
    } else if (buttonEffect === 'holographic') {
      actionFill = `linear-gradient(115deg,${actionBg},${actionLight},${actionAccent},${actionLight},${actionBg})`;
      actionShadow = `inset 0 1px 0 rgba(255,255,255,.55),0 10px 30px rgba(0,0,0,.16)`;
      actionHoverShadow = `0 15px 38px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},.35)`;
      actionBorderColor = 'rgba(255,255,255,.58)';
      actionHoverBorderColor = actionLight;
      actionBackgroundSize = '250% 250%';
      actionBackgroundPosition = '0% 50%';
      actionHoverBackgroundPosition = '100% 50%';
    } else if (buttonEffect === 'cyber') {
      actionFill = `linear-gradient(120deg,${actionDark},${actionBg})`;
      actionShadow = `inset 0 0 0 1px ${actionAccent},0 0 18px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},.38)`;
      actionHoverShadow = `inset 0 0 0 1px ${actionLight},0 0 32px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},.64)`;
      actionBorderColor = actionAccent;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'spotlight') {
      actionFill = `radial-gradient(circle at 30% 0%,${actionLight},${actionBg} 52%,${actionDark})`;
      actionShadow = `0 12px 24px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.35)`;
      actionHoverShadow = `0 18px 36px rgba(0,0,0,.22),0 0 19px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.2)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'brutalist') {
      actionShadow = `7px 7px 0 ${actionDark}`;
      actionHoverShadow = `10px 10px 0 ${actionDark}`;
      actionBorderColor = actionDark;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'paper-cut') {
      actionFill = `linear-gradient(175deg,${actionLight},${actionBg})`;
      actionShadow = `4px 4px 0 ${actionDark},8px 8px 0 rgba(0,0,0,.15)`;
      actionHoverShadow = `6px 6px 0 ${actionDark},12px 12px 0 rgba(0,0,0,.15)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'pixel') {
      actionShadow = `5px 5px 0 ${actionDark}`;
      actionHoverShadow = `8px 8px 0 ${actionDark}`;
      actionBorderColor = actionDark;
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'ceramic') {
      actionFill = `radial-gradient(ellipse at 28% 0%,rgba(255,255,255,.55),transparent 55%),linear-gradient(165deg,${actionLight},${actionBg} 58%,${actionDark})`;
      actionShadow = `inset 0 1px 2px rgba(255,255,255,.64),0 7px 15px rgba(0,0,0,.16)`;
      actionHoverShadow = `inset 0 1px 3px rgba(255,255,255,.7),0 13px 24px rgba(0,0,0,.22)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'wood') {
      actionFill = `repeating-linear-gradient(175deg,transparent 0 5px,rgba(0,0,0,.055) 6px 7px,transparent 8px 14px),linear-gradient(125deg,${actionLight},${actionBg},${actionDark})`;
      actionShadow = `inset 0 1px 0 rgba(255,255,255,.30),0 6px 0 ${actionDark},0 12px 21px rgba(0,0,0,.22)`;
      actionHoverShadow = `0 4px 0 ${actionDark},0 17px 28px rgba(0,0,0,.26)`;
      actionBorderColor = 'transparent';
      actionHoverBorderColor = actionLight;
    } else if (buttonEffect === 'neon') {
      actionShadow = [`0 0 ${Math.round(7+buttonGlow*18)}px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${(.18+buttonGlow*.44).toFixed(3)})`,`inset 0 0 ${Math.round(5+buttonGlow*12)}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},.15)`,shineShadow].filter(Boolean).join(',');
      actionHoverShadow = [`0 0 ${Math.round(18+buttonGlow*34)}px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},${(.26+buttonGlow*.55).toFixed(3)})`,`0 0 ${Math.round(8+buttonGlow*18)}px rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},.42)`,`inset 0 0 12px rgba(255,255,255,.12)`].filter(Boolean).join(',');
      actionBorderColor = actionAccent;
      actionHoverBorderColor = actionLight;
      actionTextShadow = `0 0 8px rgba(${actionRgb.r},${actionRgb.g},${actionRgb.b},.32)`;
    } else {
      actionShadow = [depthShadow,shineShadow].filter(Boolean).join(',') || ambientShadow;
      actionHoverShadow = [`0 ${Math.max(1,buttonDepth-2)}px 0 ${actionDark}`,`0 ${Math.round(buttonDepth+9)}px ${Math.round(20+buttonDepth*2.2)}px rgba(0,0,0,.22)`,shineShadow].filter(Boolean).join(',');
      actionActiveTransform = `translateY(${Math.min(4,Math.round(buttonDepth*.55))}px) scale(.985)`;
    }

    const baseVariables = `:root{--primary:${primary};--accent:${accent};--surface:${surface};--ink:${b.ink};--dark:${dark};--heading-color:${heading};--body-color:${body};--muted-color:${muted};--inverse-heading-color:${inverseHeading};--inverse-body-color:${inverseBody};--primary-on-surface:${primaryOnSurface};--primary-on-dark:${primaryOnDark};--accent-on-surface:${accentOnSurface};--accent-on-dark:${accentOnDark};--primary-on-white:${primaryOnWhite};--accent-on-white:${accentOnWhite};--primary-contrast:${primaryContrast};--accent-contrast:${accentContrast};--white-heading:${whiteHeading};--white-body:${whiteBody};--white-muted:${whiteMuted};--action-button-bg:${actionBg};--action-button-text:${actionText};--action-on-surface:${actionOnSurface};--action-on-dark:${actionOnDark};--contrast-min:${minimum};--contrast-enabled:${protectContrast ? 1 : 0};--text-effect-mode:${textEffect};--text-effect-strength:${Math.round(effectStrength*100)};--text-shadow-inverse-heading:${inverseHeadingShadow};--text-shadow-inverse-body:${inverseBodyShadow};--text-shadow-light-heading:${lightHeadingShadow};--text-shadow-light-body:${lightBodyShadow};--text-stroke-inverse:${inverseStroke};--text-stroke-light:${lightStroke};--title-outline:${titleOutline};--title-outline-width:${(titleOutlinePct/100).toFixed(4)}em;--title-outline-color:${b.titleOutlineColor || '#000000'};--title-shadow:${titleShadow};--subtitle-outline:${subtitleOutline};--subtitle-outline-width:${(subtitleOutlinePct/100).toFixed(4)}em;--subtitle-outline-color:${b.subtitleOutlineColor || '#000000'};--subtitle-shadow:${subtitleShadow};--action-button-effect:${buttonEffect};--action-button-click-effect:${buttonClickEffect};--action-button-fill:${actionFill};--action-button-shadow:${actionShadow || 'none'};--action-button-hover-shadow:${actionHoverShadow || 'none'};--action-button-backdrop:${actionBackdrop};--action-button-border-width:${buttonBorderWidth}px;--action-button-border-color:${actionBorderColor};--action-button-hover-border-color:${actionHoverBorderColor};--action-button-text-shadow:${actionTextShadow};--action-button-hover-transform:${actionHoverTransform};--action-button-active-transform:${actionActiveTransform};--action-button-background-size:${actionBackgroundSize};--action-button-background-position:${actionBackgroundPosition};--action-button-hover-background-position:${actionHoverBackgroundPosition};--action-button-animation:${actionAnimation};--action-button-speed:${buttonSpeed}ms;--radius:${num(b.radius,14)}px;--heading:${fontStack(b.headingFont)};--body:${fontStack(b.bodyFont)};--heading-weight:${num(b.headingWeight,700)};--heading-line:${num(b.headingLineHeight,1.05)};--heading-tracking:${num(b.headingTracking,-0.04)}em;--eyebrow-tracking:${num(b.eyebrowTracking,0.12)}em;--body-size:${num(b.bodySize,16)}px;--body-line:${num(b.bodyLineHeight,1.6)};--body-tracking:${num(b.bodyTracking,0)}em;--paragraph-indent:${num(b.paragraphIndent,0)}px;--paragraph-spacing:${num(b.paragraphSpacing,0)}px;--text-measure:${num(b.textMeasure,66)}ch;--h1-max:${num(b.h1Size,107)}px;--h2-max:${num(b.h2Size,77)}px;--h3-max:${num(b.h3Size,25)}px;--container:${num(b.containerWidth,1180)}px;--section-space-set:${sectionSpace}px;--section-space:${sectionSpace}px;--content-gap:${num(b.contentGap,56)}px;--element-gap:${num(b.elementGap,20)}px;--component-padding:${num(b.componentPadding,36)}px}@media(max-width:720px){:root{--section-space:clamp(32px,calc(${sectionSpace}px * .55),110px)}}`;
    const system = window.ImobifyTypeSystem;
    return baseVariables + (system ? "\n" + system.variables(b) + "\n" + system.bridgeCss(b) : "");
  }

  function sectionOverrides(state) {
    const styleDefaults = window.ImobifyCatalog?.sectionStyleDefaults?.() || {};
    const css = [];
    const validHex = (value, fallback = '#000000') => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
    const attrEscape = (value) => String(value || '').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
    const rgbaHex = (hex, alpha) => {
      const rgb = hexToRgb(validHex(hex)) || { r:0,g:0,b:0 };
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0,Math.min(1,alpha)).toFixed(3)})`;
    };

    // O :is() inclui deliberadamente um ID que nunca existe. Pela regra de especificidade
    // do CSS, o seletor recebe prioridade de ID mesmo quando casa pelo data-section-id.
    // Isso faz o override local ganhar de CSS interno de plugins com !important, sem usar
    // estilos inline e sem alterar o plugin quando a personalização estiver desligada.
    const priorityScope = (selector) => `:is(#__imobify_local_style_priority_never__,${selector})`;
    const headingSelector = ':where(.imobify-design-title,h1,h2,h3,h4,h5,h6,[data-design-role="title"],[class$="__title"],[class$="-title"],[class$="_title"],[class$="__heading"],[class$="-heading"],[class$="_heading"])';
    const bodySelector = ':where(.imobify-design-subtitle,p,li,blockquote,dd,dt,small,[data-design-role="subtitle"],[class$="__subtitle"],[class$="-subtitle"],[class$="_subtitle"],[class$="__lead"],[class$="-lead"],[class$="_lead"],[class$="__copy"],[class$="-copy"],[class$="_copy"],[class$="__description"],[class$="-description"],[class$="_description"])';
    const bodyAlignSelector = ':where(p:not(.eyebrow):not([class$="__eyebrow"]):not([class$="-eyebrow"]):not([class$="_eyebrow"]):not([class$="__kicker"]):not([class$="-kicker"]):not([class$="_kicker"]),li,blockquote,dd,dt,[data-design-role="subtitle"],[class$="__subtitle"],[class$="-subtitle"],[class$="_subtitle"],[class$="__lead"],[class$="-lead"],[class$="_lead"],[class$="__copy"],[class$="-copy"],[class$="_copy"],[class$="__description"],[class$="-description"],[class$="_description"])';
    const eyebrowSelector = ':where(.eyebrow,[class$="__eyebrow"],[class$="-eyebrow"],[class$="_eyebrow"],[class$="__kicker"],[class$="-kicker"],[class$="_kicker"])';
    const actionSelector = ':where(.imobify-design-cta,[data-design-role="cta"],.button-primary,.btn-primary,.opp-cta,.svp-hero-button,.formsenderCSS_button,.spp-cta,.pit-glass-cta,.pp-flip-cta,.btn-flip,.btn-flipFake,.bbp__cta,.iwfp-button,.imobify-menu-pro[data-cta-last="true"] .imobify-menu-pro__links li:last-child a,[data-fsp-cta],a[class$="__cta"],button[class$="__cta"],a[class$="-cta"],button[class$="-cta"],a[class$="_cta"],button[class$="_cta"],a[class*="call-to-action"],button[class*="call-to-action"])';

    const effectCss = (mode, color, strength, allowStroke = true) => {
      if (!mode || mode === 'inherit') return '';
      if (mode === 'none') return 'text-shadow:none!important;-webkit-text-stroke:0 transparent!important;';
      const amount = Math.max(0, Math.min(100, Number(strength) || 0)) / 100;
      const c = validHex(color);
      if (mode === 'soft') return `text-shadow:0 .035em .12em ${rgbaHex(c,.34*amount)}!important;${allowStroke ? '-webkit-text-stroke:0 transparent!important;' : ''}`;
      if (mode === 'glow') return `text-shadow:0 0 .06em ${rgbaHex(c,.58*amount)},0 0 .20em ${rgbaHex(c,.40*amount)},0 0 .48em ${rgbaHex(c,.22*amount)}!important;${allowStroke ? '-webkit-text-stroke:0 transparent!important;' : ''}`;
      if (mode === 'cinematic') return `text-shadow:0 .018em .018em ${rgbaHex(c,.78*amount)},0 .075em .16em ${rgbaHex(c,.48*amount)},0 .21em .52em ${rgbaHex(c,.28*amount)}!important;${allowStroke ? `-webkit-text-stroke:${(.018*amount).toFixed(4)}em ${rgbaHex(c,.48*amount)}!important;` : ''}`;
      return `text-shadow:0 .018em .018em ${rgbaHex(c,.78*amount)},0 .06em .18em ${rgbaHex(c,.48*amount)},0 .14em .34em ${rgbaHex(c,.24*amount)}!important;${allowStroke ? `-webkit-text-stroke:${(.012*amount).toFixed(4)}em ${rgbaHex(c,.42*amount)}!important;` : ''}`;
    };

    const explicitColor = (mode, custom, kind, backgroundMode, brand, localBackground) => {
      if (!mode || mode === 'inherit') return '';
      if (mode === 'heading') return 'var(--heading-color)';
      if (mode === 'body') return 'var(--body-color)';
      if (mode === 'inverse') return kind === 'body' ? 'var(--inverse-body-color)' : 'var(--inverse-heading-color)';
      if (mode === 'primary') return 'var(--primary)';
      if (mode === 'accent') return 'var(--accent)';
      if (mode === 'custom') return validHex(custom, kind === 'body' ? brand.bodyColor || '#30383d' : brand.headingColor || '#101318');
      if (mode !== 'auto' || backgroundMode === 'inherit') return '';
      if (backgroundMode === 'surface') return kind === 'body' ? 'var(--body-color)' : 'var(--heading-color)';
      if (backgroundMode === 'dark') return kind === 'body' ? 'var(--inverse-body-color)' : 'var(--inverse-heading-color)';
      if (backgroundMode === 'primary') return 'var(--primary-contrast)';
      if (backgroundMode === 'accent') return 'var(--accent-contrast)';
      const bg = validHex(localBackground, brand.surface || '#ffffff');
      return safestText(bg);
    };

    const resolveActionBackground = (local, primary, accent, brand) => {
      const mode = local.actionBackgroundMode || 'auto';
      if (mode === 'inherit') return '';
      if (mode === 'custom') return validHex(local.actionBackgroundColor, brand.actionButtonBackground || brand.primary || '#d7ff3f');
      if (mode === 'primary') return 'var(--primary)';
      if (mode === 'accent') return 'var(--accent)';
      // Automático só altera o Button Kit quando a primária local foi realmente personalizada.
      // Assim ativar o painel por si só não muda o projeto, mas personalizar a primária passa a
      // ter o efeito que o usuário espera também nos CTAs daquele plugin.
      if (mode === 'auto' && primary) return primary;
      return '';
    };

    const resolveActionText = (local, actionBackground, brand) => {
      if (!actionBackground) return '';
      const mode = local.actionTextMode || 'auto';
      if (mode === 'inherit') return '';
      if (mode === 'custom') return validHex(local.actionTextColor, brand.actionButtonText || '#ffffff');
      if (mode === 'heading') return 'var(--heading-color)';
      if (mode === 'body') return 'var(--body-color)';
      if (actionBackground === 'var(--primary)') return 'var(--primary-contrast)';
      if (actionBackground === 'var(--accent)') return 'var(--accent-contrast)';
      if (/^#[0-9a-f]{6}$/i.test(actionBackground)) return safestText(actionBackground);
      return 'var(--action-button-text)';
    };

    for (const section of state.sections || []) {
      if (section.settings?.visible === false) continue;
      const local = { ...styleDefaults, ...(section.settings?.style || {}) };
      if (local.enabled !== true) continue;
      const selector = `[data-section-id="${attrEscape(section.id)}"]`;
      const scope = priorityScope(selector);
      const brand = state.brand || {};
      const root = [];
      const primary = local.primaryMode === 'custom' ? validHex(local.primaryColor, brand.primary || '#d7ff3f') : '';
      const accent = local.accentMode === 'custom' ? validHex(local.accentColor, brand.accent || '#7ca1ff') : '';
      if (primary) root.push(
        `--primary:${primary}`,
        `--primary-contrast:${safestText(primary)}`,
        `--primary-on-surface:${primary}`,
        `--primary-on-dark:${primary}`,
        `--primary-on-white:${primary}`
      );
      if (accent) root.push(
        `--accent:${accent}`,
        `--accent-contrast:${safestText(accent)}`,
        `--accent-on-surface:${accent}`,
        `--accent-on-dark:${accent}`,
        `--accent-on-white:${accent}`
      );

      const backgroundMode = local.backgroundMode || 'inherit';
      let background = '';
      if (backgroundMode === 'surface') background = 'var(--surface)';
      else if (backgroundMode === 'dark') background = 'var(--dark)';
      else if (backgroundMode === 'primary') background = 'var(--primary)';
      else if (backgroundMode === 'accent') background = 'var(--accent)';
      else if (backgroundMode === 'custom') background = validHex(local.backgroundColor, brand.surface || '#ffffff');
      else if (backgroundMode === 'gradient') {
        const a = validHex(local.backgroundColor, brand.surface || '#ffffff');
        const b = validHex(local.backgroundColor2, brand.dark || '#101318');
        const angle = Math.max(0, Math.min(360, Number(local.gradientAngle) || 0));
        background = `linear-gradient(${angle}deg,${a},${b})`;
      }
      if (background) root.push(`background:${background}!important`);
      // Em fundo sólido personalizado, também atualiza o token de superfície local. Plugins
      // que usam var(--surface) internamente passam a respeitar a exceção sem precisar patch individual.
      if (backgroundMode === 'custom') root.push(`--surface:${validHex(local.backgroundColor, brand.surface || '#ffffff')}`);

      const headingColor = explicitColor(local.headingColorMode, local.headingColor, 'heading', backgroundMode, brand, local.backgroundColor);
      const bodyColor = explicitColor(local.bodyColorMode, local.bodyColor, 'body', backgroundMode, brand, local.backgroundColor);
      let eyebrowColor = explicitColor(local.eyebrowColorMode, local.eyebrowColor, 'heading', backgroundMode, brand, local.backgroundColor);
      if (local.eyebrowColorMode === 'auto' && backgroundMode === 'surface') eyebrowColor = 'var(--primary)';
      if (headingColor) {
        root.push(`--component-title-color:${headingColor}`);
        if (headingColor !== 'var(--heading-color)') root.push(`--heading-color:${headingColor}`);
      }
      if (bodyColor) {
        root.push(`--component-text-color:${bodyColor}`, `--component-muted-color:${bodyColor}`);
        if (bodyColor !== 'var(--body-color)') root.push(`--body-color:${bodyColor}`, `--muted-color:${bodyColor}`);
      }
      if (local.headingFont && local.headingFont !== 'inherit') root.push(`--heading:${fontStack(local.headingFont)}`);
      if (local.bodyFont && local.bodyFont !== 'inherit') root.push(`--body:${fontStack(local.bodyFont)}`);
      if (local.headingWeight && local.headingWeight !== 'inherit') root.push(`--heading-weight:${Math.max(100,Math.min(900,Number(local.headingWeight)||700))}`);
      if (local.headingTracking !== 'inherit' && Number.isFinite(Number(local.headingTracking))) root.push(`--heading-tracking:${Number(local.headingTracking)}em`);
      if (local.bodySize !== 'inherit' && Number.isFinite(Number(local.bodySize))) root.push(`--body-size:${Math.max(10,Math.min(40,Number(local.bodySize)))}px`);
      if (local.bodyLineHeight !== 'inherit' && Number.isFinite(Number(local.bodyLineHeight))) root.push(`--body-line:${Math.max(1,Math.min(2.5,Number(local.bodyLineHeight)))}`);

      const actionBackground = resolveActionBackground(local, primary, accent, brand);
      const actionText = resolveActionText(local, actionBackground, brand);
      if (actionBackground) {
        root.push(`--action-button-bg:${actionBackground}`, `--action-button-fill:${actionBackground}`, `--action-button-border-color:${actionBackground}`, `--action-button-hover-border-color:${actionBackground}`);
      }
      if (actionText) root.push(`--action-button-text:${actionText}`);

      if (local.paddingMode === 'custom') {
        root.push(`padding-top:${Math.max(0,Math.min(400,Number(local.paddingTop)||0))}px!important`);
        root.push(`padding-bottom:${Math.max(0,Math.min(400,Number(local.paddingBottom)||0))}px!important`);
      }
      if (root.length) css.push(`${scope}{${root.join(';')}}`);

      const headingRules = [];
      if (headingColor) headingRules.push(`color:${headingColor}!important`);
      if (local.headingFont && local.headingFont !== 'inherit') headingRules.push('font-family:var(--heading)!important');
      if (local.headingWeight && local.headingWeight !== 'inherit') headingRules.push('font-weight:var(--heading-weight)!important');
      if (local.headingTracking !== 'inherit' && Number.isFinite(Number(local.headingTracking))) headingRules.push('letter-spacing:var(--heading-tracking)!important');
      if (['left','center','right','justify'].includes(local.headingAlign)) {
        const justifyExtra = local.headingAlign === 'justify' ? ';text-justify:inter-word;text-align-last:start;hyphens:none;-webkit-hyphens:none;word-break:normal;overflow-wrap:normal' : '';
        headingRules.push(`text-align:${local.headingAlign}!important${justifyExtra}`);
      }
      const titleEffect = effectCss(local.titleEffect, local.titleEffectColor, local.titleEffectStrength, true);
      if (titleEffect) headingRules.push(titleEffect);
      if (headingRules.length) css.push(`${scope} ${headingSelector}{${headingRules.join(';')}}`);
      if (['left','center','right','justify'].includes(local.headingAlignMobile)) {
        const justifyExtra = local.headingAlignMobile === 'justify' ? ';text-justify:inter-word;text-align-last:start;hyphens:none;-webkit-hyphens:none;word-break:normal;overflow-wrap:normal' : '';
        css.push(`@media(max-width:720px){${scope} ${headingSelector}{text-align:${local.headingAlignMobile}!important${justifyExtra}}}`);
      }

      const bodyRules = [];
      if (bodyColor) bodyRules.push(`color:${bodyColor}!important`);
      if (local.bodyFont && local.bodyFont !== 'inherit') bodyRules.push('font-family:var(--body)!important');
      if (local.bodySize !== 'inherit' && Number.isFinite(Number(local.bodySize))) bodyRules.push('font-size:var(--body-size)!important');
      if (local.bodyLineHeight !== 'inherit' && Number.isFinite(Number(local.bodyLineHeight))) bodyRules.push('line-height:var(--body-line)!important');
      const bodyEffect = effectCss(local.bodyEffect, local.bodyEffectColor, local.bodyEffectStrength, false);
      if (bodyEffect) bodyRules.push(bodyEffect);
      if (bodyRules.length) css.push(`${scope} ${bodySelector}{${bodyRules.join(';')}}`);
      if (['left','center','right','justify'].includes(local.bodyAlign)) {
        const justifyExtra = local.bodyAlign === 'justify' ? ';text-justify:inter-word;text-align-last:start;hyphens:none;-webkit-hyphens:none;word-break:normal;overflow-wrap:normal' : '';
        css.push(`${scope} ${bodyAlignSelector}{text-align:${local.bodyAlign}!important${justifyExtra}}`);
      }
      if (['left','center','right','justify'].includes(local.bodyAlignMobile)) {
        const justifyExtra = local.bodyAlignMobile === 'justify' ? ';text-justify:inter-word;text-align-last:start;hyphens:none;-webkit-hyphens:none;word-break:normal;overflow-wrap:normal' : '';
        css.push(`@media(max-width:720px){${scope} ${bodyAlignSelector}{text-align:${local.bodyAlignMobile}!important${justifyExtra}}}`);
      }
      if (local.bodyLineFit === 'normal') css.push(`${scope} ${bodyAlignSelector}{hyphens:auto;-webkit-hyphens:auto;word-break:normal;overflow-wrap:anywhere;text-wrap:wrap}`);
      if (local.bodyLineFit === 'editorial') css.push(`${scope} ${bodyAlignSelector}{hyphens:none!important;-webkit-hyphens:none!important;word-break:normal!important;overflow-wrap:normal!important;text-wrap:pretty;font-kerning:normal;font-optical-sizing:auto}`);
      if (local.bodyLineFit === 'balanced' || local.bodyLineFit === 'optical') css.push(`${scope} ${bodyAlignSelector}{hyphens:none!important;-webkit-hyphens:none!important;word-break:normal!important;overflow-wrap:normal!important;text-wrap:pretty;font-kerning:normal;font-optical-sizing:auto;word-spacing:normal!important;letter-spacing:-.002em}`);

      // 7.5.0 — Texto e posicionamento. Alinhar só o texto (text-align) não basta:
      // títulos e subtítulos costumam ter largura máxima, e a CAIXA continuava
      // encostada à esquerda. Aqui a caixa acompanha o alinhamento (desktop e mobile),
      // a chamada superior segue o título e o justificado ganha hifenização em pt-BR.
      {
        const A = ['left','center','right','justify'];
        const hD = A.includes(local.headingAlign) ? local.headingAlign : '';
        const hM = A.includes(local.headingAlignMobile) ? local.headingAlignMobile : hD;
        const bD = A.includes(local.bodyAlign) ? local.bodyAlign : '';
        const bM = A.includes(local.bodyAlignMobile) ? local.bodyAlignMobile : bD;
        const eMode = local.eyebrowAlign || 'heading';
        const eD = eMode === 'heading' ? hD : (A.includes(eMode) ? eMode : '');
        const eM = eMode === 'heading' ? hM : eD;
        const positionOn = (local.blockPosition || 'auto') !== 'component';
        const measure = ['45','55','65','75'].includes(String(local.textMeasure)) ? String(local.textMeasure) : (local.textMeasure === 'none' ? 'none' : '');
        const hyphenOn = (local.justifyHyphens || 'auto') !== 'none' && local.bodyLineFit !== 'editorial';
        const textAlignCss = (mode, role) => {
          if (!mode) return '';
          if (mode !== 'justify') return `text-align:${mode}!important;text-align-last:auto!important`;
          const hy = role === 'body' && hyphenOn ? 'hyphens:auto!important;-webkit-hyphens:auto!important;hyphenate-limit-chars:6 3 3;overflow-wrap:break-word!important' : 'hyphens:manual!important;-webkit-hyphens:manual!important';
          return `text-align:justify!important;text-justify:inter-word;text-align-last:start!important;${role === 'heading' ? 'text-wrap:wrap!important;' : 'text-wrap:pretty!important;'}${hy}`;
        };
        const placeCss = (mode) => {
          if (!mode || !positionOn) return '';
          if (mode === 'center') return 'margin-left:auto!important;margin-right:auto!important;align-self:center!important;justify-self:center!important';
          if (mode === 'right') return 'margin-left:auto!important;margin-right:0!important;align-self:flex-end!important;justify-self:end!important';
          return 'margin-left:0!important;margin-right:auto!important;align-self:flex-start!important;justify-self:start!important';
        };
        const actionsCss = (mode) => {
          if (!mode || !positionOn) return '';
          const j = mode === 'center' ? 'center' : mode === 'right' ? 'flex-end' : 'flex-start';
          return `justify-content:${j}!important;align-items:${mode === 'center' ? 'center' : mode === 'right' ? 'flex-end' : 'flex-start'};margin-left:${mode === 'left' || mode === 'justify' ? '0' : 'auto'}!important;margin-right:${mode === 'right' ? '0' : 'auto'}!important`;
        };
        // Bloco de cabeçalho: títulos principais, chamada e o texto que vem logo após o título.
        const headTitle = ':where(h1,h2,[data-design-role="title"])';
        const headBody = ':where(:is(h1,h2,[data-design-role="title"]) ~ :is(p,[data-design-role="subtitle"],[class$="__subtitle"],[class$="-subtitle"],[class$="_subtitle"],[class$="__lead"],[class$="-lead"],[class$="_lead"],[class$="__description"],[class$="-description"]))';
        const flowBody = ':where(p:not(.eyebrow):not([class$="__eyebrow"]):not([class$="-eyebrow"]):not([class$="_eyebrow"]):not([class$="__kicker"]):not([class$="-kicker"]),[data-design-role="subtitle"],[class$="__subtitle"],[class$="-subtitle"],[class$="__lead"],[class$="-lead"])';
        const headActions = ':where(:is(h1,h2,[data-design-role="title"]) ~ :is([class$="-actions"],[class$="__actions"],[class$="_actions"],.actions,[class$="-cta-row"],[class$="-buttons"]))';
        const headWrap = ':where(:not([data-plugin]):not(section):not(main):not(article[data-plugin]):has(> :is(h1,h2,[data-design-role="title"])):not(:has(img,picture,video,iframe,form,table,ul,ol,dl,canvas,svg,[data-plugin])))';
        const bodyBlock = ':where([class$="-body"],[class$="__body"],[class$="_body"],[class$="-text"],[class$="__text"]):not(:has(h1,h2,h3,h4,h5,h6,input,select,textarea,button,img,ul,ol,table))';
        const emit = (sel, rules, mobile) => { if (!rules) return; const target = sel ? `${scope} ${sel}` : scope; css.push(mobile ? `@media(max-width:720px){${target}{${rules}}}` : `${target}{${rules}}`); };
        for (const [mobile, h, b, e] of [[false, hD, bD, eD], [true, hM, bM, eM]]) {
          if (mobile && h === hD && b === bD && e === eD) continue;
          emit(eyebrowSelector, [textAlignCss(e, 'heading'), placeCss(e)].filter(Boolean).join(';'), mobile);
          emit(headTitle, placeCss(h), mobile);
          emit(headBody, placeCss(b), mobile);
          emit(flowBody, placeCss(b), mobile);
          emit(bodyBlock, placeCss(b), mobile);
          // Caixa de cabeçalho estreita (título + texto) que o componente posiciona sozinho.
          emit(headWrap, placeCss(h), mobile);
          emit(headActions, actionsCss(h), mobile);
          // Reaplica o alinhamento com o tratamento correto do justificado.
          emit(headingSelector, textAlignCss(h, 'heading'), mobile);
          emit(bodyAlignSelector, textAlignCss(b, 'body'), mobile);
          emit(bodyBlock, textAlignCss(b, 'body'), mobile);
          // Adaptadores: componentes que posicionam a caixa por variáveis próprias.
          if (section.type === 'hero-plus' && h) {
            const j = h === 'center' ? 'center' : h === 'right' ? 'flex-end' : 'flex-start';
            emit('', positionOn ? `--hp-h-align:${j}!important;--hp-actions-align:${j}!important;--hp-text-align:${h === 'justify' ? 'left' : h}!important` : `--hp-text-align:${h === 'justify' ? 'left' : h}!important`, mobile);
            emit('.hp-content', `text-align:${h === 'justify' ? 'left' : h}!important`, mobile);
            if (positionOn) emit('.hp-actions', actionsCss(h), mobile);
          }
          if (section.type === 'only-text-context' && (b || h)) {
            emit('', `--otc-align:${b || h}!important`, mobile);
            if (positionOn && h) emit('.otc-inner', placeCss(h).replace(/align-self:[^;]+;|justify-self:[^;]+;?/g, ''), mobile);
          }
        }
        if (measure === 'none') css.push(`${scope} ${flowBody}{max-inline-size:none!important}`);
        else if (measure) css.push(`${scope} ${flowBody}{max-inline-size:${measure}ch!important}`);
      }

      if (eyebrowColor) css.push(`${scope} ${eyebrowSelector}{color:${eyebrowColor}!important}`);

      // A camada de ação é propositalmente separada. Alguns plugins pintam seus CTAs com
      // seletores locais, enquanto o Button Kit global pinta outros por semântica runtime.
      // Forçar aqui somente quando há override de ação garante consistência nos dois casos.
      if (actionBackground || actionText) {
        const rules = [];
        if (actionBackground) rules.push(`background:${actionBackground}!important`, `background-image:none!important`, `border-color:${actionBackground}!important`);
        if (actionText) rules.push(`color:${actionText}!important`);
        css.push(`${scope} ${actionSelector}{${rules.join(';')}}`);
      }
    }
    // 7.3.6: fundo exclusivo da raiz da seção; não altera cards/overlays nem âncoras.
    // Regras no final para o painel "Fundo da seção" prevalecer sobre o estilo legado.
    for (const section of state.sections || []) {
      if (section.settings?.visible === false) continue;
      const bg = { ...(window.ImobifyCatalog?.sectionBackgroundDefaults?.() || {}), ...(section.settings?.background || {}) };
      if (bg.enabled !== true) continue;
      const scope = priorityScope(`[data-section-id="${attrEscape(section.id)}"]`);
      const validColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
      let rules = '';
      if (bg.type === 'image') {
        const raw = String(bg.image || '').trim();
        // Apenas caminhos relativos/absolutos ou HTTPS e data:image base64; sem injeção de CSS.
        const allowed = /^(?:https?:\/\/|\.\.?\/|\/(?!\/)|assets\/)/i.test(raw)
          || /^data:image\/(?:png|jpeg|webp|gif|avif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(raw);
        if (!allowed || raw.length > 12000000 || /[\x00-\x1f]/.test(raw)) continue;
        const url = raw.replace(/[<>"'()\\\s]/g, (c) => encodeURIComponent(c));
        const mode = ['static','fixed','repeat'].includes(bg.imageMode) ? bg.imageMode : 'static';
        rules = `background-image:url("${url}")!important;background-color:transparent!important;background-position:${mode === 'repeat' ? 'left top' : 'center center'}!important;background-repeat:${mode === 'repeat' ? 'repeat' : 'no-repeat'}!important;background-size:${mode === 'repeat' ? 'auto' : 'cover'}!important;background-attachment:${mode === 'fixed' ? 'fixed' : 'scroll'}!important`;
      } else {
        const start = validColor(bg.color1, '#ffffff');
        if (bg.colorMode === 'gradient') {
          const end = validColor(bg.color2, '#101318');
          const angle = Math.max(0, Math.min(360, Number(bg.angle) || 0));
          rules = `background:${start}!important;background-image:linear-gradient(${angle}deg,${start},${end})!important;background-attachment:scroll!important`;
        } else rules = `background:${start}!important;background-attachment:scroll!important`;
      }
      css.push(`${scope}{${rules}}`);
      if (bg.type === 'image' && bg.imageMode === 'fixed') {
        // iOS e alguns tablets ignoram background-attachment:fixed; evita cortes no móvel.
        css.push(`@media(max-width:767px){${scope}{background-attachment:scroll!important}}`);
      }
    }
    return css.join('\n');
  }

  // O HTML canonical, o og:url e o JSON-LD precisam da MESMA URL absoluta
  // do sitemap. `new URL` normaliza host, porta padrão e '/' da raiz.
  function cleanUrl(value) {
    try {
      const url = new URL(String(value || '').trim());
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }
  const PUBLIC_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  function seoRootUrl(value, canonical) {
    try {
      const u = new URL(String(canonical || '').trim());
      if (u.protocol !== 'https:') return '';
      if (!u.pathname.endsWith('/')) {
        const tail = u.pathname.split('/').pop() || '';
        if (/\.[a-z0-9]{1,8}$/i.test(tail)) u.pathname = u.pathname.replace(/[^/]*$/, '');
        else u.pathname += '/';
      }
      u.search=''; u.hash='';
      return new URL(String(value).replace(/^\.\//, '').replace(/^\/+/, ''), u).href;
    } catch (_) { return ''; }
  }
  function publishedFavicon(seo) {
    const icon = String(seo?.favicon || '').trim();
    if (/^https:\/\//i.test(icon)) return icon;
    if (/^(?:\.\/)?icon\.(svg|png|webp|jpg|jpeg)$/i.test(icon)) return seoRootUrl(icon, seo?.canonical) || icon;
    return icon;
  }

  // Normaliza moeda digitada no padrão brasileiro ou internacional sem confundir
  // separador de milhar com casas decimais. Retorna string numérica aceita por Schema.org.
  function normalizePrice(value) {
    let raw = String(value ?? '').trim().replace(/[^0-9.,-]/g, '');
    if (!raw || !/\d/.test(raw)) return '';
    const negative = raw.startsWith('-');
    raw = raw.replace(/-/g, '');
    const comma = raw.lastIndexOf(',');
    const dot = raw.lastIndexOf('.');

    if (comma >= 0 && dot >= 0) {
      // O último separador é tratado como decimal; os anteriores são milhares.
      const decimal = comma > dot ? ',' : '.';
      const thousands = decimal === ',' ? /\./g : /,/g;
      raw = raw.replace(thousands, '').replace(decimal, '.');
    } else if (comma >= 0) {
      const parts = raw.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) raw = parts.join('');
      else raw = parts.join('.');
    } else if (dot >= 0) {
      const parts = raw.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) raw = parts.join('');
    }

    if (!/^\d+(?:\.\d+)?$/.test(raw)) return '';
    const number = Number(raw);
    if (!Number.isFinite(number) || number < 0) return '';
    return `${negative ? '-' : ''}${raw}`;
  }

  function schema(state) {
    const seo = state.seo || {};
    const site = state.siteData || {};
    const canonical = cleanUrl(seo.canonical);
    const websiteId = canonical ? new URL(canonical).origin + '/#website' : '#website';
    const pageId = canonical ? canonical.replace(/#.*$/, '') + '#webpage' : '#webpage';
    const agentId = canonical ? new URL(canonical).origin + '/#realestateagent' : '#realestateagent';
    const authorId = canonical ? new URL(canonical).origin + '/#author' : '#author';
    const propertyId = canonical ? canonical.replace(/#.*$/, '') + '#property' : '#property';
    const normalizedPrice = normalizePrice(seo.price);
    const allowedPropertyTypes = new Set(['Place','Residence','House','SingleFamilyResidence','Apartment','ApartmentComplex']);
    const propertyType = allowedPropertyTypes.has(seo.propertySchemaType) ? seo.propertySchemaType : 'Place';
    const address = seo.address ? { '@type':'PostalAddress', streetAddress:seo.address, addressLocality:seo.city || undefined, addressRegion:seo.region || undefined, postalCode:seo.postalCode || undefined, addressCountry:'BR' } : undefined;
    const property = {
      '@type':propertyType,
      '@id':propertyId,
      name:seo.propertyName || state.projectName,
      description:seo.description || undefined,
      image:publishedSeoImage(seo) || undefined,
      url:canonical || undefined,
      address,
      additionalProperty:[
        seo.localInsight && { '@type':'PropertyValue', name:'Contexto local', value:seo.localInsight }
      ].filter(Boolean)
    };
    const offer = normalizedPrice ? {
      '@type':'Offer',
      price:normalizedPrice,
      priceCurrency:seo.currency || 'BRL',
      url:canonical || undefined,
      itemOffered:{ '@id':propertyId }
    } : undefined;
    const author = seo.authorName ? { '@type':'Person', '@id':authorId, name:seo.authorName, jobTitle:seo.authorRole || undefined, url:cleanUrl(seo.authorUrl) || undefined, sameAs:cleanUrl(seo.authorUrl) ? [cleanUrl(seo.authorUrl)] : undefined } : undefined;
    // O endereço do anúncio pertence ao imóvel, não ao corretor/imobiliária.
    const agent = { '@type':['Organization','RealEstateAgent'], '@id':agentId, name:seo.organizationName || site.broker || state.projectName, url:cleanUrl(seo.organizationUrl) || (canonical ? new URL(canonical).origin + '/' : undefined), telephone:site.phone || undefined, email:site.email || undefined, identifier:site.license ? { '@type':'PropertyValue', name:'CRECI', value:site.license } : undefined, areaServed:seo.city ? { '@type':'City', name:seo.city } : undefined };
    // RealEstateListing é um subtipo de WebPage no Schema.org e representa melhor
    // páginas de venda/locação de imóveis do que Product. Offer é opcional e só é
    // publicado quando existe um preço numérico válido. Assim o framework não gera
    // Product sem offers/review/aggregateRating, origem do erro crítico do Search Console.
    const webPage = {
      '@type':'RealEstateListing',
      '@id':pageId,
      url:canonical || undefined,
      name:seo.title || state.projectName,
      description:seo.description || undefined,
      isPartOf:{ '@id':websiteId },
      about:{ '@id':propertyId },
      mainEntity:{ '@id':propertyId },
      author:author ? { '@id':authorId } : { '@id':agentId },
      publisher:{ '@id':agentId },
      dateModified:seo.lastReviewed || state.updatedAt || undefined,
      lastReviewed:seo.lastReviewed || undefined,
      primaryImageOfPage:publishedSeoImage(seo) ? { '@type':'ImageObject', url:publishedSeoImage(seo) } : undefined,
      spatialCoverage:seo.city ? { '@type':'City', name:seo.city } : undefined,
      offers:offer
    };
    const website = { '@type':'WebSite', '@id':websiteId, url:canonical ? new URL(canonical).origin + '/' : undefined, name:seo.organizationName || state.projectName, publisher:{ '@id':agentId }, inLanguage:'pt-BR' };
    return { '@context':'https://schema.org', '@graph':[website, webPage, agent, ...(author ? [author] : []), property] };
  }

  // O arquivo continua ./share.ext na raiz do ZIP, mas crawlers Open Graph
  // esperam uma URL absoluta, construída a partir da URL canônica publicada.
  function publishedSeoImage(seo) {
    const image = String(seo?.ogImage || '').trim();
    if (!image || /^data:|^blob:/i.test(image)) return '';
    if (/^https?:\/\//i.test(image)) return image;
    const canonical = String(seo?.canonical || '').trim();
    try {
      const url = new URL(canonical);
      if (url.protocol === 'https:') return /^(?:\.\/)?share\.(png|jpg|jpeg)$/i.test(image) ? seoRootUrl(image, canonical) : new URL(image, url).href;
    } catch (_) {}
    return image;
  }

  function usesFontAwesome(state) {
    if ((state.sections || []).some((section) => section.type === 'form-sender-v4' && section.settings?.visible !== false)) return true;
    const footerSocialKeys = ['facebookUrl','whatsappUrl','instagramUrl','tiktokUrl','youtubeUrl','googleBusinessUrl','linkedinUrl','additionalSocials'];
    if ((state.sections || []).some((section) => section.type === 'footer' && section.settings?.visible !== false && footerSocialKeys.some((key) => String(section.props?.[key] || '').trim()))) return true;
    const iconPattern = /\b(?:fas|far|fab|fa-solid|fa-regular|fa-brands|fa-light|fa-thin|fa-duotone)\s+fa-[a-z0-9-]+\b/i;
    return (state.sections || []).some((section) => section.settings?.visible !== false && Object.values(section.props || {}).some((value) => typeof value === 'string' && iconPattern.test(value)));
  }

  function head(state, inlineCss = '') {
    const seo = state.seo || {};
    const canonical = cleanUrl(seo.canonical);
    const description = esc(seo.description || '');
    const heroPlusPresetFonts = { popular:['Manrope','Inter'], contemporary:['DM Sans','Inter'], luxury:['Playfair Display','Manrope'], editorial:['Bodoni Moda','DM Sans'], architectural:['Roboto Serif','Manrope'] };
    const parseConfiguredFontFamily = (value) => {
      const raw = String(value || '').trim();
      if (!raw || ['inherit','preset','initial','unset','revert'].includes(raw.toLowerCase())) return '';
      // O Inspector aceita nomes simples e também stacks CSS. Para carregar a fonte
      // remota usamos somente a primeira família; o stack continua intacto no CSS.
      const first = raw.split(',')[0].trim().replace(/^['\"]|['\"]$/g, '');
      if (!first) return '';
      const generic = new Set(['serif','sans-serif','monospace','cursive','fantasy','system-ui','ui-serif','ui-sans-serif','ui-monospace','-apple-system','blinkmacsystemfont']);
      return generic.has(first.toLowerCase()) ? '' : first;
    };
    const parallaxPointFonts = (section) => {
      if (section?.type !== 'parallax') return [];
      const found = [];
      const globalFont = parseConfiguredFontFamily(section.props?.bannerFontFamily);
      if (globalFont) found.push(globalFont);
      try {
        const points = JSON.parse(section.props?.heroPoints || '[]');
        if (Array.isArray(points)) {
          for (const point of points) {
            for (const key of ['fontFamily','titleFontFamily','textFontFamily','eyebrowFontFamily']) {
              const family = parseConfiguredFontFamily(point?.[key]);
              if (family) found.push(family);
            }
          }
        }
      } catch {}
      return found;
    };
    const sectionFonts = (state.sections || []).flatMap((section) => {
      if (section.settings?.visible === false) return [];
      const explicit = Object.entries(section.props || {})
        .filter(([key,value]) => /Font(?:Family)?$/.test(key) && typeof value === 'string')
        .map(([,value]) => parseConfiguredFontFamily(value))
        .filter(Boolean);
      explicit.push(...parallaxPointFonts(section));
      const localStyle = section.settings?.style || {};
      if (localStyle.enabled === true) {
        const heading = parseConfiguredFontFamily(localStyle.headingFont);
        const body = parseConfiguredFontFamily(localStyle.bodyFont);
        if (heading) explicit.push(heading);
        if (body) explicit.push(body);
      }
      if (section.type === 'hero-plus') explicit.push(...(heroPlusPresetFonts[section.props?.typographyPreset] || heroPlusPresetFonts.contemporary));
      return explicit;
    });
    const configuredFonts = [state.brand?.headingFont, state.brand?.bodyFont, ...(window.ImobifyTypeSystem?.usedFonts(state.brand) || []), ...sectionFonts]
      .map(parseConfiguredFontFamily)
      .filter(Boolean);
    // O Parallax aceita peso 300 no corpo e 900 no título. Carregar toda a faixa
    // configurável evita fallback silencioso durante a exportação.
    const fontFamilies = [...new Set(configuredFonts)]
      .map((font) => `family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@300;400;500;600;700;800;900`)
      .join('&');
    const usesFa = usesFontAwesome(state);
    const hero = state.sections.find((section) => ['hero','hero-plus'].includes(section.type) && section.settings?.visible !== false);
    const heroImage = hero?.props?.image || hero?.props?.image1 || '';
    return `
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; object-src 'none'; base-uri 'self'">
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <title>${esc(seo.title || state.projectName)}</title>
      <meta name="description" content="${description}">
      <meta name="robots" content="${esc(seo.robots || PUBLIC_ROBOTS)}">
      <meta name="author" content="${esc(seo.authorName || state.siteData?.broker || '')}">
      <meta name="theme-color" content="${esc(state.brand.dark)}">
      ${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
      ${seo.favicon ? `<link rel="icon" href="${esc(publishedFavicon(seo))}"${/\.svg(?:[?#]|$)/i.test(seo.favicon) ? ' type="image/svg+xml"' : /\.webp(?:[?#]|$)/i.test(seo.favicon) ? ' type="image/webp"' : /\.png(?:[?#]|$)/i.test(seo.favicon) ? ' type="image/png"' : ''}>` : ''}
      ${seo.favicon && /\.svg(?:[?#]|$)/i.test(seo.favicon) ? `<link rel="apple-touch-icon" sizes="180x180" href="${esc(seoRootUrl('./apple-touch-icon.png', seo.canonical) || './apple-touch-icon.png')}">` : ''}
      ${heroImage ? `<link rel="preload" as="image" href="${esc(heroImage)}" fetchpriority="high">` : ''}
      <meta property="og:locale" content="pt_BR">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="${esc(seo.organizationName || state.projectName)}">
      <meta property="og:title" content="${esc(seo.title || state.projectName)}">
      <meta property="og:description" content="${description}">
      ${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
      ${publishedSeoImage(seo) ? `<meta property="og:image" content="${esc(publishedSeoImage(seo))}">` : ''}
      ${publishedSeoImage(seo).startsWith('https://') ? `<meta property="og:image:secure_url" content="${esc(publishedSeoImage(seo))}">` : ''}
      ${publishedSeoImage(seo) ? `<meta property="og:image:alt" content="${esc(seo.title || state.projectName)}">` : ''}
      ${/\.jpe?g(?:[?#]|$)/i.test(publishedSeoImage(seo)) ? '<meta property="og:image:type" content="image/jpeg">' : /\.png(?:[?#]|$)/i.test(publishedSeoImage(seo)) ? '<meta property="og:image:type" content="image/png">' : ''}
      ${seo.lastReviewed ? `<meta property="article:modified_time" content="${esc(seo.lastReviewed)}">` : ''}
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${esc(seo.title || state.projectName)}">
      <meta name="twitter:description" content="${description}">
      ${publishedSeoImage(seo) ? `<meta name="twitter:image" content="${esc(publishedSeoImage(seo))}">` : ''}
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      ${fontFamilies ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontFamilies}&display=swap">` : ''}
      ${usesFa ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" referrerpolicy="no-referrer">' : ''}
      <script type="application/ld+json">${JSON.stringify(schema(state)).replace(/</g, '\\u003c')}<\/script>
      ${inlineCss ? `<style>${inlineCss}</style>` : '<link rel="stylesheet" href="assets/css/site.css">'}
    `;
  }

  function documentTagInjections(state, options = {}) {
    const output = { head:[], bodyStart:[], bodyEnd:[] };
    const allowed = new Set(['head','body-start','body-end']);
    for (const section of state.sections || []) {
      const plugin = plugins[section.type];
      if (!plugin || plugin.manifest?.output !== 'document-tag') continue;
      if (section.settings?.visible === false) continue;
      if (options.preview && section.props?.runInPreview !== true) continue;
      const code = String(section.props?.code || '').trim();
      if (!code) continue;
      const placement = allowed.has(section.props?.placement) ? section.props.placement : 'head';
      const id = String(section.id || '').replace(/--+/g, '-').replace(/[\r\n]+/g, ' ').trim();
      const label = String(section.props?.label || plugin.name || section.type).replace(/--+/g, '-').replace(/[\r\n]+/g, ' ').trim();
      const wrapped = `<!-- IMOBIFY TAG | id: ${id} | ${label} -->\n${code}\n<!-- /IMOBIFY TAG | id: ${id} -->`;
      if (placement === 'body-start') output.bodyStart.push(wrapped);
      else if (placement === 'body-end') output.bodyEnd.push(wrapped);
      else output.head.push(wrapped);
    }
    return {
      head:output.head.join('\n'),
      bodyStart:output.bodyStart.join('\n'),
      bodyEnd:output.bodyEnd.join('\n')
    };
  }

  // 7.4.1 — Âncora repetida em várias seções gerava IDs duplicados: o navegador
  // levava #contato ao PRIMEIRO elemento (ex.: um botão), não ao formulário.
  // Agora cada âncora tem um único dono: prioridade para formulários.
  let anchorOwners = new Map();
  const ANCHOR_FORM_PRIORITY = [/^form-sender-v4/, /^agendamento-sender/, /^form-sender(?!-popup)/, /form/i];
  function computeAnchorOwners(sections = []) {
    const groups = new Map();
    sections.forEach((section) => {
      const id = normalizeAnchorId(section.settings?.anchorId);
      if (!id) return;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(section);
    });
    const owners = new Map();
    for (const [id, list] of groups) {
      const visible = list.filter((section) => section.settings?.visible !== false);
      const pool = visible.length ? visible : list;
      let owner = null;
      for (const re of ANCHOR_FORM_PRIORITY) { owner = pool.find((section) => re.test(String(section.type || ''))); if (owner) break; }
      owners.set(id, (owner || pool[0]).id);
    }
    return owners;
  }

  function normalizeAnchorId(value) {
    return String(value || '').trim().replace(/^#/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_:-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function decorateMarkup(markup, section) {
    const transition = section.settings?.transition || 'default';
    const motion = section.settings?.motion || {};
    const limits={duration:[200,4000],delay:[0,2500],distance:[0,250],blur:[0,50],scale:[.5,1.5],threshold:[0,1],originX:[0,100],originY:[0,100]};
    const number=(k,fallback)=>{const n=Number(motion[k]);return Number.isFinite(n)?Math.min(limits[k][1],Math.max(limits[k][0],n)):fallback;};
    const cssMotion=`--imobify-duration:${number('duration',800)}ms;--imobify-delay:${number('delay',0)}ms;--imobify-distance:${number('distance',46)}px;--imobify-blur:${number('blur',12)}px;--imobify-scale:${number('scale',.92)};--imobify-origin-x:${number('originX',50)}%;--imobify-origin-y:${number('originY',50)}%;--imobify-easing:${['ease-out','ease-in-out','linear','cubic-bezier(.22,1,.36,1)','cubic-bezier(.34,1.56,.64,1)'].includes(motion.easing)?motion.easing:'cubic-bezier(.22,1,.36,1)'};`;
    const elementMotion = section.settings?.elementMotion || {};
    const elementMotionConfig = encodeURIComponent(JSON.stringify({
      baseDelayMs: Math.max(0,Math.min(2500,Number(elementMotion.baseDelayMs) || 150)),
      staggerMs: Math.max(0,Math.min(1000,Number(elementMotion.staggerMs) || 100)),
      scrollMode: elementMotion.scrollMode === 'scrub' ? 'scrub' : 'entrance',
      items: elementMotion.items || {}
    }));
    const hideMobile = section.settings?.hideMobile === true;
    const hideDesktop = section.settings?.hideDesktop === true;
    const anchorId = normalizeAnchorId(section.settings?.anchorId);
    // 7.3.0: a âncora pertence ao INÍCIO físico da seção, nunca ao
    // conteúdo interno/final do plugin. Um marcador absoluto (sem ocupar
    // espaço no layout) funciona também em segmentos, grids e layouts compostos.
    // Preservar o ID original da seção mantém #destaques/#galeria e links
    // legados funcionando mesmo quando o usuário escolhe outra âncora.
    let anchorAtStart = '';
    const decorated = String(markup || '').replace(/^<([a-z][a-z0-9-]*)([^>]*)>/i, (_, tag, attrs) => {
      let nextAttrs = attrs || '';
      if (anchorId && (!anchorOwners.has(anchorId) || anchorOwners.get(anchorId) === section.id)) {
        const rootIdMatch = nextAttrs.match(/\sid\s*=\s*(["'])(.*?)\1/i);
        if (!rootIdMatch || rootIdMatch[2] !== anchorId) {
          anchorAtStart = `<span id="${esc(anchorId)}" class="imobify-anchor-start" data-imobify-anchor-start aria-hidden="true"></span>`;
        }
      }
      if (!/\sdata-section-id\s*=/i.test(nextAttrs)) nextAttrs += ` data-section-id="${esc(section.id)}"`;
      if (section.settings?.typographyMode === "local") nextAttrs += ` data-ib-type-mode="local"`;
      if (/\sstyle\s*=\s*(["'])(.*?)\1/i.test(nextAttrs)) nextAttrs=nextAttrs.replace(/\sstyle\s*=\s*(["'])(.*?)\1/i, (_,quote,old)=>` style="${esc(old)};${cssMotion}"`);
      else nextAttrs += ` style="${cssMotion}"`;
      return `<${tag}${nextAttrs} data-element-motion="${elementMotionConfig}" data-motion-threshold="${number('threshold',.20)}" data-motion-replay="${motion.replay===true}" data-motion-direction="${['top','bottom','left','right'].includes(motion.direction)?motion.direction:'bottom'}" data-section-transition="${esc(transition)}" data-hide-mobile="${hideMobile ? 'true' : 'false'}" data-hide-desktop="${hideDesktop ? 'true' : 'false'}">`;
    });
    // O marcador vem imediatamente após a abertura da seção, ANTES de todos
    // os elementos e filhos do plugin. Não criar wrappers nem mudar o grid.
    return anchorAtStart ? decorated.replace(/^<([a-z][a-z0-9-]*)([^>]*)>/i, (start) => start + anchorAtStart) : decorated;
  }

  function editorControls(section, index, layoutContext = null, afterIndex = index + 1) {
    const hidden = section.settings?.visible === false;
    const insertControl = layoutContext?.mode === 'segment-slots'
      ? ''
      : `<button class="imobify-insert-block" type="button" data-editor-action="insert" data-insert-index="${afterIndex}" title="Adicionar seção aqui">+</button>`;
    return `<div class="imobify-block-toolbar" role="toolbar" aria-label="Ações da seção">
      <button type="button" data-editor-action="move-up" title="Mover para cima">↑</button>
      <button type="button" data-editor-action="move-down" title="Mover para baixo">↓</button>
      <button type="button" data-editor-action="duplicate" title="Duplicar seção">⧉</button>
      <button type="button" data-editor-action="toggle-visible" title="${hidden ? 'Exibir' : 'Ocultar'} seção">${hidden ? '⊘' : '◉'}</button>
      <button type="button" data-editor-action="remove" title="Remover seção">×</button>
    </div>${insertControl}`;
  }

  function segmentTrackCount(section, layout) {
    const maxTracks = Math.max(1, Math.min(5, Number(layout?.maxTracks) || 5));
    return Math.max(1, Math.min(maxTracks, Number(section?.props?.tracks) || 1));
  }

  function segmentSlotMarkup(section, tracks, children, options = {}) {
    const direction = section.props?.direction === 'rows' ? 'rows' : 'columns';
    const label = direction === 'rows' ? 'Linha' : 'Coluna';
    const groups = Array.from({ length:tracks }, () => []);
    children.forEach((child, order) => {
      const raw = Number(child.section?.settings?.layoutSlot);
      const slot = Number.isInteger(raw) ? Math.max(0, Math.min(tracks - 1, raw)) : Math.min(tracks - 1, order);
      groups[slot].push(child.markup);
    });
    return groups.map((items, slot) => {
      const slotLabel = `${label} ${slot + 1}`;
      const add = options.editor
        ? `<button class="imobify-segment-slot-add" type="button" data-editor-action="insert-segment-item" data-segment-id="${esc(section.id)}" data-segment-slot="${slot}" title="Adicionar componente em ${esc(slotLabel.toLowerCase())}"><span>+</span>${items.length ? 'Adicionar componente' : 'Inserir componente'}</button>`
        : '';
      return `<div class="ims-segment-slot imobify-segment-slot ${items.length ? 'has-items' : 'is-empty'}" data-segment-id="${esc(section.id)}" data-segment-slot="${slot}" data-slot-label="${esc(slotLabel)}">${items.join('')}${add}</div>`;
    }).join('');
  }

  function renderLogicalBlock(state, index, options = {}) {
    const section = state.sections[index];
    const plugin = section && plugins[section.type];
    if (!section || !plugin || plugin.kind !== 'section') return { markup:'', consumed:1 };
    const visible = section.settings?.visible !== false;
    const layout = plugin.manifest?.layout;
    let consumed = 1;
    let childrenMarkup = '';
    let segmentChildren = [];

    if (layout?.mode === 'next-sections' || layout?.mode === 'segment-slots') {
      const maxChildren = Math.max(1, Number(layout.maxChildren) || 8);
      const excludedTypes = new Set(Array.isArray(layout.excludeTypes) ? layout.excludeTypes : []);
      const requested = Math.max(0, Math.min(maxChildren, Number(section.props?.itemCount ?? plugin.defaults?.itemCount ?? 0) || 0));
      const tracks = layout.mode === 'segment-slots' ? segmentTrackCount(section, layout) : 0;
      let cursor = index + 1;
      let logicalChildren = 0;
      while (cursor < state.sections.length && logicalChildren < requested) {
        const nextSection = state.sections[cursor];
        if (nextSection && excludedTypes.has(nextSection.type)) break;
        const rawSlot = Number(nextSection?.settings?.layoutSlot);
        const childSlot = layout.mode === 'segment-slots'
          ? (Number.isInteger(rawSlot) ? Math.max(0, Math.min(tracks - 1, rawSlot)) : Math.min(tracks - 1, logicalChildren))
          : null;
        const child = renderLogicalBlock(state, cursor, {
          ...options,
          layoutContext:{ parentId:section.id, mode:layout.mode, slot:childSlot }
        });
        if (layout.mode === 'segment-slots') segmentChildren.push({ section:nextSection, markup:child.markup, slot:childSlot });
        else childrenMarkup += child.markup;
        cursor += child.consumed;
        logicalChildren += 1;
      }
      consumed = Math.max(1, cursor - index);
      if (layout.mode === 'segment-slots') childrenMarkup = segmentSlotMarkup(section, tracks, segmentChildren, options);
    }

    if (!visible && !options.editor) return { markup:'', consumed };
    // Um plugin documental aparece como cartão configurável no editor, porém não
    // ocupa espaço no BODY publicado; seu conteúdo é injetado na posição escolhida.
    if (plugin.manifest?.output === 'document-tag' && !options.editor) return { markup:'', consumed };
    let rawMarkup = plugin.render(section.props, state, section.id);
    if (layout?.mode === 'next-sections' || layout?.mode === 'segment-slots') {
      const slot = String(layout.slot || '<!--IMOBIFY_LAYOUT_CHILDREN-->');
      rawMarkup = String(rawMarkup || '').includes(slot)
        ? String(rawMarkup || '').replace(slot, childrenMarkup)
        : String(rawMarkup || '').replace(/<\/section>\s*$/i, `${childrenMarkup}</section>`);
    }
    const markup = decorateMarkup(rawMarkup, section);
    if (!options.editor) return { markup, consumed };
    return {
      markup:`<div class="imobify-editor-block ${visible ? '' : 'is-editor-hidden'} ${section.settings?.hideMobile === true ? 'is-mobile-hidden' : ''} ${section.settings?.hideDesktop === true ? 'is-desktop-hidden' : ''}" data-editor-block-id="${esc(section.id)}">${editorControls(section, index, options.layoutContext, index + consumed)}${markup}</div>`,
      consumed
    };
  }

  function bodyMarkup(state, options = {}) {
    anchorOwners = computeAnchorOwners(state.sections || []);
    const output = [];
    let index = 0;
    while (index < state.sections.length) {
      const block = renderLogicalBlock(state, index, options);
      output.push(block.markup);
      index += Math.max(1, block.consumed || 1);
    }
    return output.join('\n');
  }

  function editorStyles() {
    return `.imobify-editor-block{position:relative;min-height:48px}.imobify-editor-block.is-editor-hidden{opacity:.38;filter:grayscale(.65)}.imobify-editor-block.is-editor-hidden:after{content:'Seção oculta na publicação';position:absolute;inset:0;z-index:8;display:grid;place-items:center;background:rgba(255,255,255,.55);color:#162033;font:700 14px system-ui;pointer-events:none}.imobify-block-toolbar{position:absolute;z-index:30;top:10px;right:10px;display:flex;gap:3px;padding:4px;border-radius:9px;background:#172033;box-shadow:0 8px 26px rgba(0,0,0,.3);opacity:0;transform:translateY(-4px);transition:.18s}.imobify-editor-block:hover>.imobify-block-toolbar,.imobify-editor-block.is-selected>.imobify-block-toolbar{opacity:1;transform:none}.imobify-block-toolbar button,.imobify-insert-block{border:0;background:transparent;color:#fff;cursor:pointer;font:700 15px system-ui}.imobify-block-toolbar button{width:30px;height:30px;border-radius:6px}.imobify-block-toolbar button:hover{background:#2e3d59}.imobify-insert-block{position:absolute;z-index:32;left:50%;bottom:-16px;width:32px;height:32px;border-radius:50%;background:#4f7cff;box-shadow:0 5px 16px rgba(24,61,144,.38);opacity:0;transform:translateX(-50%) scale(.8);transition:.18s}.imobify-editor-block:hover>.imobify-insert-block{opacity:1;transform:translateX(-50%) scale(1)}.editor-selected{outline:3px solid #4f7cff!important;outline-offset:-3px}.imobify-segment-slot{min-height:92px;padding:28px 8px 8px;border:1px dashed rgba(79,124,255,.48);border-radius:10px;background:rgba(79,124,255,.035);transition:border-color .16s ease,background .16s ease}.imobify-segment-slot:before{content:attr(data-slot-label);position:absolute;z-index:24;left:9px;top:8px;padding:3px 6px;border-radius:5px;background:#e8eeff;color:#3158b6;font:800 9px/1 system-ui;letter-spacing:.04em;text-transform:uppercase;pointer-events:none}.imobify-segment-slot:hover{border-color:#4f7cff;background:rgba(79,124,255,.07)}.imobify-segment-slot-add{position:relative;z-index:26;display:flex;align-items:center;justify-content:center;gap:7px;width:100%;min-height:34px;margin-top:auto;border:1px dashed rgba(79,124,255,.55);border-radius:8px;background:rgba(255,255,255,.76);color:#3158b6;cursor:pointer;font:750 11px/1 system-ui}.imobify-segment-slot-add span{font-size:17px}.imobify-segment-slot-add:hover{border-style:solid;background:#eef3ff}.imobify-segment-slot.has-items>.imobify-segment-slot-add{opacity:.35}.imobify-segment-slot.has-items:hover>.imobify-segment-slot-add{opacity:1}@media(min-width:721px){.imobify-editor-block.is-desktop-hidden:not(.is-editor-hidden){min-height:72px;border:1px dashed rgba(255,176,32,.65);background:rgba(255,176,32,.07)}.imobify-editor-block.is-desktop-hidden:not(.is-editor-hidden)>[data-hide-desktop="true"]{display:none!important}.imobify-editor-block.is-desktop-hidden:not(.is-editor-hidden):after{content:'Oculto no desktop';position:absolute;inset:0;display:grid;place-items:center;color:#9a6500;font:800 12px system-ui;letter-spacing:.04em;pointer-events:none}}@media(max-width:720px){.imobify-editor-block.is-mobile-hidden:not(.is-editor-hidden){min-height:72px;border:1px dashed rgba(79,124,255,.55);background:rgba(79,124,255,.06)}.imobify-editor-block.is-mobile-hidden:not(.is-editor-hidden)>[data-hide-mobile="true"]{display:none!important}.imobify-editor-block.is-mobile-hidden:not(.is-editor-hidden):after{content:'Oculto no mobile';position:absolute;inset:0;display:grid;place-items:center;color:#3f5fae;font:800 12px system-ui;letter-spacing:.04em;pointer-events:none}}`;
  }

  function editorBridge(selectedId, options = {}) {
    const restoreScrollY = Math.max(0, Number(options.restoreScrollY) || 0);
    const focusSelected = Boolean(options.focusSelected);
    return `
      (function(){
        window.__IMOBIFY_EDITOR__=true;
        const selected=${JSON.stringify(selectedId || '')};
        const restoreScrollY=${JSON.stringify(0)} + ${restoreScrollY};
        const focusSelected=${focusSelected ? 'true' : 'false'};
        document.querySelectorAll('[data-editor-block-id]').forEach(function(block){
          if(block.dataset.editorBlockId===selected)block.classList.add('is-selected');
        });
        document.addEventListener('click',function(event){
          const action=event.target.closest('[data-editor-action]');
          if(!action)return;
          event.preventDefault();event.stopPropagation();
          const block=action.closest('[data-editor-block-id]');
          parent.postMessage({type:'imobify-editor-action',action:action.dataset.editorAction,id:block&&block.dataset.editorBlockId,index:Number(action.dataset.insertIndex),segmentId:action.dataset.segmentId||'',segmentSlot:Number(action.dataset.segmentSlot)},'*');
        },true);
        let smartPlantNavigating = false;
        document.addEventListener('imobify:smart-plant-navigation',function(){ smartPlantNavigating = true; });
        document.querySelectorAll('[data-section-id]').forEach(function(section){
          if(section.dataset.sectionId===selected)section.classList.add('editor-selected');
          section.addEventListener('mouseenter',function(){section.classList.add('editor-hover')});
          section.addEventListener('mouseleave',function(){section.classList.remove('editor-hover')});
          section.addEventListener('click',function(event){
            // Botões/formulários devem funcionar na prévia. Selecionar a
            // section aqui remontava o iframe e devolvia o scroll às plantas.
            if(event.target.closest('button,a,input,select,textarea,[role="button"],[data-smart-plant-open],[contenteditable="true"]'))return;
            event.preventDefault(); event.stopPropagation();
            parent.postMessage({type:'imobify-select',id:section.dataset.sectionId},'*');
          });
        });
        document.addEventListener('submit',function(event){event.preventDefault()});
        document.querySelectorAll('a').forEach(function(link){link.addEventListener('click',function(event){event.preventDefault()})});
        let viewportTimer=0;
        const selectedBlock=selected&&document.querySelector('[data-editor-block-id="'+CSS.escape(selected)+'"]');
        function reportViewport(){clearTimeout(viewportTimer);viewportTimer=setTimeout(function(){parent.postMessage({type:'imobify-editor-viewport',scrollY:window.scrollY||0,selectedId:selected},'*')},40)}
        function selectedIsVisible(){
          if(!selectedBlock)return false;
          const rect=selectedBlock.getBoundingClientRect();
          const guard=Math.min(96,Math.max(28,innerHeight*.08));
          return rect.bottom>guard&&rect.top<innerHeight-guard;
        }
        function focusSelectedBlock(force){
          if(smartPlantNavigating||!focusSelected||!selectedBlock)return;
          if(!force&&selectedIsVisible())return;
          const rect=selectedBlock.getBoundingClientRect();
          const align=rect.height>innerHeight*.78?'start':'center';
          selectedBlock.scrollIntoView({block:align,behavior:'auto'});
          if(align==='start')window.scrollBy(0,-20);
          reportViewport();
        }
        window.addEventListener('scroll',reportViewport,{passive:true});
        requestAnimationFrame(function(){requestAnimationFrame(function(){
          if(focusSelected&&selectedBlock)focusSelectedBlock(true);else if(restoreScrollY>0)window.scrollTo(0,restoreScrollY);
          reportViewport();
        })});
        if(focusSelected&&selectedBlock){
          if('ResizeObserver' in window){
            const selectedObserver=new ResizeObserver(function(){focusSelectedBlock(false)});
            selectedObserver.observe(selectedBlock);
          }
          window.addEventListener('load',function(){setTimeout(function(){focusSelectedBlock(false)},30)},{once:true});
          setTimeout(function(){focusSelectedBlock(false)},180);
        }
      })();
    `;
  }

  async function buildInlineDocument(state, options = {}) {
    const sources = await loadSources(state, { includeHidden: Boolean(options.editor), editor:Boolean(options.editor) });
    const css = `${sources.css}\n${variables(state)}\n${sectionOverrides(state)}\n${options.editor ? editorStyles() : ''}`;
    const js = options.editor ? `${editorBridge(state.selectedSectionId, options)}\n${sources.js}` : sources.js;
    const tags = documentTagInjections(state, { preview:Boolean(options.editor) });
    return `<!doctype html><html lang="pt-BR"><head>${head(state, css)}${tags.head ? `\n${tags.head}` : ''}</head><body data-scroll-mode="${esc(state.pageSettings?.scrollMode || 'flow')}" data-motion="${esc(state.pageSettings?.motion || 'subtle')}">${tags.bodyStart ? `\n${tags.bodyStart}` : ''}<a class="skip-link" href="#conteudo-principal">Ir para o conteúdo</a><main id="conteudo-principal" role="main">${bodyMarkup(state, { editor: Boolean(options.editor) })}</main>${tags.bodyEnd ? `\n${tags.bodyEnd}` : ''}<script>${js.replace(/<\/script/gi, '<\\/script')}<\/script></body></html>`;
  }

  function buildExternalDocument(state) {
    const tags = documentTagInjections(state);
    const cacheToken = String(Date.now());
    const externalHead = head(state).replace('assets/css/site.css', `assets/css/site.css?v=${cacheToken}`);
    return `<!doctype html>
<html lang="pt-BR">
<head>${externalHead}${tags.head ? `\n${tags.head}` : ''}</head>
<body data-scroll-mode="${esc(state.pageSettings?.scrollMode || 'flow')}" data-motion="${esc(state.pageSettings?.motion || 'subtle')}">
${tags.bodyStart ? `${tags.bodyStart}\n` : ''}<a class="skip-link" href="#conteudo-principal">Ir para o conteúdo</a>
<main id="conteudo-principal" role="main">${bodyMarkup(state)}</main>
${tags.bodyEnd ? `${tags.bodyEnd}\n` : ''}<script src="assets/js/site.js?v=${cacheToken}" defer><\/script>
</body>
</html>`;
  }

  window.ImobifyRenderer = { computeAnchorOwners, fetchText, loadSources, variables, sectionOverrides, head, bodyMarkup, buildInlineDocument, buildExternalDocument, activePluginKeys, documentTagInjections, schema, editorStyles };
})();

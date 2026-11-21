(function () {
  const { plugins } = window.ImobifyCatalog;
  const renderer = window.ImobifyRenderer;
  const STUDIO_VERSION = '7.5.1';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const slug = (value) => String(value || 'landing-page').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'landing-page';
  const remotePattern = /^https?:\/\//i;

  function dataUrlParts(url) {
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(url || '');
    return match ? { mime: match[1].toLowerCase(), base64: match[2] } : null;
  }

  function extension(mime, source = '') {
    const map = {
      'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'image/svg+xml':'svg', 'image/avif':'avif', 'image/x-icon':'ico', 'image/vnd.microsoft.icon':'ico',
      'video/mp4':'mp4', 'video/webm':'webm', 'video/quicktime':'mov', 'video/ogg':'ogv',
      'audio/mpeg':'mp3', 'audio/mp4':'m4a', 'audio/wav':'wav', 'audio/x-wav':'wav', 'audio/ogg':'ogg', 'audio/webm':'webm',
      'font/woff':'woff', 'font/woff2':'woff2'
    };
    if (map[mime]) return map[mime];
    const clean = String(source || '').split(/[?#]/)[0];
    const byPath = clean.match(/\.([a-z0-9]{2,6})$/i);
    return byPath ? byPath[1].toLowerCase() : 'bin';
  }

  function kindFromMimeOrPath(mime = '', source = '', fallback = 'file') {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    const ext = extension('', source);
    if (/^(?:jpg|jpeg|png|webp|gif|svg|avif)$/.test(ext)) return 'image';
    if (/^(?:mp4|webm|mov|m4v|ogv)$/.test(ext)) return 'video';
    if (/^(?:mp3|wav|ogg|oga|m4a|aac|flac)$/.test(ext)) return 'audio';
    return fallback;
  }

  function folderFor(kind) {
    if (kind === 'image') return 'assets/images';
    if (kind === 'video') return 'assets/video';
    if (kind === 'audio') return 'assets/audio';
    return 'assets/files';
  }

  function normalizeRemoteMediaSource(value) {
    const source = String(value || '').trim();
    if (!source) return '';
    try {
      const url = new URL(source, window.location?.href || 'https://localhost/');
      if (url.hostname.toLowerCase() === 'github.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 5 && (parts[2] === 'raw' || parts[2] === 'blob')) {
          const [owner, repo, , ...rest] = parts;
          if (owner && repo && rest.length) return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join('/')}${url.search || ''}`;
        }
      }
    } catch (_) {}
    return source;
  }

  function isPackableSource(value, allowRemote = false) {
    if (typeof value !== 'string' || !value.trim()) return false;
    if ((remotePattern.test(value) || /^\/\//.test(value)) && !allowRemote) return false;
    if (/^#/.test(value) || /^(?:mailto|tel|javascript):/i.test(value)) return false;
    return true;
  }

  function pluginBase(sectionType) {
    const plugin = plugins[sectionType];
    if (!plugin || plugin.pluginSource !== 'bundled') return '';
    if (plugin.assetBase) return plugin.assetBase;
    const path = plugin.manifestPath || '';
    return path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '';
  }

  function resolveSectionSource(value, sectionType) {
    const source = String(value || '').trim();
    if (!source || dataUrlParts(source) || /^blob:/i.test(source) || remotePattern.test(source) || source.startsWith('/')) return source;
    const base = pluginBase(sectionType);
    if (base && /^(?:\.\/)?assets\//i.test(source)) return base + source.replace(/^\.\//, '');
    return source;
  }

  function inferFieldKind(field, key, value) {
    const type = String(field?.type || '').toLowerCase();
    const data = dataUrlParts(value);
    // Data URLs carregadas pelo editor têm MIME suficiente para identificar mídia,
    // mesmo quando um plugin legado declarou o campo como text/url.
    if (data) return kindFromMimeOrPath(data.mime, value, 'file');
    if (['image','video','audio','file','media'].includes(type)) return type === 'media' ? kindFromMimeOrPath('', value, 'file') : type;
    if (['color','toggle','number','range','select','icon','text','textarea','url','email','date'].includes(type)) return null;
    const byPath = kindFromMimeOrPath('', value, '');
    if (byPath) return byPath;
    const name = String(key || '').toLowerCase();
    if (/(?:image|imagem|photo|foto|poster|thumbnail|thumb|logo|ogimage|background)/.test(name)) return 'image';
    if (/(?:video|movie|film)/.test(name)) return 'video';
    if (/(?:audio|sound|music|som)/.test(name)) return 'audio';
    return null;
  }

  async function packageOne(zip, source, context, registry, progress) {
    const original = String(source || '').trim();
    const normalizedRemote = remotePattern.test(original) ? normalizeRemoteMediaSource(original) : original;
    const allowRemote = context?.allowRemote === true;
    if (!isPackableSource(normalizedRemote, allowRemote)) return normalizedRemote;
    if (zip.file(normalizedRemote)) return normalizedRemote;

    const resolved = context.sectionType ? resolveSectionSource(normalizedRemote, context.sectionType) : normalizedRemote;
    const existing = registry.seen.get(resolved);
    if (existing) return existing;

    const data = dataUrlParts(resolved);
    let mime = data?.mime || '';
    let payload;
    if (data) {
      payload = { base64: data.base64 };
    } else {
      try {
        const response = await fetch(resolved, allowRemote ? { mode:'cors', credentials:'omit' } : undefined);
        if (!response.ok) throw new Error(`HTTP ${response.status || ''}`.trim());
        const contentType = response.headers?.get?.('content-type');
        if (contentType) mime = contentType.split(';')[0].trim().toLowerCase();
        const declaredSize = Number(response.headers?.get?.('content-length')) || 0;
        const maxRemoteBytes = 120 * 1024 * 1024;
        if (allowRemote && declaredSize > maxRemoteBytes) throw new Error('vídeo remoto excede 120 MB');
        const buffer = await response.arrayBuffer();
        if (allowRemote && buffer.byteLength > maxRemoteBytes) throw new Error('vídeo remoto excede 120 MB');
        payload = { buffer };
      } catch (error) {
        console.warn(`Mídia não incluída: ${resolved}`, error);
        return normalizedRemote;
      }
    }

    const kind = context.kind || kindFromMimeOrPath(mime, resolved, 'file');
    registry.count += 1;
    const ext = extension(mime, resolved);
    const baseName = slug(`${context.label || context.sectionType || kind}-${context.key || registry.count}`);
    let filename = `${folderFor(kind)}/${baseName}-${registry.count}.${ext}`;
    while (zip.file(filename)) {
      registry.count += 1;
      filename = `${folderFor(kind)}/${baseName}-${registry.count}.${ext}`;
    }
    if (payload.base64) zip.file(filename, payload.base64, { base64: true });
    else zip.file(filename, payload.buffer);
    registry.seen.set(resolved, filename);
    registry.assets.push(filename);
    progress?.(`Incorporando mídia (${registry.assets.length})...`, Math.min(64, 28 + registry.assets.length * 3));
    return filename;
  }

  // Arquivos SEO PNG/WebP vivem na RAIZ do ZIP. Não passam por packageOne,
  // pois aquele helper sempre escolhe assets/images e poderia duplicar mídias.
  // URLs remotas continuam remotas caso não possam ser incorporadas via CORS;
  // referências legadas (JPG/SVG/ICO) conservam o fluxo anterior por compatibilidade.
  async function packageSeoRootImage(zip, source, basename, key, registry, progress) {
    const original = String(source || '').trim();
    if (!original) return '';
    const data = dataUrlParts(original);
    const isRemote = remotePattern.test(original) || /^\/\//.test(original);
    if (isRemote) return original; // link informado, não arquivo carregado
    const pathExt = extension('', original);
    const format = data ? extension(data.mime, '') : pathExt;
    if (!(basename === 'share' ? ['png', 'jpg', 'jpeg'].includes(format) : ['svg', 'png', 'webp', 'jpg', 'jpeg'].includes(format))) {
      return packageOne(zip, original, { kind:'image', key, label:'seo' }, registry, progress);
    }
    const filename = `${basename}.${format === 'jpeg' ? 'jpg' : format}`;
    let payload;
    if (data) {
      payload = { base64:data.base64 };
    } else {
      try {
        const response = await fetch(original);
        if (!response.ok) throw new Error(`HTTP ${response.status || ''}`.trim());
        const buffer = await response.arrayBuffer();
        payload = { buffer };
      } catch (error) {
        // Nunca gerar um ZIP que referencia ./icon.png/./share.webp inexistente.
        throw new Error(`Não foi possível incorporar ${basename}.${format}: ${error.message}. Recarregue o arquivo na aba SEO.`);
      }
    }
    if (basename === 'share') {
      const bytes = payload.base64 ? Math.floor(payload.base64.length * 3 / 4) : payload.buffer.byteLength;
      if (bytes >= 300 * 1024) throw new Error('Imagem social excede 300 KB. Recarregue no painel SEO para otimizar.');
    }
    if (basename === 'icon' && format === 'svg' && data) {
      // Apple Touch Icon exige uma representação PNG para compatibilidade com iOS.
      const apple = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 180;
            canvas.getContext('2d').drawImage(img, 0, 0, 180, 180);
            resolve(canvas.toDataURL('image/png').split(',')[1]);
          } catch (e) { reject(e); }
        };
        img.onerror = () => reject(Error('SVG não pôde ser convertido para Apple Touch Icon'));
        img.src = original;
      });
      zip.file('apple-touch-icon.png', apple, {base64:true});
      registry.assets.push('apple-touch-icon.png');
    }
    if (payload.base64) zip.file(filename, payload.base64, { base64:true });
    else zip.file(filename, payload.buffer);
    registry.seen.set(original, `./${filename}`);
    registry.assets.push(filename);
    progress?.(`SEO: incorporando ${filename}`, Math.min(64, 28 + registry.assets.length * 3));
    return `./${filename}`;
  }

  function hydratePluginDefaults(state) {
    for (const section of state.sections || []) {
      const plugin = plugins[section?.type];
      if (!plugin || !plugin.defaults) continue;
      section.props = section.props && typeof section.props === 'object' ? section.props : {};
      for (const [key, value] of Object.entries(plugin.defaults)) {
        if (!Object.prototype.hasOwnProperty.call(section.props, key)) section.props[key] = clone(value);
      }
    }
    return state;
  }

  async function packageStateMedia(zip, state, registry, progress) {
    // Na publicação, a referência do projeto é normalizada SEM alterar o projeto salvo.
    for (const [key, basename] of [['favicon','icon'], ['ogImage','share']]) {
      const value = state.seo?.[key];
      if (!value) continue;
      state.seo[key] = await packageSeoRootImage(zip, value, basename, key, registry, progress);
    }

    for (const section of state.sections || []) {
      if (section.settings?.visible === false) continue;
      const plugin = plugins[section.type];
      if (!plugin) continue;
      const background = section.settings?.background;
      if (background?.enabled === true && background.type === 'image' && background.image) {
        const originalBackgroundImage = background.image;
        background.image = await packageOne(zip, originalBackgroundImage, {
          kind:'image', key:'section-background', label:section.type, sectionType:section.type
        }, registry, progress);
        if (isPackableSource(originalBackgroundImage) && !zip.file(background.image) &&
            !/^(?:https?:|\/\/)/i.test(background.image)) {
          throw new Error(`Imagem de fundo da seção ${section.type} não encontrada: ${originalBackgroundImage.slice(0,120)}. Recarregue a imagem antes de exportar.`);
        }
      }
      const fieldMap = new Map((plugin.fields || []).map((field) => [field.key, field]));
      for (const [key, value] of Object.entries(section.props || {})) {
        if (typeof value !== 'string' || !value) continue;
        // JSON serializado de plugins não é uma URL de imagem; mídia interna
        // é processada pelos empacotadores especializados abaixo.
        if (/^\s*[\[{]/.test(value)) continue;
        const kind = inferFieldKind(fieldMap.get(key), key, value);
        if (!kind) continue;
        const allowRemote = section.type === 'parallax' && key === 'videoSrc' && kind === 'video';
        section.props[key] = await packageOne(zip, value, { kind, key, label:section.type, sectionType:section.type, allowRemote }, registry, progress);
      }
      // Parallax: cada narração vive no JSON heroPoints, fora dos campos simples.
      // Empacotar fisicamente e reescrever a referência para o site publicado.
      if (section.type === 'parallax' && typeof section.props?.heroPoints === 'string' && section.props.heroPoints) {
        try {
          const points = JSON.parse(section.props.heroPoints);
          if (Array.isArray(points)) {
            for (let index = 0; index < points.length; index++) {
              const source = points[index]?.narrationAudio;
              if (typeof source !== 'string' || !source.trim()) continue;
              points[index].narrationAudio = await packageOne(zip, source, {
                kind:'audio', key:`slide-${index+1}-narration`, label:'parallax', sectionType:'parallax'
              }, registry, progress);
            }
            section.props.heroPoints = JSON.stringify(points);
          }
        } catch (error) { console.warn('Falha ao empacotar as narrações do Parallax.', error); }
      }
      // Slider imobiliário 1.1+: imagens ficam dentro do JSON `slides`, permitindo
      // quantidade livre de itens. Empacota cada imagem para manter publicação offline.
      if (section.type === 'property-slider' && typeof section.props?.slides === 'string' && section.props.slides) {
        try {
          const slides = JSON.parse(section.props.slides);
          if (Array.isArray(slides)) {
            for (let index = 0; index < slides.length; index += 1) {
              const image = slides[index]?.image;
              if (typeof image !== 'string' || !image) continue;
              slides[index].image = await packageOne(zip, image, { kind:'image', key:`slide-${index + 1}-image`, label:section.type, sectionType:section.type, allowRemote:true }, registry, progress);
            }
            section.props.slides = JSON.stringify(slides);
          }
        } catch (error) {
          console.warn('Não foi possível empacotar as imagens do Slider imobiliário.', error);
        }
      }
      // Tour 360 Pro: panoramas e branding ficam serializados dentro de `tourConfig`.
      // Extrai Data URLs para arquivos físicos do pacote final e regrava caminhos relativos.
      if (['tour360-pro','hero360-tour','parallax360-tour'].includes(section.type) && typeof section.props?.tourConfig === 'string' && section.props.tourConfig) {
        try {
          const tour = JSON.parse(section.props.tourConfig);
          const order = Array.isArray(tour.sceneOrder) ? tour.sceneOrder : Object.keys(tour.scenes || {});
          for (let index = 0; index < order.length; index += 1) {
            const id = order[index], scene = tour.scenes?.[id];
            if (!scene || typeof scene.panorama !== 'string' || !scene.panorama) continue;
            scene.panorama = await packageOne(zip, scene.panorama, { kind:'image', key:`scene-${index + 1}-panorama`, label:'tour360', sectionType:section.type }, registry, progress);
          }
          if (tour.branding && typeof tour.branding.banner === 'string' && tour.branding.banner) {
            tour.branding.banner = await packageOne(zip, tour.branding.banner, { kind:'image', key:'branding', label:'tour360', sectionType:section.type }, registry, progress);
          }
          section.props.tourConfig = JSON.stringify(tour);
        } catch (error) { console.warn('Não foi possível empacotar as imagens do Tour 360.', error); }
      }
      // Smart Plant: as imagens ficam dentro do JSON `plants`. Empacota card,
      // imagem detalhada e implantação para que a exportação funcione offline/mobile.
      if (section.type === 'smart-plant' && typeof section.props?.plants === 'string' && section.props.plants) {
        try {
          const plants = JSON.parse(section.props.plants);
          if (Array.isArray(plants)) {
            for (let index = 0; index < plants.length; index += 1) {
              for (const key of ['image','fullImage','positionImage']) {
                const image = plants[index]?.[key];
                if (typeof image !== 'string' || !image) continue;
                plants[index][key] = await packageOne(zip, image, { kind:'image', key:`plant-${index + 1}-${key}`, label:section.type, sectionType:section.type }, registry, progress);
              }
            }
            section.props.plants = JSON.stringify(plants);
          }
        } catch (error) {
          console.warn('Não foi possível empacotar as imagens do Smart Plant.', error);
        }
      }
    }
  }

  async function packageCssAssets(zip, css, registry, progress) {
    const matches = [];
    const regex = /url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi;
    let match;
    while ((match = regex.exec(css))) {
      const source = match[2].trim();
      if (isPackableSource(source) && !/^data:/i.test(source)) matches.push(source);
    }
    let output = css;
    for (const source of [...new Set(matches)]) {
      const replacement = await packageOne(zip, source, { kind:kindFromMimeOrPath('', source, 'file'), label:'css', key:'asset' }, registry, progress);
      if (replacement !== source) output = output.split(source).join(replacement);
    }
    return output;
  }

  // URLs com cache-busting (?v=...) apontam para o mesmo arquivo no ZIP.
  // Preservamos a URL no HTML, mas verificamos a existência pelo caminho físico.
  function packagedAssetPath(source) {
    return String(source || '').split(/[?#]/, 1)[0].replace(/^\.\//, '');
  }

  async function packageHtmlAssets(zip, html, registry, progress) {
    const matches = [];
    const regex = /\b(?:src|poster)\s*=\s*(["'])([^"']+)\1/gi;
    let match;
    while ((match = regex.exec(html))) {
      const source = match[2].trim();
      if (isPackableSource(source) && !/^data:/i.test(source) && !zip.file(packagedAssetPath(source))) matches.push(source);
    }
    let output = html;
    for (const source of [...new Set(matches)]) {
      const replacement = await packageOne(zip, source, { kind:kindFromMimeOrPath('', source, 'file'), label:'html', key:'asset' }, registry, progress);
      if (replacement !== source) output = output.split(source).join(replacement);
    }
    return output;
  }

  function hasVisibleParallax(state) {
    return (state.sections || []).some((section) => section?.type === 'parallax' && section.settings?.visible !== false);
  }

  function parallaxBannerCount(state) {
    let count = 0;
    for (const section of state.sections || []) {
      if (section?.type !== 'parallax' || section.settings?.visible === false) continue;
      try {
        const items = JSON.parse(section.props?.heroPoints || '[]');
        if (Array.isArray(items)) count += items.filter((item) => item && item.enabled !== false).length;
      } catch (_) {}
    }
    return count;
  }

  async function addParallaxStandaloneFallback(zip, state, html) {
    if (!hasVisibleParallax(state)) return html;
    const plugin = plugins.parallax;
    if (!plugin) throw new Error('Exportação interrompida: o plugin Parallax não está registrado no Studio.');

    let css = plugin.cssText;
    let js = plugin.jsText;
    if (css == null && plugin.cssPath) css = await renderer.fetchText?.(plugin.cssPath);
    if (js == null && plugin.jsPath) js = await renderer.fetchText?.(plugin.jsPath);
    css = String(css || '');
    js = String(js || '');
    if (!css.includes('.svp-root') || !js.includes('[data-plugin="parallax"] .svp-root')) {
      throw new Error('Exportação interrompida: o runtime/CSS do Parallax não pôde ser incorporado. Recarregue o Studio e exporte novamente.');
    }

    zip.file('assets/plugins/parallax/plugin.css', css);
    zip.file('assets/plugins/parallax/plugin.js', js);
    const cssTag = '<link rel="stylesheet" href="assets/plugins/parallax/plugin.css" data-imobify-critical="parallax">';
    const jsTag = '<script src="assets/plugins/parallax/plugin.js" defer data-imobify-critical="parallax"></script>';
    if (!html.includes('data-imobify-critical="parallax"')) {
      html = html.replace('</head>', `${cssTag}\n</head>`);
      html = html.replace('</body>', `${jsTag}\n</body>`);
    }
    return html;
  }

  function validateParallaxExport(state, html, css, js, zip) {
    if (!hasVisibleParallax(state)) return;
    const failures = [];
    if (!html.includes('data-plugin="parallax"') || !html.includes('class="svp-root"')) failures.push('markup');
    if (!css.includes('.svp-root')) failures.push('CSS principal');
    if (!js.includes('[data-plugin="parallax"] .svp-root')) failures.push('runtime principal');
    if (!zip.file('assets/plugins/parallax/plugin.css')) failures.push('CSS isolado');
    if (!zip.file('assets/plugins/parallax/plugin.js')) failures.push('runtime isolado');
    if (parallaxBannerCount(state) > 0 && (!html.includes('data-hero-points=') || html.includes('data-hero-points="[]"'))) failures.push('banners');
    if (failures.length) throw new Error(`Exportação interrompida: pacote Parallax incompleto (${failures.join(', ')}). Nenhum ZIP foi gerado.`);
  }

  function hasVisiblePopup(state) {
    return (state.sections || []).some((section) => section?.type === 'scheduled-popup-pro' && section.settings?.visible !== false);
  }

  function validatePopupExport(state, html, css, js) {
    if (!hasVisiblePopup(state)) return;
    const failures = [];
    if (!html.includes('data-plugin="scheduled-popup-pro"') || !html.includes('class="spp-overlay"')) failures.push('markup');
    if (!css.includes('.spp-overlay') || !css.includes('spp-scroll-lock')) failures.push('CSS');
    if (!js.includes('__IMOBIFY_POPUPS__') || !js.includes('function viewportAllowed')) failures.push('runtime');
    if (failures.length) throw new Error(`Exportação interrompida: Popup Pro incompleto (${failures.join(', ')}). Nenhum ZIP foi gerado.`);
  }

  function hasVisibleQuickForm(state) {
    return (state.sections || []).some((section) => section?.type === 'form-sender-v4' && section.settings?.visible !== false && section.props?.quickComplement !== false && String(section.props?.quickComplement ?? 'true') !== 'false');
  }

  function validateFormSenderExport(state, html, js) {
    if (!hasVisibleQuickForm(state)) return;
    const failures = [];
    if (!html.includes('data-plugin="form-sender-v4"')) failures.push('markup do formulário');
    if (!/data-quick-complement="(?:true|1|on)"/i.test(html)) failures.push('flag quickComplement');
    if (!html.includes('data-quick-q1-label=') || !html.includes('data-quick-q2-label=') || !html.includes('data-quick-q3-label=')) failures.push('perguntas');
    if (!js.includes('openQuickComplement') || !js.includes('installQuickComplement')) failures.push('runtime da complementação');
    if (failures.length) throw new Error(`Exportação interrompida: Form Sender incompleto (${failures.join(', ')}). Nenhum ZIP foi gerado.`);
  }

  function securityHeaders() {
    return "Content-Security-Policy: default-src 'self' https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'\nX-Content-Type-Options: nosniff\nReferrer-Policy: strict-origin-when-cross-origin\n";
  }

  function xmlEsc(value) {
    return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }

  function canonicalUrl(state) {
    const value = String(state.seo?.canonical || '').trim();
    try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url : null; } catch { return null; }
  }

  // Sitemaps só recebem URLs públicas para imagens efetivamente referenciadas na
  // página publicada. Não transformar caminhos locais em links de arquivos ausentes.
  function absoluteAsset(source, base) {
    const value = String(source || '').trim().replace(/&amp;/gi, '&');
    if (!value || /^(?:data|blob|javascript|file):/i.test(value) || value.startsWith('#')) return '';
    try {
      const url = new URL(value, base);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      url.hash = '';
      return url.href;
    } catch (_) { return ''; }
  }

  function imageLike(source) {
    return /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(String(source || '')) || /^data:image\//i.test(String(source || ''));
  }

  function collectImageSources(state, options = {}) {
    const sources = new Set();
    const add = (v) => { if (typeof v === 'string' && v.trim()) sources.add(v.trim()); };
    const mediaKey = /(?:image|imagem|photo|foto|picture|poster|thumbnail|thumb|logo|background|banner|panorama|cover|srcset|slide|frame)/i;
    const scan = (obj, key = '', depth = 0) => {
      if (depth > 9 || obj == null) return;
      if (typeof obj === 'string') {
        if (/^[\s]*[\[{]/.test(obj) && obj.length < 300000) {
          try { scan(JSON.parse(obj), key, depth + 1); } catch (_) {}
        }
        if (imageLike(obj) || (mediaKey.test(key) && /^(?:https?:|\/|\.\.?\/|assets\/)/i.test(obj))) add(obj);
        return;
      }
      if (Array.isArray(obj)) { obj.slice(0,1500).forEach(v => scan(v,key,depth + 1)); return; }
      if (typeof obj === 'object') {
        Object.entries(obj).forEach(([k,v]) => {
          // Evitar links e placeholders arbitrários que não são mídia da página.
          if (/^(?:link|href|url|cta|email|phone|whatsapp|map)$/i.test(k)) return;
          scan(v,k,depth + 1);
        });
      }
    };
    add(state.seo?.ogImage);
    for (const section of state.sections || []) {
      if (section.settings?.visible === false) continue;
      const fields = new Map((plugins[section.type]?.fields || []).map(f=>[f.key,f]));
      for (const [key,value] of Object.entries(section.props || {})) {
        if (typeof value === 'string' && inferFieldKind(fields.get(key),key,value) === 'image') add(value);
        scan(value,key);
      }
    }
    // No HTML final: <img>, <picture>, CSS de fundo e og:image; inclui mídia
    // renderizada por plugins e não só os campos simples do editor.
    const html = String(options.html || '');
    let match;
    const mediaTags = /<(?:img|source|meta|link)\b[^>]*>/gi;
    while ((match = mediaTags.exec(html))) {
      const tag = match[0];
      const attributes = new Map([...tag.matchAll(/([\w:-]+)\s*=\s*([\"'])(.*?)\2/g)].map(a => [a[1].toLowerCase(),a[3]]));
      const attr = (name) => attributes.get(name) || '';
      const rel = attr('rel'), prop = attr('property'), as = attr('as');
      if (/^<img\b/i.test(tag)) { add(attr('src')); add(attr('data-src')); }
      if (/^<source\b/i.test(tag) && /image\//i.test(attr('type'))) add(attr('src'));
      if (/^<meta\b/i.test(tag) && /^og:image(?::secure_url)?$/i.test(prop)) add(attr('content'));
      if (/^<link\b/i.test(tag) && rel === 'preload' && as === 'image') add(attr('href'));
      for (const list of [attr('srcset'),attr('data-srcset')]) {
        if (list) list.split(',').forEach(v => add(v.trim().split(/\s+/)[0]));
      }
    }
    const css = String(options.css || '') + '\n' + html;
    const urlPattern = /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi;
    while ((match = urlPattern.exec(css))) if (imageLike(match[2])) add(match[2]);
    // Arquivos locais efetivamente incluídos no ZIP, inclusive CSS/slider/plantas.
    for (const file of options.assets || []) if (imageLike(file)) add(file);
    return [...sources];
  }

  function publishedImageUrls(state, options = {}) {
    const base = sitemapBaseUrl(canonicalUrl(state));
    if (!base) return [];
    const zip = options.zip;
    const images = new Set();
    for (const raw of collectImageSources(state, options)) {
      let src = String(raw).trim();
      if (!src || /^(?:data|blob):/i.test(src) || !imageLike(src)) continue;
      if (/^\/\//.test(src)) src = 'https:' + src;
      const remote = /^https?:\/\//i.test(src);
      const clean = src.split(/[?#]/)[0].replace(/^\.\//,'');
      // Caminhos locais dependem de um arquivo empacotado de verdade.
      if (!remote && (!zip || !zip.file(clean))) continue;
      const url = absoluteAsset(src, base);
      if (url) images.add(url);
      if (images.size >= 1000) break;
    }
    return [...images];
  }

  function sitemapEnabled(state) {
    return state.seo?.sitemapEnabled !== 'no';
  }

  function sitemapBaseUrl(canonical) {
    if (!canonical) return null;
    const base = new URL(canonical.href);
    if (!base.pathname.endsWith('/')) {
      const tail = base.pathname.split('/').pop() || '';
      if (/\.[a-z0-9]{1,8}$/i.test(tail)) base.pathname = base.pathname.replace(/[^/]*$/, '');
      else base.pathname += '/';
    }
    base.search = '';
    base.hash = '';
    return base;
  }

  function sitemapPublicUrl(state) {
    const canonical = canonicalUrl(state);
    const base = sitemapBaseUrl(canonical);
    return base ? new URL('sitemap.xml', base).href : '';
  }

  function validateSitemap(state) {
    if (!sitemapEnabled(state)) return;
    const canonical = canonicalUrl(state);
    if (!canonical || canonical.protocol !== 'https:') {
      throw new Error('Sitemap XML automático: informe uma URL canônica HTTPS válida na aba SEO antes de compilar.');
    }
  }

  function robotsTxt(state) {
    const sitemap = sitemapEnabled(state) ? sitemapPublicUrl(state) : '';
    const searchRule = state.seo?.aiSearch === 'disallow' ? 'Disallow: /' : 'Allow: /';
    const trainingRule = state.seo?.aiTraining === 'allow' ? 'Allow: /' : 'Disallow: /';
    return `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\n${searchRule}\n\nUser-agent: GPTBot\n${trainingRule}\n${sitemap ? `\nSitemap: ${sitemap}\n` : ''}`;
  }

  function sitemapXml(state, options = {}) {
    if (!sitemapEnabled(state)) return '';
    const canonical = canonicalUrl(state);
    if (!canonical || canonical.protocol !== 'https:') return '';
    const images = publishedImageUrls(state, options);
    // lastmod apenas quando há data real e válida de revisão / alteração do conteúdo.
    const candidate = String(state.seo?.lastReviewed || state.updatedAt || '').trim();
    const date = /^\d{4}-\d{2}-\d{2}/.test(candidate) ? candidate.slice(0,10) : '';
    const lastmod = date && !Number.isNaN(new Date(date + 'T00:00:00Z').getTime()) && new Date(date + 'T00:00:00Z').toISOString().slice(0,10) === date ? date : '';
    // Google ignora changefreq/priority; não gerar sinais artificiais.
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n  <url>\n    <loc>${xmlEsc(canonical.href)}</loc>${lastmod ? `\n    <lastmod>${xmlEsc(lastmod)}</lastmod>` : ''}${images.map((src)=>`\n    <image:image>\n      <image:loc>${xmlEsc(src)}</image:loc>\n    </image:image>`).join('')}\n  </url>\n</urlset>\n`;
  }

  // llms.txt é um índice de conteúdo verificável, não uma API nem garantia de indexação.
  function publicAgenticFacts(state) {
    const sections=(state.sections || []).filter(s => s.settings?.visible !== false);
    const accepted=/^(?:eyebrow|title|heading|headline|subtitle|subheading|intro|description|text|copy|body|highlight|tagline|address|location|bullet|benefit|features)(?:[0-9]+)?$/i;
    const safe = (input, max=260) => String(input || '').replace(/<[^>]*>/g,' ').replace(/[\r\n\t]+/g,' ').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').replace(/\]\(/g,'] (').trim().slice(0,max);
    return sections.slice(0,45).map((section, index) => {
      const values=Object.entries(section.props || {}).filter(([key, value]) => accepted.test(key) && typeof value==='string' && value && !/^data:|^https?:|^blob:/i.test(value)).slice(0,9)
        .map(([key,value]) => ({key,text:safe(value)})).filter(v=>v.text.length>2);
      return { type:section.type, title:values.find(v=>/title|heading|headline/i.test(v.key))?.text || `Seção ${index+1}`, values };
    }).filter(entry=>entry.values.length);
  }

  function agenticLlmsTxt(state) {
    const canonical = canonicalUrl(state);
    const title=String(state.seo?.propertyName || state.projectName || 'Empreendimento imobiliário').replace(/[\r\n#<>]/g,' ').trim();
    const summary=String(state.seo?.description || 'Informações públicas sobre este empreendimento.').replace(/[\r\n<>]/g,' ').trim().slice(0,300);
    const address=[state.seo?.address,state.seo?.city,state.seo?.region].filter(Boolean).map(v=>String(v).replace(/[\r\n<>]/g,' ')).join(', ');
    const lines=[`# ${title}`,'',`> ${summary}`,'','## Informações principais',''];
    if(address) lines.push(`- Localização: ${address}`);
    if(state.seo?.propertySchemaType)lines.push(`- Tipologia declarada: ${state.seo.propertySchemaType}`);
    if(canonical)lines.push(`- Página oficial: [${title}](${canonical.href})`);
    else lines.push('- URL pública: não informada no editor. Configure a URL canônica HTTPS antes de publicar.');
    lines.push('','## Conteúdo da página','');
    for(const entry of publicAgenticFacts(state))lines.push(`- ${entry.title.replace(/[\[\]]/g,'')}`);
    lines.push('','## Conteúdo detalhado','', '- [Descrição estruturada da página](llms-full.txt)','', '## Condições comerciais e atendimento','', 'Valores, disponibilidade, condições financeiras e prazos devem ser confirmados com o responsável. Formulários de contato e agendamento exigem ação e consentimento do visitante.','');
    return lines.join('\n');
  }

  function agenticLlmsFullTxt(state) {
    const title=String(state.seo?.propertyName || state.projectName || 'Empreendimento imobiliário').replace(/[\r\n#<>]/g,' ').trim();
    const lines=[`# ${title} — Informações públicas detalhadas`,'',`Resumo: ${String(state.seo?.description || '').replace(/[\r\n<>]/g,' ').slice(0,350)}`,''];
    if(state.seo?.city)lines.push(`Localização: ${[state.seo.address,state.seo.city,state.seo.region].filter(Boolean).join(', ')}`,'');
    for(const entry of publicAgenticFacts(state)) {
      lines.push(`## ${entry.title.replace(/[#\r\n]/g,' ')}`,'');
      const seen=new Set();
      for(const field of entry.values){if(seen.has(field.text))continue;seen.add(field.text);lines.push(`- ${field.text}`);}
      lines.push('');
    }
    lines.push('---','','As informações são descritivas. Consulte a página publicada e confirme condições comerciais diretamente com o responsável.','');
    return lines.join('\n').slice(0,50000);
  }

  function aiCatalog(state) {
    // Catálogo válido conforme AI Catalog v1.0. Sem servidor MCP/A2A remoto não há entradas.
    return { specVersion:'1.0', host:{displayName:String(state.projectName || 'Empreendimento imobiliário')}, entries:[] };
  }

  function agenticDiagnostics(state) {
    const warnings=[];
    const canonical=canonicalUrl(state);
    if(!canonical || canonical.protocol!=='https:') warnings.push('Configure a URL canônica HTTPS. Links e descoberta pública ficam incompletos.');
    if(!state.seo?.title || !state.seo?.description)warnings.push('Título SEO e meta description devem ser preenchidos.');
    if(!state.seo?.ogImage)warnings.push('Imagem social ausente.');
    const publicSections=(state.sections || []).filter(s => s.settings?.visible !== false);
    if(!publicSections.some(s=>['hero','hero-plus'].includes(s.type)))warnings.push('Hero principal não detectado; valide a hierarquia de headings.');
    return {version:STUDIO_VERSION,generatedAt:new Date().toISOString(),canonical:canonical?.href || null,sections:publicSections.length,forms:'Anotação WebMCP em tempo de execução; teste em navegador compatível.',catalogEntries:0,notes:['WebMCP no navegador não equivale a um servidor MCP remoto.','llms.txt ajuda a leitura, mas não garante indexação por agentes.'],warnings};
  }

  function htmlTagAttribute(tag, name) {
    // Leitor de atributos suficiente para HTML exportado, sem DOM no teste Node.
    const match=String(tag || '').match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));
    if (!match) return '';
    return String(match[1] ?? match[2] ?? match[3] ?? '').replace(/&(?:amp|lt|gt|quot|apos|#(?:x[0-9a-f]+|[0-9]+));/gi,entity=>{
      const e=entity.slice(1,-1).toLowerCase();
      const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
      if (Object.hasOwn(named,e)) return named[e];
      const num=e.startsWith('#x') ? parseInt(e.slice(2),16) : parseInt(e.slice(1),10);
      return Number.isFinite(num)&&num>0&&num<=0x10ffff ? String.fromCodePoint(num) : entity;
    });
  }
  function normalizedHtmlUrl(value) {
    try {
      const url=new URL(value);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  // Auditoria estática do ZIP ANTES do download. Itens estruturais impedem
  // publicação quebrada; qualidade de conteúdo e APIs experimentais são avisos.
  function validateAgenticExport(zip, state, html, sitemap, imageUrls) {
    const errors=[], warnings=[], checks=[];
    const check=(id,valid,message,fatal=false)=>{
      checks.push({id,ok:Boolean(valid),level:fatal?'error':'warning',message});
      if (!valid) (fatal?errors:warnings).push(message);
    };
    const canonical = canonicalUrl(state);
    const catalog = aiCatalog(state);
    check('html-main',/<main\b[^>]*\bid=["']conteudo-principal["'][^>]*>/i.test(html), 'O HTML deve conter um landmark <main> acessível.',true);
    check('html-skip-link',/<a\b[^>]*href=["']#conteudo-principal["']/i.test(html), 'Link para pular ao conteúdo principal ausente.');
    check('page-language',/<html\b[^>]*\blang=["']pt-BR["']/i.test(html), 'Idioma do documento ausente ou inesperado.');
    check('page-title',/<title>[^<\s][\s\S]*?<\/title>/i.test(html), 'Título HTML ausente.',true);
    check('page-description',/<meta\s+name=["']description["']/i.test(html), 'Meta description ausente.');
    check('page-headings',/<h1(?:\s|>)/i.test(html), 'H1 não identificado no HTML exportado; verifique os títulos do hero.');
    // Conferir ESPECIFICAMENTE <link rel=canonical>, não qualquer `href`.
    // Comparar URLs interpretadas (não HTML cru), após decodificar entidades.
    // Isso resolve falso negativo quando falta '/' na raiz, o host está com
    // maiúsculas ou há parâmetros como ?src=a&origem=b.
    const canonicalLinks=(html.match(/<link\b[^>]*>/gi)||[]).filter(tag=>{
      const rel=htmlTagAttribute(tag,'rel');
      return rel.toLowerCase().split(/\s+/).includes('canonical');
    });
    const canonicalHtml=canonicalLinks.length===1 ? normalizedHtmlUrl(htmlTagAttribute(canonicalLinks[0],'href')) : '';
    check('canonical-match',canonical ? (canonicalLinks.length===1 && canonicalHtml===canonical.href) : canonicalLinks.length===0, 'Canonical HTML não corresponde à URL configurada.',true);
    check('ai-catalog',catalog.specVersion==='1.0' && Array.isArray(catalog.entries) && zip.file('.well-known/ai-catalog.json') !== null, 'Catálogo de descoberta de agentes inválido ou ausente.',true);
    check('llms-files',!!zip.file('llms.txt') && !!zip.file('llms-full.txt'), 'Arquivos llms.txt / llms-full.txt ausentes.',true);
    check('webmcp-runtime',!!zip.file('assets/js/agentic.js') && html.includes('assets/js/agentic.js'), 'Runtime WebMCP não conectado ao HTML.',true);
    check('webmcp-form-annotation',!!zip.file('assets/js/agentic.js'), 'Formulários precisam de anotação declarativa progressiva.',true);
    check('public-robots',!!zip.file('robots.txt'), 'robots.txt ausente.',true);
    check('public-sitemap',!sitemapEnabled(state) || (!!zip.file('sitemap.xml') && sitemap.includes('<urlset') && sitemap.includes('<loc>')), 'Sitemap XML inválido ou ausente.',true);
    check('sitemap-canonical',!sitemapEnabled(state) || (canonical && sitemap.includes('<loc>'+xmlEsc(canonical.href)+'</loc>')), 'Sitemap não aponta à URL canônica.',true);
    check('image-namespace',!sitemapEnabled(state) || !imageUrls.length || (sitemap.includes('xmlns:image=') && sitemap.includes('<image:image>')), 'Extensão de sitemap de imagens inválida.',true);
    check('images-https',imageUrls.every(v=>v.startsWith('https://')), 'Imagens com URL HTTP detectadas no sitemap, migre para HTTPS.');
    check('metadata',!!state.seo?.title && !!state.seo?.description, 'Preencha SEO title e description.');
    check('seo-indexing',!/noindex/i.test(state.seo?.robots || 'index,follow'), 'O projeto está marcado como noindex; mecanismos de busca não indexarão a página.');
    check('hero-image',imageUrls.length>0, 'Nenhuma imagem pública indexável detectada.');
    check('public-url',!!canonical && canonical.protocol==='https:', 'URL canônica HTTPS não configurada.');
    check('content-sections',(state.sections || []).some(s=>s.settings?.visible!==false), 'Projeto sem seção visível.');
    const imageTags=html.match(/<img\b[^>]*>/gi) || [];
    const noAlt=imageTags.filter(tag=>! /\balt\s*=/i.test(tag)).length;
    check('image-alt',noAlt===0, `${noAlt} elemento(s) <img> sem atributo alt; revisar acessibilidade e contexto das imagens.`);
    check('external-images',!imageUrls.some(url=>canonical && new URL(url).hostname !== canonical.hostname), 'Imagens em outros domínios: verifique a propriedade desses hosts no Search Console e libere Googlebot.');
    check('no-auto-form-submit',true, 'WebMCP não pode enviar leads automaticamente.');
    return {version:STUDIO_VERSION,passed:errors.length===0,generatedAt:new Date().toISOString(),canonical:canonical?.href||null,images:imageUrls.length,checks,errors,warnings,notes:[
      'Auditoria estática dos arquivos gerados: não substitui Lighthouse, validação WebMCP em navegador compatível ou teste publicado por HTTPS.',
      'llms.txt é informativo; não garante posicionamento ou indexação por ferramentas de IA.',
      'WebMCP depende da API do navegador e os formulários não têm autoenvio.'
    ]};
  }

  function readinessAudit(state) {
    const seo = state.seo || {};
    const visible = (state.sections || []).filter((section) => section.settings?.visible !== false);
    const hero = visible.find((section) => ['hero','hero-plus'].includes(section.type));
    const videoCount = visible.filter((section) => /video|scrolly/i.test(section.type)).length;
    const clamp = (n) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
    const metrics = {
      coreWebVitalsPotential: clamp(9.2 - Math.min(1.5, videoCount * .35) - ((hero?.props?.image || hero?.props?.image1) ? 0 : 1.2)),
      crawlArchitecture: clamp(6.6 + (/^https:\/\//.test(seo.canonical || '') ? .8 : 0) + (seo.robots === 'index, follow' ? .6 : 0) + (seo.title && seo.description ? .7 : 0) + .8),
      realEstateEEAT: clamp(5.8 + (seo.authorName ? .7 : 0) + (seo.authorRole ? .5 : 0) + (state.siteData?.license ? .7 : 0) + (seo.sourceNotes?.length >= 30 ? .6 : 0) + (seo.lastReviewed ? .4 : 0) + (seo.organizationName ? .4 : 0)),
      aiDiscovery: clamp(7.1 + (seo.aiSearch === 'allow' ? .8 : 0) + (seo.localInsight?.length >= 40 ? .5 : 0) + (seo.sourceNotes?.length >= 30 ? .4 : 0) + (seo.authorName ? .3 : 0)),
      scaleSafety: clamp(6.8 + (seo.localInsight?.length >= 40 ? .8 : 0) + (seo.sourceNotes?.length >= 30 ? .5 : 0) + (seo.propertyName && seo.city ? .5 : 0) + (seo.canonical ? .4 : 0))
    };
    const values = Object.values(metrics);
    return { version:STUDIO_VERSION, metrics, average:Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10, generatedAt:new Date().toISOString() };
  }

  function projectText(project) {
    const parts = [project.seo?.title, project.seo?.description, project.seo?.localInsight, project.seo?.sourceNotes];
    for (const section of project.sections || []) {
      if (section.settings?.visible === false) continue;
      for (const value of Object.values(section.props || {})) if (typeof value === 'string' && !/^data:|^https?:\/\//i.test(value)) parts.push(value);
    }
    return parts.filter(Boolean).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  }

  function similarity(a, b) {
    const A = new Set(projectText(a).split(' ').filter((x) => x.length > 3));
    const B = new Set(projectText(b).split(' ').filter((x) => x.length > 3));
    if (!A.size || !B.size) return 0;
    let intersection = 0; for (const token of A) if (B.has(token)) intersection++;
    return intersection / Math.max(1, Math.min(A.size, B.size));
  }

  async function compile(state, progress) {
    if (!window.JSZip) throw new Error('Biblioteca de compactação não carregada.');
    progress?.('Validando conteúdo e SEO...', 10);
    // Os documentos MD são contexto editorial privado. Excluí-los ANTES de toda renderização,
    // diagnóstico, JSON público, llms, HTML e exportação em lote.
    const publicInput = clone(state);
    delete publicInput.aiReferences;
    const outputState = hydratePluginDefaults(publicInput);
    // Versão do formato de saída; a entrada permanece inalterada.
    outputState.version = STUDIO_VERSION;
    validateSitemap(outputState);
    const zip = new JSZip();
    const registry = { seen:new Map(), assets:[], count:0 };
    const sources = await renderer.loadSources(outputState);
    progress?.('Combinando estilos dos plugins...', 24);

    await packageStateMedia(zip, outputState, registry, progress);
    let css = `${sources.css}\n${renderer.variables(outputState)}\n${renderer.sectionOverrides(outputState)}`;
    css = await packageCssAssets(zip, css, registry, progress);
    const js = sources.js;
    zip.file('assets/js/site.js', js);
    const agenticRuntime = await fetch('assets/js/agentic-export.js').then(r => { if (!r.ok) throw new Error('Runtime WebMCP não encontrado.'); return r.text(); });
    zip.file('assets/js/agentic.js', agenticRuntime);
    let html = renderer.buildExternalDocument(outputState);
    html = await packageHtmlAssets(zip, html, registry, progress);
    html = html.replace('</head>', '<link rel="ai-catalog" href=".well-known/ai-catalog.json" type="application/ai-catalog+json">\n<link rel="alternate" type="text/plain" title="Conteúdo para IA" href="llms.txt"></head>');
    html = html.replace('</body>', '<script src="assets/js/agentic.js" defer></script>\n</body>');
    html = await addParallaxStandaloneFallback(zip, outputState, html);
    validateParallaxExport(outputState, html, css, js, zip);
    validatePopupExport(outputState, html, css, js);
    validateFormSenderExport(outputState, html, js);

    zip.file('index.html', html);
    zip.file('assets/css/site.css', css);
    zip.file('content/project.json', JSON.stringify(outputState, null, 2));
    zip.file('content/plugins-enabled.json', JSON.stringify(sources.keys.map((key) => ({
      id: key,
      name: plugins[key]?.name,
      type: plugins[key]?.kind,
      compositionRole: plugins[key]?.compositionRole || plugins[key]?.manifest?.composition?.role || (plugins[key]?.kind === 'section' ? 'both' : 'behavior'),
      compositionCardinality: plugins[key]?.compositionCardinality || plugins[key]?.manifest?.composition?.cardinality || 'multiple',
      version: plugins[key]?.manifest?.version || '1.0.0',
      source: plugins[key]?.manifestPath,
      packageType: plugins[key]?.pluginSource || 'core'
    })), null, 2));
    const audit = readinessAudit(outputState);
    zip.file('robots.txt', robotsTxt(outputState));
    zip.file('.nojekyll', ''); // Garantir .well-known em GitHub Pages / Jekyll
    zip.file('llms.txt', agenticLlmsTxt(outputState));
    zip.file('llms-full.txt', agenticLlmsFullTxt(outputState));
    zip.file('content/agentic-audit.json', JSON.stringify(agenticDiagnostics(outputState), null, 2));
    const catalogContent = JSON.stringify(aiCatalog(outputState), null, 2);
    zip.file('.well-known/ai-catalog.json', catalogContent);
    zip.file('ai-catalog.json', catalogContent);
    // Criar o sitemap DEPOIS da incorporação de mídias para não indexar Data URLs,
    // arquivos ausentes ou caminhos do ambiente de edição.
    const sitemap = sitemapXml(outputState, {zip, html, css, assets:registry.assets});
    if (sitemapEnabled(outputState)) zip.file('sitemap.xml', sitemap);
    progress?.('Validando navegação agêntica, sitemap e imagens...', 70);
    const publishedImages = publishedImageUrls(outputState, {zip,html,css,assets:registry.assets});
    const exportValidation = validateAgenticExport(zip, outputState, html, sitemap, publishedImages);
    if (!exportValidation.passed) throw new Error('Exportação interrompida por erros de validação: ' + exportValidation.errors.join(' | '));
    zip.file('content/export-validation.json', JSON.stringify(exportValidation, null, 2));
    zip.file('content/agentic-audit.json', JSON.stringify({...agenticDiagnostics(outputState), checks:exportValidation.checks, errors:exportValidation.errors, exportWarnings:exportValidation.warnings, passed:exportValidation.passed}, null, 2));
    zip.file('VALIDACAO-EXPORTACAO.txt', [
      `IMOBIFY STUDIO ${STUDIO_VERSION} — NAVEGAÇÃO AGÊNTICA E INDEXAÇÃO`,
      `Status: ${exportValidation.passed ? 'APROVADO COM AVISOS QUANDO APLICÁVEL' : 'REPROVADO'}`,
      `Imagens no sitemap: ${exportValidation.images}`,
      '', 'VERIFICAÇÕES',...exportValidation.checks.map(c=>`${c.ok?'[OK]':'[AVISO]'} ${c.id}: ${c.message}`),
      '', 'LIMITAÇÕES',...exportValidation.notes
    ].join('\n')+'\n');
    zip.file('content/seo-readiness.json', JSON.stringify(audit, null, 2));
    zip.file('SEO-READINESS.txt', `IMOBIFY ${STUDIO_VERSION} — READINESS DO RESULTADO\n\nMédia potencial: ${audit.average}/10\nCore Web Vitals potencial: ${audit.metrics.coreWebVitalsPotential}/10\nArquitetura de rastreamento: ${audit.metrics.crawlArchitecture}/10\nE-E-A-T imobiliário: ${audit.metrics.realEstateEEAT}/10\nDescoberta por IA: ${audit.metrics.aiDiscovery}/10\nProdução em escala: ${audit.metrics.scaleSafety}/10\n\nObservação: são indicadores estruturais do pacote. Ranking e métricas reais dependem de hospedagem, mídia, conteúdo, links, concorrência e dados de campo.\n`);
    zip.file('_headers', `/*\n  ${securityHeaders().trim().replace(/\n/g, '\n  ')}\n`);
    zip.file('security/headers.conf', securityHeaders());
    zip.file('README.txt', `LANDING PAGE COMPILADA — IMOBIFY STUDIO ${STUDIO_VERSION}\n\nProjeto: ${outputState.projectName}\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\nPUBLICAÇÃO\nEnvie todo o conteúdo desta pasta para a raiz do seu serviço de hospedagem, GitHub Pages, Netlify, Vercel ou servidor web. A página é estática e não exige banco de dados.\n\nSEO E INDEXAÇÃO\nO pacote inclui robots.txt, llms.txt, llms-full.txt, ai-catalog.json, content/export-validation.json e sitemap.xml com imagens quando habilitado. O sitemap usa a URL canônica configurada no editor, imagens incorporadas/publicadas de plugins e é referenciado pelo robots.txt. Confira VALIDACAO-EXPORTACAO.txt e o relatório JSON para os avisos de qualidade. O favicon SVG fica na raiz como icon.svg; imagens sociais otimizadas abaixo de 300 KB ficam como share.png ou share.jpg. Para visualização correta em redes sociais, configure a URL canônica pública HTTPS.\n\nSEGURANÇA\nO HTML inclui uma CSP compatível com <meta>. O arquivo _headers e security/headers.conf também trazem a política de cabeçalho com frame-ancestors para hospedagens que suportam configuração de headers.\n\nFORMULÁRIOS E CONTATO\nOs formulários e CTAs usam as integrações configuradas no editor. O Form.v4 mantém o endpoint, a validação e as notificações do componente original.\n\nMÍDIA INCLUÍDA\n${registry.assets.length ? registry.assets.join('\n') : 'Nenhuma mídia local encontrada.'}\n`);
    progress?.('Gerando o pacote final...', 76);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 7 } }, (meta) => {
      progress?.(`Compactando arquivos: ${Math.round(meta.percent)}%`, 76 + Math.round(meta.percent * .22));
    });
    progress?.('Download pronto.', 100);
    return { exportValidation, blob, filename: `${slug(outputState.projectName)}-landing-page.zip`, files: Object.keys(zip.files), outputState, assets:registry.assets };
  }

  async function compileBatch(projects, progress) {
    if (!window.JSZip) throw new Error('Biblioteca de compactação não carregada.');
    const list = (projects || []).filter((project) => project?.sections?.length);
    if (!list.length) throw new Error('Nenhum projeto válido para exportar.');
    const batch = new JSZip();
    const usedNames = new Set();

    for (let index = 0; index < list.length; index += 1) {
      const project = list[index];
      const base = Math.round(index / list.length * 82);
      const result = await compile(project, (message, percent) => {
        const mapped = base + Math.round((percent / 100) * (82 / list.length));
        progress?.(`Projeto ${index + 1}/${list.length}: ${message}`, mapped);
      });
      let name = slug(project.projectName);
      let suffix = 2;
      while (usedNames.has(name)) name = `${slug(project.projectName)}-${suffix++}`;
      usedNames.add(name);
      batch.file(`${name}.zip`, await result.blob.arrayBuffer());
    }

    const qualityRows = ['projeto_a;projeto_b;similaridade;risco'];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const score = similarity(list[i], list[j]);
        if (score >= .55) qualityRows.push(`${String(list[i].projectName || i+1).replace(/;/g,',')};${String(list[j].projectName || j+1).replace(/;/g,',')};${Math.round(score*100)}%;${score >= .82 ? 'ALTO' : score >= .68 ? 'MEDIO' : 'ATENCAO'}`);
      }
    }
    batch.file('RELATORIO-CONTEUDO-REPETITIVO.csv', qualityRows.join('\n'));
    batch.file('LEIA-ME.txt', `PACOTE DE PRODUÇÃO — IMOBIFY STUDIO ${STUDIO_VERSION}\n\n${list.length} landing page(s) compilada(s) individualmente.\nCada arquivo ZIP pode ser publicado de forma independente.\nGerado em: ${new Date().toLocaleString('pt-BR')}\n`);
    progress?.('Organizando o pacote de produção...', 86);
    const blob = await batch.generateAsync({ type:'blob', compression:'DEFLATE', compressionOptions:{ level:7 } }, (meta) => {
      progress?.(`Compactando lote: ${Math.round(meta.percent)}%`, 86 + Math.round(meta.percent * .14));
    });
    progress?.('Pacote de produção pronto.', 100);
    return { blob, filename:`imobify-producao-${new Date().toISOString().slice(0,10)}.zip`, count:list.length };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.ImobifyCompiler = { compile, compileBatch, downloadBlob, slug, dataUrlParts, extension, inferFieldKind, robotsTxt, sitemapXml, sitemapPublicUrl, validateSitemap, readinessAudit, similarity, agenticLlmsTxt, agenticLlmsFullTxt, aiCatalog, agenticDiagnostics, validateAgenticExport, collectImageSources, publishedImageUrls };
})();

(function(){
  'use strict';

  const bool = (value, fallback=false) => {
    if (value == null || value === '') return fallback;
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  };

  const num = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const cleanBasePath = (value) => {
    const path = String(value || 'tiles').trim() || 'tiles';
    return path.replace(/\/+$/, '');
  };

  const joinPath = (base, file) => {
    const right = String(file || '').trim().replace(/^\/+/, '');
    return right ? `${cleanBasePath(base)}/${right}` : cleanBasePath(base);
  };

  function readXmlNumber(xml, names, fallback){
    for (const name of names) {
      const el = xml.querySelector(name);
      if (!el) continue;
      const value = Number(String(el.textContent || '').trim());
      if (Number.isFinite(value)) return value;
    }
    return fallback;
  }

  function readXmlText(xml, names, fallback=''){
    for (const name of names) {
      const el = xml.querySelector(name);
      if (!el) continue;
      const value = String(el.textContent || '').trim();
      if (value) return value;
    }
    return fallback;
  }

  async function loadTileConfig(root, showStatus){
    const tilesPath = cleanBasePath(root.dataset.tilesPath || 'tiles');
    const xmlFile = String(root.dataset.tilesXml || 'tiles.xml').trim() || 'tiles.xml';
    const xmlUrl = joinPath(tilesPath, xmlFile);

    const fallback = {
      source: 'fallback',
      xmlUrl,
      tilesPath,
      tileSize: Math.max(1, num(root.dataset.fallbackTileSize, 256)),
      originalWidth: Math.max(1, num(root.dataset.fallbackOriginalWidth, 5938)),
      originalHeight: Math.max(1, num(root.dataset.fallbackOriginalHeight, 3677)),
      minZoom: num(root.dataset.fallbackMinZoom, 0),
      maxZoom: num(root.dataset.fallbackMaxZoom, 3),
      zoomSnap: Math.max(.01, num(root.dataset.zoomSnap, .25)),
      tilePattern: String(root.dataset.tilePattern || '{z}/{x}/{y}.webp').trim() || '{z}/{x}/{y}.webp'
    };
    fallback.maxZoom = Math.max(fallback.minZoom, fallback.maxZoom);

    showStatus(`Lendo configuração: ${xmlUrl}`, 0);

    try {
      const response = await fetch(xmlUrl, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      if (xml.querySelector('parsererror')) throw new Error('XML inválido');

      const tileSize = Math.max(1, readXmlNumber(xml, ['tileSize', 'TileSize'], fallback.tileSize));
      const originalWidth = readXmlNumber(xml, ['originalWidth', 'OriginalWidth', 'width', 'Width'], 0);
      const originalHeight = readXmlNumber(xml, ['originalHeight', 'OriginalHeight', 'height', 'Height'], 0);
      const minZoom = readXmlNumber(xml, ['minZoom', 'MinZoom'], fallback.minZoom);
      const maxZoom = readXmlNumber(xml, ['maxZoom', 'MaxZoom'], NaN);
      const zoomSnap = Math.max(.01, readXmlNumber(xml, ['zoomSnap', 'ZoomSnap'], fallback.zoomSnap));

      if (!(originalWidth > 0) || !(originalHeight > 0)) {
        throw new Error('originalWidth/originalHeight ausentes ou inválidos');
      }
      if (!Number.isFinite(maxZoom)) {
        throw new Error('maxZoom ausente ou inválido');
      }

      // O projeto original usa {z}/{x}/{y}.webp. Se o XML trouxer um padrão,
      // ele pode substituir o padrão configurado no inspetor.
      const xmlPattern = readXmlText(xml, ['tilePattern', 'TilePattern', 'tileUrl', 'TileUrl'], '');
      const tilePattern = xmlPattern || fallback.tilePattern;

      const config = {
        source: 'xml',
        xmlUrl,
        tilesPath,
        tileSize,
        originalWidth,
        originalHeight,
        minZoom,
        maxZoom: Math.max(minZoom, maxZoom),
        zoomSnap,
        tilePattern
      };

      root.dataset.itpConfigSource = 'xml';
      root.dataset.itpResolvedMaxZoom = String(config.maxZoom);
      root.dataset.itpResolvedSize = `${config.originalWidth}x${config.originalHeight}`;
      showStatus(`tiles.xml carregado · ${config.originalWidth}×${config.originalHeight} · zoom ${config.minZoom}–${config.maxZoom}`, 2400);
      return config;
    } catch (error) {
      root.dataset.itpConfigSource = 'fallback';
      root.dataset.itpResolvedMaxZoom = String(fallback.maxZoom);
      root.dataset.itpResolvedSize = `${fallback.originalWidth}x${fallback.originalHeight}`;
      showStatus(`Não foi possível ler ${xmlUrl}. Usando fallback.`, 6500);
      console.warn('[Implantação Tiles Pro] Falha ao carregar tiles.xml:', error);
      return fallback;
    }
  }

  function createMap(root, mapEl, config, showStatus){
    const { tileSize, originalWidth: width, originalHeight: height, minZoom, maxZoom, zoomSnap } = config;
    const tileUrl = joinPath(config.tilesPath, config.tilePattern);
    const mobileGuard = bool(root.dataset.mobileGuard, true);
    const scrollWheel = bool(root.dataset.scrollWheel, false);
    const doubleClick = bool(root.dataset.doubleClick, true);
    const lockBounds = bool(root.dataset.lockBounds, true);
    const coarseMobile = window.matchMedia && window.matchMedia('(max-width:720px) and (pointer:coarse)').matches;

    const map = L.map(mapEl, {
      crs: L.CRS.Simple,
      minZoom,
      maxZoom,
      zoomSnap,
      zoomDelta: Math.max(.25, zoomSnap),
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: scrollWheel,
      doubleClickZoom: doubleClick,
      dragging: !(coarseMobile && mobileGuard),
      touchZoom: !(coarseMobile && mobileGuard),
      inertia: true,
      inertiaDeceleration: 3000,
      keyboard: true
    });

    // Mantém a matemática do projeto original: unproject usa o maxZoom lido do XML.
    const southWest = map.unproject([0, height], maxZoom);
    const northEast = map.unproject([width, 0], maxZoom);
    const bounds = new L.LatLngBounds(southWest, northEast);

    const layer = L.tileLayer(tileUrl, {
      tileSize,
      minZoom,
      maxZoom,
      noWrap: true,
      bounds,
      keepBuffer: 3,
      updateWhenIdle: true,
      updateWhenZooming: false
    }).addTo(map);

    let tileErrorShown = false;
    layer.on('tileerror', function(){
      if (tileErrorShown) return;
      tileErrorShown = true;
      showStatus(`Tile não encontrado. Verifique: ${tileUrl}`, 7000);
    });

    const fit = () => {
      map.invalidateSize(false);
      map.fitBounds(bounds, { animate:false, padding:[0,0] });
      if (lockBounds) map.setMaxBounds(bounds.pad(.04));
    };

    map.whenReady(fit);
    setTimeout(fit, 80);

    const zoomIn = root.querySelector('.itp-zoom-in');
    const zoomOut = root.querySelector('.itp-zoom-out');
    const fitBtn = root.querySelector('.itp-fit');
    if (zoomIn) zoomIn.addEventListener('click', () => map.zoomIn());
    if (zoomOut) zoomOut.addEventListener('click', () => map.zoomOut());
    if (fitBtn) fitBtn.addEventListener('click', fit);

    const guard = root.querySelector('.itp-mobile-guard');
    if (guard && coarseMobile && mobileGuard) {
      guard.addEventListener('click', function(){
        root.classList.add('is-mobile-active');
        map.dragging.enable();
        if (map.touchZoom) map.touchZoom.enable();
        map.invalidateSize(false);
      }, {once:true});
    } else {
      root.classList.add('is-mobile-active');
    }

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => map.invalidateSize(false));
      ro.observe(mapEl);
      root._itpResizeObserver = ro;
    } else {
      window.addEventListener('resize', () => map.invalidateSize(false), {passive:true});
    }

    root._itpMap = map;
    root._itpBounds = bounds;
    root._itpTileConfig = config;
  }

  async function init(root){
    if (!root || root.dataset.itpReady === '1' || root.dataset.itpLoading === '1') return;
    const mapEl = root.querySelector('.itp-map');
    if (!mapEl || !window.L) return;
    root.dataset.itpLoading = '1';

    const status = root.querySelector('.itp-status');
    let statusTimer = 0;
    const showStatus = (message, timeout=3200) => {
      if (!status) return;
      status.textContent = message;
      status.classList.add('is-visible');
      clearTimeout(statusTimer);
      if (timeout) statusTimer = setTimeout(() => status.classList.remove('is-visible'), timeout);
    };

    try {
      const config = await loadTileConfig(root, showStatus);
      createMap(root, mapEl, config, showStatus);
      root.dataset.itpReady = '1';
    } catch (error) {
      console.error('[Implantação Tiles Pro] Erro ao inicializar:', error);
      showStatus('Não foi possível inicializar a implantação.', 7000);
    } finally {
      delete root.dataset.itpLoading;
    }
  }

  function scan(){
    document.querySelectorAll('[data-plugin="implantacao-tiles-pro"] .itp-root').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, {once:true});
  else scan();

  if (window.MutationObserver) {
    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
})();

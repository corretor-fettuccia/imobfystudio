(function () {
  'use strict';

  var GOOGLE_FONTS = new Set(['Inter','Montserrat','Poppins','Manrope','Josefin Sans','Raleway','Roboto','Lato','Oswald','Playfair Display']);

  function bool(value) { return value === true || value === 'true' || value === '1'; }
  function cssFont(value) { return String(value || '').replace(/[;{}]/g, '').trim(); }

  function loadFont(name) {
    if (!GOOGLE_FONTS.has(name)) return;
    var id = 'imobify-menu-font-' + name.toLowerCase().replace(/\s+/g, '-');
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + ':wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }

  function parseItems(text) {
    return String(text || '').split(/\r?\n/).map(function (line) {
      var clean = line.trim();
      if (!clean) return null;
      var splitAt = clean.indexOf('|');
      if (splitAt < 0) return { label: clean, href: '#' };
      return { label: clean.slice(0, splitAt).trim(), href: clean.slice(splitAt + 1).trim() || '#' };
    }).filter(Boolean);
  }

  function setFont(nav) {
    var node = nav.querySelector('.imobify-menu-pro__font');
    var selected = node ? node.dataset.font : 'Perfil do projeto';
    var custom = node ? cssFont(node.dataset.customFont) : '';
    var family;
    if (selected === 'Perfil do projeto') family = 'var(--body)';
    else if (selected === 'Sistema') family = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    else if (selected === 'Personalizada' && custom) family = custom;
    else {
      loadFont(selected);
      family = '"' + selected + '", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    }
    nav.style.setProperty('--imp-font', family);
  }

  function buildLinks(nav) {
    var source = nav.querySelector('.imobify-menu-pro__source');
    var list = nav.querySelector('.imobify-menu-pro__links');
    if (!list) return;
    list.textContent = '';
    parseItems(source ? source.value || source.textContent : '').forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.textContent = item.label;
      a.href = item.href;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function updateMobileRule(nav) {
    var bp = Math.max(320, Math.min(1600, Number(nav.dataset.mobileBreakpoint) || 768));
    var id = 'imobify-menu-pro-breakpoint';
    var style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = '@media (max-width:' + bp + 'px){.imobify-menu-pro__toggle{display:block!important}.imobify-menu-pro__panel{position:fixed}.imobify-menu-pro__links{flex-direction:column;align-items:stretch}}';
  }

  function init(nav) {
    if (!nav || nav.dataset.ready === 'true') return;
    nav.dataset.ready = 'true';

    var section = nav.closest('[data-section-id]');
    var instanceId = section ? section.getAttribute('data-section-id') : ('menu-' + Math.random().toString(36).slice(2));
    nav.dataset.instanceId = instanceId;

    document.querySelectorAll('.imobify-menu-pro[data-instance-id="' + CSS.escape(instanceId) + '"]').forEach(function (old) {
      if (old !== nav) old.remove();
    });

    buildLinks(nav);
    setFont(nav);
    updateMobileRule(nav);

    if (nav.parentElement !== document.body) document.body.appendChild(nav);
    if (section) {
      section.style.minHeight = '0';
      section.style.height = '0';
      section.style.padding = '0';
      section.style.margin = '0';
      section.style.overflow = 'visible';
    }

    var toggle = nav.querySelector('.imobify-menu-pro__toggle');
    var links = nav.querySelector('.imobify-menu-pro__links');
    var lastY = window.scrollY;
    var ticking = false;

    function close() {
      nav.classList.remove('is-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('imobify-menu-open');
    }

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var threshold = Number(nav.dataset.scrollThreshold) || 0;
      var active = y > threshold;
      nav.classList.toggle('is-scrolled', active);
      if (nav.dataset.scrollEffect === 'ocultar ao descer' && active) {
        nav.classList.toggle('is-hidden-scroll', y > lastY && y - lastY > 2 && !nav.classList.contains('is-open'));
      } else nav.classList.remove('is-hidden-scroll');
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if (toggle) toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    if (links) links.addEventListener('click', function (event) {
      var anchor = event.target.closest('a');
      if (!anchor) return;
      var href = anchor.getAttribute('href') || '';
      if (bool(nav.dataset.closeOnClick)) close();
      if (!bool(nav.dataset.smoothScroll) || href.charAt(0) !== '#' || href === '#') return;
      var target;
      try { target = document.querySelector(href); } catch (_) { target = null; }
      if (!target) return;
      event.preventDefault();
      var menuHeight = nav.getBoundingClientRect().height;
      var offset = nav.dataset.position === 'topo' ? menuHeight + 8 : 8;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });

    document.addEventListener('click', function (event) {
      if (nav.classList.contains('is-open') && !nav.contains(event.target)) close();
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
  }

  function scan(root) {
    (root || document).querySelectorAll('.imobify-menu-pro:not([data-ready="true"])').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(document); });
  else scan(document);

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (!(node instanceof Element)) return;
        if (node.matches('.imobify-menu-pro')) init(node);
        scan(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

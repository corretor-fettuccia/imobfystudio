(function () {
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeHref(value) {
    var raw = String(value || '').trim();
    if (/^#[A-Za-z][\w:.-]*$/.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^(?:https?:|mailto:|tel:)/i.test(raw)) return raw;
    return '#';
  }

  function safeImage(value) {
    var raw = String(value || '').trim();
    if (/^data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp);/i.test(raw)) return raw;
    if (/^(?:https?:)?\/\//i.test(raw)) return raw;
    if (/^(?:\/|\.\/|\.\.\/)(?!\/)/.test(raw)) return raw;
    if (/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.~%+@()-]+)+(?:\?[A-Za-z0-9_.~!$&'()*+,;=:@%/?-]*)?$/.test(raw)) return raw;
    return '';
  }

  function normalizeSlide(item, index) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id: String(item.id || ('slide-' + (index + 1))),
      image: String(item.image || ''),
      imageAlt: String(item.imageAlt || item.title || ''),
      eyebrow: String(item.eyebrow || ''),
      title: String(item.title || ''),
      text: String(item.text || item.copy || ''),
      showButton: item.showButton !== false && String(item.showButton).toLowerCase() !== 'false',
      buttonText: String(item.buttonText || item.cta || ''),
      buttonLink: String(item.buttonLink || item.link || '#')
    };
  }

  function legacySlides(slider) {
    var items = [];
    for (var n = 1; n <= 3; n += 1) {
      var image = slider.dataset['image' + n] || '';
      var title = slider.dataset['title' + n] || '';
      var eyebrow = slider.dataset['eyebrow' + n] || '';
      var text = slider.dataset['copy' + n] || '';
      var cta = slider.dataset['cta' + n] || '';
      var link = slider.dataset['link' + n] || '#';
      if (!image && !title && !eyebrow && !text && !cta) continue;
      items.push(normalizeSlide({ id:'slide-' + n, image:image, imageAlt:title, eyebrow:eyebrow, title:title, text:text, showButton:Boolean(cta), buttonText:cta, buttonLink:link }, items.length));
    }
    return items;
  }

  function readSlides(slider) {
    try {
      var parsed = JSON.parse(slider.dataset.slides || '[]');
      if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeSlide);
    } catch (_) {}
    return legacySlides(slider);
  }

  function slideMarkup(item, index) {
    var image = safeImage(item.image);
    var button = item.showButton && item.buttonText.trim()
      ? '<a class="button button-primary" href="' + esc(safeHref(item.buttonLink)) + '">' + esc(item.buttonText) + '</a>'
      : '';
    var eyebrow = item.eyebrow.trim() ? '<p class="eyebrow">' + esc(item.eyebrow) + '</p>' : '';
    var title = item.title.trim() ? '<h2>' + esc(item.title) + '</h2>' : '';
    var text = item.text.trim() ? '<p>' + esc(item.text) + '</p>' : '';
    var img = image ? '<img src="' + esc(image) + '" alt="' + esc(item.imageAlt || item.title) + '"' + (index ? ' loading="lazy"' : '') + ' decoding="async">' : '';
    return '<article class="property-slide' + (index === 0 ? ' is-active' : '') + '" data-slide-index="' + index + '" aria-hidden="' + (index === 0 ? 'false' : 'true') + '">' + img + '<div class="property-slide-shade"></div><div class="property-slide-content">' + eyebrow + title + text + button + '</div></article>';
  }

  function renderSlides(slider) {
    var items = readSlides(slider);
    var track = slider.querySelector('.property-slider-track');
    var dots = slider.querySelector('.property-slider-dots');
    if (track) track.innerHTML = items.map(slideMarkup).join('');
    if (dots) dots.innerHTML = items.map(function (_, index) {
      return '<button type="button" data-slider-dot="' + index + '" class="' + (index === 0 ? 'is-active' : '') + '" aria-label="Ir para slide ' + (index + 1) + '" aria-selected="' + (index === 0 ? 'true' : 'false') + '"></button>';
    }).join('');
    slider.dataset.slideCount = String(items.length);
  }

  function init(root) {
    if (root.dataset.sliderReady === 'true') return;
    root.dataset.sliderReady = 'true';
    var slider = root.matches('.property-slider') ? root : (root.querySelector(':scope > .property-slider') || root);
    renderSlides(slider);
    var slides = Array.from(slider.querySelectorAll('.property-slide'));
    var dots = Array.from(slider.querySelectorAll('[data-slider-dot]'));
    var index = 0;
    var timer = 0;
    var interval = Math.max(2500, Number(slider.dataset.interval) || 5500);
    var autoplay = slider.dataset.autoplay === 'true' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pauseOnHover = slider.dataset.pauseHover !== 'false';
    var loop = slider.dataset.loop !== 'false';
    var swipe = slider.dataset.swipe !== 'false';
    var startX = null;
    slider.style.setProperty('--slider-duration', interval + 'ms');

    function show(next, userAction) {
      if (!slides.length) return;
      if (loop) index = (next + slides.length) % slides.length;
      else index = Math.max(0, Math.min(slides.length - 1, next));
      slides.forEach(function (slide, position) {
        var active = position === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === index);
        dot.setAttribute('aria-selected', position === index ? 'true' : 'false');
      });
      if (userAction) restart();
    }

    function schedule() {
      window.clearTimeout(timer);
      slider.classList.remove('is-running');
      if (!autoplay || slides.length < 2 || document.hidden) return;
      void slider.offsetWidth;
      slider.classList.add('is-running');
      timer = window.setTimeout(function () {
        if (!loop && index >= slides.length - 1) { slider.classList.remove('is-running'); return; }
        show(index + 1); schedule();
      }, interval);
    }

    function restart() { schedule(); }
    slider.querySelector('[data-slider-prev]')?.addEventListener('click', function () { show(index - 1, true); });
    slider.querySelector('[data-slider-next]')?.addEventListener('click', function () { show(index + 1, true); });
    dots.forEach(function (dot) { dot.addEventListener('click', function () { show(Number(dot.dataset.sliderDot), true); }); });
    slider.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') show(index - 1, true);
      if (event.key === 'ArrowRight') show(index + 1, true);
    });
    slider.addEventListener('pointerdown', function (event) { if (swipe) startX = event.clientX; });
    slider.addEventListener('pointerup', function (event) {
      if (startX == null) return;
      var distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 50) show(index + (distance < 0 ? 1 : -1), true);
    });
    slider.addEventListener('mouseenter', function () { if (!pauseOnHover) return; window.clearTimeout(timer); slider.classList.remove('is-running'); });
    slider.addEventListener('mouseleave', function () { if (pauseOnHover) schedule(); });
    document.addEventListener('visibilitychange', schedule);
    show(0);
    schedule();
  }

  function boot() { document.querySelectorAll('[data-plugin="property-slider"]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

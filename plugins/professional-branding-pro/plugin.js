(() => {
  'use strict';

  const ROOT_SELECTOR = '[data-plugin="professional-branding-pro"]';
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const truthy = (value) => String(value).toLowerCase() === 'true' || String(value) === '1';
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const instances = new Set();

  function init(rootSection) {
    const root = rootSection.querySelector('[data-bbp-root]');
    if (!root || root.dataset.bbpReady === '1') return;
    root.dataset.bbpReady = '1';

    const track = root.querySelector('.bbp__track');
    const viewport = root.querySelector('.bbp__viewport');
    const slides = Array.from(root.querySelectorAll('[data-bbp-slide]'));
    const dotsHost = root.querySelector('.bbp__dots');
    const typing = root.querySelector('[data-bbp-typing]');
    const cta = root.querySelector('.bbp__cta');

    const transitionMs = Math.max(0, number(root.dataset.transitionMs, 650));
    const autoplayMs = Math.max(800, number(root.dataset.autoplayMs, 5200));
    const typingSpeed = Math.max(12, number(root.dataset.typingSpeed, 58));
    const effect = root.dataset.transitionEffect || 'wipe';
    const autoplayEnabled = truthy(root.dataset.autoplay) && slides.length > 1;
    const pauseOnHover = truthy(root.dataset.pauseHover);
    const typewriterEnabled = truthy(root.dataset.typewriter) && !reduceMotion();
    const revealEnabled = truthy(root.dataset.reveal) && !reduceMotion();
    const revealDistance = Math.max(0, number(root.dataset.revealDistance, 28));

    root.dataset.effect = effect;
    root.style.setProperty('--bbp-transition', `${transitionMs}ms`);
    root.style.setProperty('--bbp-reveal-distance', `${revealDistance}px`);

    let current = 0;
    let autoplayTimer = 0;
    let typingTimer = 0;
    let typeStarted = false;
    let visible = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let destroyed = false;

    if (cta && truthy(root.dataset.ctaNewTab)) {
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
    }

    function updateDots() {
      if (!dotsHost) return;
      Array.from(dotsHost.children).forEach((dot, index) => {
        dot.setAttribute('aria-current', index === current ? 'true' : 'false');
        dot.setAttribute('aria-label', `Mostrar manifesto ${index + 1}`);
      });
    }

    function markEntering(index) {
      slides.forEach((slide, i) => {
        slide.classList.remove('is-entering');
        slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      const active = slides[index];
      if (!active) return;
      void active.offsetWidth;
      active.classList.add('is-entering');
    }

    function setPosition(index, animate = true) {
      if (!track || !slides.length) return;
      current = (index + slides.length) % slides.length;
      track.style.transition = animate && !reduceMotion() && effect !== 'fade'
        ? `transform ${transitionMs}ms cubic-bezier(.23,1,.32,1)`
        : 'none';
      track.style.transform = `translate3d(${-current * 100}%,0,0)`;
      markEntering(current);
      updateDots();
    }

    function go(delta) {
      stopAutoplay();
      setPosition(current + delta, true);
      startAutoplay();
    }

    function stopAutoplay() {
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = 0;
    }

    function startAutoplay() {
      stopAutoplay();
      if (!autoplayEnabled || !visible || document.hidden || destroyed) return;
      autoplayTimer = window.setInterval(() => setPosition(current + 1, true), autoplayMs);
    }

    function startTypewriter() {
      if (!typing || typeStarted) return;
      typeStarted = true;
      const full = root.dataset.identity || typing.textContent || '';
      if (!typewriterEnabled) {
        typing.textContent = full;
        typing.classList.add('is-static');
        return;
      }
      typing.textContent = '';
      let index = 0;
      const step = () => {
        if (destroyed) return;
        if (index >= full.length) {
          typing.classList.add('is-complete');
          return;
        }
        typing.textContent += full.charAt(index++);
        typingTimer = window.setTimeout(step, typingSpeed);
      };
      step();
    }

    if (dotsHost && slides.length > 1) {
      dotsHost.innerHTML = '';
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'bbp__dot';
        dot.addEventListener('click', () => {
          stopAutoplay();
          setPosition(index, true);
          startAutoplay();
        });
        dotsHost.appendChild(dot);
      });
    } else if (dotsHost) {
      dotsHost.hidden = true;
    }

    root.querySelectorAll('.bbp__prev').forEach((button) => button.addEventListener('click', () => go(-1)));
    root.querySelectorAll('.bbp__next').forEach((button) => button.addEventListener('click', () => go(1)));

    if (slides.length <= 1) {
      root.querySelectorAll('.bbp__nav, .bbp__dots').forEach((node) => { node.hidden = true; });
    }

    if (viewport) {
      if (pauseOnHover) {
        viewport.addEventListener('mouseenter', stopAutoplay);
        viewport.addEventListener('mouseleave', startAutoplay);
        viewport.addEventListener('focusin', stopAutoplay);
        viewport.addEventListener('focusout', startAutoplay);
      }
      viewport.addEventListener('touchstart', (event) => {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive: true });
      viewport.addEventListener('touchend', (event) => {
        const touch = event.changedTouches && event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.15) go(dx > 0 ? -1 : 1);
      }, { passive: true });
    }

    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    });

    const onVisibility = () => document.hidden ? stopAutoplay() : startAutoplay();
    document.addEventListener('visibilitychange', onVisibility);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== root) return;
          visible = entry.isIntersecting && entry.intersectionRatio > 0.12;
          if (visible) {
            root.classList.add('bbp--visible');
            startTypewriter();
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: [0, .12, .35] });
      observer.observe(root);
      root.__bbpObserver = observer;
    } else {
      visible = true;
      root.classList.add('bbp--visible');
      startTypewriter();
      startAutoplay();
    }

    if (!revealEnabled) root.classList.add('bbp--visible');
    setPosition(0, false);

    root.__bbpDestroy = () => {
      destroyed = true;
      stopAutoplay();
      if (typingTimer) window.clearTimeout(typingTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      if (root.__bbpObserver) root.__bbpObserver.disconnect();
      instances.delete(root);
    };
    instances.add(root);
  }

  function scan(scope = document) {
    scope.querySelectorAll(ROOT_SELECTOR).forEach(init);
  }

  /* O framework recria a prévia como um documento completo a cada alteração.
     Portanto não observamos document.documentElement: isso evita varreduras globais
     e reentrância ao editar mídia/campos no Inspector. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(document), { once: true });
  } else {
    scan(document);
  }
})();

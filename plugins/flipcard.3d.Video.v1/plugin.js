/* Adapter Plugin Play — variante vídeo.
   Mantém a inicialização e a interação do Flip Card 4.3.0.
   A única responsabilidade extra é ativar os vídeos muted/loop/playsinline. */
(function () {
    'use strict';

    function ensureFontAwesome() {
        if (document.querySelector('link[data-flipcard-fontawesome]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
        link.setAttribute('data-flipcard-fontawesome', 'true');
        document.head.appendChild(link);
    }

    function addListIcons(scope) {
        var enabled = scope.getAttribute('data-show-item-icons') !== 'false';
        if (!enabled) return;
        scope.querySelectorAll('.flip-card__list li').forEach(function (item) {
            if (item.querySelector('i')) return;
            var icon = document.createElement('i');
            icon.className = 'fas fa-check-circle';
            item.insertBefore(icon, item.firstChild);
        });
    }

    function initVideos(scope) {
        scope.querySelectorAll('.flip-card__video').forEach(function (video) {
            var src = video.getAttribute('data-src') || '';
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.autoplay = true;
            video.playsInline = true;
            video.setAttribute('muted', '');
            video.setAttribute('loop', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', '');
            video.removeAttribute('controls');
            if (src) {
                if (video.getAttribute('src') !== src) video.setAttribute('src', src);
                var result = video.play();
                if (result && typeof result.catch === 'function') result.catch(function () {});
            } else {
                video.removeAttribute('src');
            }
        });
    }

    function init() {
        var scopes = document.querySelectorAll('[data-plugin="flipcard-3d-video-v1"]');
        if (!scopes.length || typeof window.FlipCard !== 'function') return;
        ensureFontAwesome();
        scopes.forEach(function (scope) {
            addListIcons(scope);
            initVideos(scope);
        });

        /* Mesma forma de inicialização do Flip Card 4.3.0. */
        new window.FlipCard('[data-plugin="flipcard-3d-video-v1"] .flip-card', {
            disableClick: false
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

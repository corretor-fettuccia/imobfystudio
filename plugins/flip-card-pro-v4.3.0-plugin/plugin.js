/* Adapter Plugin Play — não substitui nem altera js/flipcard.4.0.js. */
(function () {
    'use strict';

    function ensureFontAwesome() {
        if (document.querySelector('link[data-flipcard-fontawesome]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
        link.setAttribute('data-flipcard-fontawesome', 'true');
        document.head.appendChild(link);
    }

    function addListIcons(scope) {
        scope.querySelectorAll('.flip-card__list[data-check-icons="true"] li').forEach(function (item) {
            if (item.querySelector(':scope > i')) return;
            var icon = document.createElement('i');
            icon.className = 'fas fa-check-circle';
            item.prepend(icon);
        });
    }

    function init() {
        var scopes = document.querySelectorAll('[data-plugin="flip-card-pro"]');
        if (!scopes.length || typeof window.FlipCard !== 'function') return;
        ensureFontAwesome();
        scopes.forEach(addListIcons);
        new window.FlipCard('[data-plugin="flip-card-pro"] .flip-card', {
            disableClick: false
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

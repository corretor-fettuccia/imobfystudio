(function () {
  "use strict";

  const POSITION_MAP = {
    "Inferior direita": "bottom-right",
    "Inferior esquerda": "bottom-left",
    "Superior direita": "top-right",
    "Superior esquerda": "top-left"
  };

  function asBoolean(value) {
    return String(value).toLowerCase() === "true" || value === "1";
  }

  function sanitizePhone(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function safeEncodedMessage(message, mode) {
    const text = String(message || "").trim();
    if (!text) return "";

    if (mode === "Mensagem já codificada") {
      try {
        return encodeURIComponent(decodeURIComponent(text));
      } catch (_) {
        return text;
      }
    }

    return encodeURIComponent(text);
  }

  function moveToViewportRoot(widget) {
    if (!(widget instanceof HTMLElement)) return;

    /*
     * Um elemento position:fixed pode deixar de usar a viewport quando algum
     * ancestral possui transform, filter, perspective, contain ou animações de
     * reveal. O Imobify envolve as seções em elementos desse tipo.
     *
     * Por isso o widget é movido para document.body. Assim ele fica visível
     * desde o carregamento e não depende da posição da seção na página.
     */
    if (widget.parentElement !== document.body) {
      widget.dataset.iwfpOriginalParent = "section";
      document.body.appendChild(widget);
    }
  }

  function configureWidget(widget) {
    if (!(widget instanceof HTMLElement)) return;

    moveToViewportRoot(widget);

    const button = widget.querySelector(".iwfp-button");
    if (!(button instanceof HTMLAnchorElement)) return;

    const phone = sanitizePhone(widget.dataset.phone);
    const encodedMessage = safeEncodedMessage(
      widget.dataset.message,
      widget.dataset.urlEncoding
    );

    const url = phone
      ? `https://wa.me/${phone}${encodedMessage ? `?text=${encodedMessage}` : ""}`
      : "#";

    widget.dataset.corner = POSITION_MAP[widget.dataset.position] || "bottom-right";
    widget.dataset.label = String(asBoolean(widget.dataset.showLabel));
    widget.dataset.pulse = String(asBoolean(widget.dataset.pulse));
    widget.dataset.bubble = String(asBoolean(widget.dataset.showHoverBubble));
    widget.dataset.hoverPhoto = String(Boolean(String(widget.dataset.hoverImage || "").trim()));

    widget.style.setProperty(
      "--iwfp-offset-x",
      `${Math.max(0, Number(widget.dataset.offsetX) || 0)}px`
    );
    widget.style.setProperty(
      "--iwfp-offset-y",
      `${Math.max(0, Number(widget.dataset.offsetY) || 0)}px`
    );
    widget.style.setProperty(
      "--iwfp-size",
      `${Math.max(44, Number(widget.dataset.buttonSize) || 58)}px`
    );

    button.href = url;

    if (asBoolean(widget.dataset.openNewTab)) {
      button.target = "_blank";
      button.rel = "noopener noreferrer";
    } else {
      button.removeAttribute("target");
      button.removeAttribute("rel");
    }

    button.setAttribute("aria-disabled", phone ? "false" : "true");

    if (!button.dataset.iwfpClickBound) {
      button.addEventListener("click", function (event) {
        if (!sanitizePhone(widget.dataset.phone)) {
          event.preventDefault();
        }
      });
      button.dataset.iwfpClickBound = "true";
    }

    widget.dataset.iwfpReady = "true";
  }

  function initializeAll(root) {
    const scope = root instanceof Element || root instanceof Document ? root : document;

    if (scope instanceof Element && scope.matches(".iwfp-widget")) {
      configureWidget(scope);
    }

    scope.querySelectorAll(".iwfp-widget").forEach(configureWidget);
  }

  function start() {
    initializeAll(document);

    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          const target = mutation.target;
          if (target instanceof HTMLElement && target.matches(".iwfp-widget")) {
            configureWidget(target);
          }
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          initializeAll(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-phone",
        "data-message",
        "data-url-encoding",
        "data-position",
        "data-offset-x",
        "data-offset-y",
        "data-button-size",
        "data-show-label",
        "data-pulse",
        "data-show-hover-bubble",
        "data-hover-image",
        "data-open-new-tab"
      ]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

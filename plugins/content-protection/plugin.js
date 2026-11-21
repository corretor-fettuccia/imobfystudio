(function () {
  "use strict";

  const ROOT_CLASS = "imobify-content-protection";
  const READY_ATTRIBUTE = "data-content-protection-ready";

  function isEditableElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    return Boolean(
      element.closest(
        'input, textarea, select, [contenteditable="true"], [data-allow-copy]'
      )
    );
  }

  function blockEvent(event) {
    if (isEditableElement(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function blockKeyboardShortcuts(event) {
    const key = String(event.key || "").toLowerCase();
    const ctrlOrCommand = event.ctrlKey || event.metaKey;

    if (isEditableElement(event.target)) {
      return;
    }

    const blockedShortcut =
      event.key === "F12" ||
      (ctrlOrCommand && key === "c") ||
      (ctrlOrCommand && key === "x") ||
      (ctrlOrCommand && key === "u") ||
      (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
      (event.metaKey && event.altKey && ["i", "j", "c"].includes(key));

    if (!blockedShortcut) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function initialize() {
    const html = document.documentElement;

    if (html.hasAttribute(READY_ATTRIBUTE)) {
      return;
    }

    html.setAttribute(READY_ATTRIBUTE, "true");
    html.classList.add(ROOT_CLASS);

    document.addEventListener("contextmenu", blockEvent, true);
    document.addEventListener("selectstart", blockEvent, true);
    document.addEventListener("copy", blockEvent, true);
    document.addEventListener("cut", blockEvent, true);
    document.addEventListener("keydown", blockKeyboardShortcuts, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();

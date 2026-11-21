(function () {
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function truthy(value) {
    return value === true || value === 1 || value === '1' || value === 'true' || value === 'on';
  }

  function compareVersions(a, b) {
    const parse = (value) => String(value || '0').split('.').map((part) => parseInt(part, 10) || 0);
    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
  }

  function normalizeSelectOption(option) {
    if (option && typeof option === 'object') {
      const value = option.value ?? option.label ?? '';
      const label = option.label ?? option.value ?? '';
      return { value: String(value), label: String(label) };
    }
    return { value: String(option ?? ''), label: String(option ?? '') };
  }

  function normalizeSelectOptions(options) {
    return (Array.isArray(options) ? options : []).map(normalizeSelectOption);
  }

  window.ImobifyUtil = { escapeHtml, truthy, compareVersions, normalizeSelectOption, normalizeSelectOptions };
})();

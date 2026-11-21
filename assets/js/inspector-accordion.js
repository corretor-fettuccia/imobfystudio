/* Imobify Studio 6.0.36 — Inspector accordion navigation.
   Progressive enhancement only: never changes project data or exported pages. */
(() => {
  const root = document.getElementById('inspectorContent');
  if (!root || typeof MutationObserver === 'undefined') return;
  const openStates = new Map();
  let updating = false;
  let lastSection = '';
  const sectionIdentity = () => {
    const selected = document.querySelector('.section-row.active, .section-row.is-selected, [data-section-id][aria-selected="true"]');
    return selected?.getAttribute('data-section-id') || selected?.getAttribute('data-id') || document.querySelector('.inspector-header h2')?.textContent?.trim() || 'inspector';
  };
  function decorate() {
    if (updating) return;
    const groups = Array.from(root.children).filter(node => node.classList?.contains('inspector-group') && !node.classList.contains('imobify-fold-group'));
    if (!groups.length) return;
    updating = true;
    observer.disconnect();
    const identity = sectionIdentity();
    if (identity !== lastSection) lastSection = identity;
    groups.forEach((group, index) => {
      // Preexisting custom accordions retain their own open/close logic.
      if (group.classList.contains('section-style-inspector')) return;
      const heading = Array.from(group.children).find(el => el.tagName === 'H3');
      const title = heading?.textContent?.trim() || (group.querySelector('[data-inspector-remove]') ? 'Ações do componente' : group.querySelector('button')?.textContent?.trim() || `Configurações ${index + 1}`);
      const key = identity + '::' + index + '::' + title;
      const isOpen = openStates.has(key) ? openStates.get(key) : index === 0 || /^(geral|configurações|hero|conteúdo|posi[cç][aã]o)/i.test(title);
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'imobify-fold-trigger';
      trigger.setAttribute('aria-expanded', String(isOpen));
      trigger.setAttribute('aria-label', `${isOpen ? 'Recolher' : 'Expandir'} ${title}`);
      const name = document.createElement('span');
      name.className = 'imobify-fold-name';
      name.textContent = title;
      const glyph = document.createElement('span');
      glyph.className = 'imobify-fold-chevron';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '⌄';
      trigger.append(name, glyph);
      const content = document.createElement('div');
      content.className = 'imobify-fold-body';
      content.hidden = !isOpen;
      const nodeList = Array.from(group.childNodes);
      nodeList.forEach(node => { if (node !== heading) content.appendChild(node); });
      heading?.remove();
      group.append(trigger, content);
      group.classList.add('imobify-fold-group');
      group.classList.toggle('imobify-fold-open', isOpen);
      trigger.addEventListener('click', () => {
        const next = trigger.getAttribute('aria-expanded') !== 'true';
        trigger.setAttribute('aria-expanded', String(next));
        trigger.setAttribute('aria-label', `${next ? 'Recolher' : 'Expandir'} ${title}`);
        content.hidden = !next;
        group.classList.toggle('imobify-fold-open', next);
        openStates.set(key, next);
      });
    });
    observer.observe(root, {childList:true});
    updating = false;
  }
  const observer = new MutationObserver(decorate);
  observer.observe(root, {childList:true});
  decorate();
})();

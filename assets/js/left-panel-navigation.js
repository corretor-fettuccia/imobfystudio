/* v6.0.38 — left sidebar: a fixed navigation rail with two truly separate workflows.
   Move existing DOM nodes, never clone them: IDs, event listeners and plugin state stay intact. */
(function () {
  const library = document.getElementById('tab-components');
  const structure = document.getElementById('tab-structure');
  if (!library || !structure) return;

  const findHeading = (label) => Array.from(structure.querySelectorAll(':scope > .section-heading'))
    .find((element) => element.querySelector('h2')?.textContent.trim() === label);
  const mustGet = (id) => document.getElementById(id);
  const componentTitle = library.querySelector(':scope > .section-heading');
  const componentHelper = library.querySelector(':scope > .helper');
  const structureTitle = structure.querySelector(':scope > .section-heading');
  const structureHelper = structure.querySelector(':scope > .helper');
  const pluginTitle = findHeading('Plugins disponíveis');
  const segmentTitle = findHeading('Novo segmento');
  const pageTitle = findHeading('Ordem das seções');
  const reusableTitle = findHeading('Blocos reutilizáveis');
  const strategyTitle = findHeading('Estratégia comercial');
  const settingsEnd = mustGet('pageSettingsControls');
  const search = structure.querySelector('.search-wrap');
  const pluginLibrary = mustGet('pluginLibrary');
  const pluginInstall = mustGet('pluginDropZone');
  const reusableList = mustGet('reusableBlockList');
  const sectionList = mustGet('sectionList');
  const addSection = mustGet('addSectionBtn');
  const composer = mustGet('segmentComposer');

  // Guard against partially loaded or customized editor versions.
  if ([componentTitle,componentHelper,structureTitle,structureHelper,pluginTitle,segmentTitle,
       pageTitle,reusableTitle,strategyTitle,settingsEnd,search,pluginLibrary,pluginInstall,
       reusableList,sectionList,addSection,composer].some((element) => !element)) return;

  const advancedNodes = [];
  for (let node = strategyTitle; node; node = node.nextElementSibling) {
    advancedNodes.push(node);
    if (node === settingsEnd) break;
  }

  const createGroup = (className, title, description, nodes, open = false) => {
    const details = document.createElement('details');
    details.className = 'left-sidebar-group ' + className;
    details.open = open;
    const summary = document.createElement('summary');
    const name = document.createElement('span');
    name.className = 'left-sidebar-group-label';
    name.textContent = title;
    const chevron = document.createElement('span');
    chevron.className = 'left-sidebar-group-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '⌄';
    summary.append(name, chevron);
    const inner = document.createElement('div');
    inner.className = 'left-sidebar-group-body';
    if (description) {
      const note = document.createElement('p');
      note.className = 'left-sidebar-group-note';
      note.textContent = description;
      inner.append(note);
    }
    nodes.forEach((node) => inner.append(node));
    details.append(summary, inner);
    return details;
  };

  // 1. Componentes = installable catalog. Search is immediately visible; package upload is optional.
  pluginTitle.querySelector('h2').textContent = 'Biblioteca de componentes';
  pluginTitle.querySelector('small').textContent = 'DISPONÍVEIS PARA ADICIONAR';
  componentHelper.textContent = 'Localize e adicione componentes. Para gerenciar o que já está na página, use Estrutura da página.';
  search.querySelector('input').placeholder = 'Buscar componente...';
  search.querySelector('input').setAttribute('aria-label', 'Buscar componentes disponíveis');

  const uploadGroup = createGroup('left-sidebar-upload', 'Instalar plugin ZIP',
    'Adicione outros componentes à biblioteca.', [pluginInstall]);
  reusableTitle.querySelector('h2').textContent = 'Blocos reutilizáveis';
  const reusableGroup = createGroup('left-sidebar-reusable', 'Blocos reutilizáveis',
    'Reutilize conjuntos salvos em outros projetos.', [reusableList]);
  library.replaceChildren(componentTitle, componentHelper, pluginTitle, search, pluginLibrary, uploadGroup, reusableGroup);

  // 2. Estrutura = elements that already exist, plus page composition actions.
  pageTitle.querySelector('h2').textContent = 'Seções da página';
  pageTitle.querySelector('small').textContent = 'ELEMENTOS INSERIDOS';
  structureHelper.textContent = 'Selecione e reorganize as seções instaladas ou crie uma nova composição.';
  const segmentGroup = createGroup('left-sidebar-segment', '＋ Novo segmento',
    'Divida uma nova área em colunas ou linhas (1 a 5).', [composer]);
  const settingsGroup = createGroup('left-sidebar-advanced', 'Estratégia e comportamento',
    '', advancedNodes);
  structure.replaceChildren(structureTitle, structureHelper, pageTitle, sectionList,
    addSection, segmentGroup, settingsGroup);
})();

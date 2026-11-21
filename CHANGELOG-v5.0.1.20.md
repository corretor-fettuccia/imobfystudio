# Imobify Studio 5.0.1.20

## Floating Container Pro
- Novo plugin `floating-container-pro` para caixas ocultas, drawers, bottom sheets e popovers.
- Cada instância recebe `panelId` único e persistente no projeto.
- Qualquer CTA pode abrir o container usando `href="#ID"`; também suporta `data-floating-open` e `window.ImobifyFloating.open(ID)`.
- O container usa o layout `next-sections` e pode receber até 12 plugins filhos.
- Grid configurável no desktop, tablet e mobile.
- Botão fechar configurável no topo, com ícone Font Awesome, posição, tamanho e cores.
- Fechamento por backdrop/ESC e trava de rolagem configuráveis.
- Modos desktop: modal central, drawer direita/esquerda, bottom sheet e popover próximo ao botão.
- Modos mobile: bottom sheet, fullscreen, modal ou herdar desktop.
- Prévia do editor abre automaticamente o container quando ele ou um filho está selecionado.

## SDK / Core
- Plugin Play passa `__sectionId` ao template como valor reservado.
- Novo suporte de manifesto a `instanceIdField` e `instanceIdPrefix`, garantindo IDs novos ao criar/duplicar instâncias.
- A lista Estrutura mostra o ID de chamada de plugins com identidade pública.
- Duplicação de layouts compostos agora replica o bloco lógico completo (container + filhos), evitando captura acidental de seções vizinhas.

# CHANGELOG — Imobify Studio 6.0.44

Data: 2026-10-17 · Base: Imobify Studio 6.0.43 (não modificada)

## Melhorias

- Wizard de Tipografia: acrescentado tamanho **Tablet** em Eyebrow, Headline, Subheadline, Body Text e CTA. Prévia com Mobile / Tablet / Desktop.
- Escala fluida: interpolação CSS responsiva entre os pontos de referência 320, 720 e 1440 px usando `clamp()`; limites de tamanho e validação de valores.
- Migração não destrutiva: projetos 6.0.43 com apenas `mobile` e `size` recebem automaticamente um valor de tablet derivado; o arquivo antigo não é reescrito.
- Camada de tipografia comum em `core/responsive-typography.css`, incluída tanto no preview quanto no CSS da landing page compilada.
- Ajustes responsivos em tipografia de cartões, FAQ, Destaques, formulários, banners 360°, botões do tour e textos auxiliares; preservadas as regras próprias dos demais componentes.
- Em ambos os plugins 360°, o título dentro do banner de hotspot limita sua escala a 24–34 px ao usar o Wizard, evitando que herde a dimensão da headline principal.
- Suporte ao modo `data-ib-type-mode="local"`, que preserva as definições individuais sem imposição das regras compartilhadas.
- Alinhamento das referências centrais de versão em `project.json`, `assets/js/catalog.js`, `assets/js/compiler.js`, `assets/js/app.js` e `index.html`.
- Atualização do teste Plugin Play para registrar os dois pacotes 360° adicionados na versão anterior.

## Arquivos alterados/adicionados

- `assets/js/typography-system.js`
- `assets/js/typography-wizard.js`
- `assets/css/typography-wizard.css`
- `core/responsive-typography.css` (novo)
- `assets/js/renderer.js`
- `assets/js/catalog.js`
- `assets/js/compiler.js`
- `assets/js/app.js`
- `index.html`
- `project.json`
- `tests/plugin-play.test.cjs`
- `tests/release-6.0.44.test.cjs` (substitui o teste com versão anterior)
- `tests/responsive-typography.test.cjs` (novo)
- `AUDITORIA-FONT-SIZE-6.0.44.csv` (novo)
- `VALIDACAO-6.0.44.md` (novo)

## Compatibilidade e limitações

- Não foram removidos plugins, nem alterados os manifestos funcionais ou os controles específicos de mídia.
- O inventário compreende **13 plugins nativos e 37 Plugin Play**, totalizando **50 registros**.
- Plugins complexos com fontes declaradas dentro de scripts próprios ou estilos de editor encapsulados podem continuar aplicando exceções locais; a camada comum não substitui uma auditoria visual completa de cada estado.
- O CSS compartilhado é carregado de forma prioritária após o CSS dos plugins, mas o Wizard opt-in e configurações de estilo locais continuam prevalecendo.
- O modo local não recebe o ajuste compartilhado: permanece sob responsabilidade dos controles daquele componente.
- Validar a apresentação em páginas reais no servidor e em dispositivos físicos antes de publicação definitiva.

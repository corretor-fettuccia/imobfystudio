# Imobify Studio 7.3.0 — Âncoras no início de cada componente

**Base recebida:** `Imobify-Studio-7.2.1.zip` (identificadores internos da base indicavam 7.2.0). **Data:** 02/11/2026.

## Alterações

- O renderizador universal (`assets/js/renderer.js`) agora insere um marcador `id="..."` como **primeiro filho de cada componente** que configure `settings.anchorId`. O marcador é posicionado no canto superior inicial da seção, sem ocupar altura, largura, linha ou coluna de layout.
- A âncora é consistente na prévia do editor, no HTML renderizado e no HTML exportado, inclusive para componentes contidos em `section-layout-pro` e `segment-layout`.
- IDs nativos preexistentes são preservados (p.ex. `#galeria`, `#destaques`), sem substituição ou quebra de links legados. Quando o ID personalizado já coincide com o ID nativo, não há duplicação.
- O scroll por links internos, em `core/runtime.js`, foi explicitamente alinhado com `block: 'start'`, respeitando o ajuste de topo já existente no documento (`scroll-padding-top`).
- O estilo de âncora `core/base.css` isola o marcador do fluxo visual, sem deslocar cards, colunas, alturas ou conteúdo. Os recursos originais de animação, SEO e exportação foram mantidos.
- Atualizados identificadores ativos do editor e formato de exportação para **7.3.0**, incluindo `index.html`, `project.json`, `assets/js/app.js` e `assets/js/compiler.js`.

## Compatibilidade

- A alteração é compartilhada por todos os plugins que usam o campo **Âncora do bloco**, inclusive plugins importados depois da atualização; não altera as versões internas de cada plugin.
- Plugins documentais (`output: document-tag`) não criam elemento ou âncora no corpo publicado; continuam disponíveis no editor.
- Links de abertura de popup/modal controlados por IDs próprios de plugins (como Floating Container) continuam preservados.
- Projetos antigos podem ser reabertos sem converter suas configurações de âncora. É necessário **reexportar e republicar** a landing page para a alteração aparecer no site publicado.

## Testes

- 51 componentes de seção verificados automaticamente, além de preservação de âncoras nativas, layouts filhos, editor e compilação/exportação ZIP.
- Testes de regressão de exportação agêntica, referências privadas, Hero Plus, auditoria de qualidade e canonical: **aprovados**.
- Navegação visual real em Chromium não pôde ser avaliada nesta execução: o navegador foi bloqueado pelo ambiente; recomendável conferir âncoras em navegadores reais antes de publicar.

Consulte `VALIDACAO-7.3.0.md` e `tests/anchors-start-730.test.cjs`.

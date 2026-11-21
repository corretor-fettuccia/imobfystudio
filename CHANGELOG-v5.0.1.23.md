# Imobify Studio 5.0.1.23

- Floating Container Pro atualizado para v1.3.0.
- Corrigida abertura por HREF `#floating-box-...`: a camada publicada agora usa portal real no `<body>`, eliminando interferência de `content-visibility`, transforms e animações das sections.
- Corrigido bloqueio invisível de cliques no mobile causado por `pointer-events` na camada fechada.
- Corrigidas animações/estado aberto de drawer-right, drawer-left e bottom-sheet.
- O ID público do Floating Container agora também existe como atributo `id` real no DOM.
- Runtime aceita qualquer elemento com `href="#..."`, mantendo compatibilidade com os CTAs do framework.
- Layout autodeclarado ganhou `excludeTypes`; Floating Container usa `excludeTypes: ["footer"]` para nunca capturar o rodapé como conteúdo interno.
- Novos Floating Containers iniciam com zero itens internos; itens entram ao serem posicionados dentro do container na Estrutura.

FLOATING CONTAINER PRO v1.3.0

USO RECOMENDADO
1. Adicione o Floating Container Pro ao projeto.
2. Arraste os componentes desejados para dentro dele na Estrutura.
3. Ajuste colunas, modo e aparência no inspetor.
4. Copie “HREF para abrir este container”.
5. Cole exatamente esse valor no HREF / Destino do CTA de qualquer botão.

Exemplo:
#floating-box-k3p9x

FUNCIONAMENTO
- O clique em href="#ID" é interceptado automaticamente.
- Na publicação, a camada é portada para o BODY para garantir position:fixed real e evitar interferência de content-visibility, transforms e animações de seções.
- O rodapé nunca é capturado como item interno.
- Não use javascript:, data-floating-open ou window.ImobifyFloating.open() no fluxo normal.

A API JavaScript continua disponível internamente apenas para integrações avançadas.

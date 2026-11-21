# Imobify Studio 7.3.1 — Smart Plant × Form Sender

Base: **7.3.0**, mantendo o ajuste de âncoras, exportação e navegação agêntica.

## Correções

- Resolvida competição entre **Form Sender V4** e **Form Sender Popup** quando ambos estão na mesma landing page.
- Campo `formAnchor` agora identifica o destinatário da ação no Smart Plant. Caso a âncora não esteja presente, mantém fallback para V4; na ausência de V4, somente Popup com integração Smart Plant habilitada é considerado.
- Seleção da planta e informações comerciais inseridas no formulário realmente enviado, inclusive com campo de mensagem oculto.
- Uma nova seleção substitui a anterior; dados do visitante permanecem preservados.
- Abertura manual do Popup não fica bloqueada por temporizador ou recall de exibição automática.
- O conteúdo Smart Plant não aparece duas vezes na mensagem do Popup.
- A rolagem para o V4 aguarda a restauração do scroll após fechamento do modal Smart Plant.
- Falha de destino exibe aviso no próprio modal, sem fechá-lo silenciosamente.

## Plugins corrigidos

- Smart Plant: **1.4.5**
- Form Sender Popup: **1.4.1**
- Form Sender V4: **4.5.0** (compatível, sem alteração necessária do motor de envio)

Mantidas as versões anteriores em `plugin-packs/`. Novos pacotes importáveis incluídos.

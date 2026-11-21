# Imobify Studio 7.3.4 — Smart Plant / âncora contato

Base: versão 7.3.3.

## Causa identificada
Na 7.3.3, o Smart Plant ligava a escolha do formulário à escolha da âncora. Quando `#contato` não estava dentro do bloco do formulário escolhido, o código descartava a âncora e rolava para o bloco do formulário (`chosen.section`). Isso podia produzir uma navegação incorreta ou nenhum deslocamento visível, apesar do envio correto dos dados da planta.

## Correções
- **Âncora é o destino prioritário**: ao escolher `formAnchor=contato`, a rolagem segue o elemento real `id="contato"`, esteja ele dentro do V4, do Agendamento Sender ou de outra seção.
- A associação e transferência do contexto da planta ao Form Sender V4 / Agendamento Sender é independente do destino visual.
- Modal continua a fechar e desbloquear a página antes da rolagem.
- URL atualizada para `#contato` sem provocar navegação nativa concorrente; cálculo da posição feito diretamente com o elemento da âncora.
- Rolagem verificada em frames posteriores para absorver ajustes de layout após remover `body{position:fixed}`.
- O clique do CTA não propaga para listeners externos do documento.
- Smart Plant atualizado para 1.4.8; incluído `plugin-packs/smart-plant-v1.4.8.zip`.

## Publicação
Reexportar a landing page com o Studio 7.3.4 e reenviar os arquivos completos ao servidor. Conferir que a seção desejada tem a âncora `contato` (ID sem # no editor). Se a LP publicada usar cache/CDN, invalidar a versão antiga de `assets/js/site.js`.

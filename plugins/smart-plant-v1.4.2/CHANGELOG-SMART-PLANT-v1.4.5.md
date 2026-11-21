# Smart Plant 1.4.5 — Integração Form Sender

- A âncora definida em `formAnchor` seleciona prioritariamente o Form Sender V4 ou Popup da seção correspondente.
- Popup presente em outra seção não intercepta o Form Sender V4.
- Popup só recebe o contexto quando é o destino; não gera solicitação em duplicidade.
- Mantém a identificação da planta, metragem, código e mensagem comercial no Form Sender V4 (mesmo com campo visual oculto).
- Substitui o contexto da planta anterior quando uma nova planta é selecionada.
- Após liberar o bloqueio de rolagem do modal, posiciona a página no início da seção de destino.
- Se não houver destino válido, exibe uma mensagem acessível e mantém o modal aberto.

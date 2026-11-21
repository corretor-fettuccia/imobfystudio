# Smart Plant 1.5.0

## Corrigido
- "Quero escolher esta planta" não levava ao formulário quando a mesma âncora (ex.: `contato`) estava em mais de uma seção. O plugin usava o primeiro elemento com o ID (um botão acima) e a página parava antes do formulário.
- Agora todos os elementos com a âncora são avaliados; o que pertence a Form Sender V4, Agendamento Sender ou Form Sender Popup tem prioridade.
- A rolagem vai sempre ao formulário que recebeu a planta. A âncora configurada só é usada se estiver no próprio formulário ou num título até 1,5 tela acima dele.

## Validado (Chromium, desktop 1280×800 e mobile 390×780)
V4 automático com âncora repetida; V4 explícito; Agendamento Sender por âncora; Agendamento explícito com âncora antiga; V4 + Agendamento na mesma página; Form Sender Popup. 12/12 aprovados.

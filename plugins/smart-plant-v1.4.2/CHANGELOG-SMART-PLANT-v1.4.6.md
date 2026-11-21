# Smart Plant 1.4.6

- Direcionamento por âncora para Form Sender V4, Agendamento Sender ou Popup, preservando o envio do contexto da planta.
- Ao confirmar, desbloqueia o modal sem restaurar a posição anterior ou devolver o foco ao botão da planta.
- Leva o viewport imediatamente para a âncora do formulário correto, com foco no campo de nome.
- No fechamento normal do modal (sem confirmar a planta), preserva a restauração de posição.
- Inclui fallback para navegadores sem rolagem instantânea via scrollIntoView.

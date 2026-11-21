# Imobify Studio 5.10.1

## Form Sender 4.4.1

- Corrige o questionário adicional no mobile: deixa de usar bottom sheet e passa a abrir centralizado na viewport.
- Uma pergunta por vez permanece com transição fade e indicador de etapa.
- Remove scroll interno e overflow de corte no modal mobile.
- Adiciona adaptação automática ao tamanho útil da viewport (`visualViewport` quando disponível), reduzindo proporcionalmente o modal apenas quando necessário.
- Recalcula o encaixe ao trocar de pergunta, redimensionar a janela ou mudar a orientação.
- Clique/toque no backdrop não confirma, não avança, não pula e não envia o formulário.
- O botão fechar cancela a complementação sem enviar; somente ações explícitas (`Pular e enviar` ou `Concluir envio`) finalizam o envio.
- Mantém autocomplete configurável e compatibilidade de exportação introduzidos nas versões anteriores.

# ImobStudio 6.0.66 — Agendamento Sender

- Adicionado o componente Plugin Play `agendamento-sender` v1.0.0 no catálogo Captação.
- UI compacta com faixa horizontal de datas, setas, turno, nome/e-mail/telefone e botão SVG.
- Dias disponíveis gerados no browser (datas passadas e bloqueadas excluídas); bloqueio de sábado/domingo configurável, janela e dias de antecedência.
- POST `FormData` para endpoint configurável do FormSender v4. Campos legados preservados, data/turno registrados também na mensagem.
- Prevenção de envio no ambiente do editor, estados de loading, validação HTML5 e feedback de envio.
- MD de referência atualizado com contrato do componente e exemplo de section JSON.
- Plugin ZIP instalável individualmente em `plugin-packs/agendamento-sender-v1.0.0.zip`.
- Sem agendamento confirmado em tempo real: solicitação sujeita à confirmação da equipe.

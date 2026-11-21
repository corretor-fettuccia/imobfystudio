# Imobify Studio 7.3.2 — Smart Plant: foco na âncora dos formulários

Base: **7.3.1**. Permanecem os ajustes de âncora no início do componente, SEO e exportação agêntica.

## Correção solicitada

- **Smart Plant → Form Sender V4**: após clicar no CTA da planta, fecha o modal e posiciona imediatamente a página na âncora cadastrada, com foco no campo de nome.
- **Smart Plant → Agendamento Sender**: aplica o mesmo direcionamento para a âncora do Agendamento Sender.
- O texto comercial e os dados da planta continuam a ser transferidos como antes; não houve alteração no protocolo de envio por causa da navegação.
- Evita o conflito entre a restauração de rolagem do modal e a navegação para o destino escolhido. Também impede o retorno involuntário do foco ao botão da planta depois do CTA.
- O fechamento comum do modal (X, Escape ou fundo) preserva o comportamento anterior de retorno à seção Smart Plant.
- Inclui fallback para navegadores que não reconhecem `scrollIntoView({behavior:'instant'})`.

## Integração com Agendamento Sender

A versão 7.3.2 também reúne a integração iniciada nesta revisão: o campo de destino do Smart Plant permite usar **Automático (por âncora)**, **Form Sender V4**, **Agendamento Sender** e **Popup**. O Agendamento Sender recebe os dados da planta selecionada em sua própria instância e os inclui no resumo e no payload quando o visitante efetivamente envia o agendamento.

## Componentes

- Smart Plant **1.4.6**
- Agendamento Sender **1.4.1**
- Form Sender V4 e Form Sender Popup: compatibilidade preservada.

Para testar em um projeto existente, confira no Smart Plant `Ação = Formulário`, escolha a âncora real do V4 ou do Agendamento Sender e reexporte a landing page.

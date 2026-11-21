# Agendamento Sender 1.2.0 — ImobStudio 6.0.69

## Funcionamento
Formulário compacto com calendário horizontal, seleção de turno, nome, telefone e e-mail opcional. POST `FormData` compatível com FormSender V4; o agendamento é **uma solicitação de visita pendente de confirmação**, não uma reserva ou disponibilidade em tempo real. O editor não envia dados reais.

## Aparência / tema global
`themeMode=global` (padrão): usa as variáveis do Design System da LP: `--action-button-bg`, `--action-button-text`, `--primary`, `--surface`, `--heading-color`, `--muted-color`, `--body`, `--heading`, `--radius`. Mudanças no estilo global refletem no Agendamento Sender e no HTML exportado. `themeMode=custom`: usa cores manuais do plugin, preservando os campos antigos (accentColor etc.).

`visualPreset=auto` (padrão): segue o perfil comercial `state.strategy.profile` do projeto. `popular/firstHome/patio/urgency` -> Popular; perfis `luxury/premium/...` -> Editorial; investimento/náutico/resort -> Imersivo; demais -> Contemporâneo. Presets manuais: `popular`, `contemporary`, `sophisticated`, `minimal`, `spotlight`, `immersive`, `editorial`. Preset altera composição visual **sem criar paleta concorrente**; cor continua sendo do projeto.

## Dias da semana / exceções
Sete toggles no grupo **Calendário · dias atendidos**: Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado, apresentados como D S T Q Q S S. Desmarcado = indisponível: dia continua no calendário cronológico com risco diagonal, não permite clique e não é elegível no POST. `blockedDates` aceita datas exatas (AAAA-MM-DD) que também são mostradas riscadas. Datas anteriores e o prazo mínimo nem aparecem. A navegação mantém a contagem de dias corridos, incluindo indisponíveis.

## Configurações e limites
Antecedência 0–30 dias; horizonte 7–180; 3–8 datas visíveis no desktop, 3 no mobile; turnos separados por `|`. Datas e turnos são **preferências**, sem checagem de ocupação online. Dias úteis e exceções são calculados no fuso IANA do empreendimento (`timeZone`), independentemente do visitante. Para disponibilidade real e feriados dinâmicos, requer backend. Não usar o componente como confirmação automática.

## Contrato
`produto`, `nome`, `email`, `telefone`, `dataHora`, `msg`, `origem`, `assunto`, `agendamento`, `agendamentoData`, `agendamentoDataISO`, `agendamentoTurno`, `agendamentoFuso`, `agendamentoStatus`. Usa `notify_Send_notification` do FormSender V4 quando presente e fallback flutuante independente.

## Privacidade
Recomenda-se link de política de privacidade e aviso de uso de dados no site. A URL do FormSender deve ser HTTPS e estar autorizada a receber os campos enviados. Faça teste de ponta a ponta na implantação real antes de publicar.

**Compatibilidade:** instâncias antigas preservam cores locais e regras anteriores de sábado/domingo quando não usam os novos campos. Os novos campos são mesclados com seus valores padrão sem apagar valores gravados.

## 1.2.0 — Painel de conversão e calendário do empreendimento
- `showConversionPanel`: exibe o cartão visual de CTA com calendário SVG animado; `conversionLayout=split` usa o painel à direita no desktop, com responsividade em faixas menores; `banner` e `compact` são alternativas.
- `conversionEyebrow`, `conversionHeadline`, `conversionDescription`, `conversionAction`, `conversionBadge`: textos ajustáveis da chamada, sem alegações de escassez artificial.
- `pulseIntensity`: off / subtle / balanced / dynamic; pulso de calendário, órbitas e microanimações com `prefers-reduced-motion`.
- `visualPreset`: adiciona `spotlight` (alto contraste usando cores globais), `immersive` (luz e profundidade) e `editorial` (tipografia expressiva). Presets existentes permanecem válidos; `auto` considera o perfil real do projeto.
- `timeZone` = fuso IANA do empreendimento, ex. America/Sao_Paulo. O calendário civil passa a ser calculado nesse fuso, não no navegador. Em caso de configuração inválida, usa America/Sao_Paulo; ao enviar, passa `agendamentoFuso` e data/hora do recebimento no fuso configurado. Como são turnos, não existem horários específicos ou reservas confirmadas.
- Turnos por dia: Sunday...Saturday `*Turns`, opções `all`, `none` ou índices `1,2`, `2,3`, `1`, `2`, `3` relativos à lista `turns` (separada por `|`). Se não houver turnos, dia bloqueado visualmente. Dias desmarcados continuam bloqueados mesmo com turnos configurados.
- Desde v1.3.0: clique no CTA lateral valida e **envia a solicitação** pelo mesmo formulário e endpoint. Não confirma automaticamente a visita.

O Agendamento Sender precisa de uma integração de disponibilidade/agenda real para evitar choques de visitas; continua como captação de preferência sujeita à confirmação humana. Validar a política de privacidade e o endpoint real de produção.


## v1.3.0 — CTA único de submissão

Com painel ativo (e layout diferente de compact), o botão do painel é o único CTA visível e executa a submissão real do formulário com validação e POST FormSender. O botão do aviãozinho é oculto. Sem painel, o aviãozinho permanece como único botão. Em ambos os modos a confirmação de visita depende da equipe.

# ImobStudio 6.0.67 — Feedback visual do Agendamento Sender

Base: 6.0.66. Plugin Agendamento Sender atualizado para 1.0.1.

## Correção
- Reutiliza `window.notify_Send_notification(tipo, mensagem, titulo)` quando FormSender V4 está carregado.
- Em instalação isolada do plugin, renderiza sua própria notificação com identidade visual equivalente ao notify-send v4, sem Font Awesome externo: cores, ícone SVG, título, descrição, transição, barra de progresso e fechamento.
- Eventos: envio, sucesso após HTTP/API, falha de envio, campo inválido, falta de data, configuração incorreta e bloqueio da prévia do editor.
- Mantém o status textual acessível e evita anúncio falso de agendamento confirmado (apenas solicitação recebida).
- Não altera o payload FormData, endpoint, calendário nem o modelo de confirmação manual.

## QA recomendado
1. Sem FormSender V4 na página: verificar notificação local flutuante nas mensagens de sucesso/erro.
2. Com FormSender V4: verificar delegação à função global e aparência original.
3. Em editor: testar bloqueio de envio real e mensagem de prévia.
4. Na landing exportada: simular retorno HTTP 200, 4xx, erro JSON e falha de rede; só sucesso após resposta positiva.
5. Confirmar que o botão fica desabilitado durante o envio e é reabilitado no fim.

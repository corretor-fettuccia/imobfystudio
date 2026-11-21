# Validação 7.3.4 — Smart Plant / #contato

## Testes de navegador (Chromium)
- 4 cenários: âncora `#contato` criada em seção **externa** ao formulário de destino, com Form Sender V4 e Agendamento Sender, desktop 1200px e mobile 390px: **aprovados**.
- 4 cenários da página exportada convencional: âncora dentro de Form Sender V4 ou Agendamento Sender, desktop 1280px e mobile 390px: **aprovados**.
- Fechamento normal do modal sem encaminhar: **aprovado** nos cenários convencionais.
- Verificados: modal fechado, body desbloqueado, valor da planta recebido pelo formulário, posição física de `#contato` próxima do topo, hash `#contato` no caso de âncora externa.

## Testes de código
- `node --check plugins/smart-plant-v1.4.2/plugin.js`: aprovado.
- `node tests/smart-plant-senders-732.test.cjs`: 3/3 aprovado (expectativa de versão ajustada para 1.4.8).
- `node tests/smart-plant-form-sender-731.test.cjs`: 3/3 aprovado (expectativa de versão ajustada para 1.4.8).

## Limites
- Testes realizados em fixture exportada construída automaticamente com o Studio, **não** na landing page real do usuário (não fornecida nesta rodada).
- Nenhum POST real ao backend de produção foi enviado.
- A confirmação no site real depende de `id="contato"` presente uma única vez, exportação atualizada e cache do JavaScript invalidado.

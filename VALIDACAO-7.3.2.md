# Validação — Imobify Studio 7.3.2

**Objetivo:** confirmar que, ao confirmar a planta no Smart Plant, a rolagem/foco chega à âncora configurada sem prejudicar o texto já integrado.

## Verificações executadas

- Chromium headless, layout desktop (1280×780): Smart Plant → Agendamento Sender (âncora `#agendar`), foco no campo `nome`.
- Chromium headless, layout desktop (1280×780): Smart Plant → Form Sender V4 (âncora `#contato`), foco no campo `nome`.
- Chromium headless, layout mobile (390×780): mesmos dois destinos.
- Em todos os quatro cenários, a posição da âncora ficou visível no viewport em aproximadamente 120 ms após o clique. O corpo já estava desbloqueado e o modal fechado.
- O fechamento comum do modal não dispara a navegação de CTA e preserva o posicionamento na seção Smart Plant.
- A transferência de dados do Smart Plant aos dois formulários permaneceu disponível nos casos testados.

## Regressão de exportação

Teste real construído a partir de `tests/generate-732-fixture.cjs` e executado por `tests/smart-plant-anchor-732.browser.py`. A fixture exportada inclui os dois formulários ao mesmo tempo, evitando falso positivo por formulário único.

## Limites

Os testes foram realizados no Chromium do ambiente de desenvolvimento, não em Safari físico ou em uma landing page pública. O envio a um endpoint externo não foi testado, já que o ajuste solicitado era exclusivamente o foco/posicionamento na âncora. É necessário **reexportar e republicar** a landing page para aplicar o JavaScript atualizado.

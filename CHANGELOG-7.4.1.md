# Imobify Studio 7.4.1 — Smart Plant → formulário

**Base:** Imobify Studio 7.4.0 (Auditoria de seções). Nenhuma funcionalidade anterior removida.

## Corrigido
- **Smart Plant 1.5.0:** "Quero escolher esta planta" agora leva ao formulário em todos os destinos: Form Sender V4, Agendamento Sender e Form Sender Popup, tanto pela âncora quanto pelo tipo de formulário escolhido.
  - Causa: a âncora `contato` estava em 5 seções (4 botões + formulário). O navegador devolvia o primeiro `id="contato"` (um botão) e a página parava ali, ~3.600 px antes do formulário.
- **Renderer:** âncora repetida em várias seções gerava IDs duplicados (HTML inválido) e fazia todos os links `#contato` caírem no primeiro botão. Agora cada âncora tem um único dono na página publicada, com prioridade para formulários (V4 → Agendamento → outros formulários → primeira seção visível).

## Adicionado
- **Auditoria:** regra "Âncora repetida", com correção de um clique ("Remover âncora desta seção").
- `plugin-packs/smart-plant-v1.5.0.zip`.

## Validação
- Chromium, desktop 1280×800 e mobile 390×780, página gerada pelo renderer:
  A) V4 automático com âncora repetida; B) V4 explícito; C) Agendamento por âncora; D) Agendamento explícito com âncora antiga; E) V4 + Agendamento na mesma página; F) Form Sender Popup. **12/12 aprovados** (campo Nome focado e visível; contexto da planta gravado).
- Mesmo teste na 7.3.8 original: cenário A **falha** (formulário a ~3.600 px).
- Botões com link `#contato`: todos chegam ao formulário.
- Testes automáticos: mesmas 15 falhas pré-existentes da 7.3.8; nenhuma nova. Testes 7.3.1 e 7.3.2 do Smart Plant atualizados para a versão 1.5.0 do pacote.

## Atenção
- Páginas já publicadas precisam ser **reexportadas** para receber a correção.

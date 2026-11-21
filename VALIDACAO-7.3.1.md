# Validação — Imobify Studio 7.3.1

## Comportamento funcional observado

Testes executados em **Chromium 144 headless** com páginas reais montadas pelo exportador. Como a navegação local estava bloqueada, o HTML foi injetado em `about:blank` com o JS exportado, sem alterar os scripts testados.

**9 de 9 verificações aprovadas:**

1. V4 e Popup na mesma página: seleciona V4 sem abrir Popup.
2. V4 com mensagem oculta: planta, metragem e código preservados.
3. Segunda planta selecionada: contexto anterior é substituído.
4. Página só com Popup: abertura a partir do Smart Plant.
5. Popup: contexto é armazenado uma vez, sem duplicar no campo de mensagem.
6. Âncora explícita para Popup prevalece sobre V4 de outra seção.
7. Dois V4: a âncora seleciona apenas a instância correta.
8. Sem formulário compatível: modal continua aberto com erro visível.
9. Zero exceções JavaScript nos cenários testados.

Resultado estruturado: `tests/RESULTADOS-SMART-PLANT-7.3.1.json`.

## Regressões e integridade

- **51 componentes de seção** e âncoras exportadas: teste `anchors-start-730.test.cjs` aprovado com versão 7.3.1.
- Plugins Smart Plant (core style e magnifier), Form Sender Popup, complemento V4, exportação de complemento e navegação agêntica: testes aprovados.
- Pacotes importáveis Smart Plant 1.4.5 e Form Sender Popup 1.4.1: manifestos e entradas confirmados.
- Exportação de páginas com V4, Popup, ambos e múltiplos V4 concluída.

## Limitações

- **Não houve submissão real ao endpoint externo** do cliente. Foi validado o estado do formulário e o contexto preparado para envio.
- É necessário reexportar/republicar as landing pages já geradas para aplicar a correção.

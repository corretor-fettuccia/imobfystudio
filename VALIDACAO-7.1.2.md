# Validação — Imobify Studio 7.1.2

Data: 30/10/2026. Base: código 7.1.1 enviado.

## Testes
- Sintaxe JS com `node --check` nos arquivos modificados: aprovado.
- Regressão do Hero Plus: `node tests/hero-plus-712.test.cjs` aprovado — renderização, controles, transições, preenchimento e texto justificado.
- Chromium headless (amostra de 2 slides, 4 tamanhos): 1440×900, 820×1180, 390×844 e 360×640; raiz ocupou o viewport, `margin:0px` nos slides, `object-fit:cover`, imagem cobrindo viewport e sem overflow horizontal; 0 erros de JavaScript, `setInterval` ativo e trocas observadas.
- Prévia visual avaliada por captura de tela. Fotos usadas eram de demonstração, não de empreendimento real.

## Ressalvas
- A captura em navegador simulado não substitui validação em iOS/Safari e aparelhos físicos.
- O conteúdo textual, densidade dos títulos, posição e corte das imagens devem ser conferidos em cada empreendimento, pois o tamanho dos textos varia.
- O Studio e a landing exportada compartilham as fontes de CSS/JS do componente via mecanismo de `loadSources`.

## Regressão geral da suíte
- **68 testes**, **62 aprovados** e **6 falhas legadas**. As falhas restantes se referem a números de versão históricos hard-coded (6.0.83, Form Sender 4.4.6 e Plugin Play 1.3.0); não indicaram falha do Hero Plus.
- Resultado completo: `tests/RESULTADOS-7.1.2.json`.

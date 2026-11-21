# Validação — 6.0.45

Data: 2026-10-17

## Resultados confirmados

- **38/38 testes automatizados** `.test.cjs` aprovados na execução completa antes do reforço adicional de especificidade.
- Após o reforço de prioridade CSS, `immersive-360-fullbleed.test.cjs` e `plugin-play.test.cjs` executados novamente com sucesso.
- Exportação HTML/CSS gerada pelo compilador para Hero360Tour e Parallax360Tour.
- Chromium headless com o CSS real exportado embutido e com os scripts remotos desativados: em 320, 390, 768, 1024, 1440 e 2560 px, os dois panoramas tiveram bordas esquerda/direita em `0`/`viewport`, raio de 0 px, borda 0 px e padding de seção 0.
- Teste de panorama dentro de contêiner centralizado estreito também atingiu as bordas nas seis larguras acima.
- Arquivos do Tour360 original não foram editados.

## Limites da verificação

- O teste complementar tentando simular sobrescrita local do inspetor no Chromium não foi concluído: o processo travou/atingiu timeout. A prioridade foi reforçada em CSS após a medição inicial, mas a simulação de estilo local necessita de nova verificação.
- A medição geométrica foi feita com cenários vazios (sem fotografias 360), para isolar o layout. Ainda resta validar o carregamento e a interação com panoramas reais, em localhost e aparelhos físicos.
- Nenhuma validação dos endpoints remotos/CDN de Pannellum foi realizada nesta entrega.

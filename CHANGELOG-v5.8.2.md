# Imobify Studio 5.8.2

## Correção — tipografia do Parallax na exportação

- O exportador agora detecta `bannerFontFamily` do Parallax.
- Fontes configuradas individualmente em `heroPoints` (`fontFamily`, `titleFontFamily`, `textFontFamily`, `eyebrowFontFamily`) entram no carregamento tipográfico do HTML publicado.
- Stacks CSS preservam o valor completo no componente, enquanto o carregador remoto usa a primeira família válida.
- Famílias genéricas (`system-ui`, `serif`, `sans-serif` etc.) não geram requisições inválidas ao Google Fonts.
- A faixa de pesos carregada passa a 300–900 para cobrir todas as opções expostas pelos banners.
- Novo teste de exportação valida fonte geral, título, texto e eyebrow no Parallax.

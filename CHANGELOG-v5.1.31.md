# Imobify Studio 5.1.31

## Hero Imobiliário Plus

- Mantém o **Hero imobiliário** clássico intacto e registra o novo **Hero Imobiliário Plus** como componente nativo separado.
- Personaliza completamente a chamada **“Explore o projeto”**, incluindo texto, hiperlink e exibição.
- Até quatro imagens de fundo com autoplay e transições: crossfade, horizontal, vertical, zoom + fade e perspectiva.
- Movimento independente da imagem: panorâmica esquerda/direita, zoom lento, Ken Burns, perspectiva e drift cinematográfico.
- Controles de composição: alinhamento horizontal e vertical, largura do conteúdo e offsets X/Y.
- Studio avançado flutuante para evitar sobrecarregar a barra direita.
- Presets tipográficos para **Popular premium**, **Contemporâneo**, **Luxury**, **Editorial** e **Arquitetônico**.
- Tipografia local independente para título, texto de apoio e ribbon: fonte, tamanho, peso, line-height, tracking, cor e sombra.
- Ribbon com largura ajustável e alinhamento esquerda, centro, direita ou justificado.
- Animações de texto: reveal, blur, máscara, tracking, glow, palavras em sequência e caracteres em onda.
- Partículas em Canvas com estilos poeira, bokeh, faíscas e traços; densidade, velocidade, tamanho, opacidade e magnetismo configuráveis.
- Iluminação reativa ao cursor, vinheta, overlay, desfoque e controles de intensidade.
- CTA com magnetismo local e efeitos de glow/reflexo.
- `prefers-reduced-motion` respeitado para acessibilidade.
- O primeiro slide continua elegível como imagem LCP/preload e fontes usadas pelo preset do Hero Plus são incluídas no documento.

## Compatibilidade

- Projetos anteriores continuam usando `hero` sem migração automática.
- Estratégias aplicadas sobre uma página que já usa apenas `hero-plus` preservam o Plus em vez de substituí-lo pelo Hero clássico.
- O novo ID `hero-plus` é reservado no registro do núcleo para impedir sobrescrita acidental por Plugin Play.

## Validação

- Suíte `node tests/plugin-play.test.cjs` ampliada com regressões específicas do Hero Imobiliário Plus.

# Imobify Studio 5.8.3

- Corrige a hierarquia tipográfica do Parallax na exportação e no preview.
- Títulos passam a herdar `--heading` quando não há fonte específica do banner.
- Textos passam a herdar `--body` quando não há fonte específica do banner.
- `bannerFontFamily=inherit` não grava mais `--svp-banner-font: inherit`, evitando mascarar a tipografia global/local.
- Mantida prioridade: fonte individual do ponto > fonte do ponto > fonte padrão dos banners > tipografia local/global.

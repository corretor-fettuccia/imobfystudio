# Imobify Studio 5.0.0

## Perfil Visual — correção de composição

- Corrigido o controle **Espaçamento vertical das seções**: o valor agora é aplicado diretamente no desktop e gera uma redução proporcional no mobile, em vez de cair em um valor praticamente fixo.
- Plugin Play de conteúdo passa a consumir `--section-space` de forma consistente; overlays, sliders full-screen, Scrollytelling, Section Layout e Spacer/Divider permanecem com comportamento próprio.
- Eliminado padding duplicado em Location e Form Sender.
- O **Arredondamento** agora alcança superfícies estruturais dos plugins (cards, formulários, mapa, oferta, simulador, hotspot, popup, hero do scrollytelling, galerias e Flip Cards) sem alterar círculos funcionais.
- CTAs compatíveis passam a acompanhar o arredondamento global.
- Lifestyle mantém a imagem full-bleed, mas o bloco de conteúdo obedece ao ritmo vertical do projeto.
- Compatibilidade com projetos anteriores mantida via `normalizeState`.

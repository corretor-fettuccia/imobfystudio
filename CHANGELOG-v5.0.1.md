# Imobify Studio 5.0.1 — Visibilidade responsiva global Desktop + Mobile

- Chaves **Ocultar no mobile** e **Ocultar no desktop** para todas as seções/plugins de conteúdo.
- Implementação no renderer, portanto plugins atuais e futuros herdam o recurso sem alterar seus manifestos.
- Breakpoint unificado em 720 px, igual ao núcleo responsivo do framework.
- Publicação: seções marcadas usam `data-hide-mobile="true"` e/ou `data-hide-desktop="true"`, sem reservar espaço no breakpoint oculto.
- Editor: na viewport correspondente o conteúdo oculto vira um marcador **Oculto no mobile** ou **Oculto no desktop**, permanecendo selecionável.
- Section Layout: filhos ocultos colapsam naturalmente no grid; ocultar o próprio layout esconde o conjunto completo no mobile.
- Compatibilidade mantida com projetos anteriores: `hideMobile` e `hideDesktop` são normalizados como `false` quando ausentes.

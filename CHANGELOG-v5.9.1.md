# Imobify Studio 5.9.1

## Parallax 2.9.1
- Mobile: setas do hint “Deslize para cima” agora ficam em camada atrás/acima do selo de texto.
- O pill não inclui mais as setas no fluxo, evitando deformação.

## Comportamento global mobile
- Viewport exportado fixado em 100% (`maximum-scale=1`, `minimum-scale=1`, `user-scalable=no`).
- `viewport-fit=cover` para safe-area em iPhone.
- Runtime bloqueia pinch/gesture zoom e zoom por duplo clique/toque sem impedir scroll de um dedo.
- Controles clicáveis usam `touch-action: manipulation`.

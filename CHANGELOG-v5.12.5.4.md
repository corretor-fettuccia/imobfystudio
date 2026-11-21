# Imobify Studio 5.12.5.4

## Popup Pro 1.2.2
- Corrige popup disparando e bloqueando o scroll sem aparecer.
- Overlay é movido para o `body` ao abrir no site, evitando recorte por `overflow`, `transform` ou stacking context de outras seções/parallax.
- Preserva variáveis visuais do projeto ao mover o overlay.
- Preserva a configuração de exibição da imagem no mobile após o portal.
- Limpa overlays portados quando a instância original deixa de existir.
- Mantém gatilhos por data, scroll, delay, reexibição e sessão sem polling contínuo.

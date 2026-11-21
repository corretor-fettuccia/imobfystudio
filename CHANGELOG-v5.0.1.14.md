# Imobify Studio 5.0.1.14

## Correção — efeitos do Design System aplicados ao projeto real

- Corrige títulos/subtítulos cujos estilos locais de plugin venciam os tokens globais por especificidade CSS.
- Adiciona uma camada autoritativa final para `text-shadow`, `-webkit-text-stroke` e `paint-order` dos títulos/subtítulos.
- O runtime passa a identificar semanticamente títulos, subtítulos e CTAs reais de cada plugin, inclusive elementos inseridos dinamicamente.
- CTAs marcados pelo runtime recebem cor, fundo/material, borda, profundidade, glow, vidro e estados hover/active do Perfil Visual.
- Adiciona ponte para o CTA óptico do `payment-investment-glass-pro`, encaminhando o material global para a camada visual interna do botão.
- Adiciona ponte para o CTA do `professional-branding-pro` quando `data-project-profile="true"`.
- Mantém dimensões, posicionamento e mecânicas 3D locais; somente a aparência solicitada pelo Design System se torna autoritativa.
- Amplia a suíte de regressão para verificar que os efeitos globais realmente vencem os estilos locais de plugins.

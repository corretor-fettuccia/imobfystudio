# Imobify Studio 5.4.0

## Slider imobiliário 1.1.0

- Remove o limite fixo de três slides.
- Adiciona painel visual de ordem com **Adicionar**, **Remover** e **Editar**.
- Permite reordenar com setas ou arrastar a linha do slide.
- Cada slide passa a ter imagem, texto alternativo, Hero/chamada, título e texto próprios.
- CTA passa a ser opcional por slide com o controle **Exibir botão**.
- Mantém autoplay, intervalo, altura, overlay, indicadores e setas como configurações globais do slider.
- Mantém compatibilidade com projetos legados baseados em `image1..3`, `title1..3`, `cta1..3` e campos relacionados.
- O compilador passa a empacotar imagens existentes dentro do JSON `slides`, inclusive slides adicionais.
- Plugin `property-slider` atualizado de 1.0.0 para 1.1.0.

## Versionamento

A alteração é retrocompatível, mas adiciona uma nova capacidade funcional ao Studio; por versionamento semântico, o framework avança de **5.3.1** para **5.4.0**.

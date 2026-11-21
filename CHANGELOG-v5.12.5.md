# Imobify Studio 5.12.5

## Slider imobiliário 1.4.0

- Adiciona upload de imagem diretamente no editor de cada slide, seguindo a experiência dos campos de mídia do Studio.
- Mantém entrada por URL ou caminho de projeto.
- Imagens carregadas localmente são armazenadas como mídia do projeto e convertidas em arquivos físicos em `assets/images/` durante a exportação.
- URLs remotas de imagens do Slider passam a ser baixadas e incorporadas ao ZIP quando a origem permite leitura via CORS; se a origem bloquear a leitura, a URL é preservada como fallback.
- O `slides` serializado e os campos legados `image1..3` continuam sincronizados para compatibilidade com projetos e presets anteriores.

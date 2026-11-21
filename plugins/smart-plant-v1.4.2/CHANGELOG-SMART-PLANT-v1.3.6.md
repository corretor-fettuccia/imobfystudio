# Smart Plant 1.3.6

- Modal público desacoplado da section e portado para o body, evitando corte por transform/overflow de ancestrais.
- Centralização pelo visualViewport no Safari/iPhone, inclusive com scroll avançado na landing page.
- Modal sem rolagem interna: conteúdo adapta e escala ao viewport útil.
- Fechamento revisado: X, backdrop e ESC; removido duplo disparo touchend/click no iOS.
- Restauração do scroll e foco após fechamento.

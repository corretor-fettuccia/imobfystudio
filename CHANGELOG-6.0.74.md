# ImobStudio 6.0.74 — Hero360Tour 1.2.1

- Correção da tela preta ao inicializar o Hero360Tour 1.2.0.
- Causa: registro de evento `orientationchange` antes da criação de `disposers`, resultando em `ReferenceError` antes de `loadScene()`.
- Movido o registro de listeners para antes da configuração do sensor.
- Mantidos controle imersivo, salvamento de cenas, WebGL NPOT e fallback Canvas 2D.
- Criada validação de runtime cobrindo desktop/mobile, além de verificação de exportação.

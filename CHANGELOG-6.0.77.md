# ImobStudio 6.0.77 — Hero360Tour 1.2.4

- Não descarta leituras `deviceorientation` quando algum eixo está ausente, desde que exista informação aproveitável.
- Instrumenta no próprio tour um painel opcional “?” com valores do sensor e ângulo da câmera, para diagnóstico em Android e iOS.
- Preserva o fallback por velocidade angular, WebGL/Canvas, hotspots e modo touch.
- Testado no Chromium com eventos de orientação completos, parciais, fonte alternativa e permissão negada; **sem validação com sensores físicos**.

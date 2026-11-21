# Imobify Studio 5.6.2

## Parallax 2.8.2 — controle de scroll e âncoras

- Introduz estado explícito de ownership do scroll (`owned` / `released`).
- O Parallax libera captura de wheel/touch/teclado ao chegar ao OUT, ao usar **Pular introdução** ou ao clicar em qualquer âncora cujo destino esteja fora do próprio componente.
- A liberação por âncora ocorre na fase de capture, antes do menu/roteador executar a navegação.
- Ao liberar, cancela auto-start, retorno ao IN, timers e animação cinematográfica pendentes, preservando o frame atual sem disputar a viewport.
- Âncoras internas do próprio componente permanecem sob controle do Parallax.
- O controle só é readquirido depois que a seção tiver efetivamente deixado a área ativa e o usuário retornar ao Parallax.
- Evita `preventDefault()` e scroll forçado após navegação externa.

# Imobify Studio 5.5.4

## Parallax 2.7.4 — fluidez cinematográfica

- Removida a sincronização de `window.scrollTo()` a cada frame durante transições cinematográficas; a página é sincronizada somente na chegada à chave.
- O loop de render evita `getBoundingClientRect()` durante a tomada, reduzindo layout forçado.
- Adicionado piso de `playbackRate` perceptualmente contínuo durante aceleração/desaceleração; velocidades muito baixas ficam restritas à janela terminal de chegada.
- `playbackRate` agora recebe low-pass e menos atualizações por segundo para reduzir jitter.
- `getVideoPlaybackQuality()` é usado, quando disponível, para diminuir temporariamente o teto de velocidade se houver descarte de frames.
- Otimizada a composição da camada de vídeo para reduzir repaint em fullscreen.
- Mantida a precisão de parada no frame/chave e o estado estacionado no frame inicial introduzido na 5.5.3.
- Navegação reversa continua baseada em seek por limitação do `HTMLVideoElement`, mas deixa de competir com scroll físico durante a animação.

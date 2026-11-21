# Imobify Studio 5.9.0

## Parallax 2.9.0 — Dual Playback Engine

- Um único componente Parallax com dois motores internos de reprodução.
- Engine `default`: preserva o comportamento existente em Android e desktop.
- Engine `ios`: selecionada automaticamente em iPhone/iPad, inclusive iPadOS em modo desktop.
- O motor iOS usa `video.play()` como fonte de movimento para avanço, evita micro-seeks e limita playbackRate a uma faixa estável.
- `requestVideoFrameCallback` é usado somente para leitura/sincronização no iOS, nunca para reposicionar o vídeo.
- Estados `waiting`, `stalled`, `seeking`, `seeked`, `playing` e `canplay` são observados sem iniciar transições concorrentes.
- Blur/backdrop-filter pesados são suspensos apenas durante a tomada cinematográfica no iOS e restaurados no ponto de parada.
- Correção final no iOS só acontece quando o erro ultrapassa 120 ms.
- O motor ativo é exposto em `data-playback-engine` para diagnóstico.

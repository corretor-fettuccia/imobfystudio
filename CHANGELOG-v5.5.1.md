# Imobify Studio 5.5.1

## Correção — Parallax na exportação

- O compilador agora tenta incorporar vídeos remotos usados em `parallax.videoSrc` ao ZIP final.
- URLs GitHub `.../raw/...` e `.../blob/...` são normalizadas para `raw.githubusercontent.com` antes da exportação.
- O vídeo remoto incorporado respeita o mesmo limite de 120 MB do seletor de vídeo do Studio.
- Se o host remoto impedir o download via CORS ou estiver indisponível, a exportação preserva a URL normalizada como fallback, sem quebrar o restante da página.
- Demais mídias HTTP/HTTPS continuam externas para evitar crescimento inesperado do pacote.

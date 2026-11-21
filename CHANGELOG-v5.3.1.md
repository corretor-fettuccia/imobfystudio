# Imobify Studio 5.3.1

## Parallax 2.7.1

- Corrige `videoSrc`, que estava declarado como `text` apesar de o Studio já possuir suporte nativo a mídia `video`.
- O Inspector agora permite selecionar MP4/WebM local (até 120 MB) ou informar URL/caminho.
- Trocar o vídeo reinicia `videoDuration` e restaura `endTimeAuto`, evitando reaproveitar metadados do arquivo anterior.
- Reforça detecção de duração para WebM por `durationchange`, `loadeddata` e `canplay`.
- Evita que a prévia permaneça bloqueada indefinidamente esperando `seekable` em navegadores/servidores que expõem o índice mais tarde.
- Normaliza links GitHub `raw/blob` para `raw.githubusercontent.com` e informa explicitamente o MIME de MP4/WebM ao elemento de mídia.

Compatibilidade: projetos 5.3.0 e configurações Parallax 2.7.0 continuam compatíveis.

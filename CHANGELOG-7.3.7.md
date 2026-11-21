# Imobify Studio 7.3.7 — MainFrame

- Novo plugin MainFrame: iframe de URL HTTP(S) ou HTML isolado em `srcdoc`.
- Altura independente desktop/mobile, largura, alinhamento, sombras e bordas.
- URL externa sujeita a X-Frame-Options / CSP do destino: não há como contornar bloqueio do site.
- HTML isolado usa `sandbox`, sem acesso à origem do editor; JavaScript opt-in.
- Plugin carregado via registro nativo e incluído nos processos normais de exportação.

## MainFrame 1.0.1 — tour 360
- Permissões explícitas para geolocation, gyro, accelerometer, xr-spatial-tracking, fullscreen e web-share.
- Referrer-Policy `origin` conforme documentação MeuPasseioVirtual.
- Carregamento imediato como padrão para tours 360; lazy load permanece opcional.
- Prévia permite `allow-presentation` preservando sandbox e isolamento do editor.
- Observação: tours que exigem origem não opaca podem funcionar na exportação e falhar na prévia sandbox do Studio.

## Ocultação automática do Hero (v1.2.7)

No editor principal do ImobStudio selecione **Hero360Tour** → **Comportamento do Hero** → **Ocultar texto do Hero após interação**. O slider permite de 2 a 10 segundos (padrão 5 s). O texto reaparece após 10 segundos sem navegação; com delay 9–10 s permanece oculto ao menos 2 s para evitar ocultação imperceptível.

A configuração é salva no projeto, aplicada no preview e no HTML exportado. A janela modal de cenas e hotspots continua dedicada à autoria do tour.

# Hero360Tour 1.2.5 — Calibração inteligente

O tour móvel apresenta apenas um botão: **Explorar em 360°** antes da ativação e **Desativar movimento** enquanto ativo. Sem painel de debug, sem contadores, sem botão extra de recentralização.

A câmera 360 usa a posição inicial da cena como referência, calibra as primeiras leituras automaticamente, recalibra ao mudar de cena/orientação da tela, filtra ruído e rejeita saltos isolados. Usa `deviceorientation` com Generic Sensor / `devicemotion` quando disponíveis. Navegação por toque preservada. Requer HTTPS/permissão conforme navegador.

A correção deve ser testada em aparelhos reais Android e iOS; testes automatizados não garantem sensores físicos nem políticas do navegador.

# Imobify Studio 6.0.71 — Hero360Tour Studio

Base: 6.0.70. Corrigido Hero360Tour plugin 1.1.3.

# Hero360Tour 1.1.3 — Fix de captura e renderização

- Corrigido: `Capturar visão` armazena yaw, pitch e HFOV sem ser sobrescrito pelo posterior botão `Salvar cena`.
- Valores de entrada digitados manualmente são preservados da mesma forma.
- `ImobifyPluginEditor.save()` mantém o JSON atualizado ao retornar ao Studio.
- O renderer público utiliza o HFOV específico da cena em vez de impor o valor global a cada entrada.
- Se o WebGL falhar durante a inicialização ou upload da textura, substitui o canvas e ativa renderização Canvas 2D.
- Panoramas HTTP(S) solicitam CORS para habilitar textura WebGL/Canvas, preservando a imagem estática em caso de bloqueio externo.
- Cena sem panorama apresenta estado vazio identificável.

**Limitações:** imagens remotas exigem CORS para o modo interativo; prévia geral não foi validada com arquivos privados do usuário. Projeto de teste com duas condições WebGL e serialização do modal passou no Chromium local.

## Como validar em um projeto real
1. Abra uma cena existente no Hero360Tour Studio, clique no lápis para editar, mova a câmera e escolha **Capturar visão**.
2. Mova a câmera para outro ângulo e clique **Salvar cena** — os números capturados devem permanecer inalterados.
3. No modal externo, clique **Salvar**. Abra novamente e confira yaw/pitch/HFOV.
4. Use a **Visualização geral** e o ZIP exportado: o primeiro panorama deve abrir com a orientação e zoom salvos.
5. Teste uma segunda cena e navegue por um hotspot, para conferir o ângulo do destino.

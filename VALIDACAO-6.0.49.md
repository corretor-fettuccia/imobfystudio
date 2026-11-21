# Validação — Imobify Studio 6.0.49 / Hero360Tour 1.0.6

## Problema tratado

A section ocupava a largura inteira mas o panorama apresentava espaço vazio cinza ou não aparecia: além de problemas anteriores de canvas, o Pannellum pode aplicar os limites parciais de metadados Photo Sphere XMP da imagem. Esses limites não devem ser confundidos com a largura do container.

## Modificações

1. Modo **Esfera completa** por padrão (`haov: 360`, `vaov: 180`, `vOffset: 0`, `ignoreGPanoXMP: true`), preservando opção para desligá-lo.
2. HFOV configurável de 75 a 140 graus; padrão 118 graus para campo de visão amplo.
3. Para fonte de imagem fora da proporção 2:1, opção de normalização por Canvas, sem corte, gerando imagem 2:1 antes de inserir na esfera. Aviso: esta operação pode distorcer a imagem e não cria visual de áreas nunca fotografadas.
4. **Hotspot de informação:** foco da câmera no ponto (yaw/pitch) e substituição dos textos Eyebrow, Headline e Subheadline do Hero existente, usando `text` e `info` e/ou campos `banner*` do editor. **Não abre cartão separado.**
5. **Hotspot de navegação:** `loadScene(targetSceneId)` diretamente no clique, com `targetView` quando houver; sem botão extra.
6. Observador natural continua com espera configurável de 10 segundos, respeitando `prefers-reduced-motion`.

## Testes executados

- Node.js: **45/45 testes automatizados aprovados** (todos os testes `.test.cjs`, incluindo o teste novo do Hero).
- Chromium com API Pannellum simulada: **6 larguras (320, 390, 768, 1180, 1919 e 2560 px)**, cobrindo:
  - seção e viewport com largura idêntica à tela, inclusive quando inseridas em contêiner de 960 px;
  - propriedades `haov=360`, `vaov=180`, `ignoreGPanoXMP=true`, `hfov=118` e `maxHfov=140`;
  - normalização real de imagem de 900 × 700 para formato 2:1 usando Canvas e imagem decodificada no Chromium;
  - clique no hotspot de informação: texto do Hero substituído e câmera focada;
  - clique no hotspot de navegação: cena de destino aberta diretamente, sem cartão informativo;
  - ausência de erros JavaScript no teste.
- Compilador Imobify: panorama data: incorporado ao ZIP, HTML com nova versão e opções de projeção.

## Limite de validação

**Ainda não foi possível testar o Pannellum real nesta infraestrutura**, pois os arquivos `pannellum.js` e `pannellum.css` são servidos por CDN e as chamadas HTTP a esse host foram bloqueadas. A imagem específica enviada pelo usuário foi um print, não o panorama original. Portanto o defeito específico não pode ser declarado resolvido empiricamente no panorama publicado. Testar primeiro no localhost com o JPEG / WebP equiretangular original.

## Reprodução

Abrir o Imobify 6.0.49, adicionar Hero360Tour, importar uma cena 2:1, dois hotspots (tipo `info` com `text` / `info`, e tipo `navigation` com `targetSceneId`), exportar o ZIP e verificar em navegador que o canvas cobre o fundo e que os hotspots se comportam como descrito.

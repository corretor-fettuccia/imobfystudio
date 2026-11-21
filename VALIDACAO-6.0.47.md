# Imobify Studio 6.0.47 — validação

## Modificações
- Hero360Tour v1.0.4 realmente instalado em `plugins/hero360-tour`, não apenas em pacote avulso.
- Motor de panorama inicializado após CSS Pannellum ter carregado.
- Layout Full Bleed reforçado na seção, no host do Pannellum e em seu container de renderização.
- Canvas WebGL medido pelo tamanho CSS e pela dimensão do buffer; solicita `resize()` e, se necessário, recria o viewer uma vez preservando a vista.
- `ignoreGPanoXMP` e `avoidShowingBackground` ativados para panoramas equiretangulares declarados como 360°.
- Estilo e comportamento dos hotspots e do texto dinâmico preservados.
- Regras de versão unificadas: editor, projeto, catálogo, compilador e instalador.
- Parallax360Tour v1.0.2 sincronizado entre a instalação ativa e pacote individual.

## Limites da validação
- Suíte Node.js de regressão: verificar resultados ao fim do empacotamento.
- Chromium testado com motor 360 simulado, largura de 320/390/768/1180/1919/2560 px; canvas e viewport cobriram exatamente a largura, sem overflow horizontal.
- Teste de recuperação com motor simulado que permanece travado em 1180 px: uma reconstrução corrigiu o buffer para 1919 px.
- Não houve carregamento do Pannellum real via CDN neste ambiente, nem acesso ao panorama original do screenshot. Portanto, a cena específica ainda requer validação no seu localhost. Caso o próprio arquivo de panorama contenha área cinza, nenhuma regra CSS poderá recuperar os pixels ausentes; nesse caso é preciso fornecer uma equiretangular 360° completa.

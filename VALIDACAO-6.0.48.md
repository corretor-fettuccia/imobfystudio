# Imobify Studio 6.0.48 — verificação

## Corrigido
- Regra `avoidShowingBackground` removida (exigia ângulos mínimos e máximos).
- Metadados GPanoXMP novamente respeitados.
- Remontagem WebGL automática removida.
- Poster cobrindo a seção enquanto o panorama carrega, retirado apenas no evento `load`.
- Spot SVG e troca de texto do Hero mantidos.

## Limitações
- A disponibilidade do CDN do Pannellum não pôde ser testada neste ambiente sem acesso à internet pelo Chromium.
- Precisamos validar o panorama real do usuário, inclusive se for um panorama parcial.
- O poster estático é apenas contingência visual, não um tour interativo.

## Resultados automatizados (ambiente de desenvolvimento)
- 40/40 arquivos de teste `.test.cjs` aprovados, incluindo compilação de imagens 360 embutidas e atualização de manifestos.
- Chromium com stub de Pannellum: seções Full Bleed verificadas em 390, 1180, 1919 e 2560 px.
- Fallback apresentado durante carregamento e removido apenas após o evento `load`; `viewer.resize()` acionado, sem erros de JavaScript na composição sintética.
- Esta verificação **não equivale** a renderizar a imagem original no Pannellum real e não certifica um panorama incompleto.

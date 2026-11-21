# Imobify Studio 5.2.3

## Segmento 1.1.0

- O plugin `segment-layout` passa a atuar como componente flexível (`composition.role: both`).
- Segmentos podem ser inseridos dentro das células de outros Segmentos.
- O renderer mantém a composição recursiva de linhas/colunas sem duplicar os filhos.
- A remoção de um Segmento aninhado remove toda a sua árvore lógica, evitando componentes órfãos.
- O seletor contextual da célula passa a oferecer o próprio plugin Segmento.

## Alinhamento interno

- Alinhamento vertical: Esticar, Topo, Meio e Base.
- Alinhamento horizontal: Esticar, Esquerda, Centro, Direita e Linha de base.
- Esquerda/Centro/Direita também controlam o alinhamento de texto herdável da célula.
- O CSS foi escopado por célula direta para impedir que o alinhamento do Segmento pai altere um Segmento filho.

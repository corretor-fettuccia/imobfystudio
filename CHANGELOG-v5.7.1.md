# Imobify Studio 5.7.1

## Alinhamento tipográfico por componente

- O painel **Estilo do elemento** agora permite alinhar títulos à esquerda, centro ou direita.
- O corpo textual passa a aceitar **Esquerda, Centro, Direita e Justificado**.
- Há override independente de alinhamento do corpo no mobile.
- O modo Justificado usa `text-justify: inter-word` e hifenização automática quando suportada.
- O controle é aplicado pela camada comum do renderer e, portanto, fica disponível para componentes com texto sem exigir uma implementação diferente em cada plugin.

## Lifestyle 1.1.0

- A narrativa do Lifestyle possui controle direto de alinhamento.
- Novas instâncias usam **Justificado** como padrão da narrativa.
- Eyebrow, título e frase de impacto permanecem independentes da narrativa.

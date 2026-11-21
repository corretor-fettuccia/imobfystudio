# Imobify Studio 5.0.1.9

- Preview do editor preserva a posição vertical durante alterações e centraliza a seção ao selecioná-la.
- Reordenação de seções usa zonas antes/depois e entende blocos lógicos de layout, inclusive layouts aninhados.
- Ao mover uma seção para dentro/fora de `Section Layout Pro`, `itemCount` é ajustado automaticamente; layout vazio passa a ser válido.
- Controle de ocultação de seção ficou explícito no Inspector e na lista, mantendo a seção visível no editor e removendo-a da publicação.
- Toda seção, core ou Plugin Play, recebe o campo global **Âncora da seção** e pode ser destino de links `#id`.
- Corrige o template do Section Layout Pro para evitar condicionais aninhadas incompatíveis com o parser leve.
- Refino visual do editor: hierarquia de layouts, indicadores de drop, estados ocultos e correção de CSS do grid de presets.
- Remove definição duplicada de `behaviorPlugins` no estado padrão.

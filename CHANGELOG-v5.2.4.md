# Imobify Studio 5.2.4

## Herança e personalização local

- Revisada a camada de estilo local aplicada a todos os componentes/seções compatíveis.
- Overrides locais agora usam um escopo CSS autoritativo e conseguem vencer regras internas de plugins com alta especificidade e `!important` quando a personalização estiver ativada.
- Cores locais de título, corpo, eyebrow, tipografia e efeitos continuam isoladas ao elemento selecionado.
- Tokens locais de `--heading-color`, `--body-color`, `--muted-color`, `--primary`, `--accent` e contrastes derivados passam a ser propagados para plugins que consomem diretamente o Design System.

## Botões e CTAs

- Adicionado grupo **Botões e ações** no estilo do elemento.
- Fundo do CTA: automático, herdar Button Kit global, primária, destaque ou cor personalizada.
- Texto do CTA: contraste automático, herdar, títulos, texto ou cor personalizada.
- No modo automático, ao personalizar a primária local o CTA passa a acompanhar essa cor.
- Corrigido o caso em que o botão continuava usando `--action-button-fill` global mesmo após a personalização local.

## Painel recolhível

- O painel **Estilo do elemento** não mostra os controles enquanto a personalização estiver desativada.
- Ao ativar a personalização, o painel abre automaticamente.
- Com a personalização ativa, o painel pode ser recolhido ou expandido manualmente.
- O estado de expansão é salvo junto ao estilo do elemento.

# Imobify Studio 5.0.1.26

## Compositor nativo de Segmentos

- Novo bloco estrutural **Segmento** com orientação em colunas ou linhas.
- Quantidade configurável de 1 a 5 divisões por segmento.
- Slots explícitos e visíveis na prévia do editor.
- Uma mesma célula pode receber múltiplos componentes.
- Inserção contextual de plugins diretamente na célula escolhida.
- Reposicionamento de itens entre células sem alterar as propriedades do plugin.
- Segmentos podem ser duplicados, movidos, ocultados e removidos como qualquer seção.

## Compatibilidade de plugins

- Projetos existentes continuam usando o mesmo array plano `sections`.
- Plugins antigos não precisam ser migrados nem reempacotados.
- Novo metadado opcional `composition.role`: `section`, `item` ou `both`.
- Plugins de seção inteira permanecem no fluxo principal.
- Plugins de item/flexíveis aparecem no seletor de células.
- `Section Layout Pro` e `Floating Container Pro` mantêm o contrato legado `next-sections`.

## Publicação

- A prévia, o HTML compilado e os pacotes em lote preservam a composição dos slots.
- CSS e JavaScript de cada plugin filho continuam carregados uma única vez.
- Visibilidade mobile/desktop, âncoras, transições e identidade de instância continuam independentes por componente.

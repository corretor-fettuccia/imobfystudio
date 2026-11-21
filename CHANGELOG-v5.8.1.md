# Imobify Studio 5.8.1

- Novo modo **Balanceado · recomendado** para composição de linhas.
- Remove a recomendação de justificação para texto editorial; o modo balanceado preserva espaçamento natural entre palavras.
- `text-wrap: balance` em títulos/chamadas e `text-wrap: pretty` em corpos longos.
- Hifenização automática desativada nos modos Editorial/Balanceado.
- Microajuste de tracking fixo e discreto, sem loops de medição/ResizeObserver.
- Lifestyle passa a usar alinhamento à esquerda + composição balanceada por padrão.
- Compatibilidade: projetos antigos com `lineFit=optical` são tratados visualmente como balanceados.

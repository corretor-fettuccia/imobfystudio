# Imobify Studio 5.0.1.28

Esta versão converte três plugins de cards com grade interna para o modelo single do compositor nativo.

## Plugins atualizados

- AR Card Popout 3D Single v1.2.0;
- Flip Card 3D Single v4.4.0;
- Flip Card 3D Video Single v1.1.0.

Cada instância renderiza um único card. Para montar conjuntos, adicione as instâncias às células de um Segmento com 1 a 5 colunas ou linhas.

## Compatibilidade

Projetos salvos com `card2*`, `card3*` ou `card4*` são migrados automaticamente. Cada card habilitado se torna uma instância independente; quando a grade era uma seção de nível superior, o Studio cria um Segmento nativo e conserva o espaçamento configurado. Dentro de um Segmento existente, as instâncias são distribuídas entre as células disponíveis.

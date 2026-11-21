# Relatório de validação — Imobify Studio 6.0.41

Data: 17/10/2026

## Baseline e verificações

- Base: ZIP oficial 6.0.40; mantido inalterado.
- `node --test tests/*.test.cjs`: **38 testes aprovados / 0 reprovados**. Inclui um novo teste do Destaques, compilação ZIP, preservação de projetos, Wizard e regressões existentes.
- **49 arquivos plugin.json** existentes foram interpretados como JSON válido. Destes, **48 IDs** integram o registro ativo; o pacote histórico do Flip Card permanece como legado.
- **73 arquivos `.js`** passaram por `node --check` sem erro de sintaxe.
- Exportação de landing page com duas variações de Destaques, Ficha do Imóvel e FAQ concluída; fontes/tokens do Wizard e CSS de estados presentes no ZIP gerado.
- Chromium isolado: verificação de 320, 390, 768, 1024 e 1360 px; **sem overflow horizontal** em cada tamanho; Destaques com 1/2/3/4 colunas conforme a configuração e breakpoint; 1 âncora canônica `#destaques`; foco do CTA com outline visível de 3 px; Headline H2 28,12 px nos tamanhos mobile quando Wizard configurado para 38 px.
- Escaping de HTML em itens, proibição de `javascript:` no CTA, descrição com `|` e fidelidade das propriedades editor/exportação verificados.

## Limitações da validação

O Chromium no ambiente bloqueia a navegação direta por URLs `file://` e localhost. O HTML exportado foi injetado isoladamente com seu CSS (sem dependências remotas) para medir layout e foco por teclado. Essa validação não comprova comportamento de scripts externos, carregamento real de mídias, preview no iframe do editor, compatibilidade Safari/iOS ou resultados Lighthouse.

## Checklist recomendado antes de publicar uma landing

1. Abrir o Studio 6.0.41 em um servidor local e importar um projeto criado na 6.0.40.
2. Abrir o plugin Destaques e alternar Editorial, Cartões, Compacto; 2/3/4 colunas; e marcadores numéricos, pontuais e nenhum.
3. Verificar o Wizard de tipografia ativo/desativado e as exceções locais.
4. Comparar preview do editor com o HTML exportado em desktop, tablet, mobile e com zoom de 200%.
5. Testar CTA por teclado e toque e conferir contraste com as cores reais do projeto.
6. Exercitar mídias dinâmicas, upload, Parallax, players, galerias, pop-ups e formulários com URLs de produção e conexões lentas.
7. Rodar Lighthouse/PageSpeed na hospedagem final.

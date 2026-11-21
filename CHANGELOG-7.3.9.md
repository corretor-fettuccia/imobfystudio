# Imobify Studio 7.3.9 — Otimizador de Nota SEO

**Base:** Imobify Studio 7.3.8 (SEO e ícones). Nenhuma funcionalidade anterior removida.

## Adicionado
- `assets/js/seo-optimizer.js` 1.0.0 e `assets/css/seo-optimizer.css`, carregados em `index.html`.
- Painel **Otimizador de nota** no topo da aba SEO: lista o que tira ponto, com a meta exata (ex.: "Tem 67 caracteres: corte 7").
- Destaque âmbar nos campos pendentes, com dica embaixo de cada um.
- Clique em uma pendência para ir ao campo (inclusive o CRECI na aba Projeto).
- **Aplicar sugestão** para título e descrição: só reorganiza o texto existente, sem inventar dados; passa pelo fluxo normal de edição (evento `input`).
- Pendências em azul: não mudam a % de SEO, mas sobem a nota de Qualidade do resultado (teto ≈ 9,2 na fórmula 7.3.x).

## Alterado
- Versão do Studio, dos projetos salvos e do compilador: 7.3.8 → 7.3.9.

## Não alterado
- Fórmula da nota SEO/Readiness, compilação e exportação.
- Projetos 7.3.8 abrem normalmente e passam a ser salvos como 7.3.9.

## Validação
- Chromium: projeto Las Palmas v1 → 80% / 8,9 com 3 pendências destacadas; sugestões aplicadas sem perda de dados (preço "R$ 189.990" preservado); Las Palmas v2 → 100% / 9,2, painel sem pendências e sem erros de console.

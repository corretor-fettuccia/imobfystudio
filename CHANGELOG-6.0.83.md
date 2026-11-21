# ImobStudio 6.0.83 — Benefits Showcase: tipografia e margens do projeto

**Data:** 22/10/2026  
**Base:** ImobStudio 6.0.82  
**Componente:** Benefits Showcase 1.2.1

## Ajustes implementados

- Cabeçalho (eyebrow, título e descrição) começa na mesma margem horizontal da grade e das demais seções, herdando a largura da classe global `.site-container` e do token `--container`.
- Largura de leitura do cabeçalho recebe `--text-measure` do projeto; o componente não força mais `780px` e centralização mesmo quando `align:left`.
- Centralização é aplicada somente se o usuário selecionar `align:center` no inspetor; não altera as margens laterais do projeto.
- Espaçamento vertical passa a seguir `--section-space`, margem até benefícios segue `--content-gap`, distância entre os textos segue `--element-gap` e padding interno dos cards segue `--component-padding`.
- Sem Wizard, `h2`, `h3`, corpo de card e descrição usam as variáveis tipográficas do core, inclusive `--h2-max`, `--h3-max`, `--body-size`, `--heading`, `--body`, peso, tracking e line-height.
- Com Wizard de Tipografia global ativado, regras sem `!important` permitem ao bridge do core definir os papéis: eyebrow, headline, subheadline e body. Configurações locais da seção continuam prevalecendo quando escolhidas no inspetor.
- Correção no efeito de imagem sticky da 6.0.82: compensação do deslocamento inicial do backdrop para preservar também o `padding-top` do projeto quando há fotografia de fundo.
- Sobre foto, cores de alto contraste usam os tokens inversos do próprio projeto (`--inverse-heading-color` e `--inverse-body-color`), sem substituir fontes e tamanhos do Wizard.
- Não houve mudanças em itens, filtros, ícones, persistência do JSON ou movimentos dos cards.

## Principais arquivos

- `plugins/benefits-showcase/plugin.css` — integração dos tokens, layout do header e compensação sticky.
- `plugins/benefits-showcase/plugin.json` — v1.2.1.
- `assets/js/{app,catalog,compiler}.js`, `index.html`, `project.json` — identificação v6.0.83.
- `tests/benefits-core-typography-6083.test.cjs` — regressão de tokens, integração com Wizard e exportação.
- `docs/IMOBSTUDIO-GUIA-IA-LANDING-PAGES.md` — diretrizes para geração/importação de LPs.

## Validação

- Suíte geral: **59/59 testes de regressão aprovados**; smoke-test de compilação dos plugins concluído.
- Chromium: sem overflow em desktop 1440 × 900 e mobile 390 × 844; cabeçalho e cards com a mesma margem horizontal do `.site-container`; cabeçalho e padding superior coincidem mesmo com imagem fixa; fontes do Wizard presentes nos elementos corretos.
- Fotografia fixa: pinning no topo verificado durante o scroll em desktop e mobile simulados.
- A suíte ainda emite os avisos preexistentes de arquivos `images/layers*.png`/`marker-icon.png` ausentes ao tentar empacotar CSS de mapas; a compilação final não foi bloqueada. Não foi alterada a dependência desses recursos nesta revisão.

**Dispositivos físicos:** validar em Safari iOS e Chrome Android antes da publicação.

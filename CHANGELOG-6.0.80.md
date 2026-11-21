# Imobify Studio 6.0.80 — Smart Plant & motor de estilos

Data: 22/10/2026  |  Base: ImobStudio 6.0.79  |  Smart Plant: 1.4.4

## Objetivo

Corrigir a divergência entre o Smart Plant e o Design System centralizado do editor. A herança do projeto agora é o comportamento padrão, com personalizações locais explícitas disponíveis quando habilitadas pelo operador.

## Alterações

1. **Tipografia centralizada:** título, subtítulo, cards, descrição, indicadores e CTAs passaram a consumir tokens do core e as cinco funções do Wizard (eyebrow, headline, subheadline, body, CTA). O Smart Plant não define uma segunda fonte como padrão.
2. **Correção no core:** seletor global de headline não confunde o `h3` com a classe técnica `.imobify-design-title` injetada pelo runtime. Evita que o título de card seja renderizado na dimensão de H1 (bug reproduzido no navegador).
3. **Cores e superfícies:** background, cores de títulos/corpo, botões, raio de borda e painéis herdados do projeto. A opção `Tema local` mantém a personalização intencional da seção, com cálculo de contraste para botão local.
4. **Espaçamento:** alinhamento aos tokens globais `--section-space`, `--content-gap`, `--element-gap` e `--component-padding` para eliminar respiro duplicado.
5. **Modal de detalhamento:** ao sair do DOM da seção e entrar no portal global, o modal carrega `data-section-id`, estado de tipografia, modo de tema e variáveis CSS resolvidas na origem. A fonte e a paleta do projeto (inclusive overrides locais) continuam consistentes.
6. **Studio/preview:** renderização interna do componente agora recebe tokens do projeto ativo em vez de uma paleta rígida; preserva preview com personalização de seção.
7. **Compatibilidade:** preservados dados `plants`, magnifier, CTA WhatsApp/Form Sender e estrutura das páginas existentes; defaults antigos não reconfigurados à força.

## Arquivos principais

- `plugins/smart-plant-v1.4.2/{plugin.css,plugin.js,plugin.json,template.html}` (caminho histórico preservado, versão manifest 1.4.4)
- `assets/js/typography-system.js` (correção no classificador de papel)
- `assets/js/app.js` (preview interno)
- `assets/js/{catalog,compiler}.js`, `index.html`, `project.json` (versionamento)
- `tests/smart-plant-core-style.test.cjs` e testes de regressão atualizados
- `plugin-packs/smart-plant-v1.4.4.zip` (pacote individual)

## Limitações conhecidas

- Validação em dispositivos móveis físicos e em publicações reais permanece recomendada.
- A compilação isolada dos plugins ainda informa três referências a sprites padrão ausentes do Leaflet (`images/layers.png`, `layers-2x.png`, `marker-icon.png`); não são regressões do Smart Plant.

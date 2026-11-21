# CHANGELOG — Imobify Studio

## 6.0.39 — 16/10/2026

**Escopo:** primeiro incremento autorizado sobre o pacote 6.0.38. Correções pontuais de estabilidade, identificação de versão, acessibilidade da página exportada, integração de mídia e confiabilidade dos testes. O formato dos projetos, os IDs e os manifestos de plugins ativos permanecem compatíveis; nenhuma reestruturação significativa do editor, SDK ou Plugin Play foi realizada.

### Alterações funcionais e de exportação

- `index.html`: apresenta corretamente a versão **Studio 6.0.39**; permite zoom pelo navegador e pinch zoom no editor.
- `assets/js/renderer.js`: publica `viewport` sem `user-scalable=no`, `minimum-scale=1.0` ou `maximum-scale=1.0`, permitindo ampliação nativa da landing page.
- `core/runtime.js`: elimina interceptação **global** de `gesturestart`, `gesturechange`, `gestureend`, `touchmove` com múltiplos dedos e `dblclick` no documento; plugins continuam responsáveis pela sua navegação interativa específica.
- `assets/js/compiler.js`: passa a identificar URLs de recursos com `?v=...` pelo caminho físico do ZIP, sem baixar novamente `assets/js/site.js?v=...` quando `assets/js/site.js` já está incluído. Mantém a query no HTML publicado.
- `assets/js/compiler.js`: padroniza a versão de relatórios de readiness, README, pacotes em lote e `content/project.json` exportado para **6.0.39**, trabalhando sobre uma **cópia** do estado para não alterar o projeto de entrada.
- `project.json`, `assets/js/catalog.js`, `assets/js/app.js`: alinham a versão do formato de projeto, os novos projetos, a normalização de projetos carregados e o estado administrativo à versão 6.0.39. A importação de configurações antigas mantém os campos e plugins, sem migração destrutiva.
- `assets/js/app.js`: remove número obsoleto na legenda “Estilo do elemento” e corrige a identificação exibida do Parallax ativo (2.10.3).
- `plugins/payment-investment-glass-pro-v1.0.0/css/glassButton.css`: substitui `transition: all` por propriedades animadas explícitas; adiciona tratamento de `prefers-reduced-motion` ao botão Glass.

### Testes e engenharia de qualidade

- Ajustados testes existentes de Parallax, Tour 360, Smart Plant, Plugin Play e de zoom conforme o código efetivamente distribuído e os contratos atuais. Os testes não foram apagados para ocultar falhas: as expectativas obsoletas foram substituídas por verificações dos comportamentos hoje implementados, com os pacotes históricos ainda sujeitos à análise do parser.
- Novo `tests/release-6.0.39.test.cjs`: valida identificação da versão no projeto/relatório/README, geração do ZIP, pacote de imagem Data URL, URL com cache-busting, zoom permitido e imutabilidade do projeto de entrada.
- Novo `scripts/smoke-all-plugins.cjs`: compilação individual isolada dos **48 IDs ativos**; 47 com resultado renderizável e 1 plugin documental (`tag-installer-pro`, sem seção visual por contrato).
- Novo `scripts/verify-release.sh`: comando reproduzível de análise de sintaxe, regressão e compilação individual em Node.js, sem instalar dependências npm.

### Resultados executados (16/10/2026)

- **31 testes `.test.cjs` aprovados** após alinhamento e novas verificações (baseline 6.0.38: 18 aprovados e 12 falharam).
- **48/48 IDs testados em compilação isolada** — 47 verificações de marcação e 1 documento de tags (sem seção por projeto).
- Análise de sintaxe JavaScript, integridade JSON e arquivo ZIP repetidas antes da entrega (detalhes em `VALIDACAO-6.0.39.md`).

### Limitações e pendências

- A compilação isolada com Node/VM **não equivale** à execução no navegador. A validação manual em Chromium/Safari/Firefox, a comparação visual editor × preview × exportação, as interações reais de toque e as métricas LCP/INP/CLS ainda dependem de teste em ambiente de navegador autorizado.
- **Implantação Tiles Pro:** o CSS Leaflet original faz referência aos ícones `images/layers.png`, `images/layers-2x.png` e `images/marker-icon.png`, ausentes do pacote fonte 6.0.38. O smoke test mostra três avisos de incorporação local; mais dois avisos envolvem tentativa de baixar vídeo externo do Parallax por um mock de rede que não permite HTTP remoto; não foi alterada a biblioteca do plugin para evitar quebra sem validação visual. Devem ser supridos/testados numa próxima revisão do plugin.
- Bibliotecas/fontes de terceiros continuam podendo depender de CDN; mídias remotas podem depender de CORS. Não foi feita promessa de funcionamento integral offline de toda landing page.
- Os arquivos ZIP históricos em `plugin-packs/` foram preservados para reversão. A versão do arquivo ZIP de um plugin legado não representa necessariamente a versão de seu manifesto ativo em `plugins/registry.json`.
- Não foram implementados nesta versão: redesign completo dos painéis, novo contrato SDK compartilhado, atualização visual de todos os plugins e instrumentação de Web Vitals.

### Reversão

A reversão integral é feita usando o arquivo de referência original `imobify-studio-6.0.38(2).zip` (SHA-256 `92f7a7d7ead3fd2071a5587ae9a3e0b35fdcabee6a56594e45e9267b85c650e2`). Não é necessário alterar banco de dados nem converter projetos para voltar à distribuição anterior; aconselha-se guardar uma cópia dos projetos antes de atualizar qualquer sistema.

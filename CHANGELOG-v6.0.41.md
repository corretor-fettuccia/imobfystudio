# CHANGELOG — Imobify Studio

## 6.0.41 — 17/10/2026 — Lapidação técnica e visual dos plugins

**Base oficial:** 6.0.40. A distribuição original permanece intacta. Evolução incremental, sem troca de framework ou alterações destrutivas no formato dos projetos.

### Mudanças de produto
- **Destaques 1.1.0:** suporte aos estilos Editorial (divisórias), Cartões e Compacto; 2/3/4 colunas desktop (responsivas); número, ponto ou nenhum marcador; alinhamento; Subheadline opcional; CTA opcional com destino validado; inspeção melhor organizada por conteúdo, itens, estilo e ação.
- Compatibilidade com o formato legado `Título|descrição`, inclusive descrições contendo `|`; textos escapados corretamente; limites defensivos de itens e valores de configuração; somente a primeira seção Destaques visível utiliza a âncora histórica `#destaques`.
- **Acabamento transversal do design system (48 plugins registrados):** regras compartilhadas não invasivas para foco visível via teclado, estados desabilitados, quebras de texto, limites de mídia/inputs e largura em dispositivos móveis. Plugins que já implementam comportamento visual próprio continuam com seus contratos e controles específicos.
- **Lapidação de 9 plugins adicionais:** Hero, Ficha do Imóvel, Galeria, Lifestyle, Condições de Pagamento, Depoimentos, FAQ, Formulário de contato e Rodapé. Ajustes de foco, contraste de mensagens secundárias e informações legais, proporções, responsividade e tratamento de conteúdo variável.
- **Galeria:** duração do hover reduzida de 600 para 240 ms; interação por toque não depende de hover e `prefers-reduced-motion` permanece respeitado.
- **Wizard:** os cinco papéis da 6.0.40 permanecem intactos; o Destaques agora permite configurar elementos opcionais compatíveis com Headline, Subheadline, Body Text e CTA. Continua disponível o modo “Preservar estilo próprio” por seção.

### Versionamento dos manifestos modificados
- Destaques 1.1.0
- Hero, Ficha, Galeria, Condições, Depoimentos, FAQ, Formulário: 1.0.1
- Lifestyle 1.2.2; Rodapé 1.1.2
- Versão do editor e exportação: 6.0.41.

### Arquivos modificados
- `assets/js/catalog.js` — novo contrato e renderizador do Destaques; versões de catálogo.
- `core/design-system.css` — camada transversal de estados, acessibilidade e responsividade.
- `plugins/{highlights,hero,specs,gallery,lifestyle,payment,testimonials,faq,lead-form,footer}/plugin.css` e respectivos `plugin.json` — acabamento com versões dos plugins.
- `assets/js/app.js`, `assets/js/compiler.js`, `index.html`, `project.json` — versão 6.0.41.
- `tests/plugin-play.test.cjs`, `tests/release-6.0.41.test.cjs`, `tests/text-alignment-standard.test.cjs`, `tests/text-optical-fit.test.cjs` — expectativas compatíveis com a distribuição.

### Adições
- `tests/highlights-polish.test.cjs`: compatibilidade retroativa, validação de dados, escaping, links, âncoras, variações e compilação.
- `AUDITORIA-FINAL-PLUGINS-6.0.41.csv`, `VALIDACAO-6.0.41.md`.

### Limitações
- A inspeção renderizada executada utilizou o HTML **já compilado**, carregado como conteúdo isolado em Chromium. O ambiente bloqueia a navegação direta `file://`/`localhost`; portanto, não equivale à navegação completa pelo editor em produção.
- O tratamento **não foi** uma reescrita ou certificação visual individual de todos os 48 plugins. Recursos complexos (Parallax, players, modais, sliders, mapas e scripts de terceiros) ainda exigem teste integrado em dispositivos físicos e ambientes reais.
- Mantidas pendências herdadas de mídias remotas de demonstração e recursos do Leaflet que não puderam ser conferidos em rede.

---

# CHANGELOG — Imobify Studio

## 6.0.40 — 16/10/2026 — Wizard de Tipografia e Estilo

**Base:** Imobify Studio 6.0.39 (sem alterações no original).

### Adições
- Novo **Wizard de Tipografia e Estilo**, acessível na aba Design, em três etapas: direção visual / cinco papéis / revisão.
- Cinco papéis semânticos: Eyebrow, Headline, Subheadline, Body Text e CTA, cada qual com família, tamanho desktop e mobile, peso, entrelinha, tracking, caixa e cor herdada/personalizada.
- Presets: Institucional, Editorial Premium, Impacto/Conversão, Minimalista, Humano/Residencial.
- Escolha de cor primária, cor de destaque, fundo/texto do CTA e acabamento de botão (Button Kit existente). Aviso de contraste 4,5:1 para o par de cores do CTA.
- Prévia desktop/mobile no Wizard, navegação por etapas, cancelamento sem efeitos e aplicação explícita com histórico de desfazer/refazer do editor.
- Tokens CSS globais gerados pelo mesmo Renderer usado no preview e na exportação; a interface do Wizard não é incluída na landing publicada.
- Opção em cada seção: **Seguir Wizard global** / **Preservar estilo próprio**, permitindo exceções por plugin.
- CSS por papéis com escala H2 de 74% em relação à Headline (mantendo a hierarquia), CSS responsivo e respeito a `prefers-reduced-motion`.
- Auditoria de todos os 48 plugins registrados: `AUDITORIA-TIPOGRAFIA-PLUGINS.csv`.

### Compatibilidade
- Projetos anteriores preservam exatamente a tipografia antiga enquanto `brand.typographyWizardEnabled` não estiver ativo. O Wizard somente ativa o sistema ao concluir a etapa de confirmação.
- As propriedades anteriores de marca, estilos de seção, configurações dos plugins e lógica de exportação são mantidas. O escopo de aplicação é limitado ao CSS do componente, sem modificar sua estrutura ou funcionamento.
- Tipografias avançadas já configuradas em certos plugins (especialmente Parallax, Hero Plus, Slider, Modal e Menu) podem necessitar do modo **Preservar estilo próprio** no inspetor para conservar o visual original após aplicar o Wizard.

### Arquivos novos
- `assets/js/typography-system.js`: contrato de papéis, presets, validação, tokens e ponte CSS.
- `assets/js/typography-wizard.js`: interface interativa do assistente.
- `assets/css/typography-wizard.css`: estilo isolado do editor, sem dependências de biblioteca.
- `tests/typography-wizard.test.cjs`, `tests/typography-css-cascade.test.cjs`: regressões, exportação e compatibilidade.
- `AUDITORIA-TIPOGRAFIA-PLUGINS.csv`, `VALIDACAO-6.0.40.md`.

### Arquivos alterados
- `index.html` (lançador, estilos, scripts, identificação da versão).
- `assets/js/app.js` (integração, persistência, suporte de exceção por seção, versão).
- `assets/js/renderer.js` (mesmos tokens de estilo para edição e compilação, carregamento de fontes usadas nos papéis, modo de exceção).
- `assets/js/catalog.js`, `assets/js/compiler.js`, `project.json` (versão 6.0.40).
- `README.md` (como usar), `tests/plugin-play.test.cjs` e teste de release renomeado para 6.0.40 (expectativas de versão).

### Limitações observadas
- O editor completo por HTTP localhost não pôde ser navegado no navegador de teste devido a bloqueio administrativo do ambiente. O Wizard foi exercitado isoladamente no Chromium com prévia e aplicação desktop/mobile e sem erros de JavaScript. Fazer validação manual no editor real antes de uso em produção.
- A camada compartilhada cobre os cinco papéis por semântica CSS. Plugins com markup gerado dinamicamente ou especificidades de desenho exigem inspeção visual manual; esta entrega não representa reescrita integral de cada plugin. Componentes não textuais preservam seu comportamento.
- Fontes remotas do Google Fonts dependem de conectividade; são usados fallbacks do sistema.
- Pendência herdada: ícones de Leaflet ausentes, já registrada na 6.0.39, não alterada nesta versão.

# IMOBSTUDIO — Manual de referência para criação de landing pages com IA

**Versão do guia:** 2.1 · **Base técnica examinada:** Imobify Studio 6.0.69 · **Data:** 20/10/2026
**Finalidade:** servir como instrução reutilizável para transformar um briefing comercial imobiliário em uma landing page persuasiva e em um **arquivo JSON de projeto importável no ImobStudio**, permitindo a lapidação final dentro do editor.

> **Regra principal:** O resultado não é somente um roteiro, uma página HTML ou um JSON ilustrativo. A entrega esperada é um **projeto JSON compatível com a versão do ImobStudio disponibilizada**, com seções reais, propriedades aceitas pelos plugins instalados, conteúdo comercial preenchido e ajustes finais editáveis. Se não houver pacote do Studio nem um JSON real de referência, produzir briefing estruturado e solicitar o artefato de referência antes de afirmar compatibilidade de importação.

---

## 1. Instrução de ativação da tarefa

Quando o usuário pedir **“Crie uma landing page sobre [empreendimento/imóvel/produto]”**, agir como estrategista comercial imobiliário, copywriter, diretor de arte, especialista em SEO técnico e montador de projetos do ImobStudio. Entregar os arquivos necessários para abrir e refinar a página no editor.

**Fluxo de trabalho:** entender o produto → conferir fatos e materiais → definir persona e conversão → escolher estratégia/preset → planejar narrativa e seções → montar o JSON nativo → validar → entregar projeto + resumo de pendências. Não interromper por perguntas dispensáveis; adotar padrões adequados e explicitar lacunas importantes.

### Comando recomendado

> Use o arquivo `IMOBSTUDIO-GUIA-IA-LANDING-PAGES.md` como referência obrigatória. Crie uma landing page sobre **[NOME DO EMPREENDIMENTO]**, para **[PÚBLICO]**, com foco em **[OBJETIVO]**. Pesquise e organize as informações comerciais fornecidas, crie uma narrativa orientada à conversão e gere um **JSON nativo compatível com a versão do ImobStudio anexada**, pronto para importar e lapidar no editor. Indique dados não confirmados; não invente informações comerciais, URLs, imagens ou configurações de plugins.

## 2. Identidade comercial e posicionamento

- **Profissional de referência:** Roberto Fettuccia.
- **Atuação:** corretagem imobiliária consultiva, Canoas, Nova Santa Rita, Porto Alegre e demais mercados atendidos no Rio Grande do Sul.
- **Registro:** CRECI 83599F.
- **Especialidade:** Terreno + Construção, estruturação de aquisições, financiamento imobiliário, imóveis residenciais, lançamentos, condomínios e oportunidades de investimento.
- **Posicionamento central:** “Não vendo imóveis, estruturo decisões.”
- **Forma de comunicação:** madura, direta, confiante, consultiva, esclarecedora e comercialmente convincente, sem exageros. Demonstrar vantagens concretas e sua relação com a vida ou o patrimônio do comprador.
- **Contatos e integrações:** nunca supor WhatsApp, telefone, e-mail, endpoint do formulário ou URL de domínio. Exigir os dados atuais do projeto ou conservar os válidos em um JSON existente. O domínio `newedition.com.br` pode servir como referência de posicionamento, não como URL canônica automática de qualquer empreendimento.

### Princípios de persuasão

1. Comunicar **o resultado para o cliente**, não apenas listar características.
2. Abrir com uma proposição de valor específica: *onde, para quem, por que importa*.
3. Traduzir especificações em benefícios verificáveis. Ex.: espaço coworking → possibilidade de trabalhar próximo de casa.
4. Reduzir objeções relevantes: documentação, prazo, localização, mobilidade, pagamento e disponibilidade, quando houver dados.
5. Fazer CTAs naturais, ligados à próxima etapa real: “Conhecer plantas”, “Consultar disponibilidade”, “Simular condições”, “Agendar visita”.
6. Não tratar promoções ou tabelas antigas como vigentes sem confirmação.
7. Evitar clichês (“oportunidade imperdível”, “luxo sem igual”) e promessas (“valorização garantida”, “aprovação certa”).

## 3. Briefing comercial obrigatório por empreendimento

Manter o seguinte cadastro antes de compor a página. Usar `não informado` para lacunas; nunca inventar.

```yaml
produto:
  nome: ""
  incorporadora_ou_responsavel: ""
  tipologia: "apartamento | casa | terreno | loteamento | condominio | terreno+construcao | outro"
  finalidade: "moradia | investimento | segunda moradia | misto"
  publico_prioritario: ""
  persona_dores: []
  persona_desejos: []
  diferencial_principal: ""
  diferenciais_secundarios: []
localizacao:
  cidade: ""
  bairro: ""
  endereco_verificado: ""
  referencias_verificadas: []
  deslocamentos_com_fonte: []
produto_tecnico:
  area_minima_m2: null
  area_maxima_m2: null
  dormitorios: ""
  suites: ""
  vagas: ""
  quantidade_unidades_ou_lotes: null
  infraestrutura_e_lazer: []
  fase: ""
  prazo_entrega: ""
comercial:
  preco_a_partir_de_brl: null
  preco_referencia_brl: null
  faixa_de_preco_brl: []
  parcelamento: ""
  modalidades_financiamento: []
  condicoes_promocionais: []
  vigencia_condicoes: ""
  estoque_e_disponibilidade: ""
  taxas_e_custos: ""
conversao:
  objetivo: "lead | visita | simulacao | receber_material | proposta"
  cta_principal: ""
  cta_secundario: ""
  canal_de_contato: ""
  endpoint_formulario: ""
  telefone_whatsapp: ""
midia:
  logo: ""
  capa_hero: ""
  fotos_oficiais: []
  videos: []
  tours_360: []
  planta_humanizada: []
  autorizacao_de_uso_confirmada: false
publicacao:
  dominio_canonico: ""
  url_social_share: ""
  imagem_og: ""
  autor: "Roberto Fettuccia"
  creci: "83599F"
fontes:
  material_oficial: []
  documentos_comerciais: []
  data_verificacao: ""
  pendencias: []
```

## 4. Classificação comercial / escolha de narrativa

| Produto e motivação | Ângulo de venda | Estratégia sugerida | Seções importantes |
|---|---|---|---|
| Primeiro imóvel / MCMV | Viabilidade real e conquista do imóvel | PAS ou AIDA | Hero, benefícios, unidades, condições, objeções, formulário |
| Condomínio vertical | Rotina, conveniência, planta e áreas compartilhadas | AIDA | Hero, destaques, plantas, galeria, lazer, localização, condições |
| Loteamento / bairro planejado | Liberdade de projeto, localização, infraestrutura e futuro | AIDA / consultiva | Hero, masterplan, infraestrutura, localização, etapas, condições |
| Terreno + Construção | Personalização, estruturação e custos com premissas claras | PAS / consultiva | Dor da casa pronta, solução, processo, viabilidade, captação |
| Alto padrão | Exclusividade funcional e diferenciais materiais | Storytelling / consultiva | Hero editorial, detalhes, vídeo, planta, experiências, contato |
| Investimento | Hipótese de tese patrimonial, riscos e dados verificáveis | Argumentação consultiva | Contexto, produto, números documentados, riscos, ação |
| Condomínio náutico | Conveniência na guarda/operação e liberdade de navegação | Storytelling / PAS | Hero, rotina, marina, acessos, lotes, infraestrutura, CTA |

**Referência técnica da instalação 6.0.69:** a pasta `presets/` inclui `empreendimento-vertical`, `empreendimento-horizontal`, `loteamento`, `casa-individual`, `sobrado-individual`, `investimento`, perfis `alto-padrao-*`, `investidor-*` e `mcmv-*`. Preferir presets reais do pacote, não inventar IDs.

## 5. Estrutura narrativa da landing page

A estrutura é modular: incluir somente seções pertinentes e suportadas pelo pacote instalado. Evitar uma página longa sem propósito. Sugestão-base:

1. **Hero**: eyebrow com categoria/local, H1 propositivo, descrição curta, CTA, imagem/vídeo oficial e eventualmente métrica principal validada.
2. **Proposta de valor**: o que diferencia o produto e como resolve a necessidade do visitante.
3. **Destaques**: 3–6 argumentos organizados por benefício, sem repetição do hero.
4. **Experiência e estilo de vida**: narrar usos reais dos espaços, com imagens pertinentes.
5. **Produto e especificações**: lotes, áreas, dormitórios, vagas, plantas e opções; números exatos.
6. **Galeria / vídeo / tour 360**: se existirem arquivos válidos e o módulo for apropriado.
7. **Localização**: contexto regional, facilidades e acessos apenas verificáveis.
8. **Condições comerciais**: preço, entrada, parcelamento e financiamento, com ressalvas sobre disponibilidade e vigência.
9. **FAQ**: dúvidas concretas sobre operação, compra, documentação, obra, entrega e condições.
10. **Conversão final**: formulário e/ou canal permitido; CTA específico à etapa de compra.
11. **Rodapé**: identificação comercial, CRECI e informações pertinentes.

**Layout:** hierarquia visual clara, respiração, contraste, legibilidade, poucas animações com propósito, consistência de tipografia e cores; separar blocos narrativos de especificações técnicas. Não obrigar a usar todas as seções.

## 6. Plugins e componentes reais observados no pacote 6.0.69

Os seguintes **IDs reais** aparecem em `plugins/` e podem compor projetos quando compatíveis com o manifesto/configuração da instalação:

| Necessidade | Plugin / ID observado |
|---|---|
| Hero | `hero`, `hero-plus` |
| Destaques | `highlights` |
| Especificações | `specs` |
| Galeria | `gallery`, `gallery-big-four`, `property-slider` |
| Experiência | `lifestyle`, `parallax` |
| Tour e conteúdo 360 | `hero360-tour`, `parallax360-tour`, `tour360-pro` |
| Planta e implantação | `smart-plant-v1.4.2`, `hotspot-plant-pro`, `implantacao-tiles-pro-v1.0.1` |
| Localização | `location` |
| Valores e pagamento | `payment`, `offer-price-pro`, `payment-investment-glass-pro-v1.0.0` |
| Perguntas e respostas | `faq` |
| Captação | `lead-form`, `form-sender-v4` |
| CTA / botão | `button-single` |
| Marca profissional | `professional-branding-pro` |
| Rodapé | `footer` |
| Composição e narrativa | `section-layout-pro`, `segment-layout`, `magazine-text-pro-v1.3.1`, `only-text-context`, `possibility-path-pro` |
| Efeitos | `reveal`, `lightbox` |

**Atenção:** IDs da tabela não garantem as mesmas propriedades em versões futuras. Antes de gerar o JSON, verificar `plugins/registry.json`, arquivos `plugins/<id>/plugin.json`, defaults, módulos e uma exportação válida. Preferir a configuração já definida no template/preset do projeto; não acrescentar plugins por efeito decorativo.

### Especificações de UX/UI

- **Hero:** conteúdo deve aparecer no próprio hero, não em banner paralelo quando a intenção é substituir texto e labels.
- **Tour 360:** hotspot de informação pode trocar os textos do hero; hotspot de navegação troca de cena. Não inventar nomes de campos sem conferir os dados do plugin.
- **Parallax e 360:** preservar navegação de página e fluidez mobile; evitar interferência de gestos com o scroll. Só habilitar controles avançados quando a intenção do projeto exigir.
- **Tipografia:** combinar fontes com parcimônia; preservar tamanhos e line-height responsivos, sem textos cortados.
- **Formulários:** usar somente endpoint autorizado e campos necessários à captação, sem incluir dados pessoais fictícios.
- **Responsividade:** revisar desktop, tablet e mobile; preservar a semântica dos conteúdos em todas as larguras.
- **Exportação:** revisar se o resultado publicado corresponde ao preview em fontes, imagens, vídeos, animações, CTA e formulários.

## 7. SEO técnico, GEO e indexação por IA

O conteúdo deve ser útil para pessoas e interpretável por mecanismos de busca e respostas com IA. Produzir:

- **Title:** produto + região + diferencial principal, natural e específico.
- **Meta description:** resumo do produto, localização e convite à ação sem repetição abusiva.
- **H1 único**, H2/H3 com ordem semântica coerente; texto descritivo real no HTML, não dependente de animação ou imagem.
- **Keywords:** termos de intenção comercial, localização, sinônimos plausíveis; sem empilhamento. Meta keywords não substituem conteúdo útil, indexabilidade nem SEO técnico.
- **Canonical:** apenas quando a URL final estiver definida. Sem URLs de exemplo publicáveis.
- **Open Graph:** título, descrição e imagem social verdadeira fornecida ou aprovada.
- **Schema.org/JSON-LD:** usar tipo adequado ao conteúdo, não confundir o JSON-LD inserido no site com o **JSON de projeto do Studio**. Marcação estruturada deve corresponder ao que a página mostra.
- **Entidades e contexto:** empreendimento, cidade, bairro, construtora (se confirmada), características e condições com fonte.
- **Robots / sitemap:** preservar configuração do projeto e testar a exportação final; não usar `noindex` sem intenção.
- **Performance:** imagens dimensionadas, carregamento progressivo de mídia pesada, texto legível antes de efeitos e interações acessíveis.

A versão 6.0.69 contém no estado do projeto `seo.title`, `seo.description`, `seo.keywords`, `seo.canonical`, `seo.sitemapEnabled`, `seo.ogImage`, `seo.robots`, `seo.propertyName`, `seo.propertySchemaType`, `seo.city`, `seo.region`, `seo.authorName`, `seo.authorRole`, `seo.organizationName`, `seo.lastReviewed`, `seo.sourceNotes`, `seo.localInsight`, `seo.aiSearch` e `seo.aiTraining`, entre outros. **Preencher somente com dados apropriados e corroborados**.

## 8. Contrato técnico do JSON nativo

**Arquivos diferentes, finalidades diferentes:**

- `nome-do-projeto.imobstudio.json` — projeto editável que o ImobStudio abre.
- `nome-do-projeto.briefing.md` — estratégia, dados comerciais, fontes e lacunas.
- `nome-do-projeto.assets/` ou ZIP — mídias e arquivos locais, quando necessários.
- `index.html` — somente se for solicitada a versão compilada/publicável; **não substituir o JSON editável**.

### Formato real identificado no código do 6.0.69

O estado base é montado em `assets/js/catalog.js` e normalizado em `assets/js/app.js`. Campos de primeiro nível observados:

```json
{
  "version": "6.0.69",
  "projectId": "ID_UNICO_DO_PROJETO",
  "projectName": "NOME_DO_PROJETO",
  "preset": "ID_DO_PRESET_EXISTENTE",
  "strategy": { "method": "aida", "profile": "consultive" },
  "brand": {},
  "seo": {},
  "behaviorPlugins": ["reveal", "lightbox"],
  "pageSettings": { "scrollMode": "flow", "motion": "subtle" },
  "siteData": {},
  "sections": [],
  "selectedSectionId": null,
  "updatedAt": "DATA_ISO_8601"
}
```

**IMPORTANTE:** o JSON acima é uma **descrição estrutural parcial**, não um projeto pronto para importar! `brand`, `seo`, `siteData` e `sections` precisam de dados reais. Uma seção é criada no `catalog.js` a partir de `plugins[type].defaults`, recebe um `id` e contém `type`, `props` e `settings` com `visible`, `hideMobile`, `hideDesktop`, `transition`, `cssClass`, `anchorId` e `style`. O formato exato de `settings.style` e de cada `props` deve ser retirado do projeto/preset atual ou das definições do plugin.

### Regras obrigatórias para gerar arquivo de importação

1. Verificar a versão do pacote e buscar **um projeto JSON exportado pelo editor** ou gerar base nativa por seus modelos/presets reais.
2. Trabalhar sobre uma **cópia íntegra do JSON nativo**, nunca criar projeto “parecido” só porque contém os campos acima.
3. Preencher `siteData` com valores comerciais válidos, sem deixar os dados fictícios do template.
4. Preencher `seo`, `brand` e cada `section.props` de acordo com os **defaults e campos conhecidos do plugin**. Nunca transferir propriedades de um plugin para outro por semelhança de nome.
5. Preservar IDs únicos de seções, ordenação, identidade de módulos e demais campos internos exigidos.
6. Não remover configurações desconhecidas que o editor use; mudar apenas o necessário.
7. Referenciar mídia conforme a convenção real de importação do projeto, sem URLs temporárias ou caminhos inexistentes.
8. Validar sintaxe com parser JSON e confrontar tipos/campos com os defaults; testar importação no editor quando houver ambiente operacional.
9. Se faltar mídia ou valor essencial: não inventar; marcar pendência no briefing e preferir módulo sem asset falso, quando viável.
10. Se uma funcionalidade não existir no pacote, não simular compatibilidade. Relatar a limitação e sugerir outro componente real.
11. **Nenhuma publicação automática**: o usuário importa o JSON, faz a lapidação final e decide quando compilar/publicar.

### Dicas específicas do editor 6.0.69

- Os modelos e hierarquias podem ser consultados em `models/` e a lista de presets em `presets/presets.json`.
- O catálogo constrói o projeto com `createFromBlueprint()` e preenche seções com `createSection(type)`.
- O compilador também inclui `content/project.json` dentro do ZIP estático gerado. Esse arquivo é um bom candidato a **referência de projeto real**, sujeito a validação antes de reutilizar.
- A estrutura pode variar após atualização do aplicativo. Nunca garantir importabilidade em versões que não foram examinadas/testadas.

## 9. Controle de qualidade comercial e técnico

Antes de entregar, conferir:

- [ ] Produto e público estão corretos; proposta de valor específica, não genérica.
- [ ] Preço, condições, prazo e estoque têm fontes e vigência; promoções sem validade não são anunciadas como atuais.
- [ ] Números, tipologias e atributos conferem com material fornecido.
- [ ] Estrutura narrativa tem lógica e um CTA principal claro; sem excesso de seções.
- [ ] Imagens, vídeos, logotipo e planta são reais, disponíveis e adequados.
- [ ] Não há valores ou contatos fictícios herdados do template.
- [ ] Cada plugin, campo e ID empregado pertence à instalação utilizada.
- [ ] JSON é válido sintaticamente e coerente com um projeto nativo do editor.
- [ ] SEO técnico, hierarquia semântica e busca por IA estão revisados.
- [ ] Layout responsivo, acessibilidade, performance e redução de movimento foram considerados.
- [ ] Existe um resumo de lacunas e uma lista curta de ajustes a realizar na lapidação final.

**Status da validação deve acompanhar a entrega:**
- **Validado estruturalmente:** sintaxe e comparação com código e configurações examinados.
- **Importação testada:** abrir/salvar/reabrir de fato no ImobStudio.
- **Exportação testada:** compilar e verificar HTML/mídias/comportamento.

Não afirmar “testado” sem ter executado o respectivo teste.

## 10. Exemplos de direcionamento comercial

Estes exemplos são **referências conceituais**, não cotações em vigor. Toda atualização deve usar material e tabela comercial atual.

**Varandas Trend Living — Canoas:** apartamentos de 2 e 3 dormitórios, opções com ambientes de trabalho/lazer, rooftop e áreas compartilhadas. Narrativa sobre primeiro imóvel, praticidade da rotina, planta e possibilidades de financiamento. Condições históricas como “entrada em dobro” ou “taxas em 120x” só podem constar em página atual quando a oferta e os limites estiverem confirmados.

**NAU Marina & Moradas — Osório:** condomínio náutico, lotes com situações distintas e estrutura de marina. Narrativa pela experiência de navegar com menor esforço logístico. Evitar dizer que todo lote tem acesso navegável particular; distinguir lotes secos, molhados e navegáveis com precisão.

**Aparados — Cambará do Sul:** bairro planejado próximo do núcleo urbano, com lotes residenciais e comerciais. Enfatizar localização, desenho do bairro, infraestrutura prevista, cronograma e usos possíveis; evitar prometer rentabilidade ou valorização.

**Terreno + Construção:** enfatizar projeto adequado ao cliente, liberdade de decisões, estruturação financeira e análise de custos. Qualquer comparação entre preço de mercado e custo de construção exige premissas, orçamento, terreno, tributos, cronograma e ressalvas, não apenas um percentual de economia.

## 11. Padrão de resposta para a IA

Ao receber uma solicitação concreta, produzir, nesta ordem:

**A. Direção comercial (curta):** público, objeção central, proposta de valor, ângulo da campanha e CTA.

**B. Mapa da página:** ordem de seções, respectivos plugins reais, título, texto, assets e objetivo de cada seção.

**C. Arquivo de projeto:** JSON **completo** com base em modelo/arquivo real da versão anexada; disponibilizar o arquivo para importação. Não entregar somente o bloco estrutural deste manual.

**D. Pendências e verificação:** registrar o que não foi informado, o que ficou sem comprovação e quais testes foram executados.

**E. Lapidação final:** orientar revisar imagens, encaixe tipográfico, cores, responsividade, interações, SEO, formulário, conversões e exportação no ImobStudio.

### Exemplos de pedidos curtos que devem acionar este processo

- “Crie uma landing page do Varandas para compradores do Minha Casa Minha Vida.”
- “Crie uma landing page do NAU focando em proprietários de embarcação.”
- “Crie uma landing page sobre Terreno + Construção para clientes de alto padrão.”
- “Faça uma página comercial do loteamento [nome], e me entregue o JSON para abrir no ImobStudio.”

---

## 12. Conduta frente a informações insuficientes

**Pode ser inferido como decisão criativa:** ritmo visual, sequência narrativa, direção de arte, propostas de headlines, CTAs e estratégia de marketing, desde que sinalizados como propostas.

**Não pode ser inventado como fato:** preços, metragens, estoque, prazo de entrega, registros, licenças, garantias, percentuais de valorização, aprovação de financiamento, promessas de infraestrutura, telefones, URLs, pixels/IDs de rastreamento, endpoints e arquivos de mídia.

**Critério de conclusão:** considerar pronta para lapidação a página cuja narrativa comercial está resolvida e cujo arquivo de projeto é tecnicamente editável. A fase final dentro do Studio é refinamento visual e operacional, não reconstrução da página do zero.

---

*Este guia foi produzido com inspeção do pacote `imobify-studio-6.0.69.zip`, principalmente `project.json`, `assets/js/catalog.js`, `assets/js/app.js`, `assets/js/compiler.js`, `plugins/` e `presets/`. O guia não substitui o JSON nativo de um empreendimento específico.*

---

## 13. CATÁLOGO TÉCNICO AUTOMATIZADO — DEFINIÇÕES REAIS DO EDITOR 6.0.69

Este apêndice foi produzido a partir de `assets/js/catalog.js`, consultando objetos `plugins`, seus defaults, fields e manifestos disponíveis. É referência de parâmetros, **não** garantia de que todas as propriedades sejam necessárias, tampouco simulação de importação. Campos não enumerados em `fields` podem existir no default; preserve-os. Plugins carregados dinamicamente exclusivamente por `plugin-loader.js` podem não aparecer neste apêndice: nesses casos verificar o manifesto e o código do plugin.

### Procedimento obrigatório para a IA

1. Classificar o perfil real da audiência (necessidades, poder aquisitivo, estágio de decisão, objeções) e não apenas sua classe social.
2. Definir a promessa comercial central e a ação de conversão desejada.
3. Escolher uma blueprint existente ou o estado base, remover dados fictícios de demonstração e ajustar brand/seo/siteData.
4. Selecionar componentes pelo papel narrativo. Evitar redundância (dois heros, dois formulários concorrentes, repetição de benefícios).
5. Para cada section, copiar **todos os defaults reais** do componente, trocar apenas valores destinados ao briefing, manter `type`, `props` e `settings`.
6. Para selects, usar exatamente os valores suportados no catálogo; os rótulos não são valores JSON.
7. Validar o JSON com o verificador local `docs/validador-projeto-imobstudio.html` e depois testar a importação no editor.
8. Rever versão exportada no navegador para desktop/mobile e corrigir discrepâncias de layout, movimento e dados.

### Contrato do JSON de seção

```json
{
  "id": "benefits-showcase-001",
  "type": "benefits-showcase",
  "props": {
    "eyebrow": "INFRAESTRUTURA E COMODIDADES",
    "title": "Tudo para viver melhor.",
    "subtitle": "Cada detalhe pensado para sua rotina.",
    "profile": "premium",
    "layout": "smart",
    "columns": "4",
    "align": "left",
    "animation": "cascade",
    "motionDuration": 650,
    "stagger": 90,
    "iconStyle": "outlined",
    "iconSize": 42,
    "accentColor": "#b99c76",
    "backgroundColor": "#faf9f7",
    "cardColor": "#ffffff",
    "textColor": "#18202d",
    "cornerRadius": 18,
    "cardGap": 18,
    "categoryFilter": false,
    "showDescriptions": true,
    "items": "pool|Piscina & Spa|Rooftop com espaço para relaxar e aproveitar a vista.|Lazer\nlaptop|Coworking|Ambiente funcional para trabalho e estudos.|Conveniência\nfitness_center|Academia|Estrutura prática para manter a rotina ativa.|Bem-estar\nshield|Segurança 24h|Acesso controlado e mais tranquilidade.|Segurança\npets|Pet Place|Espaço pensado para seu pet.|Lazer\ncelebration|Salão de Festas|Encontros e comemorações especiais.|Lazer\nelevator|Elevadores|Mais conforto e praticidade.|Infraestrutura\nlocation_on|Localização Estratégica|Próximo aos serviços e à mobilidade.|Localização"
  },
  "settings": {
    "visible": true,
    "hideMobile": false,
    "hideDesktop": false,
    "transition": "default",
    "cssClass": "",
    "anchorId": "",
    "style": {}
  }
}
```

**Nota:** exemplo com defaults do catálogo; `settings.style` pode receber os tokens do editor. Não publicar dados de demonstração sem substituir.

### Referência componente a componente (ordenada por nome)

#### Benefits Showcase (`benefits-showcase`)

**Grupo:** Interesse · **Tipo:** section · **Objetivo declarado:** Benefícios com ícones vetoriais SVG, presets, categorias e coreografias

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

**Padrões do core:** `site-container` controla as margens horizontais com o token `--container`; cabeçalho e cards devem iniciar na mesma margem (alinhamento esquerdo por padrão). Cabeçalho usa `--text-measure` e `--content-gap`; padding da seção usa `--section-space`, distâncias internas usam `--element-gap` e `--component-padding`. Não atribua fontes/tamanhos independentes ao conteúdo ao gerar JSON: Headline, Subheadline, Eyebrow e Body obedecem ao Wizard de Tipografia global quando ativo. A imagem de fundo fixa não pode suprimir o padding superior configurado no projeto.

**Imagem de fundo:** opcional via `props.backgroundImage` (arquivo do editor/URL). `props.backgroundFixed` (true por padrão) mantém a fotografia fixa enquanto a section é percorrida; `props.backgroundOverlay` controla o escurecimento de 55 a 90, com padrão 76, e `props.backgroundPositionY` controla o enquadramento vertical (0–100). Sem imagem, a aparência original é mantida. Proteção escura com cards sólidos e título branco mantém o conteúdo legível.

**Guia específico:** quatro composições (`smart-grid`, `bento`, `editorial`, `list` conforme valores aceitos abaixo); benefícios são gerenciados pelo Wizard no modal e persistidos em texto estruturado `icone|titulo|descricao|grupo`, uma linha por benefício. Use IDs de ícones disponíveis. Agrupar quando houver muitos itens, destacar somente diferenciais comprovados. O modal do editor oferece adicionar, editar, remover, duplicar, ordenar e salvar; a IA deve fornecer `props.items` no formato nativo.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| subtitle | Descrição da section | textarea | Conteúdo |  |
| profile | Perfil do imóvel | select | Preset | premium, mcmv, nautico, comercial, custom |
| layout | Composição | select | Preset | smart, bento, editorial, list |
| items | Gerenciar lista de benefícios | benefits-wizard | Benefícios |  |
| categoryFilter | Mostrar filtros por categoria | toggle | Benefícios |  |
| showDescriptions | Mostrar descrições | toggle | Benefícios |  |
| columns | Colunas no desktop | select | Layout | 2, 3, 4 |
| align | Alinhamento | select | Layout | left, center |
| cornerRadius | Raio dos cards (px) | range | Layout |  · mín=0 · máx=36 |
| cardGap | Espaçamento entre cards (px) | range | Layout |  · mín=8 · máx=40 |
| iconStyle | Estilo dos ícones | select | Ícones Google SVG | outlined, rounded, sharp |
| iconSize | Tamanho do ícone (px) | range | Ícones Google SVG |  · mín=20 · máx=64 |
| backgroundImage | Imagem de fundo | image | Imagem de fundo | opcional |
| backgroundFixed | Manter imagem fixa durante o scroll | toggle | Imagem de fundo | true/false |
| backgroundOverlay | Proteção de leitura sobre a imagem | range | Imagem de fundo | 55–90; padrão 76 |
| backgroundPositionY | Posição vertical da imagem | range | Imagem de fundo | 0–100; padrão 50 |
| accentColor | Cor dos ícones e detalhes | color | Cores |  |
| backgroundColor | Fundo da section | color | Cores |  |
| cardColor | Fundo dos cards | color | Cores |  |
| textColor | Cor dos textos | color | Cores |  |
| animation | Coreografia | select | Animação | cascade, mask, elevate, none |
| motionDuration | Duração (ms) | range | Animação |  · mín=200 · máx=1600 |
| stagger | Intervalo entre cards (ms) | range | Animação |  · mín=0 · máx=300 |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "INFRAESTRUTURA E COMODIDADES",
  "title": "Tudo para viver melhor.",
  "subtitle": "Cada detalhe pensado para sua rotina.",
  "profile": "premium",
  "layout": "smart",
  "columns": "4",
  "align": "left",
  "animation": "cascade",
  "motionDuration": 650,
  "stagger": 90,
  "iconStyle": "outlined",
  "iconSize": 42,
  "accentColor": "#b99c76",
  "backgroundColor": "#faf9f7",
  "cardColor": "#ffffff",
  "textColor": "#18202d",
  "cornerRadius": 18,
  "cardGap": 18,
  "categoryFilter": false,
  "showDescriptions": true,
  "items": "pool|Piscina & Spa|Rooftop com espaço para relaxar e aproveitar a vista.|Lazer\nlaptop|Coworking|Ambiente funcional para trabalho e estudos.|Conveniência\nfitness_center|Academia|Estrutura prática para manter a rotina ativa.|Bem-estar\nshield|Segurança 24h|Acesso controlado e mais tranquilidade.|Segurança\npets|Pet Place|Espaço pensado para seu pet.|Lazer\ncelebration|Salão de Festas|Encontros e comemorações especiais.|Lazer\nelevator|Elevadores|Mais conforto e praticidade.|Infraestrutura\nlocation_on|Localização Estratégica|Próximo aos serviços e à mobilidade.|Localização"
}
```

**Manifesto:** `plugins/benefits-showcase/plugin.json`

#### Condições de pagamento (`payment`)

**Grupo:** Decisão · **Tipo:** section · **Objetivo declarado:** Preço, entrada e parcelas

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| priceLabel | Rótulo do preço | text | Conteúdo |  |
| price | Preço | text | Conteúdo |  |
| downPaymentLabel | Label da entrada | text | Conteúdo |  |
| downPayment | Entrada | text | Conteúdo |  |
| installmentsLabel | Label das parcelas | text | Conteúdo |  |
| installments | Parcelas | text | Conteúdo |  |
| note | Observação legal | textarea | Conteúdo |  |
| cta | Texto do CTA | text | Conteúdo |  |
| anchor | Destino do CTA | text | Conteúdo |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "CONDIÇÃO ESPECIAL",
  "title": "Um plano possível para chegar ao seu imóvel.",
  "price": "R$ 389.900",
  "priceLabel": "unidades a partir de",
  "downPaymentLabel": "Entrada",
  "downPayment": "R$ 38.990",
  "installmentsLabel": "Prazo sugerido",
  "installments": "36x de R$ 2.190",
  "note": "*Condição ilustrativa sujeita à análise de crédito e disponibilidade.",
  "cta": "Simular meu plano",
  "anchor": "#contato"
}
```

**Manifesto:** `plugins/payment/plugin.json`

#### Depoimentos (`testimonials`)

**Grupo:** Prova · **Tipo:** section · **Objetivo declarado:** Prova social de clientes

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| items | Nome\|perfil\|depoimento | textarea | Conteúdo |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "QUEM JÁ ESCOLHEU",
  "title": "Decisões seguras começam com informação.",
  "items": "Mariana e Paulo|Compradores|A apresentação foi clara e conseguimos entender qual planta fazia sentido para nossa rotina.\nLuciana M.|Investidora|Recebi dados objetivos sobre localização, condições e potencial do projeto. Isso facilitou minha decisão.\nRafael S.|Comprador|O atendimento não pressionou; organizou os próximos passos e respondeu todas as dúvidas."
}
```

**Manifesto:** `plugins/testimonials/plugin.json`

#### Destaques (`highlights`)

**Grupo:** Interesse · **Tipo:** section · **Objetivo declarado:** Benefícios com layouts editorial, cartões ou compacto

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Eyebrow · chamada superior | text | Conteúdo |  |
| title | Headline · título da seção | textarea | Conteúdo |  |
| subtitle | Subheadline · texto de apoio (opcional) | textarea | Conteúdo |  |
| items | Um destaque por linha: título\|descrição | textarea | Destaques |  |
| layout | Estilo visual | select | Estilo | editorial, cards, compact |
| columns | Colunas no desktop | select | Estilo | 2, 3, 4 |
| marker | Marcador dos itens | select | Estilo | number, dot, none |
| textAlign | Alinhamento do conteúdo | select | Estilo | left, center |
| ctaLabel | CTA opcional · texto do botão | text | Ação |  |
| ctaHref | CTA opcional · link ou âncora | text | Ação |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "PENSADO NOS DETALHES",
  "title": "O essencial, elevado a outro nível.",
  "subtitle": "",
  "items": "Localização estratégica|Perto de tudo, sem abrir mão da tranquilidade.\nPlantas inteligentes|Espaços que aproveitam cada metro e acompanham sua rotina.\nLazer completo|Ambientes para viver, celebrar e desacelerar todos os dias.",
  "layout": "editorial",
  "columns": "3",
  "marker": "number",
  "textAlign": "left",
  "ctaLabel": "",
  "ctaHref": "#contato"
}
```

**Manifesto:** `plugins/highlights/plugin.json`

#### Ficha do imóvel (`specs`)

**Grupo:** Interesse · **Tipo:** section · **Objetivo declarado:** Dados técnicos de leitura rápida

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| title | Título | textarea | Conteúdo |  |
| copy | Descrição | textarea | Conteúdo |  |
| items | Dados: valor\|rótulo | textarea | Conteúdo |  |

**Defaults reais de `props`:**

```json
{
  "title": "Espaço para o que realmente importa.",
  "copy": "Plantas versáteis, acabamento contemporâneo e soluções que ampliam a sensação de conforto.",
  "items": "72–96 m²|Área privativa\n2 ou 3|Dormitórios\n1 suíte|Em todas as plantas\n2 vagas|Opções selecionadas\n2028|Previsão de entrega"
}
```

**Manifesto:** `plugins/specs/plugin.json`

#### Formulário de contato (`lead-form`)

**Grupo:** Ação · **Tipo:** section · **Objetivo declarado:** Captação com consentimento LGPD

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| copy | Texto de apoio | textarea | Conteúdo |  |
| button | Texto do botão | text | Conteúdo |  |
| success | Mensagem de sucesso | textarea | Conteúdo |  |
| whatsapp | WhatsApp com DDI | text | Conteúdo |  |
| consent | Consentimento LGPD | textarea | Conteúdo |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "ATENDIMENTO PERSONALIZADO",
  "title": "Receba valores, plantas e disponibilidade.",
  "copy": "Preencha seus dados. Um especialista entrará em contato para entender seu objetivo e apresentar as melhores possibilidades.",
  "button": "Quero receber as informações",
  "success": "Recebemos seu interesse. Em breve entraremos em contato.",
  "whatsapp": "5551998111078",
  "consent": "Concordo em receber contato sobre este empreendimento."
}
```

**Manifesto:** `plugins/lead-form/plugin.json`

#### Galeria imersiva (`gallery`)

**Grupo:** Desejo · **Tipo:** section · **Objetivo declarado:** Imagens com navegação e lightbox

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| image1 | Imagem 1 | image | Galeria |  |
| caption1 | Legenda 1 | text | Galeria |  |
| image2 | Imagem 2 | image | Galeria |  |
| caption2 | Legenda 2 | text | Galeria |  |
| image3 | Imagem 3 | image | Galeria |  |
| caption3 | Legenda 3 | text | Galeria |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "ARQUITETURA E ATMOSFERA",
  "title": "Ambientes que convidam você a ficar.",
  "image1": "assets/images/gallery-1.jpg",
  "caption1": "Living integrado",
  "image2": "assets/images/gallery-2.jpg",
  "caption2": "Rooftop ao pôr do sol",
  "image3": "assets/images/gallery-3.jpg",
  "caption3": "Lazer para toda a família"
}
```

**Manifesto:** `plugins/gallery/plugin.json`

#### Hero imobiliário (`hero`)

**Grupo:** Conversão · **Tipo:** section · **Objetivo declarado:** Primeira dobra com promessa e CTA

**Aplicação estratégica:** Usar como abertura de alta atenção com proposta de valor, visuais verificados e CTA direcionado.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título principal | textarea | Conteúdo |  |
| subtitle | Texto de apoio | textarea | Conteúdo |  |
| primaryCta | CTA principal | text | Conteúdo |  |
| secondaryCta | CTA secundário | text | Conteúdo |  |
| anchor | Destino do CTA | text | Conteúdo |  |
| badge | Selo comercial | text | Conteúdo |  |
| image | Imagem principal | image | Imagem |  |
| imageAlt | Texto alternativo da imagem | text | Imagem |  |
| showScroll | Indicador de rolagem | toggle | Exibição |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "LANÇAMENTO EM CANOAS",
  "title": "Seu próximo capítulo começa em um lugar feito para viver bem.",
  "subtitle": "Apartamentos de 2 e 3 dormitórios com varanda, lazer completo e localização que valoriza seu tempo.",
  "primaryCta": "Quero conhecer",
  "secondaryCta": "Ver condições",
  "image": "assets/images/hero-placeholder.jpg",
  "imageAlt": "Fachada do Residencial Aurora em Canoas",
  "badge": "Últimas unidades da fase 1",
  "anchor": "#contato",
  "showScroll": true
}
```

**Manifesto:** `plugins/hero/plugin.json`

#### Hero Imobiliário Plus (`hero-plus`)

**Grupo:** Conversão · **Tipo:** section · **Objetivo declarado:** Hero cinematográfico com slides, movimento, partículas e tipografia avançada

**Aplicação estratégica:** Usar como abertura de alta atenção com proposta de valor, visuais verificados e CTA direcionado.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título principal | textarea | Conteúdo |  |
| subtitle | Texto de apoio | textarea | Conteúdo |  |
| ribbonText | Texto do ribbon | text | Ribbon |  |
| ribbonAlign | Alinhamento do ribbon | select | Ribbon | left, center, right, justify |
| ribbonWidth | Largura do ribbon | select | Ribbon | fit, full |
| primaryCta | CTA principal | text | Ações |  |
| primaryLink | Link do CTA principal | text | Ações |  |
| secondaryCta | CTA secundário | text | Ações |  |
| secondaryLink | Link do CTA secundário | text | Ações |  |
| badge | Selo comercial | text | Ações |  |
| exploreText | Texto de “Explore” | text | Explore |  |
| exploreLink | Hiperlink de “Explore” | text | Explore |  |
| showExplore | Exibir chamada Explore | toggle | Explore |  |
| image1 | Imagem principal | image | Fundo |  |
| image2 | Slide 2 | image | Fundo |  |
| image3 | Slide 3 | image | Fundo |  |
| image4 | Slide 4 | image | Fundo |  |
| imageAlt | Texto alternativo | text | Fundo |  |
| slideAutoplay | Troca automática dos slides | toggle | Fundo |  |
| slideTransition | Transição entre slides | select | Fundo | crossfade, horizontal, vertical, zoom-fade, perspective |
| slideDuration | Tempo por slide (ms) | number | Slides |  · mín=1800 · máx=20000 |
| transitionDuration | Duração da transição (ms) | number | Slides |  · mín=200 · máx=4000 |
| contentAlign | Alinhamento do conteúdo | select | Composição | left, center, right |
| verticalAlign | Posição vertical | select | Composição | top, center, bottom |
| contentMaxWidth | Largura máxima do texto (px) | number | Composição |  · mín=420 · máx=1400 |
| contentOffsetX | Deslocamento X (px) | number | Composição |  · mín=-320 · máx=320 |
| contentOffsetY | Deslocamento Y (px) | number | Composição |  · mín=-240 · máx=240 |
| bgMotion | Movimento da imagem | select | Movimento | none, pan-left, pan-right, zoom, ken-burns, perspective, drift |
| motionDuration | Duração do movimento (s) | number | Movimento |  · mín=4 · máx=60 |
| motionIntensity | Intensidade do movimento | range | Movimento |  · mín=0 · máx=100 |
| bgScale | Escala máxima (%) | range | Movimento |  · mín=101 · máx=125 |
| imagePositionX | Posição da imagem X (%) | range | Movimento |  · mín=0 · máx=100 |
| imagePositionY | Posição da imagem Y (%) | range | Movimento |  · mín=0 · máx=100 |
| bgBlur | Desfoque do fundo (px) | range | Movimento |  · mín=0 · máx=10 |
| overlayOpacity | Escurecimento (%) | range | Iluminação |  · mín=0 · máx=90 |
| vignette | Vinheta (%) | range | Iluminação |  · mín=0 · máx=80 |
| pointerLight | Luz que acompanha o cursor | toggle | Iluminação |  |
| pointerLightStrength | Intensidade da luz | range | Iluminação |  · mín=0 · máx=65 |
| particlesEnabled | Ativar partículas | toggle | Partículas |  |
| particleStyle | Estilo | select | Partículas | dust, bokeh, spark, lines |
| particleDensity | Quantidade | range | Partículas |  · mín=8 · máx=110 |
| particleSpeed | Velocidade | range | Partículas |  · mín=1 · máx=100 |
| particleSize | Tamanho | range | Partículas |  · mín=0.4 · máx=4 |
| particleOpacity | Opacidade (%) | range | Partículas |  · mín=4 · máx=80 |
| particleMagnetic | Partículas magnéticas ao cursor | toggle | Partículas |  |
| magneticStrength | Força magnética | range | Partículas |  · mín=0 · máx=100 |
| typographyPreset | Preset tipográfico | select | Tipografia | popular, contemporary, luxury, editorial, architectural |
| titleFont | Fonte do título | select | Título | preset, Manrope, Inter, DM Sans, Montserrat, Poppins, Playfair Display, Bodoni Moda, Roboto Serif |
| titleSize | Tamanho (px) | number | Título |  · mín=42 · máx=180 |
| titleWeight | Peso | number | Título |  · mín=300 · máx=900 |
| titleLineHeight | Altura de linha | number | Título |  · mín=0.75 · máx=1.5 |
| titleLetterSpacing | Tracking (em) | number | Título |  · mín=-0.12 · máx=0.18 |
| titleTransform | Transformação | select | Título | none, uppercase, lowercase |
| titleColor | Cor | color | Título |  |
| titleShadow | Sombra (%) | range | Título |  · mín=0 · máx=80 |
| subtitleFont | Fonte do apoio | select | Texto de apoio | preset, Manrope, Inter, DM Sans, Montserrat, Poppins, Playfair Display |
| subtitleSize | Tamanho (px) | number | Texto de apoio |  · mín=12 · máx=42 |
| subtitleWeight | Peso | number | Texto de apoio |  · mín=300 · máx=900 |
| subtitleLineHeight | Altura de linha | number | Texto de apoio |  · mín=1 · máx=2.2 |
| subtitleLetterSpacing | Tracking (em) | number | Texto de apoio |  · mín=-0.05 · máx=0.16 |
| subtitleColor | Cor | color | Texto de apoio |  |
| ribbonFont | Fonte do ribbon | select | Ribbon avançado | preset, Manrope, Inter, DM Sans, Montserrat |
| ribbonSize | Tamanho (px) | number | Ribbon avançado |  · mín=8 · máx=24 |
| ribbonWeight | Peso | number | Ribbon avançado |  · mín=300 · máx=900 |
| ribbonLetterSpacing | Tracking (em) | number | Ribbon avançado |  · mín=0 · máx=0.4 |
| ribbonColor | Cor | color | Ribbon avançado |  |
| eyebrowAnimation | Animação da chamada | select | Animação de texto | none, reveal-up, blur-in, mask-slide, tracking-in, glow-in |
| titleAnimation | Animação do título | select | Animação de texto | none, words-rise, chars-wave, reveal-up, blur-in, mask-slide, tracking-in, glow-in |
| subtitleAnimation | Animação do apoio | select | Animação de texto | none, reveal-up, blur-in, mask-slide, tracking-in |
| ribbonAnimation | Animação do ribbon | select | Animação de texto | none, reveal-up, blur-in, mask-slide, tracking-in |
| textDuration | Duração (ms) | number | Animação de texto |  · mín=150 · máx=3000 |
| textDelay | Atraso inicial (ms) | number | Animação de texto |  · mín=0 · máx=2500 |
| textStagger | Intervalo palavra/letra (ms) | number | Animação de texto |  · mín=5 · máx=180 |
| magneticCta | Botões magnéticos | toggle | Interação |  |
| ctaEffect | Efeito do CTA | select | Interação | none, glow, shine |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "IMÓVEL EM DESTAQUE",
  "title": "Uma primeira impressão que faz o imóvel parecer único.",
  "subtitle": "Combine arquitetura, localização e desejo em uma abertura cinematográfica feita para prender atenção sem perder elegância.",
  "primaryCta": "Quero conhecer",
  "primaryLink": "#contato",
  "secondaryCta": "Ver detalhes",
  "secondaryLink": "#destaques",
  "badge": "Apresentação exclusiva",
  "exploreText": "Explore o projeto",
  "exploreLink": "#destaques",
  "showExplore": true,
  "ribbonText": "ARQUITETURA · LOCALIZAÇÃO · EXPERIÊNCIA",
  "ribbonAlign": "left",
  "ribbonWidth": "fit",
  "image1": "assets/images/hero-placeholder.jpg",
  "image2": "",
  "image3": "",
  "image4": "",
  "imageAlt": "Imagem principal do empreendimento",
  "slideAutoplay": true,
  "slideTransition": "horizontal",
  "slideDuration": 6500,
  "transitionDuration": 1200,
  "contentAlign": "left",
  "verticalAlign": "center",
  "contentMaxWidth": 820,
  "contentOffsetX": 0,
  "contentOffsetY": 0,
  "bgMotion": "pan-left",
  "motionDuration": 16,
  "motionIntensity": 34,
  "bgScale": 108,
  "imagePositionX": 50,
  "imagePositionY": 50,
  "bgBlur": 0,
  "overlayOpacity": 56,
  "vignette": 38,
  "pointerLight": true,
  "pointerLightStrength": 18,
  "particlesEnabled": false,
  "particleStyle": "dust",
  "particleDensity": 38,
  "particleSpeed": 22,
  "particleSize": 1.6,
  "particleOpacity": 30,
  "particleMagnetic": true,
  "magneticStrength": 42,
  "typographyPreset": "contemporary",
  "titleFont": "preset",
  "titleSize": 92,
  "titleWeight": 800,
  "titleLineHeight": 0.96,
  "titleLetterSpacing": -0.045,
  "titleTransform": "none",
  "titleColor": "#ffffff",
  "titleShadow": 25,
  "subtitleFont": "preset",
  "subtitleSize": 20,
  "subtitleWeight": 450,
  "subtitleLineHeight": 1.55,
  "subtitleLetterSpacing": 0,
  "subtitleColor": "#e7ebef",
  "ribbonFont": "preset",
  "ribbonSize": 11.5,
  "ribbonWeight": 800,
  "ribbonLetterSpacing": 0.13,
  "ribbonColor": "#ffffff",
  "eyebrowAnimation": "reveal-up",
  "titleAnimation": "words-rise",
  "subtitleAnimation": "blur-in",
  "ribbonAnimation": "mask-slide",
  "textDuration": 850,
  "textDelay": 80,
  "textStagger": 35,
  "magneticCta": true,
  "ctaEffect": "shine"
}
```

**Manifesto:** `plugins/hero-plus/plugin.json`

#### Informações objetivas (`info-objetiva`)

**Grupo:** Interesse · **Tipo:** section · **Objetivo declarado:** Indicadores e cronograma de entrega, sem parágrafos longos

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| copy | Descrição curta | textarea | Conteúdo |  |
| metrics | Indicadores: número\|descrição (um por linha) | textarea | Indicadores |  |
| showMetrics | Exibir indicadores | checkbox | Indicadores |  |
| columns | Colunas no desktop | select | Estilo | 2, 3, 4 |
| visualStyle | Visual | select | Estilo | cards, minimal, accent |
| scheduleTitle | Título do cronograma | text | Cronograma |  |
| milestones | Etapas: identificação\|data (uma por linha) | textarea | Cronograma |  |
| showSchedule | Exibir cronograma | checkbox | Cronograma |  |
| note | Observação do cronograma | textarea | Cronograma |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "RESIDENCIAL NÁPOLES",
  "title": "O empreendimento em números",
  "copy": "Uma visão rápida da estrutura e do calendário de entrega.",
  "metrics": "03|Torres residenciais\n07|Pavimentos por torre\n02|Elevadores por torre\n12|Apartamentos por andar",
  "scheduleTitle": "Previsão de entrega",
  "milestones": "Torre A|Junho de 2028\nTorre B|Dezembro de 2028\nTorre C|Junho de 2029",
  "note": "Datas previstas, sujeitas à confirmação contratual.",
  "columns": "4",
  "visualStyle": "cards",
  "showMetrics": true,
  "showSchedule": true
}
```

**Manifesto:** `plugins/info-objetiva/plugin.json`

#### Lifestyle (`lifestyle`)

**Grupo:** Desejo · **Tipo:** section · **Objetivo declarado:** Narrativa emocional com imagem

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| titleAlign | Alinhamento do título | select | Tipografia | left, center, right, justify |
| titleAlignMobile | Alinhamento do título · mobile | select | Tipografia | inherit, left, center, right, justify |
| copy | Narrativa | textarea | Conteúdo |  |
| copyAlign | Alinhamento da narrativa | select | Tipografia | left, center, right, justify |
| lineFit | Quebra e ajuste de linha | select | Tipografia | normal, editorial, balanced |
| quote | Frase de impacto | textarea | Conteúdo |  |
| image | Imagem | image | Imagem |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "MAIS VIDA NO SEU DIA",
  "title": "Menos deslocamento. Mais tempo para você.",
  "titleAlign": "left",
  "titleAlignMobile": "inherit",
  "copy": "Comece a manhã com calma, trabalhe perto de tudo e termine o dia em espaços criados para renovar as energias.",
  "image": "assets/images/lifestyle.jpg",
  "quote": "Morar bem é quando a casa melhora também o lado de fora dela.",
  "copyAlign": "left",
  "lineFit": "balanced"
}
```

**Manifesto:** `plugins/lifestyle/plugin.json`

#### Lightbox de galeria (`lightbox`)

**Grupo:** Efeito · **Tipo:** behavior · **Objetivo declarado:** Ampliação das imagens

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

**Defaults reais de `props`:**

```json
{}
```

**Manifesto:** `plugins/lightbox/plugin.json`

#### Perguntas frequentes (`faq`)

**Grupo:** Objeção · **Tipo:** section · **Objetivo declarado:** Accordion para reduzir dúvidas

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| eyebrow | Chamada superior | text | Conteúdo |  |
| title | Título | textarea | Conteúdo |  |
| items | Pergunta\|resposta | textarea | Conteúdo |  |

**Defaults reais de `props`:**

```json
{
  "eyebrow": "DÚVIDAS FREQUENTES",
  "title": "Informação para decidir com tranquilidade.",
  "items": "Posso usar FGTS?|Sim. A utilização depende do enquadramento do cliente e do imóvel nas regras vigentes.\nO empreendimento aceita financiamento?|Sim. A simulação é feita conforme sua renda, entrada disponível e modalidade de crédito.\nQuando será entregue?|A previsão contratual é dezembro de 2028, observadas as condições do memorial e do contrato.\nComo recebo a tabela atualizada?|Preencha o formulário e solicite a disponibilidade e as condições do dia."
}
```

**Manifesto:** `plugins/faq/plugin.json`

#### Revelação no scroll (`reveal`)

**Grupo:** Efeito · **Tipo:** behavior · **Objetivo declarado:** Entrada suave e acessível

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

**Defaults reais de `props`:**

```json
{}
```

**Manifesto:** `plugins/reveal/plugin.json`

#### Rodapé profissional (`footer`)

**Grupo:** Confiança · **Tipo:** section · **Objetivo declarado:** Marca, CRECI, canais sociais e informações legais

**Aplicação estratégica:** Usar quando sua função narrativa contribuir para responder uma dúvida, demonstrar um benefício ou conduzir a próxima ação do visitante.

**Comportamento e composição:** A seção usa as propriedades listadas abaixo; sua aparência e interações finais dependem de `render`, CSS e JS do plugin. Verifique mídia, gatilhos de interação, teclado, touch e fallback no HTML exportado. Evite efeitos redundantes; textos devem continuar legíveis sem animações.

| Campo JSON | Nome no editor | Tipo | Grupo | Valores permitidos / intervalo |
|---|---|---|---|---|
| brand | Nome ou marca | text | Identidade |  |
| role | Posicionamento | text | Identidade |  |
| professionalDescription | Descrição profissional / responsável | text | Identidade |  |
| license | CRECI | text | Contato |  |
| phone | Telefone | text | Contato |  |
| email | E-mail | text | Contato |  |
| socialHeading | Chamada dos canais | text | Redes sociais |  |
| facebookUrl | Facebook — URL do perfil | url | Redes sociais |  |
| whatsappUrl | WhatsApp — URL do perfil | url | Redes sociais |  |
| instagramUrl | Instagram — URL do perfil | url | Redes sociais |  |
| tiktokUrl | TikTok — URL do perfil | url | Redes sociais |  |
| youtubeUrl | YouTube — URL do canal | url | Redes sociais |  |
| googleBusinessUrl | Google Meu Negócio — URL | url | Redes sociais |  |
| linkedinUrl | LinkedIn — URL do perfil | url | Redes sociais |  |
| additionalSocials | Outras redes: Nome \| URL do ícone \| URL do perfil | textarea | Outras redes |  |
| socialStyle | Estilo dos ícones | select | Aparência | solid, outline, minimal |
| socialLabels | Exibição dos nomes | select | Aparência | icons, show |
| socialIconSize | Tamanho dos ícones (px) | range | Aparência |  · mín=32 · máx=64 |
| socialOpenNewTab | Abrir canais em nova aba | toggle | Aparência |  |
| disclaimer | Aviso legal | textarea | Legal |  |

**Defaults reais de `props`:**

```json
{
  "brand": "Roberto Fettuccia",
  "role": "Especialista em Terreno e Construção",
  "professionalDescription": "Roberto Fettuccia — Corretor de imóveis e especialista em Terreno e Construção",
  "license": "CRECI 83599F",
  "phone": "(51) 99811-1078",
  "email": "contato@seudominio.com.br",
  "socialHeading": "Você nos encontra também em nossos canais.",
  "facebookUrl": "https://www.facebook.com/roberto.fettuccia",
  "whatsappUrl": "https://wa.me/?phone=5551998111078",
  "instagramUrl": "https://www.instagram.com/roberto.fettuccia",
  "tiktokUrl": "https://www.tiktok.com/@roberto.fettuccia7",
  "youtubeUrl": "https://www.youtube.com/@Corretor-RobertoFettuccia",
  "googleBusinessUrl": "https://g.page/r/CSVAh5ZZppPREAE/review",
  "linkedinUrl": "https://www.linkedin.com/in/roberto-fettuccia/",
  "additionalSocials": "",
  "socialStyle": "outline",
  "socialLabels": "icons",
  "socialIconSize": 44,
  "socialOpenNewTab": true,
  "disclaimer": "Imagens meramente ilustrativas. Valores, condições e disponibilidade podem ser alterados sem aviso prévio."
}
```

**Manifesto:** `plugins/footer/plugin.json`

## 14. Validação: o que é e o que não é

O validador incluso confere estrutura, IDs, tipos de componente conhecidos, propriedades e escolhas de selects quando essas definições estiverem disponíveis. Ele **não** testa CSS, layout no navegador, links externos, mídia real, nem garante aceitação por plugins carregados dinamicamente. O editor normaliza diversos campos; valide a importação real e exporte uma prévia antes de publicar.

A IA deverá entregar um JSON completo, não apenas descrever como produzi-lo. Se não houver dados comerciais, assumir estrutura editorial sem fabricar preço, local, disponibilidade, promoção nem endpoint.


## 15. Plugins externos e suas declarações de manifesto

Os plugins abaixo estão presentes em `plugins/` como pacotes adicionais. **Não gerar props de qualquer plugin somente pelo manifesto**: conferir seu script e instância exportada antes de afirmar compatibilidade. Os nomes e descrições abaixo são metadados identificados nos respectivos pacotes.

- **Anti-IA Copy — Política de uso** (`anti-ia-copy-policy`): Insere aviso oculto, metadados e marcação estruturada informando que o conteúdo não pode ser copiado, reproduzido ou usado para treinamento de IA sem autorização.. Manifesto: `plugins/anti-ia-copy/plugin.json`.
- **AR Card Popout 3D Single** (`ar-card-popout-3d`): Um AR Card Popout 3D por instância, pronto para composição em linhas ou colunas pelo Segmento nativo.. Manifesto: `plugins/ar-card-popout-3d-grid-v1.1.1/plugin.json`.
- **AR Card Popout 3D Stage** (`ar-card-popout-3d-stage`): Section ampla com cartão 3D pulsante; ao abrir, o cartão deita, a casa é projetada e a frase principal (`headline`) e três blocos (`block1Label`/`block1Text` … `block3Text`) saem do cartão. Sem CTA. `blocksLayout`: orbit, orbit-alt, left, right. `openTrigger`: both, click, scroll. Manifesto: `plugins/ar-card-popout-3d-stage-v1.0.0/plugin.json`.
- **Benefícios + Modal** (`beneficios-modal`): Grade responsiva de benefícios e infraestrutura com perfis independentes de vitrine e modal, ajuste manual prioritário, contraste automático pelo fundo efetivo, ícones Font Awesome, modal semântico e acessível e texto indexável.. Manifesto: `plugins/beneficios-modal/plugin.json`.
- **Benefits Showcase** (`benefits-showcase`): Descrição não declarada. Manifesto: `plugins/benefits-showcase/plugin.json`.
- **Botão** (`button-single`): Botão único para CTA, navegação ou abertura de Floating Container, integrado ao Button Kit global.. Manifesto: `plugins/button-single/plugin.json`.
- **Proteção de conteúdo** (`content-protection`): Bloqueia seleção, cópia, botão direito e atalhos comuns das ferramentas de desenvolvimento.. Manifesto: `plugins/content-protection/plugin.json`.
- **Editorial Motion** (`editorial-motion`): Composição arquitetônica editorial com três layouts, imagens editáveis e coreografias sincronizadas; preview no editor e animações no export.. Manifesto: `plugins/editorial-motion/plugin.json`.
- **Perguntas frequentes** (`faq`): Descrição não declarada. Manifesto: `plugins/faq/plugin.json`.
- **Financing Simulator Pro** (`financing-simulator-pro`): Simulador financeiro genérico com parcela estimada, comprometimento de renda e CTA para WhatsApp.. Manifesto: `plugins/financing-simulator-pro/plugin.json`.
- **Flip Card 3D** (`flip-card-pro`): Cartão 3D com frente, verso, hover e toque. Manifesto: `plugins/flip-card-pro/plugin.json`.
- **Flip Card 3D Single** (`flip-card-pro`): Um Flip Card 3D por instância, pronto para composição em linhas ou colunas pelo Segmento nativo.. Manifesto: `plugins/flip-card-pro-v4.3.0-plugin/plugin.json`.
- **Flip Card 3D Video Single** (`flipcard-3d-video-v1`): Um Flip Card 3D com vídeo por instância, pronto para composição em linhas ou colunas pelo Segmento nativo.. Manifesto: `plugins/flipcard.3d.Video.v1/plugin.json`.
- **Floating Container Pro** (`floating-container-pro`): Container flutuante reutilizável com portal real no BODY. Uso principal: cole somente #ID no HREF de qualquer botão. Inspetor autodeclarado, responsivo e compatível com modal, drawer, sheet e popover.. Manifesto: `plugins/floating-container-pro/plugin.json`.
- **Rodapé profissional** (`footer`): Marca, CRECI, canais sociais configuráveis e informações legais.. Manifesto: `plugins/footer/plugin.json`.
- **Form Sender v4** (`form-sender-v4`): Form Sender v4 com complementação rápida obrigatória: mobile em etapas automáticas, modal centralizado com altura natural sem vazamento de opções, última resposta envia, desktop preservado, modal sem fechar/pular e autocomplete configurável. Manifesto: `plugins/form-sender-v4/plugin.json`.
- **Galeria imersiva** (`gallery`): Descrição não declarada. Manifesto: `plugins/gallery/plugin.json`.
- **Galeria Big Four** (`gallery-big-four`): Galeria cinematográfica expansível com cinco painéis. Manifesto: `plugins/gallery-big-four/plugin.json`.
- **Galeria Big Four Video** (`gallery-big-four-video`): Galeria Big Four original com suporte híbrido a imagem e vídeo, play on hover, autoplay loop e autoplay boomerang.. Manifesto: `plugins/gallery-big-four-video-v1.0.0/plugin.json`.
- **Hero imobiliário** (`hero`): Descrição não declarada. Manifesto: `plugins/hero/plugin.json`.
- **Hero Imobiliário Plus** (`hero-plus`): Hero imobiliário cinematográfico com slides, tipografia avançada, partículas e movimento.. Manifesto: `plugins/hero-plus/plugin.json`.
- **Hero360Tour** (`hero360-tour`): Hero imersivo 360°, Full Bleed, hotspots de navegação e informações no próprio Hero. Painel de navegação (zoom e tela cheia) opcional, desativado por padrão; rolagem de página liberada.. Manifesto: `plugins/hero360-tour/plugin.json`.
- **Destaques** (`highlights`): Descrição não declarada. Manifesto: `plugins/highlights/plugin.json`.
- **Hotspot Plant Pro** (`hotspot-plant-pro`): Imagem de implantação/planta com pontos clicáveis e painel de detalhes adaptado ao mobile.. Manifesto: `plugins/hotspot-plant-pro/plugin.json`.
- **Imagem Single** (`image-single`): Uma imagem responsiva por instância, com legenda, link, proporção, recorte e aparência configuráveis.. Manifesto: `plugins/image-single/plugin.json`.
- **Implantação Tiles Pro** (`implantacao-tiles-pro`): Implantação interativa por tiles com configuração automática lida de tiles/tiles.xml, caminho editável e controles responsivos.. Manifesto: `plugins/implantacao-tiles-pro-v1.0.1/plugin.json`.
- **Informações objetivas** (`info-objetiva`): Descrição não declarada. Manifesto: `plugins/info-objetiva/plugin.json`.
- **Formulário de contato** (`lead-form`): Descrição não declarada. Manifesto: `plugins/lead-form/plugin.json`.
- **Lifestyle** (`lifestyle`): Narrativa emocional com imagem, alinhamento independente e composição balanceada de linhas sem hifenização automática.. Manifesto: `plugins/lifestyle/plugin.json`.
- **Lightbox de galeria** (`lightbox`): Descrição não declarada. Manifesto: `plugins/lightbox/plugin.json`.
- **Localização** (`location`): Google Maps, endereço e proximidades em um único campo multilinha.. Manifesto: `plugins/location/plugin.json`.
- **Magazine Text Pro** (`magazine-text-pro`): Editorial de revista com tipografia avançada, justificação sem hífen, ajuste óptico de linha e motion cinematográfico.. Manifesto: `plugins/magazine-text-pro-v1.3.1/plugin.json`.
- **Menu fixo adaptável Pro** (`menu-fixo-adaptavel-pro`): Menu fixo responsivo com cores, fontes, posição e efeitos de scroll configuráveis.. Manifesto: `plugins/menu-fixo-adaptavel-pro-v1.0.0/plugin.json`.
- **Offer Price Pro** (`offer-price-pro`): Bloco comercial para preço, economia, condição, CTA e contagem regressiva opcional.. Manifesto: `plugins/offer-price-pro/plugin.json`.
- **Only TEXT — Context** (`only-text-context`): Bloco editorial somente de texto com tipografia completa, justificação sem hífen, ajuste óptico de linha e efeitos cinematográficos.. Manifesto: `plugins/only-text-context/plugin.json`.
- **Parallax** (`parallax`): Parallax cinematográfico com navegação progressiva, banner de liberação de scroll, marcadores com salto pausado e motores dedicados para desktop/Android e iOS.. Manifesto: `plugins/parallax/plugin.json`.
- **Parallax360Tour** (`parallax360-tour`): Narrativa 360 sequencial por cenas e hotspots, com navegação por rolagem, passos e botões — panorama Full Bleed sem bordas.. Manifesto: `plugins/parallax360-tour/plugin.json`.
- **Condições de pagamento** (`payment`): Descrição não declarada. Manifesto: `plugins/payment/plugin.json`.
- **Tabela Investimento + Glass CTA** (`payment-investment-glass-pro`): Tabela premium de condições de pagamento com CTA GlassButton do projeto The Garden New Edition.. Manifesto: `plugins/payment-investment-glass-pro-v1.0.0/plugin.json`.
- **Possibility Path Pro** (`possibility-path-pro`): Diagnóstico guiado de possibilidade: objeção → reenquadramento → cenário → desejo → próximo passo, sem simulação bancária.. Manifesto: `plugins/possibility-path-pro/plugin.json`.
- **Professional Branding Pro** (`professional-branding-pro`): Seção premium de posicionamento profissional integrada ao perfil visual global do projeto, com manifesto, identidade e enquadramento responsivo.. Manifesto: `plugins/professional-branding-pro/plugin.json`.
- **Slider imobiliário** (`property-slider`): Slider imobiliário com slides ilimitados, imagem por URL ou upload local empacotável, tipografia, enquadramento, transições, área segura, navegação e controles responsivos configuráveis. Manifesto: `plugins/property-slider/plugin.json`.
- **Revelação no scroll** (`reveal`): Descrição não declarada. Manifesto: `plugins/reveal/plugin.json`.
- **Popup Pro** (`scheduled-popup-pro`): Popup independente por instância, com modos completo ou imagem + CTA, escala exclusiva no desktop, gatilhos próprios e controle por dispositivo.. Manifesto: `plugins/scheduled-popup-pro-v1.2.2/plugin.json`.
- **Section Layout Pro** (`section-layout-pro`): Container de composição que organiza os próximos blocos/plugins em grid responsivo sem perder os controles individuais.. Manifesto: `plugins/section-layout-pro/plugin.json`.
- **Segmento** (`segment-layout`): Área estrutural com 1 a 5 colunas ou linhas, alinhamento interno e suporte a Segmentos aninhados.. Manifesto: `plugins/segment-layout/plugin.json`.
- **Smart Plant** (`smart-plant`): Vitrine inteligente de plantas com modal detalhado, lupa configurável de 150 px (2×/3×), Form Sender v4 e compatibilidade iPhone/mobile.. Manifesto: `plugins/smart-plant-v1.4.2/plugin.json`.
- **Spacer Divider Pro** (`spacer-divider-pro`): Espaçador e transição visual responsiva entre seções.. Manifesto: `plugins/spacer-divider-pro/plugin.json`.
- **Ficha do imóvel** (`specs`): Descrição não declarada. Manifesto: `plugins/specs/plugin.json`.
- **Tag Installer Pro** (`tag-installer-pro`): Instala uma tag HTML independente no documento publicado. Cada instância possui ID próprio no projeto e pode ser inserida no HEAD, início ou fim do BODY.. Manifesto: `plugins/tag-installer-pro/plugin.json`.
- **Depoimentos** (`testimonials`): Descrição não declarada. Manifesto: `plugins/testimonials/plugin.json`.
- **Timeline Process Pro** (`timeline-process-pro`): Linha do tempo responsiva para explicar processos, compra, financiamento ou etapas de obra.. Manifesto: `plugins/timeline-process-pro/plugin.json`.
- **Tour 360** (`tour360-pro`): Tour virtual 360° como section, com edição completa em modal no ImobStudio, hotspots, visão de chegada, branding, mobile e navegação por toque.. Manifesto: `plugins/tour360-pro/plugin.json`.
- **WhatsApp flutuante Pro** (`whatsapp-flutuante-pro`): Botão flutuante sempre visível, configurável com mensagem URL encoded, posição, pulso, balão e foto no ícone durante o hover.. Manifesto: `plugins/whatsapp-flutuante-pro/plugin.json`.
- **YouTube** (`youtube`): Player responsivo do YouTube por ID ou URL, com autoplay, controles e opções de reprodução e aparência.. Manifesto: `plugins/youtube/plugin.json`.

**Consulta prioritária da IA:** `assets/js/catalog.js` + `plugins/registry.json` + manifesto específico + fonte de implementação + JSON exportado do editor. O catálogo estático e o anexo do download são auxiliares, não substituem o teste funcional.


---

## Agendamento Sender (`agendamento-sender`) — versão 1.2.0

**Comportamento para IA — agendamento com conversão:** combinar calendário horizontal, turnos por dia, preferências enviadas via FormSender V4 e CTA à direita animado com SVG, sem prometer disponibilidade real. Use `showConversionPanel=true`, `conversionLayout="split"`, `conversionHeadline="Agende aqui agora"` e `pulseIntensity="balanced"` como padrão. Ajustar texto à proposta comercial, sem contar vagas fictícias. A chamada à direita apenas foca no calendário.

**Presets:** `visualPreset=auto | popular | contemporary | sophisticated | minimal | spotlight | immersive | editorial`. Herança do tema global via `themeMode="global"` é recomendada; preset altera efeitos/hierarquia, e não a paleta mestre.

**Agenda:** `timeZone="America/Sao_Paulo"` ou outro fuso IANA real. `turns="Manhã|Tarde|Noite"`. Cada dia tem `sundayTurns`...`saturdayTurns` com `all`, `none` ou índices de turnos (`1`, `2`, `3`, `1,2`, `1,3`, `2,3`). Exemplo: `saturdayTurns="1"` (apenas manhã) e `fridayTurns="2"` (apenas tarde). `allowSaturday=true` deve ser informado se quiser sábado atendido, caso contrário será mostrado riscado. Dias indisponíveis são exibidos riscados; a data civil é calculada no fuso do empreendimento. O backend continua recebendo preferências, não uma reserva confirmada.

**Exportação:** o SVG, CSS de pulso, configurações e a lógica de turnos são incluídos na LP estática. Respeitar `prefers-reduced-motion`. Não incluir API keys nas props. A confirmação precisa ocorrer fora do componente.



**Objetivo comercial:** captar a intenção de visita com um formulário mínimo (nome, telefone, e-mail opcional, data e turno). Indicado após localização, fotos, benefícios ou informações comerciais. Não utilizar como confirmação automática de horário ou garantia de disponibilidade.

**Comportamento visual:** calendário horizontal compacto com 3–8 dias no desktop e três no mobile; navegação pelas datas consecutivas e botão de envio com ícone SVG. Diferentemente de versões antigas, dias da semana não atendidos ou datas específicas bloqueadas **continuam aparecendo**, com fundo atenuado, barra diagonal (`/`) e botão `disabled` com descrição acessível. Datas passadas e anteriores à antecedência mínima permanecem fora da janela. A primeira data realmente válida é pré-selecionada. Não envia visitas em dias bloqueados.

**Tema global (padrão):** `themeMode="global"` lê `--action-button-bg`, `--action-button-text`, `--surface`, `--heading-color`, `--muted-color`, `--body`, `--heading`, `--radius` da paleta e tipografia do projeto. Se o cliente pedir mudança de estilo, prefira ajustar o Design System da LP; só defina `themeMode="custom"` para exceção intencional usando `accentColor`, `selectedTextColor`, `tileColor`, `pageColor`, `titleColor`, `mutedColor`, `borderColor`, `cardRadius`.

**Presets de composição:** `visualPreset="auto"` segue `state.strategy.profile` sem criar cores independentes: perfis populares/MCMV -> `popular`; perfis premium/luxury -> `editorial`; investimento/náutico/resort -> `immersive`; demais -> `contemporary`. Também são aceitos `popular`, `contemporary`, `sophisticated`, `minimal`, `spotlight`, `immersive`, `editorial` manualmente. Popular prioriza legibilidade e objetividade; Contemporâneo reproduz o modelo compacto; Sofisticado adiciona respiro editorial; Minimal elimina fundos decorativos. Não confundir perfil comercial da LP com o preset manual do bloco.

**Dias atendidos (D S T Q Q S S):** `allowSunday`, `allowMonday`, `allowTuesday`, `allowWednesday`, `allowThursday`, `allowFriday`, `allowSaturday` (boolean). `false` significa dia visível porém indisponível. `blockedDates` bloqueia individualmente datas `AAAA-MM-DD` (uma por linha ou separadas por espaços/vírgulas). `leadDays` (0–30) e `horizonDays` (7–180) determinam o período; `visibleDays` (3–8) define quantos cartões aparecem no desktop. Não inventar disponibilidade real: os cartões são opções para **solicitar**, não confirmação de vagas.

**FormSender V4:** `endpoint` recebe URL HTTPS `/exec` real do Apps Script, `product` identifica empreendimento, `turns` define as opções de turno com `|`, e `defaultTurn` o turno inicial. `showEmail`, `requireEmail` controlam e-mail. POST `FormData` usa `produto`, `nome`, `email`, `telefone`, `dataHora`, `msg`, mais `origem`, `assunto`, `agendamento`, `agendamentoData`, `agendamentoDataISO`, `agendamentoTurno`, `agendamentoFuso`, `agendamentoStatus`. `msg` contém a data/turno para compatibilidade. Exibir notificação de sucesso somente após resposta positiva da API; a equipe confirma a visita depois.

**Exemplo de seção dentro de `state.sections`:**

```json
{
  "id": "agendamento-sender-visita",
  "type": "agendamento-sender",
  "props": {
    "title": "Agendar uma visita",
    "copy": "Escolha uma data e turno. Nossa equipe confirmará sua visita.",
    "product": "Nome do empreendimento",
    "endpoint": "https://script.google.com/macros/s/SEU_ID/exec",
    "themeMode": "global",
    "visualPreset": "auto",
    "timeZone": "America/Sao_Paulo",
    "showConversionPanel": true,
    "conversionLayout": "split",
    "conversionHeadline": "Agende aqui agora",
    "conversionAction": "Escolher minha data",
    "pulseIntensity": "balanced",
    "leadDays": 1,
    "horizonDays": 60,
    "visibleDays": 6,
    "allowSunday": false,
    "allowMonday": true,
    "allowTuesday": true,
    "allowWednesday": true,
    "allowThursday": true,
    "allowFriday": true,
    "allowSaturday": true,
    "fridayTurns": "2",
    "saturdayTurns": "1",
    "blockedDates": "2026-12-25",
    "turns": "Manhã|Tarde|Noite",
    "defaultTurn": "Manhã",
    "showEmail": true,
    "requireEmail": true
  },
  "settings": { "visible": true, "hideMobile": false, "hideDesktop": false, "transition": "default" }
}
```

**Regras de geração por IA:** `props` armazena configurações internas do plugin; `settings` armazena visibilidade, transição e estilos de seção. Não utilizar os campos legados `skipSaturday/skipSunday` em novos projetos; o Studio 6.0.69 migra os projetos antigos. Se o usuário não fornecer URL de FormSender, deixe pendência explícita e não afirme que o agendamento funcionará até configurá-la. Nunca prometer confirmação ou integração com Google Agenda sem backend apropriado. Informe a política de privacidade aplicável à coleta de dados pessoais.


## 6.0.70 — Google Material Symbols e CTA unico do Agendamento Sender

### Benefits Showcase: biblioteca completa de icones
O wizard consulta o indice **Material Symbols (Google)** em `variablefont/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].codepoints` no repositorio oficial. O indice inclui milhares de icones e utiliza pesquisa por nome, ate 64 por pagina de resultados; refine o termo para encontrar o desejado. Requer internet para consultar o indice e obter SVGs novos. Os 25 icones locais permanecem disponiveis offline. Pesquisa tambem aceita termos imobiliarios em portugues como piscina, academia, seguranca, festas, garagem e marina. Os nomes remotos carregados dependem de acesso ao repositorio oficial. Ao escolher um icone novo, sao obtidos os SVGs outlined, rounded e sharp, validados e guardados em `section.props.iconSvgMap` (string JSON com chaves `estilo/nome` e SVG simplificado). A exportacao utiliza os SVGs locais incorporados ao projeto, sem requisicoes externas. **Nunca gere `iconSvgMap` inventado:** quando usar icones ja existentes, preserve esse objeto exportado pelo proprio editor. Para icones novos, selecione-os no wizard. `items` continua com linhas `icone|titulo|descricao|grupo`; o asterisco inicial define destaque.

### Agendamento Sender 1.3.0: unico CTA de submissao
Se `showConversionPanel=true` e `conversionLayout!='compact'`, somente o CTA visual do painel aparece, e ele **executa o envio** (validacao e POST para FormSender V4). O botao de aviaozinho fica oculto. Se painel desligado ou layout compacto, somente o botao do formulario (aviaozinho) aparece e envia. Texto recomendado para `conversionAction`: **Enviar solicitacao de visita**. Nao representar a solicitacao como visita confirmada.


## 6.0.71 — Hero360Tour: visão inicial e prévia geral

- **Capturar cena** armazena `scenes[id].initialView` (`yaw`, `pitch`, `hfov`). Salvar a cena não substitui valores capturados ou digitados manualmente.
- Quando não houver captura, o comando **Salvar cena** continua usando a orientação atual do visualizador.
- A visualização geral e a exportação começam em `settings.firstSceneId`, usam `scene.initialView` para orientação e HFOV, respeitam `targetView` de hotspots quando configurado e usam fallback 2D seguro quando WebGL não estiver disponível.
- O tour precisa de imagem panorâmica em cada cena. Referências externas dependem de CORS para a renderização interativa em Canvas.


## 6.0.72 — Hero360Tour: compatibilidade do panorama no preview

O renderizador Hero360Tour 1.1.4 aceita imagens equiretangulares com largura não potência de dois (por exemplo, 3000 × 1500). Não é necessário converter a imagem para 2048 × 1024 ou 4096 × 2048 para evitar fundo preto. O componente mantém a foto estática até desenhar o primeiro quadro e utiliza Canvas 2D quando o WebGL não está disponível. Para links remotos, o servidor de imagens deve autorizar CORS no modo interativo. Ao criar projetos JSON, mantenha `scenes[id].panorama` como data URL, caminho relativo válido ou URL HTTPS com CORS; use `settings.firstSceneId` e `scenes[id].initialView` para a abertura.


## 6.0.73 — Hero360Tour 1.2.0 — Immersive Motion

Use o plugin `hero360-tour` para tours 360 em imóveis, especialmente no mobile/tablet. Defina `tourConfig` usando o formato de cenas existente, `settings.firstSceneId`, `scenes[id].panorama`, `initialView.yaw`, `initialView.pitch`, `initialView.hfov` e hotspots.

Configurações da **section**: `motionEnabled: true` ativa o recurso para aparelhos compatíveis, `motionActivation: "button"` solicita a ativação por clique quando necessário (`"auto"` somente quando o navegador permite acesso sem autorização), `motionSensitivity: 50` (10–100), `motionSmoothing: 65` (0–100), `motionRecenter: true`, `motionTouchFallback: true`. O modo usa orientação do aparelho, com calibração relativa à posição salva na cena, e não altera as coordenadas originais dos hotspots. NUNCA inclua códigos que solicitem permissão de sensor automaticamente no iOS; ela depende do clique do visitante. Se não houver suporte, usa-se toque. HTTPS e permissão do navegador/iframe são requisitos para leitura do sensor.

Exemplo de propriedades em uma section `hero360-tour`:

```json
{"motionEnabled":true,"motionActivation":"button","motionSensitivity":50,"motionSmoothing":65,"motionRecenter":true,"motionTouchFallback":true}
```


## 6.0.74 — Hero360Tour 1.2.1 — correção de inicialização

Hotfix de inicialização dos listeners do modo giroscópio. A versão 1.2.0 podia interromper o runtime antes da cena ser renderizada, mostrando fundo preto. Na 1.2.1 os listeners são preparados antes de qualquer registro. O modo 360, hotspots, entradas por yaw/pitch/HFOV, WebGL, Canvas 2D e suporte opcional a sensores são preservados. Para geração por IA, use `hero360-tour` com os parâmetros documentados em 6.0.73 e utilize a versão 1.2.1 do plugin.


## 6.0.77 — Hero360Tour 1.2.2 — orientação móvel

O componente `hero360-tour` usa os parâmetros de movimento existentes (`motionEnabled`, `motionActivation`, `motionSensitivity`, `motionSmoothing`, `motionRecenter`, `motionTouchFallback`) para Android e iOS. Ao exportar, mantenha HTTPS e uma política de permissões que não bloqueie `accelerometer` ou `gyroscope`. Para iframes externos, configure `allow` para sensores e teste no aparelho real. Caso não receba orientações, o componente exibe diagnóstico, mantém toque e hotspots.


## 6.0.78 — Hero360Tour 1.2.5 — navegação imersiva discreta

Para projetos com Hero360Tour, o sistema admite `motionEnabled`, `motionActivation`, `motionSensitivity`, `motionSmoothing` e `motionTouchFallback`. A ativação móvel mostra **Explorar em 360°** e, quando ativo, **Desativar movimento**. O visitante NÃO visualiza diagnósticos ou botão separado de recalibração. A calibração inicial, mudanças de orientação e entrada em outras cenas são automáticas. O campo legado `motionRecenter` pode existir em JSONs antigos, mas é ignorado na interface pública. Priorize movimento suave e desempenho; não ative sensores sem consentimento quando requerido, e preserve fallback por toque. Teste em HTTPS e dispositivos reais.

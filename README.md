# Imobify Studio 7.3.4 — Smart Plant: fechar modal, transferir contexto e navegar à âncora

**Base herdada da 7.2.0-r1:** corrige falso bloqueio em URLs sem `/` final, domínio em maiúsculas, espaços acidentais e parâmetros. A URL da tag canonical, Open Graph e sitemap é normalizada; URLs divergentes continuam sendo erros.

**Base:** Imobify Studio 7.2.1 fornecida para atualização. Mantida a arquitetura web/JavaScript com exportação de landing pages estáticas. O painel de revisão «Agente IA» foi removido do editor; não foi removida a navegação agêntica das páginas exportadas.

## Como executar

Na pasta deste projeto execute `python3 -m http.server 8765` e acesse `http://localhost:8765/` (o acesso por `file://` não é suportado). Continue editando, importando e salvando projetos JSON como antes.

## Como configurar a exportação

Em **SEO**, informe o título, a descrição e principalmente a **URL canônica HTTPS exata** onde a landing page será publicada; habilite **Gerar sitemap.xml + mapa das imagens**. Use uma URL terminada em `/` quando a página estiver na raiz de uma pasta ou domínio. A opção “Não gerar” permanece disponível para projetos que deliberadamente não publicam sitemap.

Clique em **Exportar ZIP**. O compilador normaliza as imagens incorporadas, gera `robots.txt`, `sitemap.xml` com extensão `image:image`, `llms.txt`, `llms-full.txt` e os catálogos de descoberta, e executa checagens antes de disponibilizar o ZIP. Erros estruturais interrompem a geração; avisos de conteúdo e de ambiente são entregues em `VALIDACAO-EXPORTACAO.txt` e `content/export-validation.json`.

## Arquivos da landing page publicada

- `index.html` com metadados públicos, canonical, JSON-LD e conteúdo semântico.
- `sitemap.xml` com URL canônica e imagens reais, absolutas, deduplicadas, de plugins e CSS/HTML, quando habilitado.
- `robots.txt` com URL do sitemap e regras separadas para busca e treinamento de IA, conforme configuração.
- `llms.txt` e `llms-full.txt` com informações públicas extraídas das seções visíveis.
- `ai-catalog.json` e `.well-known/ai-catalog.json`, sem anunciar serviços MCP que não existem.
- `assets/js/agentic.js` para WebMCP progressivo em navegadores compatíveis, sem autoenvio dos formulários.
- `content/agentic-audit.json`, `content/export-validation.json` e `VALIDACAO-EXPORTACAO.txt` para auditoria.

Documentos privados `aiReferences` de projetos antigos não são incluídos na exportação pública. Não há garantia de indexação ou ranking por gerar sitemap/llms. Valide a página publicada no **Google Search Console** (Inspeção de URL + Sitemaps) e use **Lighthouse** num domínio HTTPS para testar as capacidades de navegador que não podem ser certificadas estaticamente.

No **Smart Plant**, em Ação escolha **Formulário**, selecione o destino **Form Sender V4** ou **Agendamento Sender** (ou modo Automático) e informe a âncora da respectiva seção sem `#`. Ao confirmar a planta, a página rola imediatamente até a âncora e ativa o campo de nome. É necessário reexportar a landing page para publicar essa correção.

Para a correção mais recente do Smart Plant, consulte `CHANGELOG-7.3.4.md` e `VALIDACAO-7.3.4.md`. Para a correção de âncoras consulte `CHANGELOG-7.3.0.md` e `VALIDACAO-7.3.0.md`. Para os recursos de SEO, consulte `CHANGELOG-7.2.0.md` e `VALIDACAO-7.2.0.md`.

---

## Histórico das versões anteriores


> **Versão 6.0.83:** Benefits Showcase 1.2.1 passou a herdar margens horizontais, tipografia e espaçamento do Design System; correção do offset superior no fundo fotográfico fixo. Consulte `CHANGELOG-6.0.83.md` e `VALIDACAO-6.0.83.md`.
> **Versão 6.0.82:** Benefits Showcase 1.2.0 recebeu imagem de fundo fixa durante o scroll, overlay configurável para leitura, enquadramento vertical e botão remover. Consulte `CHANGELOG-6.0.82.md` e `VALIDACAO-6.0.82.md`.
> **Versão 6.0.81:** Hero360Tour 1.2.7 adiciona no inspetor o controle do delay de ocultação do texto do Hero (2–10 s, padrão 5 s), visível ao operador e aplicado também ao HTML exportado. O texto retorna após 10 s de inatividade, com duração mínima de 2 s oculto. Consulte `CHANGELOG-6.0.81.md` e `VALIDACAO-6.0.81.md`.
> **Versão 6.0.80:** Smart Plant 1.4.4 integrado ao motor de estilos do core (Wizard de Tipografia, cores, CTAs, ritmo, modal em portal e override local). Corrigida também a classificação h3/heading no motor compartilhado. Consulte `CHANGELOG-6.0.80.md` e `VALIDACAO-6.0.80.md`.
> Versão 6.0.78: Hero360Tour 1.2.5 com movimento recalibrado e interface pública de um único botão; consulte `CHANGELOG-6.0.78.md`.
> Versão 6.0.74: correção de tela preta na inicialização do Hero360Tour 1.2.1; consulte `CHANGELOG-6.0.74.md`.
> Versão 6.0.74: Hero360Tour 1.2.0 com modo de orientação por sensores no mobile/tablet. Consulte `CHANGELOG-6.0.74.md`.

> Versão 6.0.72: correção de panoramas pretos no Hero360Tour WebGL e fallback persistente. Consulte `CHANGELOG-6.0.72.md`.

> Versão 6.0.71: revisão Hero360Tour Studio, captura de ângulo persistente e renderização resiliente na prévia geral. Consulte `CHANGELOG-6.0.71.md`.

> Versão 6.0.70: Agendamento Sender com tema global, presets e dias indisponíveis riscados. Consulte `CHANGELOG-6.0.70.md`.

> Atualização 6.0.67: notificações visuais no Agendamento Sender compatíveis com o FormSender V4. Consulte `CHANGELOG-6.0.67.md`.

# Imobify Studio — 6.0.74

Nova section **Agendamento Sender** para solicitar visitas pelo FormSender v4; veja `CHANGELOG-6.0.66.md`.

# Imobify Studio — 6.0.62

Novo componente **Editorial Motion** em `plugins/editorial-motion`. Consulte `CHANGELOG-6.0.59.md`.

# Imobify Studio — 6.0.43

Atualização 6.0.43: adicionados **Hero360Tour** e **Parallax360Tour**, com editor 360, hotspots, banners e navegação imersiva. Veja `GUIA-HERO360-PARALLAX360.md`.

Atualização SEO: ícone e imagem de compartilhamento PNG/WebP armazenados na raiz dos ZIPs exportados. Upload de ambos na aba SEO, sem modificar os projetos salvos. Consulte CHANGELOG.md e VALIDACAO-6.0.43.md.

## Histórico da 6.0.41

Atualização incremental de acabamento visual e técnico dos plugins. Para usar, abra `index.html` pelo servidor local e consulte o **CHANGELOG.md**. A nova seção **Destaques** apresenta três estilos de layout, 2/3/4 colunas, marcadores, texto de apoio e CTA opcional. Seus itens continuam usando uma linha por destaque em `Título|descrição`, compatível com projetos antigos.

A nova camada transversal de acessibilidade e acabamento aplica foco visível, tratamento de textos e proteção responsiva a todos os plugins, sem alterar sua lógica específica. Consulte `AUDITORIA-FINAL-PLUGINS-6.0.41.csv` e `VALIDACAO-6.0.41.md` para saber quais plugins receberam ajustes específicos e quais validações ainda são necessárias.

---

# Imobify Studio — 6.0.40

## Wizard de Tipografia e Estilo

Na aba **Design** escolha **Abrir Wizard de Tipografia e Estilo**. Selecione um perfil visual, personalize **Eyebrow / Headline / Subheadline / Body Text / CTA**, revise no modo desktop e mobile e clique em **Aplicar ao projeto**. O Wizard cria tokens globais usados pelo mesmo renderizador do editor e pelo HTML compilado.

O Wizard **não aplica estilos automaticamente em projetos antigos**: só ativa `brand.typographyWizardEnabled` após a confirmação. Para respeitar estilos particulares (Hero Plus, Parallax etc.), selecione o plugin e escolha **Tipografia deste plugin → Preservar estilo próprio** no inspetor. Em outros plugins, a hierarquia definida pelo Wizard se torna o padrão. Isso não altera o texto, os links nem as interações dos componentes.

Confira `AUDITORIA-TIPOGRAFIA-PLUGINS.csv`, `CHANGELOG.md` e `VALIDACAO-6.0.40.md` para o inventário, limites e os testes executados.

---

## Imobify Studio 5.12.5

Inclui Tour 360 Pro 3.2.0 como section com configuração em modal. Veja `CHANGELOG-v5.12.5.md`.

# Imobify Studio 5.8.2 — Production Builder

A linha **5.4.x** amplia o **Slider imobiliário** com quantidade livre de slides e um painel visual de gerenciamento. Agora cada slide pode ser adicionado, removido, reordenado e editado individualmente, com imagem, Hero/chamada, título, texto e CTA opcional. Projetos antigos com os três slides fixos continuam compatíveis e são migrados no próprio editor/runtime.

A versão **5.8.2** corrige a exportação da tipografia do Parallax: fontes globais dos banners e fontes configuradas por ponto-chave agora são detectadas, carregadas no HTML publicado e respeitam pesos de 300 a 900.

## Slider imobiliário 1.2.0

O Slider imobiliário usa uma coleção dinâmica de slides. No Inspector, o painel **Slides** permite:

- **＋ Adicionar** novos slides sem limite fixo de três itens;
- **− Remover** o slide selecionado, mantendo no mínimo um slide;
- **Editar** imagem, texto alternativo, Hero/chamada, título e texto;
- ordenar com **↑ / ↓** ou arrastando a linha do slide;
- ativar ou desativar **Exibir botão** e, quando ativo, informar texto e link do CTA.
- ajustar a **margem interna de todo o conteúdo** (Hero, título, texto e CTA) separadamente no desktop e no mobile;
- ativar **Preencher na horizontal** para full-bleed ou manter o slider limitado ao container pai;
- escolher controles **redondos/quadrados** e posicioná-los no **meio/rodapé**.

Os projetos antigos com `image1..3`, `eyebrow1..3`, `title1..3`, `copy1..3`, `cta1..3` e `link1..3` continuam sendo lidos. Na primeira alteração pelo novo painel, a instância passa a salvar a coleção dinâmica em `slides`, mantendo os três primeiros campos legados sincronizados para compatibilidade.

## Presets de projeto

- Registro central: `presets/presets.json`.
- Cada entrada informa nome, descrição, categoria e o diretório do preset.
- Cada diretório contém `preset.json`.
- Na aba **Projeto**, o preset pode criar um novo projeto ou ser aplicado ao projeto atual.
- **Salvar projeto atual como preset** permite cadastrar a composição em uso.
- Em Chrome/Edge compatível, **Salvar no Studio** pede a pasta raiz do Imobify Studio e atualiza automaticamente `presets/presets.json` + `presets/<id>/preset.json`.
- **Exportar ZIP** gera um pacote portátil quando acesso direto à pasta não estiver disponível.

### Formato mínimo do registro

```json
{
  "schemaVersion": 1,
  "presets": [
    {
      "id": "meu-preset",
      "name": "Meu preset",
      "description": "Descrição do uso",
      "category": "Personalizado",
      "directory": "presets/meu-preset",
      "file": "preset.json"
    }
  ]
}
```


Framework visual para produzir landing pages imobiliárias estáticas, responsivas e orientadas à conversão. Combina **Plugin Play**, sistema global de design e produção em escala. A versão **5.0.1.18** adicionou o **Possibility Path Pro**, a biblioteca global de ícones Font Awesome, corrigiu o Magazine Text Pro como Plugin Play nativo e manteve “Rolar para explorar” durante o stand-by dos cards do Scrollytelling Video. A versão **5.0.1.15** adicionou um kit global de botões reutilizável por todo o framework e plugins, com modelos visuais e interações avançadas. A versão **5.0.1.14** corrigiu a aplicação efetiva dos efeitos do Perfil Visual no projeto real. Veja os changelogs para o histórico completo.

## SEO & AI Engine 5.0

A aba **SEO** agora também mede a prontidão estrutural do resultado em cinco eixos. O pacote publicado gera arquivos de rastreamento e diagnóstico automaticamente. A configuração padrão permite `OAI-SearchBot` para descoberta em busca do ChatGPT e bloqueia `GPTBot` para treinamento; ambos podem ser alterados no projeto.

Para E-E-A-T e escala, preencha responsável, CRECI, data de revisão, fontes e **contexto local/exclusivo**. Esses campos não servem para inserir palavras-chave artificiais: eles registram procedência e diferenças reais entre páginas.

O valor de **Readiness** não substitui PageSpeed Insights, Lighthouse, CrUX ou Search Console. Core Web Vitals reais dependem também de hospedagem, rede, peso das mídias e comportamento dos usuários.

## Como abrir

Por segurança, navegadores bloqueiam o carregamento de arquivos CSS e JavaScript modulares quando o editor é aberto diretamente por `file://`. Inicie um servidor local na pasta do framework:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Fluxo recomendado

1. Escolha o método de persuasão: AIDA, PAS, BAB ou 4 Ps.
2. Defina o perfil de condução: consultivo, moradia, investimento ou oportunidade.
3. Aplique o roteiro recomendado e ajuste a ordem das seções por arrastar e soltar.
4. Quando precisar de uma composição complexa, crie um **Segmento**, escolha colunas ou linhas e insira os componentes diretamente nas células da prévia.
5. Adicione, remova ou habilite plugins na biblioteca. Para instalar um componente externo, arraste o ZIP em **Plugin Play**.
6. Escolha um preset em Design ou importe um arquivo de `models/`.
7. Edite conteúdo, imagens, CTA, WhatsApp, condições e dados legais no inspetor. Quando um trecho precisar fugir do padrão, ative **Estilo local · 5.2** na própria seção.
8. Complete SEO, Open Graph e os dados estruturados.
9. Duplique projetos e aplique os dados globais para produzir novas páginas rapidamente.
10. Use **Exportar ZIP** para uma página ou **Exportar todos em lote** para gerar vários projetos.

## Editor de produção

- inserção visual de seção entre blocos pelo botão `+` na prévia;
- segmentos com 1–5 colunas ou 1–5 linhas, células explícitas e vários componentes por célula;
- reposicionamento de itens pelo inspetor ou pelos controles da lista estrutural;
- arrastar e soltar, mover, duplicar, ocultar e excluir seções;
- biblioteca de blocos reutilizáveis;
- quatro modelos: lançamento, terreno e construção, investimento e oferta rápida;
- dados globais para empreendimento, cidade, endereço, preço, corretor, CRECI, contatos e endpoint;
- biblioteca local de projetos, duplicação e exportação em lote;
- rolagem contínua ou encaixe suave entre seções;
- transições individuais por seção;
- **Estilo local · 5.2**: exceções visuais por seção com herança global por padrão;
- fundo por token global (superfície, escuro, primária, destaque), cor própria ou gradiente;
- cores independentes para título, corpo e eyebrow, com contraste automático opcional;
- fonte local para títulos e textos, peso, tracking, tamanho e entrelinha;
- efeitos locais de texto (suave, contraste, cinematográfico e glow) e espaçamento vertical fino;
- slider imobiliário com autoplay, setas, indicadores, teclado e gesto no mobile.

## Estrutura

```text
assets/                 interface do editor e imagens demonstrativas
core/                   CSS base e runtime da landing compilada
models/                 presets visuais independentes
plugins/<plugin>/       manifesto, CSS e JavaScript de cada plugin
plugin-packs/           ZIPs prontos para instalar
plugin-sdk/             contrato, schema e pacote inicial
vendor/                 biblioteca local usada pelo compilador ZIP
index.html              editor visual
project.json            metadados do framework
```

## Plugins incluídos

- Segmento — compositor nativo em colunas ou linhas
- Only TEXT — Context — título, linha fina, lide e corpo com tipografia ajustável
- YouTube — frame responsivo com ID/URL, autoplay e controles
- Botão — CTA único integrado ao Button Kit global
- Imagem Single — imagem responsiva individual com legenda e link
- Hero imobiliário
- Hero Imobiliário Plus — slides, movimento cinematográfico, partículas e Studio tipográfico avançado
- Destaques
- Ficha do imóvel
- Galeria imersiva
- Lifestyle
- Condições de pagamento
- Localização
- Depoimentos
- Perguntas frequentes
- Formulário de contato com LGPD e WhatsApp
- Slider imobiliário
- Rodapé profissional — sete canais sociais e redes adicionais configuráveis
- Menu fixo
- WhatsApp flutuante
- Revelação suave no scroll
- Lightbox de galeria
- AR Card Popout 3D Single
- Flip Card 3D Single v4.4
- Flip Card 3D Video Single v1.1
- Galeria Big Four v2.2
- Form Sender v4 original, carregado por adaptador não invasivo

Os plugins internos continuam no catálogo. Pacotes Plugin Play usam `plugin.json`, template e um ou mais arquivos CSS/JS, sendo registrados automaticamente. `Location` também usa este fluxo desde a v4.1.0. Não é necessário editar `assets/js/catalog.js`.

Desde a v4.0, o Slider imobiliário (`property-slider`) é um pacote Plugin Play "incluído" (antes era uma definição duplicada e desatualizada dentro de `catalog.js`). IDs listados em `plugins/registry.json → corePlugins` (os componentes que permanecem hardcoded, como Hero e Rodapé) não podem ser sobrescritos por um ZIP instalado — a tentativa é rejeitada.

## Form.v4 preservado

Os arquivos `css/formulario.css`, `css/notify-send.css`, `js/formulario.js` e `js/notify-send.js` são cópias byte a byte do pacote enviado. O editor não reescreve o formulário. `adapter.css` cuida apenas da posição da seção e `adapter.js` passa as opções do inspetor para `formsenderJS.Plugin`.

## Instalar um Plugin Play

1. Abra **Estrutura**.
2. Arraste o arquivo `.zip` para o quadro **Plugin Play** ou clique em **Instalar plugin .zip**.
3. Confirme o nome e a versão do pacote.
4. Clique no novo componente na biblioteca para adicioná-lo à página.
5. Edite seus campos no inspetor e reordene como qualquer outra seção.

O pacote fica salvo localmente no navegador. Em **Projeto → Componentes instalados**, plugins importados podem ser removidos. Plugins incluídos no framework aparecem identificados como Plugin Play.

## Criar novos plugins

Consulte `plugin-sdk/PLUGIN-SDK.md` e use `plugin-packs/plugin-starter.zip`. O importador valida estrutura, identificador, versão, arquivos de entrada e campos. Imagens, vídeos, áudios e fontes colocados dentro de `assets/` são incorporados automaticamente ao instalar.

Importante: um plugin pode executar JavaScript na landing page. Instale somente pacotes de origem confiável.

## Presets de componentes

Selecione um componente e abra o botão de três linhas no cabeçalho do inspetor. O menu permite:

- salvar somente o estado do componente selecionado;
- salvar o grupo inteiro quando a seleção pertence a um Segmento ou Floating Container;
- carregar um arquivo `.saved.json` no componente ou grupo compatível.

Os arquivos usam o padrão `nome-do-componente.saved.json`. Ao carregar, o editor preserva o ID da instância e a posição externa no Segmento, evitando quebrar âncoras e chamadas de Floating Container.

## Compilação

O ZIP gerado contém somente os arquivos necessários para publicação:

- `index.html`
- `assets/css/site.css`
- `assets/js/site.js`
- `assets/images/`
- `assets/video/` (quando houver)
- `assets/audio/` (quando houver)
- `assets/files/` (quando houver)
- `content/project.json`
- `content/plugins-enabled.json`

Os CSS e JavaScript são combinados apenas com os plugins publicados. Seções ocultas não carregam seus assets na saída. Imagens, vídeos e áudios locais usados por campos do projeto são incorporados ao pacote; URLs HTTPS externas permanecem externas.

## Testes de regressão

Execute:

```bash
node tests/plugin-play.test.cjs
```

A suíte carrega os pacotes bundled, percorre todos os `.zip` de `plugin-packs/`, compila uma landing de teste e valida mídia, segurança, versionamento e regressões principais do Plugin Play.

## Publicação

O ZIP também inclui `_headers` e `security/headers.conf` com uma política CSP de cabeçalho (incluindo `frame-ancestors`). A CSP via `<meta>` mantém apenas diretivas suportadas nesse modo.

Extraia o ZIP gerado e envie todo o conteúdo para GitHub Pages, Cloudflare Pages, Netlify, Vercel, hospedagem cPanel ou Apache/Nginx. A página final é HTML5, CSS e JavaScript puros.

## Observações comerciais e legais

Use escassez somente quando houver disponibilidade real. Revise valores, previsão de entrega, incorporação, condições de financiamento, CRECI, política de privacidade e consentimento antes da publicação.



## Perfil Visual — botões de ação (5.0.0)

O Perfil Visual agora possui tokens globais para **fundo dos botões de ação** e **cor da fonte dos botões**. Eles são propagados para CTAs nativos e Plugin Play compatíveis (Hero, Payment, Lead Form, Property Slider, Form Sender, Offer Price Pro, Financing Simulator Pro, Scrollytelling e Flip Cards). Plugins com aparência local explícita, como o WhatsApp flutuante e o CTA do Menu Pro, continuam podendo sobrescrever o padrão do projeto.

## Novos componentes estruturais — 4.1.0

A versão 4.1.0 adiciona seis componentes Plugin Play integrados ao Perfil Visual: `Section Layout Pro`, `Spacer Divider Pro`, `Offer Price Pro`, `Timeline Process Pro`, `Hotspot Plant Pro` e `Financing Simulator Pro`. O `Section Layout Pro` introduz composição real: ele organiza os próximos blocos/plugins em grid responsivo, sem converter os filhos em conteúdo estático.


## Visibilidade responsiva — 5.0.1

Toda seção/plugin do tipo `section` recebe automaticamente as chaves **Ocultar no mobile** e **Ocultar no desktop** no inspetor, sem exigir alteração no manifesto do plugin. O breakpoint padrão é `720px`, alinhado ao Design System: mobile é `<= 720px` e desktop é `>= 721px`. Na publicação, o bloco oculto não reserva espaço. No editor, a viewport correspondente exibe um marcador selecionável (**Oculto no mobile** ou **Oculto no desktop**) para permitir reativação e edição. Assim é possível criar uma seção exclusiva para desktop e outra exclusiva para mobile. Plugins atuais e futuros do tipo `section` herdam essa capacidade automaticamente. Projetos antigos recebem `hideDesktop: false` na normalização.




## Kit global de botões — 5.0.1.15

- **16 modelos/efeitos**: Sólido Premium, Soft Shadow, 3D Profundidade, 3D + Glow, Glass, Liquid Glass, Glow, Shine Sweep, Gradient Flow, Pulse CTA, Border Reveal, Fill Slide, Magnetic Hover, Scale Pop, Ripple e Neon Edge.
- **Modelos rápidos** aplicam combinações coerentes de profundidade, glow, vidro, brilho, borda, escala e velocidade; todos os parâmetros continuam editáveis.
- **Efeito de clique independente**: Press, Ripple, Bounce, Flash ou Nenhum.
- A camada semântica global reconhece CTAs conhecidos e também padrões genéricos de classes `*-cta`, `__cta`, `_cta`, `btn-primary` e `data-design-role="cta"`.
- Plugins futuros podem registrar explicitamente um CTA com `data-design-role="cta"` ou `Imobify.registerCTA(element)`.
- Magnetic Hover e Ripple são implementados no runtime global, com `prefers-reduced-motion` respeitado e foco por teclado preservado.
- Texto, URL, dimensões, posicionamento e mecânicas próprias do plugin não são substituídos pelo kit.

## Efeitos tipográficos e materiais de CTA — 5.0.1.14

- Títulos e subtítulos têm controles independentes de **borda proporcional ao tamanho da fonte**, cor do contorno e sombra.
- Sombras: **sem sombra, suave, contraste multicamada, cinematográfica e halo/brilho**, com cor e intensidade configuráveis.
- Botões de ação: cor de fundo, cor da fonte e materiais **plano, profundidade, glow, vidro e profundidade + glow**.
- Ajustes adicionais de profundidade, glow, opacidade/blur do vidro, brilho interno e espessura da borda.
- O painel Design inclui uma prévia de título, subtítulo e CTA durante a personalização.

## Destaque óptico e preset Branco — 5.0.1.12

- O contraste continua escolhendo a cor legível, mas agora o perfil também controla separação óptica do texto por sombra, halo e microcontorno.
- Modos: **Automático**, **Suave**, **Forte** e **Sem efeito**, com intensidade de 0 a 100.
- Em fundos escuros, fotografia e vídeo, o texto claro recebe reforço maior; em superfícies claras o tratamento é deliberadamente discreto.
- Novo preset **Branco Essencial**: branco dominante, preto profundo, cinzas neutros e CTA preto de alto contraste.

## Contraste funcional e reordenação — 5.0.1.11

- Modos de contraste: **WCAG AA automático**, **AAA / conforto alto** e **Manual**.
- O sistema preserva a paleta escolhida quando há contraste suficiente e corrige somente o foreground quando a leitura cai abaixo do limite.
- Tokens semânticos específicos para fundo claro, fundo escuro, branco, `primary`, `accent` e CTA.
- Diagnóstico de contraste no painel Design com relação numérica e indicação das combinações que serão protegidas.
- Bridges adicionais para Hero, pagamento, simulador, timeline, hotspot, FAQ, localização, depoimentos, cards, menu e rodapé.
- Em **Estrutura**, a linha inteira da seção pode ser arrastada com mouse/ponteiro, exceto os botões de ação.
- Indicadores de drop antes/depois e auto-scroll na coluna durante a reordenação.
- Botões ↑/↓ usam a mesma hierarquia lógica da lista e ficam desativados somente quando realmente não há movimento naquele nível.

## Contraste e ordem — 5.0.1.11

- **Contraste funcional:** modo AA automático, conforto alto e manual. Títulos, corpo, textos de apoio, destaques e CTAs recebem foreground compatível com o fundo sem alterar a paleta quando ela já é legível.
- **Cores locais protegidas:** Menu fixo, WhatsApp flutuante e Tabela Investimento/Glass CTA calculam contraste também quando suas cores são personalizadas dentro do próprio plugin.
- **Estrutura arrastável:** pegue qualquer área livre da linha da seção e arraste para cima/baixo. O indicador mostra se a queda será antes ou depois; ↑/↓ usam a mesma lógica de ordem.

## Edição de seções — 5.0.1.10

- Enquanto existir uma seção selecionada no Inspetor, todo rerender do preview mantém **aquele plugin visível**.
- O foco usa o ID lógico da seção e acompanha mudanças de altura do bloco; não depende mais apenas da posição absoluta do scroll.
- O drag & drop usa zonas antes/depois e respeita layouts aninhados.
- Mover blocos para dentro/fora de `Section Layout Pro` ajusta automaticamente a quantidade de filhos.
- Qualquer seção pode ser ocultada da publicação sem desaparecer do editor.
- Qualquer plugin `type: section` recebe uma âncora global (`settings.anchorId`) para navegação por `#id`.

## Design guiado — 5.0.1.10

O painel **Design** agora combina presets completos com técnicas de harmonia de cor e perfis tipográficos. A técnica pode gerar uma paleta a partir da cor principal e, depois, cada cor continua editável individualmente. Também há controles de largura ideal de leitura e tracking das chamadas curtas.

## Marketing popular / MCMV — 5.0.1.10

O painel **Estratégia comercial** inclui roteiros específicos para produto popular/Minha Casa Minha Vida: resultado primeiro, saída do aluguel, casa + pátio, terreno + construção, quebra de objeções e oferta direta. Os roteiros organizam seções e copy-base, mas não prometem aprovação, subsídio ou condição financeira sem análise.

## Studio 5.9.5 · Form Sender v4.3.0
O Form Sender ganhou Complementação rápida antes do envio, com três perguntas configuráveis, respostas por toque e opção de pular. As respostas são anexadas à mensagem enviada sem transformar o primeiro contato em um formulário longo.


## Studio 5.10.0 · Form Sender v4.4.0
Complementação rápida progressiva no mobile e autocomplete configurável para nome, e-mail e telefone.

## Studio 5.10.1 · Form Sender v4.4.1

O questionário adicional mobile agora abre como modal centralizado, mostra uma pergunta por vez e se adapta automaticamente à viewport sem scroll interno ou conteúdo cortado. O backdrop é neutro: clicar fora nunca confirma nem envia. O botão de fechar cancela a etapa; apenas ações explícitas finalizam o envio.


## Studio 5.10.2 · Form Sender v4.4.2
No mobile, a complementação rápida agora avança automaticamente ao tocar em respostas simples e envia automaticamente após a última resposta. O modal tornou-se obrigatório enquanto estiver aberto: não possui X nem “Pular e enviar”, o backdrop é neutro e Escape não fecha. No desktop, as perguntas continuam juntas com conclusão explícita.

### v6.0.45 — Panorama Full Bleed

Hero360Tour e Parallax360Tour agora exibem a cena sem margens, bordas ou cantos arredondados; altura independente continua configurável.


## 6.0.70 — Agendamento Sender 1.2.0
O plugin **Agendamento Sender** inclui calendário animado em SVG no painel de conversão à direita, perfis Spotlight/Imersivo/Editorial, presets anteriores, herança de tokens globais, seletor de turnos específico para cada dia e fuso IANA configurável. A exportação inclui tudo localmente no HTML/CSS/JS; o FormSender V4 recebe uma **solicitação**, não confirmação de disponibilidade. A documentação técnica atualizada está em `plugins/agendamento-sender/README.md` e no manual MD para IA.

### Hero360Tour 1.2.3 — fontes de sensores

Reconhece leituras de orientação estáticas, tenta um sensor alternativo em Android/Chromium, solicita permissão de movimento no iOS, e, quando disponível, usa a taxa de rotação de devicemotion como fallback (sujeito a deriva). Testes com sensores simulados não substituem validação em smartphones reais.

### Hero360Tour 1.2.5 — calibração automática e interface limpa

Removido o painel de debug na tela do visitante. O único controle de sensor é **Explorar em 360°**, que alterna para **Desativar movimento**. A calibração é automática na ativação, troca de cena ou orientação da tela, com filtro de ruído e respostas mais rápidas. Validação física em aparelhos ainda necessária.

### Correção 7.3.5 — Smart Plant
O CTA Form Sender V4/Agendamento Sender fecha o modal **sem animar o retorno às plantas**, escreve a seleção da planta e navega para a âncora configurada, por exemplo `contato`. O fechamento manual (X, Esc, fundo) preserva a posição nas plantas. Consulte `CHANGELOG-7.3.5.md`.

### Fundo de seção — 7.3.6
Em qualquer plugin visual, selecione **Fundo da seção** no inspetor e ative. Use **Cor** (sólida ou gradiente) ou **Imagem** (estática, fixa ou repeat). O upload é incorporado ao ZIP de exportação; o fundo original permanece quando o controle está desligado. Consulte `CHANGELOG-7.3.6.md`.

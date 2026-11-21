# Imobify Studio 5.0.0 — SEO, IA e Qualidade em Escala

A versão 5.0 muda o foco do construtor: além de montar a página, o pacote publicado recebe uma camada automática de prontidão técnica para busca, rastreamento e produção em escala.

## 5.1.30

- remove o botão `collapseInspector` do painel direito;
- adiciona um menu compacto de três linhas para salvar e carregar estados individuais de componentes;
- exporta grupos completos de Segmento ou container sem salvar o restante do projeto;
- usa o padrão de arquivo `nome-do-componente.saved.json` e preserva IDs de instância e posições externas ao carregar;
- corrige o interpretador de condicionais aninhadas, eliminando o vazamento visual de `{{/if}}` no Floating Container;
- adiciona os plugins **Botão** e **Imagem Single**, ambos com uma unidade por instância e compatibilidade com Segmentos.

## 5.0.1.29

- atualiza o **Rodapé profissional** para a versão 1.1.0;
- adiciona Facebook, WhatsApp, Instagram, TikTok, YouTube, Google Meu Negócio e LinkedIn com URLs editáveis e pré-configuradas;
- permite incluir redes adicionais no formato `Nome | URL do ícone | URL do perfil`;
- adiciona estilos sólido, contorno e minimalista, opção de exibir nomes e controle do tamanho dos ícones;
- valida URLs externas, aplica abertura segura em nova aba e mantém o rodapé legado sem redes sociais quando esses campos não existem.

## 5.0.1.28

- converte AR Card Popout 3D, Flip Card 3D e Flip Card 3D Video para cardinalidade `single`;
- remove grades internas dos três templates: uma instância agora renderiza exatamente um card;
- usa o Segmento nativo para compor múltiplos cards em linhas ou colunas;
- migra projetos antigos, desmembrando cards habilitados e preservando conteúdo, IDs e configurações;
- adiciona os três pacotes instaláveis atualizados e testes de cardinalidade, renderização e migração.

## 5.0.1.27

- adiciona **Only TEXT — Context** com título, subtítulo/linha fina, lide e corpo;
- permite ajustar famílias, tamanhos, pesos, entrelinhas, alinhamento, colunas, cores e efeitos tipográficos;
- adiciona player **YouTube** responsivo por ID ou URL com autoplay, controles, loop, recorte temporal, legendas e modo de privacidade;
- os dois plugins declaram `composition.role: both` e podem ocupar uma página ou uma célula de Segmento;
- mantém compatibilidade com todos os plugins e projetos anteriores.

## 5.0.1.26

- adiciona Segmentos nativos com 1 a 5 colunas ou 1 a 5 linhas;
- cada célula aceita múltiplos componentes e possui inserção contextual na prévia;
- itens podem ser reposicionados entre células pelo inspetor ou pela lista estrutural;
- SDK passa a declarar `composition.role` como `section`, `item` ou `both`;
- plugins antigos sem a nova declaração continuam compatíveis como componentes flexíveis;
- mantém `Section Layout Pro` e `Floating Container Pro` no modo legado `next-sections`.

## 5.0.1.25

- JSON-LD imobiliário migrado de `Product` para `RealEstateListing` + `Residence`.
- `Offer` opcional e seguro, com normalização correta de preços brasileiros.
- Corrige alerta crítico de Product snippets no Google Search Console.

## Resultado compilado

- `robots.txt` gerado automaticamente.
- `sitemap.xml` com suporte a imagens quando existe URL canônica válida.
- política separada para `OAI-SearchBot` (descoberta em ChatGPT Search) e `GPTBot` (treinamento).
- `content/seo-readiness.json` e `SEO-READINESS.txt` com cinco indicadores estruturais.
- exportação em lote inclui `RELATORIO-CONTEUDO-REPETITIVO.csv` para sinalizar similaridade entre páginas.

## Core Web Vitals potencial

- imagem principal do Hero deixou de ser apenas `background-image` e passou a ser `<img>` HTML.
- Hero usa `loading="eager"`, `fetchpriority="high"` e `decoding="async"`.
- preload automático da imagem principal.
- seções abaixo da dobra usam `content-visibility:auto` e tamanho intrínseco de reserva.
- imagens secundárias usam lazy-load/decodificação assíncrona quando aplicável.
- suporte reforçado a `prefers-reduced-motion`.

## Semântica e E-E-A-T

- conteúdo principal é publicado dentro de `<main>`.
- link de salto para acessibilidade.
- ficha do imóvel usa `dl/dt/dd` para pares atributo/valor.
- rodapé pode publicar responsável editorial, especialidade, data de revisão e fontes das informações.
- novos campos: autor, especialidade, URL do autor, organização, data de revisão, fontes e contexto local/exclusivo.

## Dados estruturados

O JSON-LD passa a usar `@graph` relacionando:

- `WebSite`;
- `WebPage`;
- `Organization` + `RealEstateAgent`;
- `Person` (responsável/autoria, quando preenchido);
- `Product` + `Offer` para o imóvel/oferta.

## Produção em escala

O exportador em lote calcula similaridade lexical entre projetos. Pares com similaridade relevante são registrados no relatório com níveis `ATENCAO`, `MEDIO` e `ALTO`.

O objetivo não é afirmar que conteúdo é "único" por algoritmo, mas impedir que duplicações óbvias passem despercebidas na produção em massa.

## Readiness 5.0

O editor exibe cinco indicadores de prontidão estrutural:

1. Core Web Vitals potencial;
2. Arquitetura de rastreamento;
3. E-E-A-T imobiliário;
4. Descoberta por IA;
5. Produção em escala.

A pontuação é um diagnóstico do construtor e das informações preenchidas. Não é previsão de ranking, Lighthouse ou dados reais do Search Console.

## 5.0.1.24
Correção estrutural do Floating Container Pro: HREF direto funcional com portal no BODY, mobile sem camada invisível bloqueando cliques e layout sem capturar Footer.

# Imobify Studio — instruções para o Claude

Editor web (HTML/CSS/JS puro, sem build) para montar landing pages imobiliárias e exportá-las como ZIP estático.
Publicado em GitHub Pages: https://corretor-fettuccia.github.io/imobfystudio/ (branch `main`, raiz).
Dono: Roberto Fettuccia — corretor, CRECI 83599F, RS. Posicionamento: "Não vendo imóveis, estruturo decisões."

## Regras de trabalho
- Responder em português do Brasil.
- Toda mudança de código vai numa branch nova + Pull Request. Nunca commitar direto na `main` (ela é o site no ar).
- Rodar local: `python3 -m http.server 8765` na raiz e abrir `http://localhost:8765/` (`file://` não funciona).
- Referência obrigatória para criar/editar projetos: `docs/IMOBSTUDIO-GUIA-IA-LANDING-PAGES.md` (contrato do JSON, campos de cada plugin, regras de copy).
- Nunca inventar preço, metragem, prazo, estoque, telefone, URL, endpoint de formulário, pixel/tag ou mídia. Marcar como pendência.
- Não commitar projetos JSON de clientes no repositório (são públicos e trazem imagens, telefones e endpoints).

## Mapa do código
- `index.html` — editor. `assets/js/catalog.js` (plugins core, `createSection`, blueprints), `assets/js/app.js` (estado/normalização), `assets/js/compiler.js` (exportação ZIP).
- `core/` — CSS/JS compartilhado das páginas exportadas: `design-system.css`, `responsive-typography.css`, `base.css`, `runtime.js`, `element-motion.*`.
- `plugins/<id>/plugin.json` + `plugins/registry.json` — componentes (58). Core: hero, hero-plus, highlights, benefits-showcase, specs, gallery, lifestyle, payment, testimonials, faq, footer, info-objetiva, reveal, lightbox.
- `plugin-packs/*.zip` — plugins instaláveis via "Instalar plugin ZIP".
- `presets/` (presets.json + pastas) e `models/blueprints.json` — pontos de partida reais. Nunca inventar IDs de preset.
- `docs/validador-check.js` / `docs/validador-projeto-imobstudio.html` — validador estrutural de projeto JSON.
- Muitos `CHANGELOG-*.md` / `VALIDACAO-*.md` na raiz: histórico de versões; versão atual 7.5.1.

## Formato do projeto JSON (versão 7.5.1)
Chaves de topo: `version, projectId, projectName, preset, strategy, brand, seo, behaviorPlugins, pageSettings, siteData, sections, selectedSectionId, updatedAt, geo, aiReferences`.
- `strategy`: `{method: "aida" | "mcmvResult" | ..., profile: "consultive" | "popular" | ...}`; pode ter `creativeDoctrine` e `principles[]`.
- `brand`: tokens globais — cores (`primary, accent, surface, ink, dark, headingColor, bodyColor, mutedColor, actionButton*`), fontes (`headingFont, bodyFont`), escala (`h1Size, h2Size, h3Size, bodySize`), ritmo (`containerWidth, sectionSpace, contentGap, elementGap, componentPadding, radius`), `paletteTechnique`, `typographyProfile`, efeitos de título/botão.
- `seo`: title, description, keywords, canonical, sitemap*, ogImage, favicon, robots, propertyName, propertySchemaType, address/city/region/postalCode, author*, organization*, lastReviewed, sourceNotes, localInsight, aiSearch, aiTraining.
- `siteData`: propertyName, city, address, price, whatsapp, phone, broker, license, email, endpoint.
- `behaviorPlugins`: normalmente `["reveal", "lightbox", "content-protection"]`. `pageSettings`: `{scrollMode: "flow", motion: "subtle"}`.
- Seção: `{id, type, props, settings}`. `settings` = `visible, hideMobile, hideDesktop, transition, cssClass, anchorId, style{enabled,...}, background{enabled,type,...}, motion, elementMotion`.
- Imagens ficam embutidas como data URI (quase sempre WebP), por isso os projetos pesam de 5 a 9 MB.
- Para criar seção: copiar TODOS os defaults do plugin e trocar só o conteúdo. Selects aceitam apenas os `value` listados no catálogo.
- Listas em texto estruturado, uma linha por item: highlights `titulo|descricao`; specs `valor|rótulo`; faq `pergunta|resposta`; benefits-showcase `icone|titulo|descricao|grupo`.

## Arquivo de tour 360 (separado do projeto)
`{format: "ImobStudioTour360", version: 7, project, settings, sceneOrder[], scenes{id: {title, panorama (data URI), initialView{yaw,pitch,hfov}, hotspots[]}}, branding}`.
Hotspot: `type: "navigation"` (leva a `targetSceneId`, com `targetView` opcional) ou info. Usado por `hero360-tour`, `parallax360-tour`, `tour360-pro` (ver `GUIA-HERO360-PARALLAX360.md`).

## Como o Roberto monta as páginas (aprendido de NAU, Porto Atacama, Aparados, LinQ)
Esqueleto recorrente:
1. Hero (`hero-plus` ou `hero`) com eyebrow em CAIXA ALTA separado por "·" (produto · construtora · bairro · cidade).
2. `property-slider` logo depois do hero (imagens).
3. Blocos de argumento: `highlights`, `lifestyle`, `benefits-showcase` / `beneficios-modal`, `specs`, `only-text-context` (ficha técnica em texto).
4. `button-single` intercalado depois de quase todo bloco forte. O CTA é em primeira pessoa e ligado à dúvida do bloco ("QUERO AVALIAR MINHAS CONDIÇÕES", "Quero comparar lote seco e lote molhado").
5. `location`, planta/implantação (`smart-plant`, `implantacao-tiles-pro`), condições (`payment`, `offer-price-pro`, `payment-investment-glass-pro`).
6. `faq` → `form-sender-v4` (âncora `contato`) → `anti-ia-copy-policy` → `footer`.
7. Utilitários no fim da lista: `menu-fixo-adaptavel-pro`, `whatsapp-flutuante-pro`, `tag-installer-pro`.
- Âncoras usadas: `galeria, logistica, estrutura, conceito, prova, localizacao, implantacao, faq, condicoes, contato`.
- Variantes mobile/desktop são feitas com `hideMobile` / `hideDesktop` em seções duplicadas (ex.: `gallery-big-four` só no desktop + `section-layout-pro` só no mobile).
- Transições de seção preferidas: `liquid-blur`; também zoom, soft-focus, ripple-reveal, mask-reveal, slide-right.

Direções visuais por perfil:
- MCMV / popular (Porto Atacama): Manrope/Inter, paleta 60-30-10 quente (terracota #b5532f, areia #e3b274, creme #fbf6f0), typographyProfile `conversion`, parcela no H1.
- Investimento / loteamento (Aparados): preset `whiteEssential`, monocromático (#111318 / #69717b / branco), Manrope/Inter, tom consultivo, sem prometer valorização.
- Alto padrão / náutico editorial (NAU): DM Serif Display (peso 400, line-height 0.94) + Manrope 18px/1.72, paleta pedra-náutica (#07141A, #0E3140, #F3F0E8), radius 6, bastante respiro (sectionSpace 132). Doutrina "context-first-product-proof": contexto antes do comercial, prova em vez de hype, contenção visual.

Tom de copy: maduro, direto, consultivo; frases curtas em contraste ("Ter embarcação é uma coisa. Tornar o uso simples é outra."); sem clichês ("imperdível", "luxo sem igual") e sem promessas ("valorização garantida").

## Auditoria EC 3.1 (assets/js/section-audit.js) — vale para projetos MCMV
Ativa quando strategy.method / templateMeta / projectName contém "mcmv". Antes de entregar um projeto, deixar a Auditoria sem itens:
- CTAs obrigatórios: hero `primaryCta` = "QUERO MEU APARTAMENTO" (ou "QUERO ME CANDIDATAR"); payment `cta` = "QUERO MINHA PROPOSTA"; form-sender `buttonText` = "GARANTIR MEU CADASTRO"; smart-plant `cardButtonText` = "QUERO ESCOLHER MINHA PLANTA".
- Termos proibidos em qualquer texto: aprovado, garantido/garantida, crédito liberado, sem consulta SPC/Serasa, sem burocracia, grátis, última chance, só hoje, "do governo".
- Títulos, eyebrows, badges e CTAs não podem ter linguagem fraca ("consulte", "conforme tabela", "talvez", "sujeito à análise"). A ressalva vai na nota ou no FAQ. Títulos com até ~12 palavras. Valor em R$ no título ou badge precisa de * e nota.
- Com `anti-ia-copy-policy` na página, usar `seo.aiTraining: "disallow"`.
- Âncoras dos links precisam existir numa seção visível. `image-single` sem imagem deve ficar oculto.
- A exportação ZIP falha sem `seo.canonical` HTTPS quando o sitemap está ligado. Meta description entre 120 e 160 caracteres.
- `seo.sourceNotes` aparece no rodapé publicado ("Fontes:"): escrever em linguagem pública, sem notas internas.
- `location.places` usa o formato `rótulo|texto`: rótulos com até ~6 letras ("Centro", "Lojas", "Saúde"), senão quebram no celular.

## Pontos de atenção conhecidos
- No projeto NAU (19/11), o `hero-plus` ainda está com o texto de demonstração do plugin ("Uma primeira impressão que faz o imóvel parecer único.", badge "Apresentação exclusiva", links `#destaques` que não existem na página).
- No editor publicado: o ícone do card "Agendamento Sender" na biblioteca aparece como o texto "calendar-days"; em 60% de zoom, a prévia corta o hero pela esquerda.

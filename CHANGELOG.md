# Imobify Studio 6.0.52 — Controle do painel de navegação do Hero360Tour

- Atualiza **Hero360Tour para 1.1.2** no plugin ativo e no ZIP Plugin Play.
- Novo campo na inspeção da section, grupo **Navegação**: **Habilitar painel de navegação** (tipo toggle), **desligado nativamente**.
- Com o campo desligado, os botões de **aproximar, afastar e tela cheia não são criados** na landing page exportada; atalhos `+`, `=` e `-` também não fazem zoom.
- Ao ligar, os três controles aparecem e ficam funcionais no Hero360Tour.
- Zoom pela roda do mouse continua desativado; scroll vertical do mouse e touch mantém a navegação pela página.
- Hotspots, navegação entre cenas, textos do Hero e observador de inatividade preservados.
- O editor de panoramas Tour360 Studio mantém controles próprios para o operador posicionar seus hotspots.

---

# Imobify Studio 6.0.51 — Hero360Tour scroll nativo

- Hero360Tour v1.1.1: roda e trackpad deixam de controlar o zoom da cena, permitindo rolagem da landing page.
- Arraste vertical do mouse é limitado a 100 px na câmera, sem limitar o giro horizontal.
- No celular, gesto vertical é reservado ao scroll nativo do navegador; gesto horizontal gira a cena.
- Botões de zoom e navegação por teclado preservados.
- Nenhuma alteração no Tour360 original ou Parallax360Tour.

---

## 6.0.50 — Hero360Tour com esfera nativa

- Base: 6.0.49.
- Hero360Tour 1.1.0: reescrita do runtime público sem dependências de CDN.
- WebGL shader equiretangular verdadeiro, preenchendo todos os pixels da largura.
- Canvas 2D interativo como alternativa para navegadores sem WebGL.
- Navegação direta entre cenas e textos de informação reescritos no próprio Hero.
- Mantidos editor, plugins existentes e estrutura de projeto.

# Imobify Studio 6.0.49

Correção focalizada no Hero360Tour v1.0.6: equiretangular full sphere, HFOV configurável e hotspots sem banner separado.

# Imobify Studio 6.0.47 — 17/10/2026

- Corrigido registro de versão do editor, catálogo, projeto, compilador e suíte de release.
- Hero360Tour v1.0.4 incorporado nos plugins **ativos** e no pacote instalável.
- Renderização full bleed com posicionamento explícito da section e dos containers Pannellum.
- Inicialização aguarda o CSS do motor panorâmico antes de gerar o WebGL.
- Verificação de cobertura do canvas após cada carregamento, troca de cena e resize, com alerta diagnóstico quando persistir uma inconsistência.
- Hotspots com SVG e texto do hero contextual mantidos.
- Limitação: a origem panorâmica real do print não foi fornecida, portanto não há certificação da cena específica.

# CHANGELOG — Imobify Studio 6.0.45

Data: 2026-10-17 · Base: 6.0.44 (preservada)

## Alterações

- **Hero360Tour v1.0.1** e **Parallax360Tour v1.0.1**: cenas panorâmicas em Full Bleed, largura efetiva da viewport sem margens laterais ou bordas arredondadas, em desktop, tablet e mobile.
- Removido o espaçamento vertical padrão do Plugin Play para essas duas seções, evitando faixas vazias acima e abaixo do panorama.
- A camada interna do tour expande além de contêineres estreitos (100vw, deslocamento pelo centro do contêiner), enquanto a altura continua configurável.
- Desativado `content-visibility: auto` e recorte do wrapper dos dois tours para não truncar a cena expandida.
- Os controles obsoletos **largura máxima**, **arredondamento** e **espaçamento vertical** foram removidos do inspector. Os valores antigos continuam preservados no projeto (sem efeito no novo modo Full Bleed).
- As superfícies flutuantes do banner, hotspots e navegação mantêm suas bordas próprias; somente a **cena panorâmica** é sem bordas.
- Versionamento da aplicação sincronizado em 6.0.45; atualizados os pacotes instaláveis dos dois plugins e os testes de regressão.

## Arquivos principais

- `plugins/hero360-tour/{plugin.json,plugin.css,template.html,README.md}`
- `plugins/parallax360-tour/{plugin.json,plugin.css,template.html,README.md}`
- `plugin-packs/{hero360-tour-v1.0.1,parallax360-tour-v1.0.1}.zip`
- `assets/js/{catalog.js,compiler.js,app.js}`; `index.html`; `project.json`
- `tests/{plugin-play.test.cjs,release-6.0.45.test.cjs,immersive-360-fullbleed.test.cjs}`

## Verificações e ressalvas

Os testes automatizados validam a geração de CSS, manifestos, compilação e arquivos empacotados. A interface do editor com projetos reais e fotografias equiretangulares exige conferência adicional em navegador/dispositivos de produção.


## v6.0.46
- Hero360Tour e Parallax360Tour: correção do preenchimento horizontal da cena na exportação, com `resize()` reforçado e observação de largura/altura do viewer para evitar áreas pretas laterais.
- Hero360Tour e Parallax360Tour: hotspots da exportação agora replicam o visual do editor (ícone vetorial, perspectiva, pulso, rotação, escala e tooltip).
- Hero360Tour: o bloco textual do hero passa a ser atualizado ao clicar no hotspot, usando headline/body do spot e restaurando o texto padrão ao fechar ou trocar de cena.
- Full Bleed mantido sem bordas, inclusive em exportações com carregamento assíncrono do panorama.
- Plugin packs adicionados: `hero360-tour-v1.0.2.zip` e `parallax360-tour-v1.0.2.zip`.

## 6.0.48 (17/10/2026)
- Hero360Tour v1.0.5: correção de regressão introduzida em 1.0.4. `avoidShowingBackground` e `ignoreGPanoXMP` não são mais forçados; preserva panoramas parciais e metadados do fotógrafo.
- Removida a rotina de remount automático que podia apagar a cena após exibir o panorama; `viewer.resize()` nativo permanece.
- Poster responsivo `object-fit:cover` enquanto o panorama carrega ou em erro, evitando um hero cinza. Ele não substitui navegação 360 funcional em caso de falha.
- Plugin individual sincronizado em `plugins/hero360-tour` e `plugin-packs/hero360-tour-v1.0.5.zip`.

# ImobStudio 6.0.82 — Benefits Showcase, imagem fixa com proteção de leitura

**Data:** 22/10/2026  
**Base:** 6.0.81  
**Plugin:** Benefits Showcase 1.2.0

## Funcionalidades

- Campo **Imagem de fundo (opcional)** no inspetor do Benefits Showcase: upload JPG/PNG/WebP/GIF ou URL/caminho, com incorporação de mídia local pelo compilador no ZIP exportado.
- **Manter imagem fixa durante o scroll** ativado por padrão quando a seção tiver imagem. Implementado com plano fotográfico `position:sticky`, limitado à própria section, sem `background-attachment:fixed` nativo instável em mobile.
- Controle **Proteção de leitura sobre a imagem** (55–90%, padrão 76%) com sobreposição escura para preservar contraste de títulos e filtros.
- **Posição vertical da imagem** (0–100%, padrão 50%) com `object-fit:cover`.
- Cards continuam sobre superfícies sólidas, inclusive na composição Editorial, preservando a hierarquia entre fotografia e informações.
- Cores de títulos de cabeçalho sobre a imagem passam a branco com sombra discreta. Tipografia e escala permanecem herdadas do Design System do projeto.
- Botão **Remover imagem de fundo** para limpar o campo e restaurar o estilo anterior.
- Projetos existentes sem imagem mantém integralmente o comportamento e CSS anteriores.
- O editor e a exportação usam o mesmo markup e as mesmas regras CSS.

## Arquivos

- `assets/js/catalog.js` — campos, defaults, HTML e verificação de URL
- `assets/js/app.js` — botão de remover imagem no inspetor
- `plugins/benefits-showcase/plugin.css` — camada sticky, overlay, contraste, mobile
- `plugins/benefits-showcase/plugin.json` — versão 1.2.0
- `tests/benefits-fixed-background-6082.test.cjs` — regressão incluindo incorporação da imagem e HTML exportado
- `assets/js/{app,catalog,compiler}.js`, `index.html`, `project.json` — versão 6.0.82

## Compatibilidade

`backgroundImage` é opcional e permanece vazio para projetos antigos. `backgroundFixed` assume `true`, `backgroundOverlay` assume `76` e `backgroundPositionY` assume `50`. URLs inválidas/inseguras não são renderizadas como imagem nem injetadas em CSS. 

## Limites e validação

Testes de viewport desktop/mobile foram executados em Chromium. A experiência em iOS Safari e dispositivos físicos Android deve ser confirmada antes da publicação. Referências remotas exigem uma origem acessível ao visitante, enquanto mídias locais importadas são incluídas na exportação.

**Nota de instalação:** Benefits Showcase é um componente nativo do catálogo do ImobStudio; não há pacote individual auto-instalável pelo Plugin Play nesta versão. Utilize o ZIP completo para preservar a integração com o inspetor, catálogo e compilador.

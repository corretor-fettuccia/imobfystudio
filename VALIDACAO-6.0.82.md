# Verificação ImobStudio 6.0.82 — Benefits Showcase

## Testes automatizados

- Campo de imagem no inspetor, botão para remover, defaults e intervalo de overlay/posição.
- HTML com e sem imagem, modo fixo/normal, contraste dos cartões e do título.
- Mídia importada em data URL convertida para arquivo físico na exportação, sem alterar o original.
- Proteção contra links injetando regras CSS via JSON externo.
- Teste integrado de exportação/retrocompatibilidade (Benefits Showcase, Ficha, SmartPlant, Hero360Tour).

## Navegador (Chromium, viewports simulados)

- Desktop 1360×800: backdrop sticky mantém y=0 enquanto o documento percorre 400px de seção, texto branco e cards com superfícies sólidas.
- Mobile 390×844: mesmos comportamentos, layout de cards de uma coluna, sem dependência de `background-attachment:fixed`.

## Checklist manual antes de publicar

1. Selecione Benefits Showcase e carregue uma imagem imobiliária horizontal.
2. No inspetor, escolha `Manter imagem fixa durante o scroll`, ajuste proteção de leitura (76% padrão) e posição vertical da foto.
3. Percorra a página, verifique que a fotografia permanece fixa *dentro da seção* enquanto cards passam sobre ela e que ela termina ao sair da seção.
4. Desative o modo fixo e compare com o deslocamento normal.
5. Confira o contraste de chamada, título, descrição, filtros e cards nas quatro composições do plugin, com presets claro/escuro.
6. Exporte ZIP da LP, abra em servidor local e repita a verificação.
7. Clique em Remover imagem de fundo e confirme retorno ao fundo e às cores anteriores.
8. Repita em iOS Safari e Android Chrome reais, incluindo rotação de tela e economia de dados.

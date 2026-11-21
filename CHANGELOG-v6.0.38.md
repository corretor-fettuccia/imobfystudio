# Imobify Studio v6.0.38 — Painel esquerdo

- Corrige sobreposição de navegação lateral causada por `flex-wrap` na versão 6.0.37; a barra de abas volta a ser vertical, com largura fixa e rolamento independente.
- Isola o conteúdo do painel em coluna flexível (`minmax(0, 1fr)`), impedindo que títulos e cartões invadam o menu.
- **Componentes:** catálogo e pesquisa em destaque, instalação ZIP e blocos reutilizáveis em submenus recolhíveis.
- **Estrutura da página:** mostra primeiro a árvore de seções já inseridas, depois `+ Adicionar seção` e o submenu **+ Novo segmento** (colunas ou linhas).
- Estratégia comercial e comportamento da página em submenu independente.
- Preserva os elementos HTML/IDs originais, a lógica de inserção, edição, reordenação, carregamento de plugins, eventos e dados salvos; nenhuma mudança na página exportada.
- Ajustes de responsividade e acessibilidade visual para as abas e submenus.

# Imobify Studio 5.11.12

## Rodapé profissional 1.1.1

- adiciona o campo editável **Descrição profissional / responsável** ao painel do Rodapé profissional;
- o texto exibido no bloco **Responsável pelas informações** passa a usar esse campo;
- valor padrão: `Roberto Fettuccia — Corretor de imóveis e especialista em Terreno e Construção`;
- mantém compatibilidade com projetos anteriores: se o novo campo não existir, o rodapé usa `seo.authorName` e `seo.authorRole` como fallback;
- revisão e fontes continuam usando os dados SEO existentes.

## Parallax 2.9.3 — marcador INICIAR

- transforma o limite inicial da timeline em um marcador arrastável **INICIAR**;
- permite definir exatamente o primeiro frame/timestamp do vídeo, por exemplo `3,0s`;
- mantém o marcador **LIBERAR** independente para controlar o ponto de saída do scroll;
- reaproveita o `startTime` nativo do player, portanto o vídeo já é posicionado no frame configurado antes de a experiência começar;
- preserva pontos-chave, banners, navegação mobile/iOS e lógica de retorno ao início.

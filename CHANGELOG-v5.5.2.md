# Imobify Studio 5.5.2

## Correção crítica — Parallax branco na publicação

- O Parallax deixa de participar do comportamento global `Revelação no scroll`. O reveal não pode mais aplicar `opacity: 0` ou transformações à raiz `.svp-root`.
- O `IntersectionObserver` do reveal ignora explicitamente `parallax` e o identificador legado `scrollytelling-video-pro`.
- A otimização global `content-visibility:auto` também deixa de ser aplicada ao Parallax, pois seções sticky de grande altura precisam manter layout e pintura ativos durante o scrollytelling.
- A exportação passa a incluir um fallback isolado em `assets/plugins/parallax/plugin.css` e `assets/plugins/parallax/plugin.js`, além do bundle normal em `site.css` / `site.js`.
- O HTML publicado referencia esse fallback crítico diretamente. Se outro plugin quebrar o bundle combinado, o runtime do Parallax continua tendo um arquivo próprio para inicializar.
- O compilador valida antes de gerar o ZIP se o markup, CSS, runtime e banners do Parallax estão presentes. Pacote incompleto agora interrompe a exportação com erro, em vez de gerar uma landing branca.
- Parallax atualizado para **2.7.2**, corrigindo também uma referência ausente ao renderizador de ícones dos banners.
- Mantida a normalização e tentativa de incorporação de vídeo remoto introduzida na 5.5.1.

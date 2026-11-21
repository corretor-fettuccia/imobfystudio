# Imobify Studio 5.2.6

- Renomeia `scrollytelling-video-pro` para **Parallax** (`id: parallax`, v2.6.0).
- Migra automaticamente projetos antigos e caminhos das versões 1.0.0 a 2.5.3 para `plugins/parallax/`.
- Restaura o **Editor de Pontos** diretamente no Inspector do Studio, sem depender da ponte iframe → parent.
- Timeline visual com duração do vídeo, IN/OUT, playhead, marcadores de banners e marcadores de pausas.
- Cada banner expõe o ponto exato de pausa/abertura, transição anterior à chave, ativação da pausa cinematográfica e conteúdo principal.
- Pausas adicionais do modo contínuo podem ser criadas, editadas e removidas visualmente.
- Mantém a regra cinematográfica: a transição ocorre antes da chave; ao chegar ao ◆, o vídeo pausa e o banner entra.

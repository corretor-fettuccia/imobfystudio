# Validação — Imobify Studio 6.0.42

Data: 2026-10-17

## Cenários verificados em testes automatizados

| Caso | Resultado |
|---|---|
| Upload/simulação de ícone PNG → raiz `/icon.png` | OK |
| Upload/simulação de imagem WebP → raiz `/share.webp` | OK |
| Formatos invertidos: ícone WebP + share PNG | OK |
| Tags favicon HTML com MIME correto | OK |
| Open Graph e Twitter usando URL absoluta baseada na canônica | OK |
| Schema.org com imagem social pública | OK |
| JSON exportado com caminhos `./icon.ext` e `./share.ext` | OK |
| Projeto original preservado durante a compilação | OK |
| Caminhos PNG/WebP locais pré-existentes migrados para a raiz | OK |
| URL remota informada manualmente preservada | OK |
| Elementos de upload presentes na interface | OK |
| Compilação isolada dos plugins | 48/48 sem erro fatal |

## Testes de release
Executar `bash scripts/verify-release.sh` dentro da pasta. A rotina cobre sintaxe JS, testes `.test.cjs` e smoke test de exportação dos plugins.

## Limitações e observações
- PNG/WebP efetivamente **carregados por arquivo** são incorporados à raiz. URLs externas informadas como texto permanecem URLs externas.
- Arquivos legados ICO/SVG/JPG permanecem pelo fluxo anterior por compatibilidade: use PNG/WebP novo para adotar o padrão `/icon` e `/share`.
- Sem URL canônica HTTPS definida, a referência social é relativa; plataformas de compartilhamento normalmente precisam da URL absoluta pública. Configure a URL canônica de publicação antes de publicar.
- A validação de imagem pública em hospedagem e o resultado do compartilhamento nas redes sociais permanecem pendentes.
- Avisos preexistentes do Leaflet referenciam arquivos `images/layers.png`, `images/layers-2x.png` e `images/marker-icon.png` ausentes no teste isolado.

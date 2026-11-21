# VALIDAÇÃO — IMOBIFY STUDIO 6.0.50

## Defeito reproduzido
- Origem: landing page `HeroParallax360-7.zip` fornecida pelo usuário.
- Panoramas 2:1 válidos: Sala e Sacada, ambos 6912 × 3456 px.
- O HTML antigo usava Pannellum remoto e CSS Full Bleed, porém a área visual do panorama aparecia limitada a aproximadamente 1180 px.

## Alteração efetiva
- Hero360Tour 1.1.0 reescrito com shader equiretangular WebGL nativo (sem dependência externa na exportação).
- Alternativa interativa Canvas 2D para ambientes sem WebGL: densidade de pixels reduzida.
- Imagem 2:1 reprojetada por longitude/latitude; canvas independente do `--container:1180px`.
- Hotspots preservam ângulos, ícones SVG, perspectiva, escala, rotação e texto.
- Hotspot INFO foca o ponto e reescreve Eyebrow, Headline e texto do próprio Hero.
- Hotspot NAVIGATION carrega diretamente a próxima cena.
- Modo observador após 10 segundos, com suporte a movimento reduzido.

## Verificações executadas
- 45/45 testes de regressão JavaScript aprovados.
- Chromium headless: imagem real Sala renderizada no Canvas 2D a 390 px e a 1919 px, sem área cinza lateral.
- Clique no hotspot de informação: título alterado para `Churrasqueira na sala`, descrição e Eyebrow atualizados sem modal.
- Clique no hotspot de navegação: mudou de Sala para Sacada e resetou texto base.
- Nenhum erro JavaScript nos testes interativos citados.
- Empacotamento dos panoramas pelo compilador preservado pelos testes de exportação.

## Limites
- O ambiente de teste não ofereceu contexto WebGL. A renderização WebGL foi revisada em código e validada por sintaxe/contratos, mas ainda requer ensaio em GPU real.
- O fallback Canvas 2D foi testado com as imagens fornecidas, em Chromium; é funcional, porém usa resolução reduzida para evitar travamentos.
- A experiência final depende do navegador e do dispositivo; testar o ZIP corrigido em seu localhost antes de publicar.

## Compatibilidade
- Mantidos Tour360 original, Parallax360Tour, editor de cenas e dados cadastrados.
- 6.0.49 permanece intacta para reversão.

# Relatório de validação — Imobify Studio 6.0.51

## Escopo
Hero360Tour v1.1.1. O Parallax360Tour e o Tour360 Pro permanecem intactos.

## Comportamento
- Roda do mouse e trackpad: rolam a página, sem zoom do panorama.
- Arraste vertical da câmera: limitado a 100 px por gesto.
- Touch: gesto predominantemente vertical pertence ao navegador (scroll nativo); arraste horizontal gira o panorama.
- Botões +/- e teclado: zoom preservado.

## Testes de navegador (Chromium com imagens reais reduzidas para QA)
- Roda: página rolou **440 px**, HFOV permaneceu em 118°.
- Drag do mouse 265 px: câmera mudou **8.645°**, respeitando limite equivalente a **8.645°** (100 px).
- Touch vertical mobile: página rolou **415 px**.
- Touch horizontal mobile: yaw mudou de **150.70°** para **-147.27°**.
- Botão zoom-in: HFOV de 118° para 111°.
- Nenhum erro JavaScript em QA.

## Regressão
`node --test tests/*.test.cjs`: **46/46 aprovados**.

## Nota importante
O ZIP de demonstração enviado anteriormente continha apenas a section Hero. Para observar a rolagem é necessário haver conteúdo abaixo do Hero ou altura de documento superior à viewport. O teste de scroll foi feito com uma seção adicional, preservando as imagens do usuário reduzidas para a instrumentação do navegador.

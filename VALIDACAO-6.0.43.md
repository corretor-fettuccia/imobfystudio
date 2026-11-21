# Validação — Imobify Studio 6.0.43
Data: 17/10/2026

## Verificações executadas
- **113 arquivos JavaScript** passaram na análise de sintaxe (`node --check`).
- **36 arquivos de testes `.test.cjs`** executados individualmente com aprovação.
- Compilação smoke: **50 plugins registrados**, dos quais 49 têm seção/HTML esperado e o Tag Installer é documental.
- Novos plugins: manifests registrados, editor modal com importação e hotspot, runtime JS e CSS presentes.
- Exportação mock: panoramas do `tourConfig` em Data URL convertidos em arquivos `assets/images/*`, projeto ZIP e HTML referenciam arquivos físicos.
- Browser Chromium com motor 360 simulado: hotspot Hero abre/fecha banner, após 5 s de inatividade em configuração de teste iniciou oscilação natural (52 atualizações), pointermove interrompeu; Parallax passou por 4 das 5 etapas incluindo mudança de cena, sem erros de página; desktop 1365px/mobile 390px sem overflow horizontal.
- Original do Tour360 comparado bit a bit com a 6.0.42 para arquivos JS, CSS, manifesto e editor principal: inalterados.
- ZIP completo e os dois ZIPs individuais verificados por CRC (`ZipFile.testzip`).

## Limitações/pendências
- O teste Chromium usou Pannellum simulado (API de viewer), **não equivale à validação de renderização esférica real**; usar panoramas reais e publicar em ambiente com internet para teste final de campo.
- Motor Pannellum ainda depende do CDN jsDelivr, como no Tour360 original.
- Existem 3 avisos herdados referentes a ícones da biblioteca Leaflet (`images/layers.png`, `images/layers-2x.png`, `images/marker-icon.png`) durante o smoke global. Não são introduzidos pelos dois plugins.
- O comportamento mobile com dispositivos reais e giroscópio ainda não foi validado; controle por toque foi preparado para o motor 360.

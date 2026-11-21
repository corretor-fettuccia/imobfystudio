# Roteiro de validação — Imobify Studio 6.0.79

1. Abra o `index.html` do editor em servidor estático compatível com os caminhos relativos (ex.: `python3 -m http.server 8000`), e crie/importe um projeto.
2. Escolha um preset com família tipográfica visivelmente diferente, adicione **Benefits Showcase** e verifique título, eyebrow, subtítulo, cards e filtros, tanto no editor quanto no ZIP exportado. Altere as cores do preset e confirme que uma seção nova acompanha as cores; em um projeto antigo, habilite a herança explicitamente se desejar mudar cores locais históricas.
3. Adicione **SmartPlant**, abra o detalhamento da planta: a lupa deve estar invisível ao abrir. Pressione e segure para ampliar, mova o dedo ou mouse e solte para esconder. Verifique o controle do editor para restaurar o modo clássico.
4. Adicione **Ficha do imóvel**. Inspecione a apresentação objetiva dos atributos em desktop, tablet e celular. Confira se os rótulos permanecem alinhados e legíveis em áreas estreitas.
5. Adicione **HeroTour360** com imagem e hotspots válidos. Comece a navegar na cena; a cópia do hero desaparece após ~5s de atividade iniciada e reaparece após 10s da última interação. A auto-rotação ociosa não impede a reaparição. Verifique hotspots de informação e de mudança de cena.
6. Exporte a página e repita os itens 2–5. Teste especialmente Safari no iPhone e Chrome no Android, que não foram executados fisicamente neste ambiente.
7. Execute, na raiz: `for f in tests/*.test.cjs; do node "$f" || exit 1; done` e `node scripts/smoke-all-plugins.cjs`.

### Compatibilidade de projetos
- Projetos anteriores não são regravados em massa. `styleSource` não existente indica paleta personalizada antiga, conservando os valores exportados; `styleSource='project'` habilita a herança global.
- O novo SmartPlant usa `magnifierStartHidden=true` em seções recém-criadas, mas mantém o mecanismo clássico disponível pelo controle de edição.

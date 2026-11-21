# Imobify Studio 5.0.1.10

- Preview de edição passa a manter a **seção selecionada visível** em todo rerender, em vez de depender apenas de `scrollY` absoluto.
- O bridge do editor refoca o bloco selecionado após reconstrução do `srcdoc`, após `load` e quando o tamanho da seção muda (`ResizeObserver`), evitando perder o plugin durante edição de texto/mídia.
- Design System ganha técnicas guiadas de paleta: **60–30–10, complementar, análoga, tríade e monocromática**, sempre mantendo edição manual depois da geração.
- Novos presets visuais: **Casa Própria Azul, Família Verde, Chave Solar, Casa + Pátio, Confiança Popular e Popular Coral**.
- Novos perfis tipográficos: **Conversão direta, Popular clara, Humana e acolhedora, Editorial premium e Leve e arquitetônica**.
- Hierarquia tipográfica revisada: H1/H2/H3 responsivos, `text-wrap`, largura de leitura configurável e tracking próprio para chamadas curtas.
- Estratégias comerciais passam a ser agrupadas e ganham presets específicos para **Minha Casa Minha Vida / produto popular**:
  - Resultado primeiro
  - Saída do aluguel
  - Casa + pátio
  - Terreno + Construção
  - Quebra de objeções
  - Oferta direta / imediatista
- Ao aplicar uma estratégia MCMV, o framework pode adaptar Hero, formulário, condição/CTA e timeline de processo, preservando ressalvas de análise de crédito e evitando promessas automáticas.
- Novos modelos iniciais MCMV: **Casa própria, Casa + pátio, Terreno + construção e Oferta direta**, com preset visual associado.

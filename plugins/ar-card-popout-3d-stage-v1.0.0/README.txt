AR Card Popout 3D Stage v1.0.0

Plugin Play para Imobify Studio 7.5.x. Evolução do AR Card Popout 3D Single 1.2.0 (o original continua instalado e intacto).

O que muda em relação ao Single
- Section ampla: no desktop o palco ocupa ~88% da altura da tela e o card ~66% dessa altura.
- Medidas internas proporcionais ao card: o efeito fica igual em qualquer tamanho.
- Cartão fechado pulsa (batimento + ondas na borda) para convidar ao toque.
- Sem botão/CTA. Abre no toque/clique e/ou ao rolar até a section (configurável).
- Ao abrir: o card deita e vira base, a casa sobe com efeito mola, os textos do card se dissolvem
  e saem dele a frase principal e 3 blocos de frase, em profundidades 3D diferentes.
- Desktop (componente ≥ 980px): blocos em órbita ao redor da projeção, com linha e ponto de ligação.
  Presets: órbita, órbita invertida, todos à esquerda, todos à direita.
- Tablet / célula média (560–979px): blocos em linha abaixo da projeção.
- Celular (< 560px): blocos empilhados abaixo; o card fica centralizado enquanto fechado e sobe ao abrir
  (só transform, sem empurrar o resto da página).
- Os breakpoints usam a largura real do componente (container query), então também funciona dentro de
  colunas de um Segmento.
- Mouse move a cena em parallax; no celular há uma deriva lenta automática.
- Respeita "reduzir movimento" do sistema.

Dica: ligue "Iniciar aberto" enquanto edita as frases e desligue antes de publicar.

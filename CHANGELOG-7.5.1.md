# Imobify Studio 7.5.1 — AR Card Popout 3D Stage

**Base:** Imobify Studio 7.5.0. Nenhuma funcionalidade anterior foi removida. O **AR Card Popout 3D Single 1.2.0** continua instalado e inalterado: páginas existentes não mudam.

## Novo plugin: AR Card Popout 3D Stage 1.0.0 (`ar-card-popout-3d-stage`)
Evolução do Single, pensada para ocupar a section inteira.

- **Section ampla:** no desktop, o palco ocupa por padrão 88% da altura da tela (limitado entre 560 e 1040 px) e o card ocupa 66% dessa altura. Todas as medidas internas (projeção, sombras, inclinação, textos) são proporcionais à altura do card, então o efeito é o mesmo em qualquer tamanho.
- **Cartão pulsante:** quando fechado, o card faz uma batida dupla seguida de uma "respiração", com duas ondas saindo da borda na cor de destaque. O pulso fica mais forte no hover e tem três intensidades (suave, média e forte) e três modos (batimento + ondas, só batimento, desligado).
- **Sem botão:** o card inteiro é o gatilho (clique, toque, Enter ou espaço). Ele também pode abrir sozinho quando a section entra na tela (`openTrigger`: both, click, scroll) e repetir o efeito quando o visitante volta à section. Há uma dica discreta e opcional, "Toque no cartão".
- **Textos que saem do cartão:** ao abrir, o kicker e o título do card se dissolvem para cima. Em seguida, a frase principal e os três blocos (rótulo + frase) voam para fora do card, partindo do centro dele (a posição é medida em tempo real), um após o outro e com efeito mola. Cada bloco fica numa profundidade 3D diferente.
- **Projeção:** a casa sobe com efeito mola e flutua. Por padrão, a projeção tem 122% da largura do card. As bordas do PNG recebem um fade, para que sombras embutidas na imagem não apareçam com corte reto.
- **Parallax:** o mouse move o card, a casa e os blocos em profundidades diferentes, em toda a área da section. Sem mouse (celular), uma deriva lenta mantém a cena viva.
- **Layout pela largura real do componente** (container query, funciona também dentro de colunas de Segmento):
  - ≥ 980 px: blocos ao redor da projeção, com linha e ponto de ligação. Presets: órbita, órbita invertida, todos à esquerda e todos à direita. Nos presets de um lado só, o card se desloca para equilibrar a composição.
  - 560–979 px: blocos em linha abaixo da projeção.
  - < 560 px: blocos empilhados. Fechado, o card fica centralizado no palco e sobe ao abrir, usando só `transform`, então não empurra o resto da página.
- **Estilos dos blocos:** vidro claro, vidro escuro e só texto com filete. A cor de destaque pode vir do Perfil Visual ou ser personalizada.
- **Acessibilidade:** `aria-expanded` no card, foco visível, Esc para fechar e respeito a "reduzir movimento".

## Validação
- `tests/ar-card-popout-stage-100.test.cjs`: manifesto, defaults, render (3 blocos, bloco vazio omitido, sem CTA, sem placeholders), container queries e pacote ZIP pelo parser real do Plugin Play. Aprovado.
- `tests/plugin-play.test.cjs`: o novo pacote foi incluído na cobertura. O teste já parava antes desta versão, por motivos sem relação com esta mudança: a versão esperada do Agendamento Sender era 1.3.0 e o instalado é 1.4.1, e 10 ZIPs de 7.4.x não estavam na lista. Nada disso foi alterado aqui.
- Chromium com o renderer real (`buildInlineDocument`): 1920, 1440, 1024, 768, 390 e 360 px, estados fechado e aberto, sem rolagem horizontal e sem erros de JavaScript. Abertura ao rolar, repetição e fechamento no clique conferidos.

## Atenção
- Para editar as frases com o card aberto, ligue **Iniciar aberto** e desligue antes de publicar.
- Reexporte as páginas para publicar.

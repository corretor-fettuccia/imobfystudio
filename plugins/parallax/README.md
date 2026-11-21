# Parallax v2.8.2

## Motor cinematográfico revisado

- Novo **Perfil da experiência**: Cinema suave, Cinema premium, Performance, Mobile e Personalizado.
- Os controles técnicos de aceleração, Bézier, velocidade máxima, threshold e cooldown ficam no painel avançado.
- Perfis priorizam reprodução nativa para frente e limitam velocidades que aumentam descarte de frames.
- Em retorno/reverso, os seeks continuam coalescidos (sem fila) e usam cadência mais rápida quando o vídeo foi pré-carregado por completo.

## Preload completo

- `preloadMode=complete` baixa 100% do vídeo antes de liberar a experiência.
- O carregamento mostra progresso real quando o servidor informa `Content-Length`.
- Depois do download o runtime usa um `Blob URL`, removendo a rede do caminho crítico durante o Parallax.
- Se `fetch()` não estiver disponível para a origem do vídeo, há fallback automático para o buffer nativo do navegador.

## IN é limite e retorno automático

- O ponto IN continua sendo uma parada real da timeline.
- **IN não é banner**: é somente o limite inicial da timeline. Nenhuma chave de conteúdo pode ocupar o mesmo frame do IN.
- Ao voltar de uma chave posterior até o IN, o Parallax chega exatamente ao frame inicial e, por padrão, reinicia automaticamente para a próxima chave após um pequeno atraso configurável.
- O usuário ainda pode sair da seção ao tentar continuar para trás quando já estiver no limite inicial.

## Tipografia e mobile

- Tipografia global configurável para eyebrow, título, subtítulo, texto e botão.
- Cada banner pode sobrescrever fonte, tamanho, peso e caixa do título/texto.
- Posição e alinhamento continuam definidos por banner.
- No mobile, o layout preserva esquerda/centro/direita e top/center/bottom em escala, respeitando safe-area.
- `mobileAutoAdapt` e `mobileTypographyScale` controlam a adaptação proporcional.
- Blur e filtros caros são reduzidos no mobile.

Compatível com projetos Parallax 2.7.x; campos antigos permanecem aceitos.



## 2.8.2 — ownership do scroll e navegação por âncoras

- O Parallax mantém o controle do scroll somente enquanto a experiência está ativa.
- O controle é liberado de forma terminal ao chegar ao OUT/LIBERAR ou ao usar **Pular introdução**.
- Cliques em qualquer `a[href]` cujo destino não pertença ao próprio componente liberam o scroll **antes** da navegação da âncora.
- Ao liberar por âncora, timers, auto-start, retorno ao IN e tomada cinematográfica pendente são cancelados para impedir que a viewport seja puxada de volta.
- Âncoras internas do próprio Parallax não liberam o controle.
- Se o usuário sair e depois retornar à seção do Parallax, o componente readquire o controle somente após ter efetivamente deixado a área ativa, evitando rearmar durante um smooth-scroll para outra seção.
- Wheel, touch e teclado respeitam o estado `owned/released` e não executam `preventDefault()` depois da liberação.

## 2.8.1 — correção da máquina de estados

- IN deixa de ser tratado como banner no Studio e no runtime.
- Ao voltar por gesto do Banner 1 até IN, a experiência toca automaticamente para frente até o Banner 1.
- Navegação por capítulos cancela auto-start e retorno pendente antes de trocar de chave.
- **Pular introdução** salta para a mesma chave marcada como **libera scroll**, mantendo o vídeo pausado nesse frame. Se não houver chave marcada, usa o OUT como fallback.
- **Reiniciar** é o único controle que volta deliberadamente ao IN e relança a primeira etapa.
- Toolbar isola pointer/touch para não disparar gestos cinematográficos ao clicar nos controles.


## 2.9.2 — hint mobile e composição

- No mobile, o selo “Deslize para cima” passa a ser uma camada independente.
- As setas animadas ficam atrás/acima do selo, sem participar do tamanho do pill e sem deformar o banner.
- O fundo, blur e borda ficam somente no texto; as setas permanecem em camada inferior.


## Studio 5.9.2 · trava de movimento das chaves
O editor do Studio oferece cadeado por chave. Bloqueado, o ponto continua selecionável/editável, mas não pode ser arrastado ou ter seu frame alterado até ser explicitamente desbloqueado.

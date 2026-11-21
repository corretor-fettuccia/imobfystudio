Popup Pro v1.2.1

Arquitetura:
- componente independente por instância;
- permite adicionar vários popups na mesma página;
- cada popup possui configuração, sessão, fechamento e reexibição próprios;
- se dois popups ficarem elegíveis ao mesmo tempo, a primeira instância na ordem da página abre primeiro e a próxima pode abrir depois do fechamento.

Gatilho principal:
- Abrir sempre [V/F];
- Abrir em intervalo de datas [V/F], com data inicial e final;
- Abrir sempre tem prioridade quando ambos estiverem ligados;
- se ambos estiverem desligados, aquela instância fica desativada.

Sub-gatilhos:
- Re-exibir após fechado [V/F] + segundos;
- Atraso para abrir (segundos);
- Scroll da página [V/F] + percentual da altura da página.

Regra do primeiro disparo:
- sem scroll: o delay começa no carregamento;
- com scroll: ao atingir X% da página, começa a contagem do delay;
- a agenda/período apenas autoriza ou bloqueia a instância.

Comportamento:
- Fechar ao tocar fora [V/F];
- Exibir uma vez por sessão [V/F];
- Exibir uma vez por sessão tem prioridade sobre reexibição.

Mobile:
- largura e altura limitadas à viewport;
- conteúdo interno rolável quando necessário;
- safe-area respeitada.


v1.3.2: respeita Ocultar no mobile e Ocultar no desktop mesmo após o overlay ser portalizado para o body.

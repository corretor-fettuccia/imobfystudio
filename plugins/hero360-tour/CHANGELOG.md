# Hero360Tour 1.2.7 — temporizador configurável do texto do Hero

- Novo slider **Ocultar texto do Hero após interação** no inspetor do componente, de 2 a 10 segundos (intervalos de 1 segundo; padrão: 5).
- O valor numérico é mostrado ao lado do campo enquanto o operador arrasta o controle.
- Configuração persistida em `props.heroHideDelay` no projeto e exportada em `data-hero-hide-delay`.
- Clique em hotspot, arrasto do panorama, teclas e orientação por sensores compartilham o mesmo temporizador de interação.
- Reaparece após 10 segundos sem atividade; mínimo de 2 segundos oculto para evitar efeito instantâneo quando o delay for 10 segundos.
- Projetos anteriores sem o parâmetro mantêm 5 segundos por compatibilidade.

# Hero360Tour 1.2.5 — interface limpa e orientação calibrada

- Remove painel de diagnóstico e botão `?` da interface pública.
- Apenas um botão de ativar/desativar movimento.
- Calibração curta da orientação inicial, automática em trocas de cena/fonte e mudanças retrato/paisagem.
- Suavização adaptativa com menor atraso, zona morta anti-jitter e proteção contra viradas bruscas de um único frame.
- Congela direção horizontal em ângulos quase verticais para evitar reversões de 180 graus.
- Preserva hotspots, scroll, seleção de cena e fallback de renderização.

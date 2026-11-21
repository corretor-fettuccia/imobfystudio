# Imobify Studio 5.0.1.11

## Contraste funcional
- Adicionado modo WCAG AA automático como padrão, conforto alto (alvo 7:1) e modo manual.
- Renderer gera foregrounds seguros para surface, dark, branco, primary, accent e CTA.
- Cores escolhidas pelo usuário são preservadas quando já atendem ao contraste mínimo.
- Adicionado diagnóstico de contraste no painel Design.
- Revisadas pontes semânticas de texto para componentes nativos e Plugin Play.
- Corrigida a prioridade CSS de contextos escuros/claros para que regras antigas de plugins não vençam o foreground seguro.
- Adicionada proteção de contraste em tempo de execução para cores locais de Menu fixo, WhatsApp flutuante e Tabela Investimento/Glass CTA.

## Estrutura / ordem das seções
- Reordenação deixou de depender do HTML5 `draggable` do pequeno handle.
- A linha inteira da seção passa a aceitar drag por mouse/Pointer Events, exceto botões.
- Drop mostra indicador antes/depois e suporta mudança entre níveis de layout.
- Auto-scroll do painel durante drag próximo às bordas.
- Pointer capture mantém o arraste ativo ao atravessar subelementos da linha e o drag nativo do navegador é bloqueado para não competir com a ordenação.
- Botões ↑/↓ passam a refletir a ordem lógica real entre irmãos do mesmo nível.

## Compatibilidade
- Mantida a estrutura de estado e de plugins das versões anteriores. Projetos antigos recebem `contrastMode: aa` pela normalização do estado quando o campo não existir.
- Plugin Play continua compilando 32 arquivos no teste de regressão.

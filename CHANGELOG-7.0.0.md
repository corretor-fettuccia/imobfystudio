# IMOBIFY Studio 7.0.0 — Performance Edition

Base: 6.0.91. Atualização conservadora e retrocompatível.

## Otimizações implantadas
- Eliminada a serialização completa do estado a cada edição para atualizar o cache de projetos na memória. Cópias isoladas permanecem nas operações de leitura e histórico.
- Atualização do iframe principal agrupada por debounce de 300 ms, reduzindo reconstruções durante digitação e alterações rápidas.
- Invalidação de renderizações pendentes ao receber uma edição mais recente.
- Tokens de renderização separados por iframe, impedindo que uma prévia em tela cheia invalide o editor.
- Evita redefinir `srcdoc` quando o documento renderizado não mudou.
- Versão do editor/exportador atualizada para 7.0.0.

## Compatibilidade
- Mantém motor JavaScript, formatos de projeto JSON, plugins e rotina de exportação, inclusive WebMCP, llms.txt e catálogo de IA.
- Nenhuma dependência Python adicionada.

## Validação e limites
- Verificação sintática do app.js e compiler.js com Node.js.
- Testes automatizados de exportação agêntica, fluxo financeiro e formulário popup executados.
- Sem benchmark real de FPS/heap em navegador; ganhos de desempenho não são quantificados.
- Ainda há pontos para futura otimização, como atualização parcial do inspetor e isolamento da compilação em worker.

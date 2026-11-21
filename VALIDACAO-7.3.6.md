# Validação — Imobify Studio 7.3.6

- Sintaxe validada com `node --check` nos quatro JavaScripts modificados.
- Teste novo `tests/section-background-736.test.cjs`: todas as instâncias de plugins visuais; cores sólida e gradiente; imagem estática, fixa e repetida; fundo desativado; CSS isolado por seção; compatibilidade do Smart Plant; inclusão de imagens locais e Data URLs no ZIP; integridade do estado original; ausência de imagem impede exportação incompleta.
- Regressão `tests/anchors-start-730.test.cjs` aprovada: 51 plugins, âncoras, layouts compostos e exportação.
- Comparação de suítes: a base 7.3.5 tinha 75 testes aprovados e 11 falhas; a primeira execução da 7.3.6 teve 78 aprovados e as mesmas 11 falhas. Todas as falhas identificadas são verificações legadas contra versões antigas (incluindo Smart Plant 1.4.5, quando a versão instalada é 1.4.9). Elas não foram alteradas para não mascarar a dívida de testes herdada.
- Testes automatizados não substituem revisão visual no navegador. Chromium local bloqueou navegação de teste por política do ambiente (`ERR_BLOCKED_BY_ADMINISTRATOR`), portanto a aparência em dispositivos reais deve ser conferida ao publicar.
- Limitação: `background-attachment:fixed` no celular recua para `scroll` para evitar problemas conhecidos dos navegadores móveis; fundos internos de cartões/overlays dos plugins permanecem independentes.

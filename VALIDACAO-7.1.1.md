# Validação técnica — Imobify Studio 7.1.1

Data: 29/10/2026. Base: versão 7.1.0 recebida nesta conversa.

## Cobertura executada
- Validação de sintaxe JavaScript em `assets/js/ai-agent.js`, `app.js`, `compiler.js`.
- Regressão: **66 arquivos de teste; 60 passaram e 6 falharam**. As seis falhas correspondem a expectativas de números de versão antigos dos testes (Studio 6.0.83, Form Sender 4.4.6, Plugin Play 1.3.0). Nenhuma delas demonstrou defeito causado pela biblioteca Markdown.
- Novos testes 7.1.1: `ai-markdown-711.test.cjs` (seleção, classificação, distribuição de orçamento, sinalização de corte, prompt e não envio de arquivo desmarcado) e `md-export-private-711.test.cjs` (exclusão de Markdown do ZIP público, preservação do projeto original) passaram.
- Testes anteriores: `ai-agent-71.test.cjs`, `agentic-export-71.test.cjs` passaram.
- Smoke de plugins: concluído sem erro crítico; conhecida ocorrência de `MISSING_MARKUP` em `tag-installer-pro`, plugin de tags de documento. Arquivos Leaflet `images/layers.png`, `images/layers-2x.png`, `images/marker-icon.png` não encontrados no empacotamento.
- Servidor Node local: GET `/` e `/assets/js/ai-agent.js` retornaram HTTP 200.

## Limitações / pendências
- O Chromium headless disponível não completou a navegação dentro de 12 segundos; sem validação visual interativa automatizada ou teste em dispositivo físico nesta rodada.
- Não executado teste real com ChatGPT/Claude (interação manual), Ollama ou Gemini (sem modelo/chave neste ambiente).
- O MD anexado é usado somente como fonte no prompt; não modifica automaticamente o SEO sem revisão da IA e confirmação do operador.
- Se o contexto selecionado não couber no orçamento, apenas o início do conteúdo de cada documento é incluído. O prompt sinaliza os cortes; revisar um documento por vez para cobertura completa.
- Todo projeto editável que contenha MDs é privado; **não publicar o JSON do projeto salvo**. A landing exportada remove o campo `aiReferences` antes de renderizar e salvar seus arquivos.
- Não há conexão direta de OAuth com ChatGPT/Claude nem promessa de franquia gratuita automática para Gemini.

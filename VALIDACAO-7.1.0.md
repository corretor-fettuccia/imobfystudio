# Validação técnica — Imobify Studio 7.1.0

Data: 29/10/2026. Base: ZIP Imobify Studio 7.0.00(1).

## Auditoria executada
- Sintaxe JavaScript validada pelo Node.js nos módulos atualizados.
- Arquivos de teste: 64 executados individualmente. **58 passaram; 6 falharam.** As seis falhas são verificações de versões históricas (expectativas de 6.0.83, 4.4.6 e 1.3.0 vs versões atuais), não falhas de execução demonstradas dos recursos desta versão.
- Testes novos: `tests/ai-agent-71.test.cjs` e `tests/agentic-export-71.test.cjs` passaram.
- Exportação anterior de WebMCP e llms, SEO mídia raiz, Form Sender Popup, Agendamento Sender e tipografia: testes direcionados passaram.
- Smoke de plugins: 54 instâncias examinadas; **53 OK** e 1 **MISSING_MARKUP** (`tag-installer-pro`, plugin document-tag sem markup de seção; o smoke trata como exceção esperada). Exit code 0.
- A compilação registrou avisos conhecidos de três sprites Leaflet ausentes (`images/layers.png`, `images/layers-2x.png`, `images/marker-icon.png`).
- Servidor local para Gemini: GET `/index.html` HTTP 200; API sem chave responde erro informativo em vez de usar credenciais indevidas.

## Pendente e não afirmado
- Teste visual/browser automatizado **não concluído**: o Chromium do ambiente bloqueou navegação a localhost/file por política administrativa (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- Nenhum teste de integração real com Gemini/Ollama foi executado (não havia chave/modelo/servidor). Apenas código e contrato local foram testados.
- WebMCP exige teste em navegador compatível e site servido em HTTPS; nenhum Lighthouse publicado foi realizado.
- Não foi feita validação manual em dispositivos Android e iOS nem conferência visual exaustiva dos 54 plugins.
- Os seis testes históricos devem ter suas expectativas de versão atualizadas cuidadosamente após revalidação funcional; não foram mascarados ou removidos.
- Ampliação universal de layout/tipografia dos plugins é atividade futura; nesta versão a IA trabalha apenas com controles existentes.

## Segurança e compatibilidade
- O editor permanece estático e web; o servidor Gemini é opcional, rodando somente em 127.0.0.1.
- ChatGPT/Claude não autenticam automaticamente; o fluxo por copiar/colar não consome uma API programática.
- Propostas de IA são tratadas como conteúdo não confiável, submetidas à whitelist, revisão humana e histórico reversível.
- O ZIP compilado contém `content/project.json` em razão da compatibilidade com a base. **Revise o JSON antes de publicar o site**, pois os dados ali serão públicos.
- `ai-catalog.json` não anuncia serviços MCP/A2A inexistentes; as capacidades WebMCP reais dependem do navegador.

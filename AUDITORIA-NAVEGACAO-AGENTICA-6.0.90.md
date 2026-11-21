# Auditoria de navegação agêntica — Imobify Studio 6.0.90

## Escopo
Inspeção estática do exportador (`assets/js/compiler.js`), páginas externas (`assets/js/renderer.js`) e formulários carregados por plugins; testes Node do empacotamento ZIP. Não foi executado Lighthouse em uma página publicada com Chrome 150+ / origin trial.

## Achados da versão recebida
- **WebMCP:** nenhum registro explícito de ferramentas ou anotação declarativa localizada.
- **Formulários:** plugins criam parte dos campos no navegador. A cobertura depende dos formulários HTML realmente renderizados; interfaces sem `<form>` não recebem ferramenta declarativa automaticamente.
- **llms.txt:** não era gerado.
- **ai-catalog.json:** não era gerado.
- **Exportação:** gera `index.html`, JavaScript, CSS, `robots.txt`, sitemap opcional e arquivos SEO.

## Correções aplicadas
- Inclusão de `assets/js/agentic-export.js`, injetado **somente no ZIP exportado**.
- Ferramenta WebMCP imperativa somente de leitura para consultar título, descrição e títulos das seções; registro progressivo, condicionado à disponibilidade da API do navegador.
- Anotação declarativa de `<form>` com campos nomeados e descritos, inclusive formulários montados posteriormente via DOM. Formulários incompletos não são registrados; nunca usa `toolautosubmit`.
- `llms.txt` gerado na raiz **se a URL canônica estiver configurada**, com referência à página pública. Ausência da URL exige configuração SEO no projeto.
- `.well-known/ai-catalog.json` e `ai-catalog.json`: manifesto `specVersion: 1.0`, host e `entries: []` validamente vazia. Isso não afirma que haja servidor MCP/A2A, pois WebMCP in-page não é um endpoint remoto.
- `<link rel="ai-catalog">` no HTML exportado.
- Teste específico `tests/agentic-export-6090.test.cjs` cobre presença dos arquivos, runtime e metadados básicos.

## Limites e testes obrigatórios em produção
- Sem navegador compatível ou origin trial, o WebMCP pode aparecer como 'não aplicável' no Lighthouse.
- Ferramenta informativa é registrada apenas onde `modelContext.registerTool` estiver disponível. Formulários sem `<form>` HTML real precisarão de integração própria no plugin.
- Validar execução pelo DevTools/Lighthouse no domínio HTTPS, com envio manual do visitante; não presumir que anotar formulário signifique integração completa dos fluxos em etapas.
- O catálogo não anuncia uma capacidade chamável porque não existe endpoint MCP/A2A no projeto; preencher entradas apenas quando houver serviços reais.
- A publicação correta de arquivos em `/.well-known/` depende de servidor que sirva caminhos ocultos, inclusive GitHub Pages.
- Não confundir esta prontidão técnica com ganho de SEO ou indicação em assistentes.

## Validação
- Sintaxe JS: `node --check` passou no compilador e runtime.
- Testes direcionados: exportação agêntica, mídia SEO e Form Sender passam.
- Testes legados do repositório contêm expectativas antigas de versões (6.0.83, plugins), que não são critérios válidos para a nova versão; não se declara aprovação integral da suíte.

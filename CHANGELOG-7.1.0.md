# Imobify Studio 7.1.0 — Agente IA e exportação agêntica

Base preservada: 7.0.0, arquitetura web JavaScript, JSON de projeto, renderizador e plugins.

## Integração de IA no editor
- Novo botão **Agente IA** na barra superior, com modal responsivo e painel de alterações.
- ChatGPT / Claude: modo copiar/colar, sem API e sem autenticação programática.
- Ollama: chamada local opcional com resposta JSON, sem custo por chamada API; exige instalação e modelo baixado.
- Gemini: opção automática via `tools/ai-proxy.cjs` local, que mantém chave fora do cliente.
- Modos de revisão: SEO, copy, tipografia/alinhamento, navegação agêntica e revisão completa.
- Propostas em JSON validadas por whitelist dos campos dos plugins/SEO, diffs antes/depois e confirmação explícita. Uso do sistema de histórico/Desfazer existente.
- Não altera scripts, endpoints, dados de formulário, URL ou mídia pela IA; não cria campos inexistentes nos plugins.

## Exportação
- `.nojekyll` incluso para manter `/.well-known/` servido pelo GitHub Pages.
- `llms.txt` gerado em toda compilação e `llms-full.txt` com títulos/textos de seções visíveis.
- `content/agentic-audit.json` explicita avisos de configuração e limitações em vez de afirmar aprovação de auditorias reais.
- Catálogo IA preservado conforme schema 1.0 e `entries: []`, pois WebMCP in-page não equivale a servidor remoto MCP/A2A.
- Link de descoberta do catálogo relativo para suportar publicação em subdiretórios.
- Tags canonical/og:url/og:image omitidas quando sem valor em vez de conteúdo vazio.
- Segurança de JSON-LD reforçada contra quebra de elemento `<script>`.

## Controle de versões
- `project.json`, `RELEASE-MANIFEST.json`, editor, estado salvo e compilador com versão 7.1.0.
- Testes 7.1 adicionados para diffs AI e exportação, complementando os testes legados.

## Limitações
- ChatGPT/Claude: integração interativa por troca de JSON. OAuth não incluído, sujeito a registro/credenciamento de cliente.
- O Ollama requer modelo/servidor e permissões de origem; o Gemini requer chave e franquia que dependem da conta.
- Não há garantia de ranking SEO nem de compatibilidade WebMCP em navegadores sem suporte.
- A revisão visual completa de todos os plugins e testes físicos Android/iOS permanece pendente.

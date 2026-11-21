# Agente IA — Imobify Studio 7.1

## O que faz
Revisa o estado editável das seções visíveis, com saída em patch JSON. Sugere ajustes de SEO, copy, tipografia e alinhamento **somente nos campos já existentes**. A proposta é validada e apresentada como antes/depois. O operador aprova; todas as mudanças entram em uma única operação Desfazer.

## Como executar sem API paga
1. Suba o editor por HTTP local: `python3 -m http.server 8765` na raiz da versão 7.1.
2. Abra **Agente IA**, escolha **ChatGPT** ou **Claude**.
3. Selecione o objetivo, clique **Copiar** e cole em seu chat.
4. Cole a resposta JSON gerada no campo apropriado e valide.
5. Inspecione cada mudança e confirme **Aplicar alterações**. Nada é aplicado sozinho.

## Ollama
Instale Ollama e baixe um modelo, por exemplo: `ollama pull gemma3:4b`.
Rode Ollama com origem HTTP do editor permitida. Exemplo Linux:

```bash
OLLAMA_ORIGINS=http://localhost:8765,http://127.0.0.1:8765 ollama serve
```

Abra Studio na porta 8765 e escolha **Ollama**. Para máquinas mais modestas, troque o modelo. Com `http://` e navegador em domínio HTTPS remoto, a política de mixed content pode impedir a conexão. Prefira editor local.

## Gemini via proxy local

```bash
GEMINI_API_KEY='CHAVE_DO_AI_STUDIO' node tools/ai-proxy.cjs
```

Abra `http://127.0.0.1:8765`. A chave não é enviada à aplicação web, apenas à API do Gemini pelo proxy local. A franquia gratuita é sujeita a elegibilidade, cotas e termos atuais do Google. Não exponha esse servidor na internet.

## ChatGPT Sign in with ChatGPT
O fluxo oficial exige registro de cliente, OAuth suportado e controles de uso e armazenamento de tokens. Não foi criado um botão OAuth falso ou uso de cookies/sessão do ChatGPT. O modo manual funciona sem credenciais e o Ollama permite automação local sem API paga.

## JSON de resposta

```json
{
  "operations": [
    { "target": "seo", "key": "title", "value": "Novo título de até 60 caracteres" },
    { "target": "section", "sectionId": "ID_REAL_DA_SECAO", "key": "title", "value": "Novo título" }
  ],
  "notes": ["Explique o motivo das mudanças."]
}
```

`sectionId` deve ser um ID já presente no projeto; o agente não inventa elementos. A validação bloqueia URLs, mídia, código, scripts, campos secretos, parâmetros de envio e demais controles não incluídos na lista permitida. A resposta de um LLM é não confiável e deve ser revisada pelo operador. Não envie dados sigilosos de clientes no projeto.

## ZIP público
- `llms.txt`: índice público do empreendimento (gerado com ou sem canônica; avisa quando ausente).
- `llms-full.txt`: textos extraídos **somente** das seções visíveis e campos públicos considerados seguros.
- `ai-catalog.json`, `/.well-known/ai-catalog.json`: catálogo com entradas vazias (não há servidor MCP remoto).
- `assets/js/agentic.js`: anotação progressiva de formulários HTML com suporte WebMCP, sem autoenvio.
- `content/agentic-audit.json`: diagnóstico estático; validar no site HTTPS real com navegador compatível.
- `robots.txt`, `sitemap.xml` (se habilitado), metadados OpenGraph e Schema.org já existentes.

**Atenção:** arquivos dentro de `content/` são públicos se a pasta for publicada. O pacote inclui `content/project.json` para compatibilidade histórica, e pode conter contatos e configurações. Revise os dados antes de colocar o ZIP em produção; não coloque segredos de API no projeto.

Ao publicar em GitHub Pages, inclua o arquivo `.nojekyll` que a exportação já adiciona para servir `/.well-known/` corretamente.

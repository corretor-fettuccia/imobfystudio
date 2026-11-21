# Imobify Studio 7.1.1 — biblioteca de referências Markdown

**Base:** 7.1.0. **Arquitetura:** Web/JavaScript, sem conversão desktop.

## Melhorias
- Adiciona upload local de até 8 arquivos `.md`/`.markdown` (até 64 KB cada; total armazenado 160 mil caracteres).
- Seletor de tipo (Memorial, Condições comerciais, Copy, SEO/região e Outros), ativação/desativação e remoção individual.
- Persistência dos documentos no projeto editável JSON, com validação e histórico Desfazer.
- Prompt com autoria/identificação de documentos, orçamento de contexto configurável (12 mil, 32 mil, 70 mil caracteres), redistribuição justa entre os selecionados e sinalização de corte.
- Hierarquia de confiança de fontes: dados técnicos vs marketing vs condições comerciais; entradas Markdown tratadas como texto de referência, não instruções.
- Exclusão preventiva de referências privadas na compilação de landing page, inclusive `content/project.json`, documentos de IA e SEO.
- Preserva ChatGPT/Claude por copiar/colar, Ollama local e proxy opcional Gemini.

## Uso e segurança
- Salvar explicitamente o arquivo JSON do projeto para conservar referências. Os MDs não são enviados ao servidor pelo simples anexo, mas seu conteúdo entra no prompt enviado ao modelo quando o usuário escolhe executar ou copiar.
- Não anexar dados sigilosos ou informações pessoais; revisar condições comerciais e datas, que podem estar desatualizadas.
- Se documentos excederem o orçamento da sessão, a IA só recebe os trechos indicados.

## Limitações
- Não habilita OAuth de ChatGPT ou Claude.
- A resposta continua exigindo validação e confirmação para aplicar mudanças.
- Modelos locais pequenos podem exigir o modo compacto por causa da janela de contexto.
- Testes em navegadores reais, Ollama ou Gemini são pendentes quando o ambiente não permite conexões.

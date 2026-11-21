# Guia — Markdown como referência para o Agente IA (Imobify 7.1.1)

## Iniciar o Studio
1. Extraia todo o ZIP do Studio para uma pasta local. Não abra o `index.html` diretamente por `file://`.
2. No terminal, entre na pasta que contém `index.html` e execute `python3 -m http.server 8765`.
3. Abra `http://localhost:8765` no Chrome/Firefox e carregue/crie um projeto Imobify.
4. Clique em **✦ Agente IA** na barra superior.

## Anexar os MD
1. Clique em **Anexar Markdown**, selecione um ou vários `.md`/`.markdown`.
2. Os documentos aparecem com caixa de seleção, categoria e botão Remover.
3. Classifique: **Memorial** (especificações objetivas), **Condições comerciais** (preço, entrada, entrega), **Copy** (modelo de escrita) ou **SEO/região** (entorno/posicionamento). A classificação inicial é sugerida pelo nome do arquivo.
4. Marque apenas os arquivos relevantes para cada objetivo. Configure **Compacto** (12 mil caracteres), **Padrão** (32 mil) ou **Estendido** (70 mil). A IA recebe somente o texto selecionado até esse limite. Cortes aparecem no prompt.
5. **Salve o projeto JSON (Ctrl+S ou Salvar → Salvar no disco)**. O conteúdo MD é guardado dentro desse arquivo editável; reabra esse JSON para recuperar o material.

## Usar com ChatGPT ou Claude sem API
1. Em **Modo de conexão**, escolha ChatGPT ou Claude.
2. Escolha a revisão: Completa, SEO, Copy, Tipografia ou Navegação agêntica.
3. Clique **Preparar prompt** e confirme os MDs e cortes; depois **Copiar para ChatGPT / Claude**.
4. Cole o texto no chat ChatGPT/Claude. Peça que a resposta seja **apenas JSON** no formato solicitado no prompt.
5. Copie o JSON retornado, cole em **Resposta JSON do agente** no Studio, clique **Validar e visualizar diferenças**.
6. Confira o antes/depois e clique **Aplicar alterações no projeto** somente depois de confirmar. Você pode usar **Desfazer**.
7. Salve o projeto novamente. A IA não modifica mídia, URLs, formulários ou campos não permitidos.

## Usar Ollama local (sem API paga)
1. Instale Ollama e baixe um modelo compatível, por exemplo: `ollama pull gemma3:4b`.
2. Pare instâncias duplicadas e inicie Ollama permitindo a origem do Studio: `OLLAMA_ORIGINS=http://localhost:8765,http://127.0.0.1:8765 ollama serve`.
3. Deixe `python3 -m http.server 8765` executando em outro terminal.
4. No Studio, escolha **Ollama** e informe o modelo instalado. Para `gemma3:4b`, prefira orçamento **Compacto**, especialmente se houver vários MDs.
5. Clique **Executar agente**, depois valide as diferenças e aplique. Ollama precisa estar acessível em `http://127.0.0.1:11434`.

## Usar Gemini com API
1. Instale Node.js 20+ e configure uma chave de API válida do Gemini.
2. No diretório do Studio, rode `GEMINI_API_KEY='SUA_CHAVE' node tools/ai-proxy.cjs`. Não rode o `python3 -m http.server` na mesma porta.
3. Abra `http://127.0.0.1:8765`, escolha **Gemini** e clique **Executar agente**.
4. Valide os ajustes antes de aplicar. A chave fica no servidor local, não no navegador. O uso pode estar sujeito a limites/cobrança conforme o plano.

## Limites e segurança
- Máximo: 8 MDs; 64 KB por arquivo e 160 mil caracteres no projeto.
- A cópia de texto para ChatGPT/Claude e o envio para Gemini são feitos explicitamente pelo operador. Os MDs selecionados entram no prompt, logo NÃO inclua credenciais, dados pessoais ou segredos comerciais que não possam ser compartilhados.
- O comando **Exportar landing page** retira a propriedade `aiReferences` antes de construir qualquer arquivo público, inclusive `content/project.json` e `llms*.txt`.
- **Salvar projeto** cria um JSON **privado** que CONTÉM os documentos e não deve ser publicado junto com a landing page.
- O modelo pode errar. Dados de memorial, valores, prazos e regras precisam de checagem humana.
- Se o prompt indicar cortes, escolha menos documentos, aumente o orçamento ou revise um por vez para receber mais cobertura.

## Exemplo de classificação
- `SinteseMemorial_Mezzano.md` → Memorial
- `Mezzano-Tabela-Comercial.md` → Condições comerciais
- `COPY_Engeneer_Social.md` → Copy
- `Pesquisa-SEO-Regiao.md` → SEO/região

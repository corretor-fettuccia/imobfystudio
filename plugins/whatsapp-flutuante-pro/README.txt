WHATSAPP FLUTUANTE PRO — IMOBIFY STUDIO v4

INSTALAÇÃO PELO EDITOR
1. Abra Estrutura > Plugin Play.
2. Clique em Instalar plugin .zip.
3. Selecione whatsapp-flutuante-pro.zip.
4. Adicione o plugin na biblioteca.
5. Selecione a seção criada e configure no inspetor.

INSTALAÇÃO MANUAL
1. Copie a pasta whatsapp-flutuante-pro para framework/plugins/.
2. Adicione em plugins/registry.json:
   { "manifest": "plugins/whatsapp-flutuante-pro/plugin.json" }
3. Reabra/recarregue o editor por HTTP.

TELEFONE
Use DDI + DDD + número, somente números. Exemplo: 5551998111078.

URL ENCODE
- "Codificar automaticamente": escreva a mensagem normalmente.
- "Mensagem já codificada": aceita texto previamente processado e evita codificação dupla quando possível.


FOTO NO HOVER
-------------
No inspetor do plugin, use o campo “Foto no hover”.
- Cole uma URL HTTPS; ou
- carregue uma imagem local (JPG, PNG, WebP ou GIF).

Quando uma imagem local é escolhida, o Imobify a incorpora como data:image/...;base64,... no projeto. No hover ou foco do botão, a foto substitui visualmente o ícone do WhatsApp. Sem imagem configurada, o ícone funciona como antes.

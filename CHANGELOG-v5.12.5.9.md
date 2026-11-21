# Changelog v5.12.5.9

- Popup Pro 1.3.4: controle de tamanho do banner no desktop (80% a 200%) no modo imagem + CTA; o mobile não é alterado.
- Exportação: cache-busting automático de `site.css` e `site.js`, evitando publicação com runtime antigo em navegador/CDN.
- Exportação: validação específica do markup, CSS e runtime do Popup Pro antes de gerar o ZIP.
- Popup Pro: namespace de sessão atualizado para evitar bloqueio herdado de testes de versões anteriores na mesma aba.

# Imobify Studio 5.0.1.24

## Sitemap XML automático

- `sitemap.xml` passa a ser um recurso explícito da compilação do projeto.
- Ativado por padrão na aba SEO.
- O arquivo é gerado na raiz do ZIP final.
- Usa a URL canônica HTTPS como `<loc>`.
- Inclui `lastmod`, `changefreq`, `priority` e imagens indexáveis do projeto.
- `robots.txt` referencia automaticamente o endereço público do sitemap.
- O editor mostra uma prévia do endereço em que `sitemap.xml` será publicado.
- Se o sitemap estiver habilitado e a URL canônica estiver ausente ou inválida, a compilação é interrompida com uma mensagem clara para evitar publicar um XML incorreto.
- É possível desativar a geração na aba SEO quando necessário.

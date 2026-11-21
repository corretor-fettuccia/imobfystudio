# Imobify Studio 7.2.0 — Release (2026-11-02)

## Exportação, rastreamento e imagens
- `sitemap.xml`: uma URL canônica pública por landing page, com as imagens na extensão `<image:image><image:loc>`. Origem: imagens incorporadas ao ZIP e mídias públicas referenciadas em seções, JSON serializado de plugins, HTML de imagem/OG e CSS; limite de 1.000 imagens, deduplicação e escape XML de parâmetros de URL.
- Links de imagem local são incluídos apenas quando o arquivo realmente existe no ZIP. Arquivos `data:`/`blob:` e links de seções ocultas não entram na listagem.
- Caminhos de `icon.png|webp` e `share.png|webp` respeitam a pasta da URL canônica em hospedagens de subdiretório, inclusive para Open Graph/Twitter/JSON-LD.
- `<lastmod>` somente quando há data sintaticamente válida disponível em revisão ou atualização. Não incluir `<priority>` nem `<changefreq>` porque não são considerados pelo Google.
- `llms.txt` e `llms-full.txt` preservados, com informações de seções visíveis e links de descoberta (não é fator declarado de ranqueamento).
- `robots.txt` declara Sitemap quando habilitado. `.nojekyll` protege publicação de `.well-known/` no GitHub Pages.

## Auditoria de navegação agêntica na exportação
- Após gerar HTML, CSS, JS e mídia, executa validações de integridade (main, HTML title, canonical, llms, sitemap, catálogo de IA, runtime WebMCP e robots).
- Falhas estruturais bloqueiam o download para evitar publicação de pacote inválido; avisos não bloqueantes documentam ausência de H1, alt, imagem, SEO, canonical, páginas noindex, imagens HTTP e hosts externos.
- Novos relatórios: `content/export-validation.json` e `VALIDACAO-EXPORTACAO.txt`, com checklists de resultados. `content/agentic-audit.json` inclui checks da exportação.
- Formulários recebem descrições/nome WebMCP progressivamente se o navegador oferecer a API; não há `toolautosubmit`.

## Editor
- Removido botão «Agente IA», modal, JS/CSS exclusivos e API global de aplicação de alterações por IA.
- Preservadas ferramentas de edição, plugins, hero-plus, exportação múltipla, campos SEO, guias de documentação e importação de projetos JSON 7.x.
- Referências de Markdown antigas são toleradas no formato privado de projeto, mas descartadas da exportação pública.

## Compatibilidade / limites
- URLs HTTPS públicas configuradas pelo operador são obrigatórias para sitemap automático; sem URL válida, o compilador interrompe a exportação se sitemap estiver habilitado.
- Referências de mídia remota precisam estar acessíveis e autorizadas para rastreamento; o compilador não faz teste HTTP remoto completo em todos os hosts por limites de CORS.
- Validação WebMCP funcional, interações reais e Lighthouse devem ser executados no site publicado e em navegadores compatíveis; validação estática não certifica esses ambientes.
- Gerar arquivos de descoberta melhora a organização técnica, mas não garante indexação nem posição na pesquisa.

## Correção 7.2.0-r1 — URL canônica e exportação (2026-11-02)
- Corrigido o bloqueio indevido `Canonical HTML não corresponde à URL configurada.` quando a URL estava preenchida, mas diferia após normalização pelo navegador (como ausência de barra final na raiz, caixa do domínio, porta HTTPS padrão e espaços externos).
- O HTML gera `<link rel="canonical">` e `og:url` usando URL absoluta normalizada, coerente com o `<loc>` do sitemap. JSON-LD também utiliza uma URL pública normalizada.
- A auditoria agora lê especificamente o atributo `href` do elemento `<link rel="canonical">`, decodifica entidades HTML e compara URLs normalizadas, sem aprovar apenas um `href` arbitrário presente no HTML.
- Mantido o bloqueio para URL canônica realmente divergente, removida ou duplicada.
- Adicionado `tests/canonical-regression-720.test.cjs`, cobrindo seis formatos e três casos de corrupção por formato.

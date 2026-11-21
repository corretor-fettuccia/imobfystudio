# Validação da versão 6.0.40 — 16/10/2026

## Execuções realizadas
- `node --test tests/*.test.cjs`: **37/37 aprovados**, incluindo contrato de papéis, normalização segura de entradas, compatibilidade com projetos antigos, sobrescrita local, exportação de CSS e coerência de versão.
- 48 plugins registrados percorridos em auditoria estática dos seus markups; nenhum erro de renderização dos defaults. **33** possuem correspondência estática direta com os papéis CSS, **10** não exibem conteúdo textual estático na configuração padrão e **5** dependem de markup criado dinamicamente ou exigem verificação visual específica. Os resultados não equivalem a testes visuais completos. Consulte o CSV.
- Compilação isolada dos **48 IDs de plugins** no motor de exportação: **47** tiveram markup normal esperado; **1** (Tag Installer Pro) é do tipo `document-tag` e não gera uma seção de UI por definição. Nenhuma falha de compilação dos plugins.
- Compilação integrada no teste `typography-wizard.test.cjs`: tokens globais desktop/mobile e cor personalizada no `assets/css/site.css` do ZIP; opção local representada no HTML e script administrativo não incluído no HTML exportado; projeto fonte não sofre mutações durante a compilação.
- Chromium headless, interface isolada via DOM: executados os fluxos de seleção de preset, edição da Headline 96 px / 41 px, prévia mobile, navegação e aplicação. Resultado desktop e mobile: tamanho de amostra 41 px, dados de 96/41 persistidos no callback, modal fechado, nenhum erro JavaScript e nenhum overflow horizontal na área externa.

## Validações ainda necessárias
- Navegação pelo editor real em localhost, criação e reabertura de projetos antigos, verificação de prévia dentro do iframe, comparativo visual dos 48 plugins em desktop e mobile, acessibilidade por teclado/leitora de tela em contexto de integração e medições reais de desempenho/Lighthouse.
- Verificar exceções para plugins com tipografia interna especializada e confirmar compatibilidade com CTAs de vídeo, menu, galeria e componentes dinâmicos.

## Teste manual rápido
1. Servir a pasta pelo localhost; abrir `index.html`.
2. Aba Design → Abrir Wizard de Tipografia e Estilo → selecionar perfil.
3. Editar Eyebrow/Headline/Subheadline/Body Text/CTA, alternar desktop/mobile e aplicar.
4. Reabrir o Wizard; verificar as propriedades persistidas.
5. Selecionar um plugin que possua tipografia própria → escolher “Preservar estilo próprio”; comprovar que somente esse plugin ignora o Wizard.
6. Salvar projeto, reabrir, exportar ZIP e comparar o editor com a landing publicada.
7. Verificar contraste dos CTAs, títulos em blocos com imagem e layout mobile.

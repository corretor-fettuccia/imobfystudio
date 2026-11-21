# Validação — Imobify Studio 7.2.0

**Data:** 2026-11-02  
**Base:** ZIP Imobify Studio 7.1.2 enviado pelo usuário.

## Testes automatizados

- Scripts de teste executados: 68
- Aprovados: 62
- Reprovados: 6
- Excederam tempo: 0
- Relatório integral: `tests/RESULTADOS-7.2.0.json`
- Teste corretivo novo `tests/canonical-regression-720.test.cjs`: **APROVADO**. Seis variações de URL (barra final, caixa, espaço, query, encoding e porta padrão); também confere rejeição de canonical alterada, ausente ou duplicada.
- Teste específico novo `tests/export-quality-720.test.cjs`: **APROVADO**. Cobre sitemap + imagens, namespace, deduplicação, escaping, caminho correto em subpastas, llms, WebMCP, SEO, página sem canonical com sitemap desativado e remoção do painel.

Os seis testes que falharam têm assertivas fixadas em números de versões de lançamentos históricos (6.0.83, 4.4.6, 1.3.0). Essas assertivas não refletem os números dos componentes na base 7.1.2 ou na nova 7.2.0. Não declarar a suíte integral como aprovada; executar QA em navegador para fluxos de plugins.

Os testes antigos do painel de IA removido foram arquivados em `tests/legacy/`, para não contar um componente intencionalmente removido como falha.

## Limites de validação

- Testes Node cobrem a composição estática e a presença dos arquivos exportados, não a presença efetiva de APIs WebMCP experimentais no navegador do visitante.
- Publicação em HTTPS e acesso HTTP 200 dos recursos na hospedagem de destino não são testados pelo ZIP. Verificar Search Console, URL Inspection e Lighthouse após publicação.
- A ausência de H1, alt ou imagens indexáveis é registrada como aviso de qualidade e não corrige automaticamente o copy nem inventa atributos alternativos.
- Em imagens de CDN, garantir disponibilidade, robôs permitidos e propriedade de domínio verificada no Search Console conforme aplicável.

## Tentativa de QA em navegador

Foi iniciada uma verificação do editor no Chromium headless com servidor HTTP local. O ambiente de execução bloqueou a navegação `http://127.0.0.1` com `net::ERR_BLOCKED_BY_ADMINISTRATOR`; por isso não foi possível confirmar um fluxo real de clique/baixar ZIP com navegador. As verificações de exportação executadas pela suíte Node são válidas, mas não substituem esse teste de interface.

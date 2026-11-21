# Validação técnica — Imobify Studio 7.3.0

## Resultado

**Aprovado (testes estruturais e compilação).** Atualização de âncoras no início dos componentes por meio do renderizador compartilhado.

| Verificação | Resultado |
|---|---|
| Cobertura de âncoras — 39 plugins de seção do registry + 12 componentes nativos | OK: 51 |
| Primeiro filho de cada seção é o marcador de âncora configurado | OK |
| Âncora no editor e no HTML exportado | OK |
| Preservar IDs históricos `#destaques`, `#galeria` | OK |
| Não duplicar ID quando âncora personalizada coincide com ID histórico | OK |
| Composição em Section Layout e Segment Layout | OK |
| Plugins de documento sem âncora espúria no BODY publicado | OK |
| Regressão: exportação agêntica + privacidade do Markdown | OK |
| Regressão: Hero Plus + export quality + canonical | OK |
| Validação de sintaxe JS do renderer/runtime/app/compiler | OK |
| Interação visual real com Chromium | Não executável: bloqueio administrativo do ambiente |

**Procedimento de aceite manual:** abrir `index.html` do Studio a partir de um servidor HTTP local, abrir uma LP com três ou mais seções, configurar IDs em “Âncora do bloco” (por exemplo `beneficios`, `plantas`, `contato`), inserir CTAs para `#beneficios`, `#plantas` e `#contato`, exportar, publicar e clicar em desktop e mobile. Todos devem posicionar o início da seção de destino imediatamente abaixo da área de segurança do menu, sem cair na seção seguinte. Revalidar layouts de múltiplas colunas e páginas com parallax/efeitos de transição.

**Comandos reproduzíveis:**

```bash
node tests/anchors-start-730.test.cjs
node tests/agentic-export-71.test.cjs
node tests/md-export-private-711.test.cjs
node tests/hero-plus-export-712.test.cjs
node tests/export-quality-720.test.cjs
node tests/canonical-regression-720.test.cjs
```

O teste `export-quality-720` gera um aviso de imagem externa `cdn.example.org` indisponível no fixture e **termina com status 0**. Os testes legados que exigem números de versão anteriores não representam a versão atual e não foram considerados aprovados sem execução.

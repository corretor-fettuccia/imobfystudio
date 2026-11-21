# Imobify Studio 7.5.0 — Texto e posicionamento

**Base:** Imobify Studio 7.4.2. Nenhuma funcionalidade anterior removida.

## Problema
Com "Personalizar estilo" ligado, só a seção Condições de pagamento respeitava o alinhamento escolhido. Três causas, comuns a quase todos os componentes:
1. A **chamada superior** (eyebrow) era excluída de propósito do alinhamento.
2. Títulos e subtítulos têm **largura máxima**: o texto alinhava dentro da própria caixa, mas a caixa continuava encostada à esquerda. Alguns componentes posicionam o conteúdo por variáveis próprias (Hero Plus, Only TEXT).
3. O **justificado** desligava a hifenização e convivia com a quebra "balance", que encurta as linhas; o resultado eram buracos entre as palavras.

## Corrigido (renderer, camada de estilo por seção — sem reescrever os componentes)
- Chamada superior acompanha o alinhamento do título (desktop e mobile), com opção própria.
- A caixa do texto acompanha o alinhamento: títulos principais (h1/h2), chamada, subtítulo/lide, parágrafos com largura máxima e a caixa de cabeçalho estreita do componente. Os botões que vêm logo após o título também acompanham.
- Adaptadores: Hero Plus (`--hp-h-align`, `--hp-actions-align`, `--hp-text-align`, inclusive no mobile, que antes forçava esquerda) e Only TEXT (`--otc-align` e posição de `.otc-inner`).
- Corpo em `div` (`*-body`, `*-text`) passa a ser reconhecido (ex.: corpo do Only TEXT no mobile).
- Justificado: hifenização automática em português no corpo; quebra `pretty` no corpo e normal nos títulos (nunca `balance`); títulos nunca hifenizados; última linha sempre alinhada ao início.

## Adicionado
- Grupo **Texto e posicionamento** no estilo da seção: alinhamento de títulos e corpo (desktop/mobile), **Chamada superior**, **Posição do bloco de texto**, **Largura de leitura do corpo** (45/55/65/75 caracteres ou livre), **Hifenização no justificado** e quebra de linha.
- Auditoria: "Título justificado no celular" e "Justificado sem hifenização", com correção de um clique.
- `scripts/diagnostico-alinhamento.cjs`: mede a posição real das linhas de texto de cada componente (esquerda/centro/direita/justificado, 1280 e 390 px).

## Validação — diagnóstico de alinhamento (Chromium, 4 modos × desktop/mobile)
| Componente | Falhas 7.3.8 | Falhas 7.5.0 | Medições |
|---|---:|---:|---:|
| Hero Imobiliário Plus | 8 | 4 | 24 |
| Destaques | 6 | 0 | 64 |
| Benefits Showcase | 7 | 1 | 152 |
| Ficha do imóvel | 4 | 0 | 104 |
| Lifestyle | 7 | 7 | 32 |
| Condições de pagamento | 6 | 0 | 24 |
| Perguntas frequentes | 20 | 16 | 48 |
| Only TEXT — Context | 3 | 0 | 32 |
| Tabela Investimento + Glass CTA | 10 | 3 | 24 |
| Form Sender v4 | 4 | 0 | 24 |
| Benefícios + Modal | 5 | 0 | 16 |
| Smart Plant | 6 | 0 | 64 |

Todos os 24 componentes de texto: 341 → 200 falhas em 1484 medições (23% → 13%).

Falhas restantes conhecidas e esperadas: etiqueta (ribbon) do Hero Plus tem controle próprio; citação do Lifestyle tem barra lateral; respostas do FAQ reservam espaço para o ícone +/−; linhas com uma palavra ou terminadas em quebra forçada não se esticam no justificado (comportamento correto). Componentes de dados (rodapé, simulador, timeline, magazine) mantêm rótulos e números no alinhamento do próprio layout.

Testes automáticos: mesmas 15 falhas pré-existentes da 7.3.8; nenhuma nova. Smart Plant → formulário 12/12; Auditoria e MainFrame sem regressão.

## Atenção
- Os controles valem com **Personalizar estilo** ligado na seção.
- Reexporte as páginas para publicar.

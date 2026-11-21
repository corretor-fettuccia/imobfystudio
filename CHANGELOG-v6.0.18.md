# 6.0.18 — Parallax avançado no export

- Prévia mobile do modal avançado passa a usar a mesma referência de composição de 1280 px que o desktop, reduzida como um todo.
- O runtime mobile respeita a caixa de composição de largura original e não impõe max-width incompatível com o zoom proporcional.
- Restaura semântica unificada de fontes, quebras e proporções entre prévia e exportação.
- O zoom é aplicado automaticamente pelo runtime exportado, independente dos controles de zoom do editor.

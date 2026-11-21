# Imobify Studio 7.3.3

Base: 7.3.2. Correção específica do Smart Plant.

## Fluxo corrigido

1. Clicar no CTA da planta selecionada.
2. Resolver o formulário configurado (Form Sender V4 ou Agendamento Sender) e verificar sua disponibilidade.
3. **Fechar o modal**, liberar o `body` e restaurar a posição temporariamente travada pelo modal.
4. **Gravar o texto da planta** no formulário definido, sem sobrescrever data/turno do agendamento.
5. **Aplicar a âncora** após dois quadros de renderização, com posicionamento imediato e foco no campo de nome.

## Causa adicional localizada

Na prévia do editor, clicar no botão de uma seção também emitia `imobify-select`, causando remount da prévia e realinhamento forçado à seção Smart Plant. O editor agora preserva a interação com botões/formulários e suspende o auto-foco da seção selecionada durante a navegação.

## Compatibilidade

- Form Sender V4, Agendamento Sender, Popup (comportamento existente) e WhatsApp.
- Fechamento simples X/Escape/fundo continua preservando a posição nas plantas.
- Exportação estática e âncoras do Imobify 7.3.0 preservadas.

É necessário reexportar e republicar a landing page.

# Imobify Studio 5.3.0

## Novo projeto
- O botão **Novo** agora abre um diálogo próprio.
- Opção **Novo projeto em branco**.
- Opção **Novo projeto de modelo** com árvore hierárquica.
- Modelos iniciais para loteamento, empreendimentos vertical/horizontal, investimento, casa, sobrado, MCMV, alto padrão e investidor.

## Presets de projeto
- Novo registro `presets/presets.json` inspirado no registro de plugins.
- Cada preset aponta para seu diretório e arquivo `preset.json`.
- Loader dedicado em `assets/js/preset-loader.js`.
- Biblioteca de presets dentro da aba **Projeto**.
- Ações **Novo** e **Aplicar** para cada preset.
- Cadastro do projeto atual como novo preset.
- Salvamento direto na pasta do Studio via File System Access API quando disponível.
- Exportação ZIP como alternativa portátil.

## Compatibilidade
- Presets visuais existentes no design system permanecem separados dos novos presets de projeto.
- Plugin Play e projetos JSON existentes permanecem compatíveis.

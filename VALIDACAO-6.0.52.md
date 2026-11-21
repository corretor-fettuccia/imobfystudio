# Validação — Imobify Studio 6.0.52

## Alteração funcional
- O Hero360Tour v1.1.2 expõe em **Navegação** a opção **Habilitar painel de navegação**, inicialmente desligada.
- Com a opção desativada, a exportação não cria os botões de aproximar, afastar e tela cheia; atalhos de teclado para zoom também ficam desligados.
- Com a opção ativada, os três botões ficam disponíveis, com zoom manual e tela cheia; a roda do mouse continua rolando a landing page.
- O ambiente de autoria de cenas Tour360 Studio mantém seus controles próprios, pois são destinados à edição e posicionamento de hotspots.
- Tour360 e Parallax360Tour não sofreram alterações.

## Testes automatizados
- Suíte completa do Imobify Studio: 48 testes aprovados de 48.
- Validação de manifestos, instalação Plugin Play, HTML exportado com opção desativada/ativada e presença condicional dos botões.
- Verificação de sintaxe `node --check` e integridade do ZIP.

## Teste de navegador (Chromium)
- Resoluções: 390 × 844 px e 1366 × 850 px.
- Painel desativado: 0 controles criados.
- Painel ativado: 3 botões (+, − e tela cheia).
- Os botões de zoom responderam ao clique, e a ação de tela cheia ativou `document.fullscreenElement`.
- Scroll com wheel sobre o canvas: 350 px de movimento da página.
- Nenhuma exceção JavaScript reportada.
- Este ensaio usou uma cópia reduzida do panorama real fornecido pelo usuário; não constitui teste de publicação em domínio externo.

## Compatibilidade
- Projetos antigos sem o novo parâmetro também iniciam sem painel de navegação. Para exibir os controles, ative a opção no inspetor do Hero360Tour e exporte novamente.

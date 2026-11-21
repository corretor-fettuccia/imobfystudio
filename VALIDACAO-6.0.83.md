# Validação 6.0.83 — Benefits Showcase

## Automatizado

- `bash scripts/verify-release.sh`: 59 testes de regressão OK; 49 plugins de interface/comportamento compilados e Tag Installer documental inventariado. Há avisos de imagens auxiliares ausentes no CSS dos mapas, herdados das versões anteriores.
- `node tests/benefits-core-typography-6083.test.cjs`: OK; tokens, Wizard, exportação HTML/CSS/JSON e imagem fixa.
- Validação Chromium de browser (capturas desktop/mobile): `plain`, `wizard`, `center` e `photo`; largura do projeto personalizada para 860px e margem do contêiner preservada.
- Desktop 1440: margem horizontal do cabeçalho = margem horizontal da grade = 290px; padding superior = 96px.
- Mobile 390: margem horizontal = 14px; padding superior = 52.8px via token fluido do core.
- Tipografia Wizard: headline Playfair Display, subheadline DM Sans, body Montserrat aplicados em seus papéis; projeto sem Wizard respeita fontes e tamanhos do core.
- Fundo sticky: permanece fixo enquanto seção é percorrida nas viewports testadas, sem roubar o padding de topo.

## Checklist manual recomendado

1. No editor, defina Largura do contêiner, Espaçamento de seção, Espaçamento entre blocos, Fonte de títulos e Fonte de textos.
2. Selecione Benefits Showcase, deixe alinhamento Esquerda e confirme que título e cards iniciam exatamente na mesma margem.
3. Ative o Wizard de Tipografia e altere headline, subheadline e body. Compare preview e HTML exportado.
4. Adicione uma imagem de fundo fixa e verifique que o topo do título mantém o respiro padrão do projeto.
5. Alterne alinhamento Centralizado e volte para Esquerda, conferindo a ausência de deslocamentos horizontais.
6. Teste larguras mobile de 320px, 390px e 430px, além de tablet e desktop.
7. Abra o ZIP exportado em hospedagem de teste com imagens locais e verifique Android e iOS reais.

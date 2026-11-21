# Validação — Imobify Studio 7.3.3

## Falha corrigida

Na prévia do editor, o clique em um botão do Smart Plant também podia selecionar a seção, remontando a prévia e forçando o scroll de volta às plantas. Em paralelo, o desbloqueio do `body` do modal e a ida à âncora não possuíam uma sequência de navegação suficientemente determinada.

## Sequência implantada

1. Resolve e valida o formulário de destino.
2. Fecha o modal, desbloqueia o `body` e restaura o scroll sincronamente.
3. Grava dados da planta no Form Sender V4 ou no Agendamento Sender.
4. Navega à seção/âncora alvo após a atualização do layout e foca o campo Nome.
5. Impede a prévia do editor de remontar/recentralizar a seção Smart Plant durante o clique interativo.

## Testes executados

- **Exportação real:** 4/4 cenários no Chromium, após 1,3 s: desktop/mobile, V4/Agendamento. Âncora visível, modal fechado, body desbloqueado, foco em Nome, contexto transferido.
- **Prévia (ponte do editor isolada):** 4/4 cenários no Chromium: desktop/mobile, V4/Agendamento. Sem novas mensagens `imobify-select` originadas pelos botões da planta, com âncora visível após 1,2 s.
- **Regressão Node:** 11/11 verificações aprovadas, abrangendo exportação, âncoras, scripts e configuração de destinos.
- **Fechamento comum:** continua sem redirecionar o usuário para o formulário.

## Limites

Os testes de prévia utilizaram o JavaScript real da ponte do editor num documento de prova isolado, não a aplicação inteira do Studio num iframe. Não foi executado envio externo ao Google Apps Script ou testes em Safari físico. Para páginas já publicadas, reexporte e republique o ZIP.

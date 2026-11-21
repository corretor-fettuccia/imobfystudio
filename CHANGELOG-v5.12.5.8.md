# Changelog v5.12.5.8

- Popup Pro 1.3.3: elimina conflito entre múltiplas instâncias desktop/mobile com gatilhos iguais.
- As regras Ocultar no mobile / Ocultar no desktop são capturadas por instância e controladas somente pelo JavaScript após o portal para o body.
- O overlay não recebe mais os atributos globais de ocultação, evitando dupla aplicação de `display:none!important`.
- Aviso no editor quando uma instância estiver configurada para ocultar nos dois dispositivos.
- Reavaliação segura ao cruzar o breakpoint de 720 px.

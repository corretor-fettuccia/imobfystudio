# Imobify Studio 5.2.5

## YouTube 1.0.1

- Corrige a reprodução do YouTube na prévia do editor: o preview passa a liberar `same-origin` e apresentação quando o YouTube bundled está ativo, evitando que o player herdado do sandbox seja executado com origem opaca.
- Mantém o isolamento mais restritivo quando houver plugin instalado de terceiros ativo no mesmo preview.
- O campo **ID ou URL do vídeo** agora aceita também URLs de watch/embed/Shorts/Live, `youtu.be` e conteúdo de iframe copiado do YouTube.
- Adiciona sincronização resiliente do iframe quando atributos do plugin forem atualizados dinamicamente.
- Corrige **Alinhamento do frame** (`Esquerda`, `Centro`, `Direita`) usando margens internas no shell do player, evitando conflito com `justify-content` externo.
- Dentro de **Segmentos**, o componente YouTube mantém 100% da largura disponível do slot, permitindo que o alinhamento do frame tenha efeito visual mesmo quando o Segmento pai usa alinhamento horizontal próprio.
- Pacote atualizado: `plugin-packs/youtube-v1.0.1.zip`.

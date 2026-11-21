# Imobify Studio 7.1.2 — Hero Imobiliário Plus 1.1.0

**Base:** 7.1.1. **Arquitetura:** Web/JavaScript; edição e exportação de landing pages estáticas preservadas.

## Atualizações do Hero Plus
- Corrigidas margens nativas de `figure` que deixavam bordas nas imagens. Todos os quadros têm overscan de 9%, `object-fit:cover` e recorte no próprio contêiner, sem expor faixas nas transições horizontal, vertical, zoom, perspectiva ou crossfade.
- O slide anterior fica totalmente visível atrás do próximo durante a entrada. A imagem seguinte é pré-carregada e decodificada antes da troca, evitando vazios por atraso de download.
- Nova transição padrão `crossfade` de 1400 ms. Movimento de fundo padrão mais lento e suave (20 s, intensidade 24), sem alterar as configurações já existentes em projetos salvos.
- Preenchimento horizontal em desktop e vertical em tablet/celular, com `100dvh` e margens seguras para telas com notch. A fotografia utiliza recorte proporcional, nunca distorção.
- Tipografia fluida para título/apoio, quebras de palavras animadas e reorganização dos espaçamentos em telas baixas; o texto de apoio usa alinhamento justificado, com hifenização disponível e última linha alinhada ao início.
- Botão discreto para pausar e retomar apresentações automáticas, com rótulos acessíveis, foco visível e pausa de animação conforme a preferência de movimento reduzido. Pausa automática dos slides fora da tela; ao remover o elemento, o timer é encerrado.
- Menor risco de gasto de CPU em sessões longas: partículas com cancelamento quando o elemento sai do DOM; `will-change` de imagens somente no slide ativo.

## Compatibilidade
- Valores, links, editor do Studio Hero Plus, exportação e perfis de projetos existentes mantidos. Propriedades antigas continuam aceitas.
- O recorte `cover` é intencional: no celular as laterais da fotografia podem ser cortadas para ocupar toda a altura; use `Posição da imagem X/Y` para ajustar o enquadramento.

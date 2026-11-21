# Imobify Studio 5.2.7

- Atualiza Parallax para **2.7.0**.
- Timeline limpa: somente a chave selecionada abre o editor do banner.
- Cada ◆ é sempre parada do vídeo + abertura do banner.
- Chaves arrastáveis com leitura do segundo/frame durante o movimento.
- Duplo clique no espaço vazio da timeline cria ponto-chave após confirmação.
- Duração real do vídeo capturada via `loadedmetadata` e sincronizada com o Studio por `postMessage` compatível com sandbox.
- Desaceleração antes da chave reforçada; cada ponto pode usar `decelMs` próprio ou herdar a configuração global.
- Marcador independente **LIBERAR SCROLL** define o ponto de saída e não abre banner.
- Ao atingir LIBERAR SCROLL, o handoff determinístico entrega a rolagem à próxima section.
- Pausas adicionais antigas ficam apenas como compatibilidade legada e deixam de competir com o conceito de ponto-chave.

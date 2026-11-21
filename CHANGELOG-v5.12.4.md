# Imobify Studio 5.12.4

- Integração nativa do **Tour 360 Pro 3.2.0** como `section`.
- A configuração complexa do Tour 360 abre em **modal dedicado** dentro do modo edição.
- O modal usa o editor Tour 360 completo: cenas, hotspots, perspectiva, visão de chegada, zoom, bússola, branding e mapa de conexões.
- O projeto do tour é persistido em `section.props.tourConfig`; acessar a section não altera o tour até **Salvar Tour 360**.
- Compilador passou a extrair panoramas e branding armazenados no JSON interno do Tour 360 para arquivos físicos `assets/images/`, removendo Base64 do HTML/projeto publicado.
- Plugin bundled e pacote reinstalável adicionados: `plugins/tour360-pro/` e `plugin-packs/tour360-pro-v3.2.0.zip`.
- Preservados os comportamentos consolidados do Tour 360 3.2.0: navegação touch/pinça, hotspots pulsantes, zona segura, menu de pontos e branding.

## Revisão de integração Tour 360 — plugin 3.2.1

- Corrigido o pacote Tour 360 para ser realmente instalável pelo **Plugin Play**.
- O editor `editor/` agora é incorporado pelo loader e persistido junto ao plugin instalado.
- Adicionado contrato genérico `window.ImobifyPluginEditor` para editores avançados em modal.
- Removida a dependência do modal Tour 360 de um caminho físico hard-coded dentro do framework.
- Abrir o editor não altera a section; somente **Salvar** persiste `tourConfig`.
- SDK e schema atualizados com suporte oficial a `editor.mode = "modal"`.

## Tour 360 Pro v3.2.2
- Corrigido ciclo de vida do editor modal: config da section tem precedência sobre autosave.
- Dependências do editor são lazy-load e não bloqueiam abertura / adição de cenas.
- Simulação de adicionar e persistir cena adicionada à validação.

### Correção do modal Plugin Play
- O JavaScript do editor modal passa a ser transportado em Base64 antes de entrar no `srcdoc`, evitando colisões do parser HTML quando o código do plugin contém strings `<script>`.
- Corrige especificamente o Tour360: abrir o modal, adicionar uma cena e salvar a configuração agora preserva a cena na section.


## Tour360 Pro v3.2.3 — frame nativo e preview local
- Section visual refatorada para o mesmo padrão estrutural do plugin YouTube: container + frame-shell.
- Largura máxima, alinhamento, respiro vertical, raio, sombra e fundo configuráveis.
- Wrapper da section permanece transparente; o Tour360 é recortado dentro da janela interna.
- Panoramas em Data URL são convertidos para Blob URL em runtime no preview do Studio antes do Pannellum.
- Mantida a extração de assets físicos na exportação final.
- Corrige o erro visual de URL Base64 exposta no player do canvas.

## Tour360 Pro v3.2.4 — branding fiel à configuração
- Corrige a chave mestra de exibição do branding.
- Preserva o canto configurado do branding; não troca de posição automaticamente.
- Menu de pontos e painel cedem espaço ao branding em caso de conflito.
- Remove bloco vazio quando branding não tem texto nem imagem.
- Remover logotipo não desabilita o texto/link do branding.

### Tour360 Pro v3.2.5
- Menu de spots reduzido a botão hambúrguer de 3 linhas.
- Painel recolhe ao selecionar um spot, clicar no botão novamente ou clicar fora.
- Branding no mesmo canto do menu fica alinhado na mesma linha, ao lado, sem sobrepor controles.

## Tour360 Pro v3.2.6
- Ao selecionar um hotspot do tipo Informação pelo menu de spots, o viewer gira até o yaw/pitch desse hotspot antes de exibir o conteúdo.
- O zoom/HFOV atual é preservado.
- O painel de spots recolhe ao selecionar qualquer item.
- Clique direto no hotspot mantém o comportamento anterior.

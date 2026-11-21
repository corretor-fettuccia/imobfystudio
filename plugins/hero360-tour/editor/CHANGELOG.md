# v3.2.6

- Menu de spots: hotspot de informação passa a orientar a câmera para o ponto do hotspot antes de exibir seu conteúdo.
- Preserva HFOV/zoom atual.
- Painel de spots recolhe após a seleção.
- Sem alteração no clique direto do hotspot.

## v3.2.4
- Corrige o branding no player integrado e exportado.
- `branding.enabled` passa a ser a chave mestra; `floatingEnabled` fica como compatibilidade.
- A posição configurada do branding é preservada.
- Em conflito, o branding se desloca apenas dentro do mesmo canto; nunca troca automaticamente de canto.
- Menu de pontos e painel cedem espaço ao branding.
- Branding sem texto e sem imagem permanece oculto.
- Remover imagem não desabilita texto/link do branding.
- Imagem inválida é ocultada sem deixar bloco vazio.
- Regra de não regressão preservada.

# Changelog

## v3.2.2
- Corrigida inicialização do editor como modal do ImobStudio.
- Eliminada corrida entre autosave local e configuração da section.
- Dependências pesadas agora carregam sob demanda, sem bloquear o contrato do plugin.
- Validado fluxo de criação e persistência de cena em modo embed.

## v3.2.1

- Integração nativa com editor modal do Plugin Play via `window.ImobifyPluginEditor`.
- O editor agora pode ser empacotado e instalado dentro do próprio plugin sem caminho físico hard-coded.
- Sem regressão funcional do Tour 360 3.2.0.

# Changelog

## 3.2.0

- Consolida o branding em banner compacto único com texto, imagem opcional, link e posição.
- Adiciona posicionamento seguro dinâmico para impedir sobreposição com zoom, fullscreen, bússola e outros controles do viewer.
- Faz o menu/painel de hotspots respeitar a mesma zona segura.
- Preserva opção de exibir/ocultar bússola.
- Formaliza touch e pinch-to-zoom como comportamento padrão mobile.
- Atualiza engine/project format para v7.


## v3.1.1
- Move menu/painel de hotspots para o lado direito para não sobrepor controles do Pannellum.
- Adiciona branding compacto inferior direito com marca, texto e link configurável.
- Mantém banner superior configurável e evita conflito com o menu.
- Estrutura interna passa para v6.

## v3.1.0
- Adiciona painel recolhível de hotspots ao player exportado.
- Painel atualiza conforme a cena e permite acionar os pontos pela lista.
- Adiciona banner de branding configurável no projeto.
- Banner local é exportado como arquivo físico em `branding/`, sem Base64 no player publicado.
- Adiciona posição configurável do banner.
- Mantém integralmente a lógica de navegação e edição consolidada nas versões anteriores.

## v3.0.1
- Corrige falha de inicialização causada por `projectName` fora de escopo.
- Corrige persistência do nome em Novo projeto.
- Revalida a arquitetura de exportação modular da v3.
- Atualiza cabeçalhos e documentação da versão.

# CHANGELOG — Tour 360 Editor

Este arquivo acumula o histórico funcional consolidado.

## v3.0.0
- Nova arquitetura de exportação modular pronta para publicação.
- Campo de nome solicitado ao criar um novo projeto.
- Exportação passa a gerar ZIP com `index.html`, `tour.js`, `tour.json`, `README.txt` e `360/`.
- Imagens panorâmicas locais deixam de ser exportadas como Base64 e passam a ser arquivos físicos em `360/`.
- Referências de panoramas locais no `tour.json` passam a usar caminhos relativos.
- URLs externas continuam preservadas.
- `tour.js` recebe cabeçalho profissional com versão, nome do projeto, propriedade e contato de Roberto Fettuccia.
- Comportamentos de navegação/edição da v2.0.12.4 preservados integralmente.
- Regra de não regressão preservada.

## v2.0.12.4
- Navegação tornou-se o comportamento padrão; removido o botão separado de modo navegação/teste.
- Clique em hotspot salvo navega/aciona automaticamente quando o hotspot não está em edição individual.
- Caneta da cena permanece como única porta para editar a cena e liberar criação de hotspots.
- Caneta do hotspot permanece como única porta para editar/reposicionar o hotspot.
- Corrigido encerramento da inserção: após posicionar o novo hotspot, preview, cursor/estado visual e modo de inserção são removidos imediatamente.
- Barra de ferramentas é atualizada imediatamente após a criação do hotspot.
- Regra de não regressão preservada.

## v2.0.12.3
- Caneta ✎ adicionada diretamente em cada cena da lista para entrada explícita em edição.
- Seleção de cena continua somente em visualização.
- Edição da cena libera enquadramento, zoom e criação de hotspots.
- Botão “＋ Adicionar hotspot nesta cena” adicionado ao painel da cena durante edição.
- Criação de novo hotspot bloqueada enquanto outro hotspot está em edição, evitando conflito de estado.
- Botão “← Voltar aos hotspots” adicionado aos atributos do hotspot.
- Voltar durante edição não salva restaura o último estado salvo do hotspot.
- Separação entre seleção, visualização e edição reforçada sem regressão dos comportamentos anteriores.

## v2.0.12.2
- Separação formal entre visualização e edição de Cena e Hotspot.
- Caneta **✎** para habilitar edição.
- Arraste do hotspot permitido somente em edição explícita.
- Salvamento da visualização da cena pela câmera atual (`yaw`, `pitch`, `HFOV`).
- Cancelamento restaura estado anterior.
- Ripple/halo pulsante preservado sem deslocar a âncora.
- Documentação de versão e regra de não regressão incorporadas ao pacote.

## v2.0.12.1
- Efeito visual de pulsação do hotspot evoluído para halo/ripple de CTA.

## v2.0.12
- Pulsação sutil de hotspot de navegação.

## v2.0.11
- Iteração sobre comportamento de animação do hotspot.

## v2.0.10
- Primeira separação entre visualização e edição dos atributos de cena/hotspot.

## v2.0.9
- Visualização de chegada armazenada por hotspot: `yaw`, `pitch`, `HFOV`.

## v2.0.8
- Correções no fluxo de inserção e encerramento do preview de hotspot.

## v2.0.7
- Hotspot ancorado na esfera 360 por `yaw/pitch`.
- Perspectiva aplicada ao SVG interno conforme a altura, sem mover a âncora.
- Modo de navegação/teste consolidado.

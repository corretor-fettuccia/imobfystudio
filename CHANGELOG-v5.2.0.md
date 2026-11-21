# Imobify Studio 5.2.0

## Estilo local por seção

- Mantém o **Design System global como padrão**. Projetos e seções antigas continuam visualmente iguais porque o override local nasce desativado.
- Adiciona o painel **Estilo local · 5.2** no inspetor de cada seção visual.
- Fundo da seção pode herdar o componente ou usar os tokens globais **superfície**, **escuro**, **primária** e **destaque**.
- Fundo também pode usar cor personalizada ou gradiente com duas cores e ângulo ajustável.
- A seção pode manter a paleta global ou substituir somente sua **primária** e **destaque**.
- Cores de **títulos**, **corpo** e **eyebrow** são independentes e aceitam herança, tokens globais, cor personalizada ou contraste automático conforme o fundo.
- Tipografia local: fonte de títulos, fonte de corpo, peso, tracking, tamanho do corpo e entrelinha.
- Efeitos locais de texto: sem efeito, sombra suave, contraste, cinematográfico e glow, com cor e intensidade configuráveis.
- Ajuste fino de espaçamento superior e inferior por seção.
- Botão **Restaurar estilo local** volta a seção para herança total do projeto.

## Renderer e compilação

- Overrides são escopados por `data-section-id`; uma alteração local não vaza para outras seções.
- O renderer injeta `data-section-id` no elemento raiz mesmo quando um plugin não o informou originalmente.
- Fontes usadas somente em overrides locais são incluídas automaticamente no carregamento do Google Fonts.
- O mesmo CSS local é aplicado na prévia do editor e no `assets/css/site.css` do ZIP compilado.
- Contraste automático usa o fundo local para escolher texto claro/escuro quando aplicável.

## Compatibilidade

- Projetos 5.1.x são normalizados com `settings.style` sem alterar o resultado visual existente.
- Hero Imobiliário Plus, Plugin Play, Segmentos e demais recursos da 5.1.31 permanecem preservados.

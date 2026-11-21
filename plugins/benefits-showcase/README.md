# Benefits Showcase 1.2.1

## Integração de estilo com o projeto

O componente utiliza a classe do core `.site-container` sem sobrescrever as margens horizontais, preservando `--container` e os breakpoints globais. O cabeçalho herda `--text-measure`, o espaçamento vertical `--section-space`, o espaço até os cards `--content-gap` e os paddings internos `--component-padding`.

**Alinhamento:** o cabeçalho acompanha a grade à esquerda por padrão. Selecionar `Centralizado` no inspetor centraliza o cabeçalho dentro do mesmo contêiner, sem alterar o limite horizontal.

**Tipografia:** com o Wizard do projeto ativo, Eyebrow / Headline / Subheadline / Body seguem a configuração global. Sem Wizard, os textos recebem fontes, pesos, tamanhos e ritmo do design-system. Estilos locais configurados explicitamente na seção continuam possíveis.

## Imagem de fundo fixa (desde 1.2.0)

No inspetor, grupo **Imagem de fundo**:

1. Carregue JPG/PNG/WebP/GIF ou informe a URL.
2. Use **Manter imagem fixa durante o scroll** (padrão habilitado quando existe imagem).
3. Ajuste proteção de leitura (55–90%, padrão 76%) e posição vertical (0–100%).
4. O título preserva a margem superior do projeto mesmo no modo sticky; cores inversas do projeto protegem a leitura.
5. Para voltar ao fundo original, escolha **Remover imagem de fundo**.

A versão 1.2.1 mantém retrocompatibilidade com as páginas sem imagem e sem Wizard.

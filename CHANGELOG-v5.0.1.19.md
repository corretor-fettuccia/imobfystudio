# Imobify Studio 5.0.1.19

## Tag Installer Pro

- Novo plugin `tag-installer-pro` para instalar tags HTML e snippets de integração no documento publicado.
- Cada instância adicionada ao projeto possui um ID único persistente (`section.id`).
- O HTML compilado inclui comentários `IMOBIFY TAG` com o ID e o nome da tag para auditoria.
- Posições suportadas: `HEAD`, início do `BODY` e fim do `BODY`.
- Uma mesma página pode conter quantas instâncias do plugin forem necessárias; cada instância representa uma tag independente.
- Presets de finalidade no editor: Google Search Console, Google Analytics, Google Tag Manager, Meta Pixel, TikTok Pixel, Microsoft Clarity, verificação de domínio e código personalizado.
- Tags documentais não geram seção ou espaço visual na landing page publicada.
- No editor, a instância aparece como cartão de configuração para poder ser selecionada, duplicada, reordenada e removida.
- Execução no preview é opcional por tag e permanece desativada por padrão para evitar interferência de scripts externos durante a edição.
- CSS/JS do cartão de edição não é empacotado na landing publicada; o plugin continua listado em `content/plugins-enabled.json`.

# Imobify Studio 7.3.6 — Fundo da seção em todos os plugins

Base: versão 7.3.5. Arquitetura Web/JavaScript mantida.

## Controle compartilhado

Cada plugin visual de seção oferece **Fundo da seção** no painel de propriedades. É independente da configuração legada "Estilo do elemento" e, quando ativado, prevalece sobre ela. O comportamento padrão é **desativado**, de modo que projetos existentes preservam seus fundos.

- **Imagem**: estática (cover, acompanha o conteúdo), fixa (cover, efeito de fundo no scroll em desktop), repeat (padrão repetido, sem ampliar). Imagem via upload, caminho relativo ou URL HTTP(S).
- **Cor**: sólida (1 cor) ou gradiente linear (cores inicial/final e ângulo de 0–360°).
- Comando para remover a imagem, desativar ou restaurar o fundo original. Todos os controles ficam na instância selecionada.

O mesmo CSS de raiz da seção é usado no editor e na exportação. Imagens locais são incorporadas ao ZIP e o caminho é reescrito no JSON da publicação, sem mexer no projeto original. Em telas móveis estreitas, o fundo fixo usa attachment:scroll por compatibilidade com navegadores móveis.

## Escopo e retrocompatibilidade

Não muda os valores internos dos plugins nem seus formulários, âncoras, CTAs, composição e CSS próprio quando o fundo personalizado está desativado. Plugins de tags de documento não possuem fundo visual. O fundo definido na seção não substitui automaticamente backgrounds de cards internos ou imagens de sobreposição dos plugins.

# Imobify Studio 5.11.1

- Adicionado o plugin **Benefícios + Modal 1.0.0** como componente bundled e instalável por ZIP.
- Benefícios ilimitados com editor próprio no Inspetor: adicionar, remover, editar e reorganizar itens.
- Seletor visual Font Awesome com busca por categoria e suporte a classe manual para ícones futuros ou não cadastrados.
- Biblioteca de ícones ampliada com infraestrutura, lazer, condomínio, segurança, mobilidade, energia, paisagismo e serviços.
- Grade responsiva configurável, com padrão de **5 itens por linha no desktop** e **3 no mobile**.
- Ícones com controles de tamanho, base, cores, borda, arredondamento, profundidade e hover.
- Modal com layout desktop em duas áreas e, no mobile, ícone maior no topo e texto abaixo.
- Modal configurável em fundo, cores, fonte, borda, largura, alinhamento, backdrop e animação.
- Acessibilidade: `<dialog>`, foco, retorno ao acionador, ESC, botão de fechar, `aria-controls` e `aria-labelledby`.
- SEO/IA: títulos e descrições detalhadas são renderizados diretamente no HTML final, mesmo antes da interação do usuário.
- Compatível com **Salvar componente / Carregar estado** e **Salvar bloco** para reutilizar presets completos do elemento.

## Benefícios + Modal 1.1.0

- Adicionados **Perfil da vitrine** e **Perfil do modal** como controles independentes de paleta.
- Vitrine com perfis Assinatura, Marfim, Mineral, Floresta, Monocromático e Personalizado.
- Modal com perfis Obsidian, Ivory, Forest, Midnight, Mineral e Personalizado.
- Novo **contraste automático do modal**: título, descrição, botão de fechar e ícone se adaptam ao fundo claro/escuro, preservando leitura e contraste; o modo manual permanece disponível.
- Perfis não alteram conteúdo, SEO ou estrutura semântica; apenas a camada visual do componente.


## Benefícios + Modal 1.1.1

- Corrigido o conflito entre **Perfil do modal** e as cores manuais: o perfil não sobrescreve mais um fundo, borda, destaque ou superfície do ícone alterados no Inspetor.
- O **Fundo do modal** agora altera efetivamente o modal mesmo com um perfil selecionado.
- O contraste automático passa a calcular título, descrição e botão de fechar a partir da **cor efetiva do fundo**, garantindo inversão claro/escuro após ajustes manuais.
- A mesma regra de prioridade por atributo foi aplicada à vitrine: o perfil funciona como paleta-base e os ajustes manuais ficam por cima.

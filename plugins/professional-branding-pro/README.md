# Professional Branding Pro v1.2.0

## Correções
- Integração real com o perfil visual global do projeto (ativada por padrão).
- Remove MutationObserver global para evitar reentrância/travamentos no editor.
- Mantém cores e medidas locais como fallback quando “Seguir perfil visual do projeto” estiver desligado.
- Compatível com imagem por upload ou caminho/URL; o framework 5.0.1.10 aplica caminhos de mídia apenas em change/Enter/blur para não recompilar a cada caractere.
- Enquadramento desktop/mobile preservado: fit, foco X/Y e zoom.

# Professional Branding Pro 1.0.0

Plugin Play para seção de posicionamento e branding profissional.

## Principais recursos

- Headline de posicionamento com trecho de destaque.
- Identidade/nome/credencial com efeito máquina de escrever opcional.
- Especialidades profissionais opcionais.
- Até 4 manifestos/frases de autoridade editáveis.
- Carrossel responsivo com swipe em mobile.
- Efeitos Wipe, Slide e Fade.
- Autoplay configurável e pausa no hover.
- Navegação superior, inferior e dots independentes.
- CTA editável e opção de abrir em nova aba.
- Imagem de fundo local ou URL, foco X/Y e overlay configurável.
- Cores, glass card, blur, bordas, radius e dimensões editáveis.
- Composição reversível: manifesto à esquerda ou direita.
- Reveal ao entrar na viewport e respeito a prefers-reduced-motion.
- Autoplay e typewriter só trabalham quando a seção está visível, reduzindo uso de CPU.
- Compatível com várias instâncias na mesma página.

## Instalação

No Imobify Studio / Framework 5.x, abra Estrutura → Plugin Play e instale o ZIP.

O asset `assets/images/corporate.webp` é incluído no pacote e pode ser substituído pelo Inspetor.


## v1.1.0 — Fundo e enquadramento
- Corrigida a pilha de camadas que podia deixar a imagem atrás do fundo sólido da seção.
- A imagem padrão passou a ser autocontida no plugin para não depender de caminho relativo.
- Novo modo de enquadramento: Cover, Contain ou Fill.
- Zoom de fundo no desktop.
- Foco horizontal e vertical no desktop.
- Foco X/Y e zoom independentes para mobile.
- Overlay, grain e conteúdo continuam acima da imagem sem bloquear a visualização.

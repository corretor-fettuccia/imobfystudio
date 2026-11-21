# Imobify Studio 5.0.1.29

Esta versão amplia o plugin interno **Rodapé profissional** sem alterar a compatibilidade dos projetos e plugins existentes.

## Rodapé profissional 1.1.0

- inclui Facebook, WhatsApp, Instagram, TikTok, YouTube, Google Meu Negócio e LinkedIn;
- entrega todos os links solicitados como valores iniciais editáveis;
- permite ocultar qualquer canal deixando sua URL vazia;
- aceita redes adicionais, uma por linha, no formato `Nome | URL do ícone | URL do perfil`;
- oferece os estilos sólido, contorno e minimalista;
- permite usar somente ícones ou ícone com nome e ajustar o tamanho entre 32 e 64 px;
- pode abrir os perfis em nova aba com proteção `noopener noreferrer`.

## Segurança e acessibilidade

- somente URLs HTTP/HTTPS válidas são usadas como destino;
- ícones personalizados aceitam imagens seguras por URL, `data:image` ou mídia do projeto;
- ícones remotos que falham recebem um ícone genérico de fallback;
- cada link possui nome acessível, foco visível e comportamento compatível com redução de movimento.

## Compatibilidade

Rodapés antigos, sem os novos campos sociais, continuam renderizando a estrutura anterior. As alterações da versão 5.0.1.28 — cards 3D unitários e migração automática das grades legadas — permanecem preservadas.

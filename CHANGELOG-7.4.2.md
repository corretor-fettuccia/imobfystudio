# Imobify Studio 7.4.2 — MainFrame sem texto técnico na página publicada

**Base:** Imobify Studio 7.4.1. Nenhuma funcionalidade anterior removida.

## Corrigido — MainFrame 1.0.2
- A frase "Configure uma URL HTTPS válida ou insira o conteúdo HTML no inspetor do MainFrame." ficava no HTML publicado (código-fonte, buscadores e leitura por IA), mesmo com o tour configurado. Removida do template.
- A orientação técnica agora é escrita pelo script **só no editor**.
- Na página publicada, um MainFrame sem URL ou HTML válido é **ocultado** (EC 3.1, seção 10.3), sem mensagem para o visitante.
- Adicionado `<noscript>` com o link "Abrir {título}" quando há URL, para quem navega sem JavaScript.

## Validação (Chromium)
| Caso | Seção | Aviso | iframe |
|---|---|---|---|
| Publicada · URL válida | visível | oculto | carrega o tour |
| Publicada · sem URL | oculta | oculto | vazio |
| Editor · sem URL | visível | orientação exibida | vazio |
| Editor · URL válida | visível | oculto | carrega o tour |

A frase antiga não aparece em nenhum HTML gerado. Testes automáticos: mesmas 15 falhas pré-existentes da 7.3.8; nenhuma nova.

## Atenção
- Reexporte a página para publicar a correção.

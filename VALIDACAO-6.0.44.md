# VALIDAÇÃO — Imobify Studio 6.0.44

Data: 2026-10-17

## Testes automatizados

- **37/37 arquivos `tests/*.test.cjs` aprovados** em Node.js.
- Novo teste de tipografia: catálogo de 50 plugins, compatibilidade do projeto, geração de CSS fluido, importação de campos antigos, opt-out de tipografia local, ZIP com folhas de estilo.
- Verificação anterior do pacote 360° mantida.

## Chromium — teste de CSS calculado

Composição representativa, não uma landing page imobiliária completa. Foram usados os estilos reais do projeto e seus tokens, com textos de Hero, Destaques, Hero360Tour e um bloco com tipografia local.

| Largura da tela | Headline Hero | Título do banner 360 | Overflow horizontal |
|---:|---:|---:|---|
| 320 px | 38 px | 24 px | Não |
| 390 px | 41,85 px | 24 px | Não |
| 720 px | 60 px | 27 px | Não |
| 768 px | 61,87 px | 27,84 px | Não |
| 1024 px | 71,82 px | 32,32 px | Não |
| 1440 px | 88 px | 34 px | Não |

O browser foi inicializado localmente e `page.set_content()` utilizado, pois a navegação direta para caminhos `file:///` foi bloqueada pelo ambiente.

## Limitações

- Não foi realizada auditoria visual individual de todos os 50 plugins em todos os estados e configurações.
- Não foram medidos Core Web Vitals reais (LCP, INP, CLS) de páginas hospedadas.
- Editor completo, comportamento 360° com imagens reais, Safari/iOS, Android e zoom de acessibilidade exigem teste em ambiente final.
- Os ajustes programáticos respeitam fontes locais intencionais; não forçam todos os textos de todos os plugins a um mesmo tamanho.

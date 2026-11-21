# Validação — ImobStudio 6.0.80 / Smart Plant 1.4.4

Data: 22/10/2026

## Automatizada

- `bash scripts/verify-release.sh`: **55 testes aprovados** e **49 plugins comportamentais compilados** (+ Tag Installer documental), sem falhas bloqueantes.
- `node --check`: sintaxe JS aprovada.
- Teste de regressão de Smart Plant confirma consumo de tokens, atributos de papel, herança do modal e proteção do seletor `h3` no core.

## Chromium / CSS computado no navegador

- Projeto com Wizard ativo: título Playfair Display; subtítulo e título de card Montserrat; CTA Poppins com cor da ação global; modal com as mesmas fontes e cores.
- Projeto com estilo local: título do componente Lora, corpo Outfit, ações na cor local e modal reproduzindo a seção de origem.
- O erro anterior de título de card H3 interpretado como headline (cerca de 61 px) foi corrigido: H3 em aproximadamente 21 px no cenário de validação.
- Modal leva o mesmo `data-section-id` que a seção original.
- Em viewport emulado de 390 px: sem overflow horizontal; modal dentro da janela; lupa inicia oculta.
- Estes resultados foram obtidos no Chromium via Chrome DevTools Protocol com HTML exportado pelo compilador.

## Conferência manual recomendada

1. Abrir projeto existente com Smart Plant e comparar Editor × Preview × HTML exportado.
2. No Wizard de Tipografia: alterar fontes/tamanhos/cores de *headline*, *subheadline*, *body* e *CTA*; verificar seção, cards e modal.
3. Habilitar personalização local na seção, testar fundo claro/escuro, contraste de botão e persistência na exportação.
4. No celular real: pressionar e segurar para exibir lupa, soltar para ocultar; abrir modal e testar rolagem/zoom.
5. Validar retorno e visual dos CTAs para WhatsApp e FormSender em projeto de produção.

## Ressalva

Os testes automatizados e o navegador emulado não substituem teste final em dispositivo físico ou site publicado. A validação de compatibilidade com um conjunto representativo de páginas reais não foi feita.

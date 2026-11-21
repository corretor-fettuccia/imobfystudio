# Validação ImobStudio 6.0.81 / Hero360Tour 1.2.7

## Verificações automatizadas

1. `scripts/verify-release.sh`: regressões e compilação isolada de plugins.
2. `tests/hero360-copy-delay-6081.test.cjs`: valores 2, 5, 10 segundos; clamp de valores fora de faixa; fallback de projetos antigos; acessibilidade ao ocultar/exibir.
3. `tests/hero360-delay-export-6081.test.cjs`: presença dos valores 2, 5 e 10 no preview, HTML exportado e JSON de projeto.
4. `tests/release-6.0.79.test.cjs`: preservação da integração com os outros componentes e publicação.

## Teste real no Chromium

Executado em Chromium headless com WebGL/Canvas 2D, imagem panorâmica local e relógio virtual do navegador.

- Delay 2s: texto ainda visível antes de 2s; desaparece após o prazo; reaparece após inatividade. **Aprovado**.
- Delay 10s: texto ainda visível antes de 10s; desaparece após o prazo; reaparece após pelo menos 2s oculto. **Aprovado**.
- Erros JavaScript nesses testes: **nenhum**.

## Limites

O navegador automatizado não substitui a validação final em Android/iOS reais, principalmente para orientação e sensores. As três referências ausentes de sprites do Leaflet são avisos preexistentes da compilação geral e não dizem respeito ao Hero360Tour.

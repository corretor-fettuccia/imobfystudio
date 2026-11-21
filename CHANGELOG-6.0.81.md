# ImobStudio 6.0.81 — HeroTour360 com atraso configurável

**Data:** 22/10/2026  
**Base:** ImobStudio 6.0.80  
**Plugin:** Hero360Tour 1.2.7

## Mudança

Novo controle em **Hero360Tour → Comportamento do Hero → Ocultar texto do Hero após interação**, exposto no inspetor principal da seção.

- Tipo: slider, de **2 a 10 segundos**, passo de 1 segundo, **5 segundos por padrão**.
- Valor atual exibido ao lado do título do controle e atualizado em tempo real.
- Configuração armazenada em `section.props.heroHideDelay` no projeto.
- No HTML exportado, a seção inclui `data-hero-hide-delay` com o valor numérico configurado.
- Runtime lê o valor com limite de segurança de 2–10 segundos. Páginas antigas sem valor mantêm 5 s.
- O texto desaparece após o delay contado a partir do início da navegação; eventos de movimento, hotspots e navegação por teclado compartilham o controle.
- Reaparece após **10 s sem atividade**, respeitando um mínimo de **2 s oculto** para impedir transição imperceptível com delays maiores (9–10 s).
- Preservados hotspots de informação e navegação, interface imersiva mobile, sensores e passagem do scroll vertical.
- O valor é editado na barra de propriedades do plugin, não na janela de edição de cenas/hotspots.

## Arquivos alterados

- `plugins/hero360-tour/plugin.json` — manifesto, campo e valor padrão.
- `plugins/hero360-tour/template.html` — atributo serializado da seção.
- `plugins/hero360-tour/plugin.js` — delay por instância e reconciliação dos temporizadores.
- `assets/js/app.js` — exibição numérica opcional nos controles de faixa do inspetor.
- `assets/js/{catalog,compiler}.js`, `index.html`, `project.json` — versão 6.0.81.
- `tests/hero360-copy-delay-6081.test.cjs` e `tests/hero360-delay-export-6081.test.cjs`.
- `plugin-packs/hero360-tour-v1.2.7.zip`.

## Compatibilidade

O pacote anterior 1.2.6 foi mantido no histórico do projeto. O novo valor é opcional em projetos legados e tem fallback de 5 segundos.

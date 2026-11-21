# ImobStudio 6.0.55 — presets de animação por elemento

- Modal **Animação dos elementos** no inspetor de cada seção, com presets por texto/imagem/botão, duração, atraso, ordem, intensidade e teste.
- Montagem ortogonal, reveal por linhas, soft focus, float-in, layer assemble, mask unveil e subtle scale.
- O gatilho reutiliza o evento da animação original de section, respeitando threshold e aguardo da duração/atraso da section.
- Configuração persistida em `section.settings.elementMotion` no projeto JSON e compilada em atributo de dados da section.
- Mesmo módulo de execução carregado no editor e no HTML exportado. Sem animações configuradas, mantém comportamento anterior.
- Suporte a `prefers-reduced-motion` e animação progressiva (conteúdo permanece visível sem JavaScript).

## Observação
A montagem ortogonal usa transformação visual sutil (não faz rearranjo real de caracteres). Elementos de plugins com renderização JS tardia podem precisar de ajustes específicos de integração.

# ImobStudio 6.0.61 — Motion Engine

Base: 6.0.60 (Editorial Motion CTA).

## Novidades
- 8 presets cinematográficos para elementos: Architectural Curtain, Kinetic Shear, Depth Parallax, Light Sweep, Prism Unfold, Liquid Mask, Cinema Focus e Stereo Drift.
- 3 coreografias novas: Arquitetura cinematográfica, Editorial cinético e Luz e profundidade.
- Controle de sincronização da seção: Entrada após gatilho (padrão) ou Progresso vinculado ao scroll.
- Modo scroll baseado em Web Animations API + requestAnimationFrame apenas no evento de scroll; sem dependência GSAP/WebGL.
- Preview individual no modal e preview completo no iframe do editor.
- Configuração serializada em elementMotion.scrollMode, com renderização compartilhada no preview e exportação HTML.
- Respeito a prefers-reduced-motion e exclusão de animações ao retirar a seção do DOM.

## Observações
- Liquid Mask utiliza clip-path nativo (não shader de fluido WebGL). Light Sweep utiliza filtro de luminosidade, não iluminação 3D real.
- O sistema mantém as coreografias salvas localmente no navegador conforme o comportamento da 6.0.60.
- É recomendada homologação visual manual no editor, exportação e dispositivos reais.

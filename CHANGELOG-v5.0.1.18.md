# Imobify Studio 5.0.1.18

- Adiciona **Ocultar no desktop** como configuração global para toda seção Plugin Play.
- Mantém **Ocultar no mobile** e permite combinar os dois controles.
- Seção com `hideDesktop: true` recebe `data-hide-desktop="true"` e é removida da publicação em viewports `>= 721px`.
- Seção com `hideMobile: true` continua removida em viewports `<= 720px`.
- Editor mostra marcadores selecionáveis **Oculto no desktop** e **Oculto no mobile** na viewport correspondente.
- Lista de seções passa a mostrar badges `D` e `M` para identificar rapidamente a restrição responsiva.
- Projetos antigos são normalizados com `hideDesktop: false`; nenhum projeto existente muda de aparência por padrão.
- Implementação continua no núcleo do renderer/editor, portanto plugins atuais e futuros herdam o recurso sem mudanças no manifesto.

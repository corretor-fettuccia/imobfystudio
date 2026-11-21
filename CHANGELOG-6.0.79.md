# Imobify Studio 6.0.79 — revisão de estilos e componentes

**Base revisada:** arquivo `imobify-studio-6.0.78(1).zip`, cuja versão interna é 6.0.78. A referência verbal a 7.01 não corresponde ao número de versão presente no ZIP enviado. Esta entrega é uma atualização incremental 6.0.79 da base efetivamente recebida, não uma atualização do código 7.01.

## Motor de estilos / benefícios
- **Benefits Showcase 1.1.1:** remove dependência visual de tipografia fixa (Georgia). Títulos, eyebrow, subtítulos, textos e filtros passam a utilizar os tokens globais do editor, incluindo as configurações do Wizard de Tipografia (`--ib-*`).
- Novo seletor **Fonte das cores → Herdar do projeto (recomendado) / Personalizar neste componente**. As seções novas herdam a paleta do projeto. Seções antigas sem essa propriedade preservam as cores locais salvas; isso evita mudança visual silenciosa em páginas existentes.
- Mantém a possibilidade de ajustes locais de estilo de modo explícito, evitando divergência entre preview e compilação/exportação.

## SmartPlant 1.4.3
- Ajustada a área de início da seção e o espaçamento do cabeçalho para eliminar o respiro excedente entre seções.
- Adicionado no editor **Iniciar lupa oculta · pressionar e segurar para ampliar**, habilitado por padrão. O modo temporário funciona com mouse, tela sensível ao toque e Enter/Espaço quando a planta recebe foco. Ao soltar ou cancelar, a lente desaparece.
- O operador pode desativar o novo controle para utilizar o comportamento clássico de lupa. A imagem e os listeners são reinicializados corretamente na abertura do modal e no carregamento da imagem.

## Ficha do imóvel
- Layout reformulado como **ficha técnica**, com cabeçalho discreto, resumo opcional e pares **rótulo / valor** em lista descritiva (`dl`, `dt`, `dd`).
- Colunas adaptáveis conforme a largura do dispositivo; tratamento de conteúdos antigos preservado.
- Cores e tipografia fazem uso do sistema compartilhado, evitando uma section editorial repetida.

## HeroTour360 1.2.6
- O texto do hero é recolhido após **5 segundos** de interação com panorama, navegação de cena ou hotspot, mantendo visíveis o ambiente e a navegação.
- O texto retorna após **10 segundos sem atividade do usuário**, mesmo com movimento de câmera autônomo.
- Conteúdo temporariamente oculto deixa de receber foco (atributo `inert` e estado ARIA) e a transição respeita o CSS existente.

## Compatibilidade e manutenção
- Alinhadas as referências de versão dos pontos principais de exportação, estado e interface para 6.0.79.
- O componente nativo `info-objetiva` deixou de ser registrado incorretamente como pacote de plugin externo.
- Pacotes individuais novos incluídos em `plugin-packs/` para SmartPlant e HeroTour360. Pacotes antigos foram mantidos para facilitar recuperação/rollback.
- Atualizadas as asserções de testes legados que verificavam versões congeladas; ajustado mock de `CustomEvent` no teste legado de reveal.

## Verificação
- **54 de 54 testes Node/CJS passaram.**
- Smoke de registro de plugins: 53 plugins com verificação positiva + 1 marcador documental sem template de plugin executável.
- Exportação HTML/CSS/JS e JSON do projeto exercitada com seções Benefits Showcase, SmartPlant, Ficha do imóvel e HeroTour360.
- Teste de execução em Chromium headless confirmou tipografia herdada, lupa por pressão e ocultação/reaparecimento do texto conforme temporizadores.

**Validação adicional recomendada antes de publicar:** testar a experiência tátil em Android e iOS reais, inclusive WebGL/sensores, e revisar visualmente páginas já existentes com cores locais personalizadas. A execução automatizada de Chromium não substitui testes em hardware real.

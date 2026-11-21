# Auditoria de compatibilidade visual — 4.1.0

O Perfil Visual passa a funcionar como sistema de design global.

## Tokens globais
- Cores: principal, destaque, superfície, fundo escuro, estrutural, títulos, textos, secundários e versões sobre fundo escuro.
- Tipografia: fonte de títulos/textos, peso, H1/H2/H3, corpo, line-height e tracking.
- Composição: container, espaço vertical de seção, gap de blocos, gap de elementos, padding de componentes e radius.

## Plugins revisados
- Core: Hero, Destaques, Ficha, Galeria, Lifestyle, Pagamento, Depoimentos, FAQ, Formulário, Footer.
- Plugin Play bundled: Location, Flip Card 3D 4.3, Flip Card 3D Video, Gallery Big Four, Form Sender v4, Property Slider, Menu Pro e Scrollytelling Video Pro.
- Behaviors e botões flutuantes mantêm seus controles funcionais/brand-specific, mas herdam tipografia quando aplicável.

## Precedência
1. Perfil Visual define o padrão do projeto.
2. O plugin herda esses tokens.
3. Quando um plugin possui um ajuste local funcional e explícito, ele pode sobrescrever o token daquele componente.

## Compatibilidade futura
Plugin Play novo recebe fonte/cor herdadas no elemento `[data-plugin]`. Para integração total deve consumir os tokens documentados em `plugin-sdk/PLUGIN-SDK.md`.

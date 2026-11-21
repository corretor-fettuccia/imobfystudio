# Plugin Play SDK — Imobify Studio 5.1.30

Um plugin é um ZIP autocontido que pode ser instalado pelo editor sem alterar `catalog.js`.

## Estrutura mínima

```text
meu-plugin.zip
  plugin.json
  template.html
  plugin.css
  plugin.js
  assets/              opcional: imagens, vídeos, áudios e fontes
```

O `plugin.json` descreve o componente, os arquivos de entrada, os valores iniciais e os controles que aparecerão no inspetor.

```json
{
  "schemaVersion": 3,
  "id": "meu-componente",
  "name": "Meu componente",
  "version": "1.0.0",
  "type": "section",
  "category": "Plugin Play",
  "icon": "⬡",
  "description": "Descrição curta",
  "composition": { "role": "both" },
  "entry": {
    "template": "template.html",
    "style": "plugin.css",
    "script": "plugin.js"
  },
  "defaults": {
    "title": "Título inicial"
  },
  "fields": [
    { "key": "title", "label": "Título", "type": "text", "group": "Conteúdo" }
  ]
}
```

### Preservar um componente existente sem reescrever

Quando o componente já possui vários arquivos CSS e JavaScript, use listas. O carregador respeita a ordem declarada e o compilador combina somente o que estiver ativo:

```json
"entry": {
  "template": "template.html",
  "styles": ["css/original.css", "css/notificacoes.css", "adapter.css"],
  "scripts": ["js/notificacoes.js", "js/original.js", "adapter.js"]
}
```

Essa é a forma recomendada para transformar bibliotecas existentes em Plugin Play: mantenha os arquivos originais intactos e coloque a integração com o editor em `adapter.css` e `adapter.js`. O Form.v4 incluído no framework usa exatamente este modelo.

## Campos disponíveis

`text`, `textarea`, `url`, `image`, `video`, `audio`, `toggle`, `select`, `icon`, `color`, `number` e `range`.

Campos `select` usam `options`. Cada opção pode ser uma string simples ou um objeto `{ "label": "Texto mostrado", "value": "valor-salvo" }`. Campos `number` e `range` podem usar `min`, `max` e `step`. Campos `image`, `video` e `audio` aceitam upload local no inspetor e também caminho/URL.

## Template

Use `{{campo}}` para conteúdo escapado. Recursos adicionais:

- `{{texto|br}}`: preserva quebras de linha;
- `{{itens|list}}`: converte linhas em elementos `<li>`;
- `{{itens|pairs}}`: interpreta cada linha como `rótulo | texto` e gera `<li><strong>rótulo</strong><span>texto</span></li>`;
- `{{campo|checked}}`: adiciona `checked` quando verdadeiro;
- `{{#if campo}}...{{/if}}`: renderiza quando verdadeiro;
- `{{#unless campo}}...{{/unless}}`: renderiza quando falso.

O editor envolve o template em uma seção com `data-plugin="id-do-plugin"`. Prefixe todas as classes do plugin para evitar colisões.

## CSS e JavaScript

O CSS e o JavaScript são carregados somente quando o componente está em uso. `style`/`script` aceitam um arquivo; `styles`/`scripts` aceitam vários arquivos ordenados. O script deve:

- procurar todos os componentes pelo atributo `data-plugin`;
- impedir inicialização duplicada usando um atributo como `data-ready`;
- funcionar quando houver várias instâncias;
- evitar variáveis globais;
- oferecer teclado e toque quando houver interação.

Arquivos dentro de `assets/` são convertidos em Data URL ao instalar o ZIP, incluindo imagens, vídeos, áudios e fontes. Pacotes bundled mantêm os caminhos relativos e o carregador os resolve contra a pasta do próprio manifesto.

## Instalação

No editor, abra **Estrutura → Plugin Play** e arraste o ZIP. Após a validação, o componente aparece na biblioteca e pode ser adicionado, repetido, reordenado, editado e compilado.

Plugins executam JavaScript na landing page. Instale somente pacotes de origem confiável.

## IDs reservados (desde a v4.0)

Os identificadores listados em `plugins/registry.json → corePlugins` pertencem aos componentes internos do framework (definidos diretamente em `catalog.js`, sem manifesto próprio) e **não podem ser usados como `id` de um plugin instalado por ZIP**. A tentativa é rejeitada antes da instalação, com o motivo explicado ao usuário. Isso evita que um pacote malicioso ou mal versionado substitua silenciosamente um componente principal (ex.: `hero`, `footer`) sem o mecanismo de desinstalação/reversão que os pacotes Plugin Play possuem.

Pacotes Plugin Play "incluídos" (bundled) — como `flip-card-pro`, `gallery-big-four`, `form-sender-v4` e `property-slider` — continuam podendo ser reinstalados/atualizados por ZIP normalmente; a proteção de ID reservado vale apenas para os componentes hardcoded do núcleo.

## Reinstalação e versão (desde a v4.0)

Ao instalar um plugin cujo `id` já existe, o editor agora compara a versão do pacote enviado com a versão instalada (comparação numérica por segmento, não alfabética) e avisa explicitamente se a operação seria um downgrade ou uma reinstalação da mesma versão, antes de pedir a confirmação final.

## Assets relativos em pacotes bundled (desde a v4.0.2)

Use caminhos relativos como `assets/images/foto.jpg`, `assets/video/demo.mp4` ou `assets/audio/trilha.mp3` nos `defaults` e nos arquivos do plugin. O carregador bundled resolve esses caminhos contra a pasta do próprio `plugin.json`; o ZIP instalável converte os mesmos assets em Data URL. Assim, a mesma estrutura funciona nos dois modos sem depender da pasta `assets/` global do framework.

Exemplo:

```text
plugins/meu-plugin/
  plugin.json
  template.html
  plugin.css
  plugin.js
  assets/
    images/foto.jpg
    video/demo.mp4
```


## Design tokens globais (4.1.0+)
Plugins devem preferir estes tokens em vez de valores visuais fixos:

- `--primary`, `--accent`, `--surface`, `--dark`
- `--heading-color`, `--body-color`, `--muted-color`
- `--inverse-heading-color`, `--inverse-body-color`
- `--heading`, `--body`, `--heading-weight`, `--heading-line`, `--heading-tracking`
- `--h1-max`, `--h2-max`, `--h3-max`, `--body-size`, `--body-line`
- `--container`, `--section-space`, `--content-gap`, `--element-gap`, `--component-padding`, `--radius`

Todo componente deve permitir herança da fonte no elemento raiz `[data-plugin]`. Em superfícies escuras, use as cores `inverse-*`. Valores locais podem continuar existindo quando forem parte funcional/visual específica do plugin.


## Containers de composição (4.1.0+)

Um Plugin Play pode atuar como container dos próximos blocos declarando no manifesto:

```json
"layout": {
  "mode": "next-sections",
  "slot": "<!--IMOBIFY_LAYOUT_CHILDREN-->",
  "maxChildren": 8
}
```

O template deve conter o marcador definido em `slot`. O renderer injeta ali os próximos blocos lógicos, preservando seus próprios manifests, inspetores, scripts e estilos. O `Section Layout Pro` usa esse mecanismo. No editor, os filhos continuam selecionáveis e editáveis individualmente.

## Componentes em segmentos — 5.0.1.26

O compositor nativo diferencia uma seção inteira de um componente que pode ocupar uma célula. A declaração é opcional e não invalida plugins antigos:

```json
"composition": { "role": "item" }
```

Papéis aceitos:

- `section`: permanece no fluxo principal e não aparece no seletor de células;
- `item`: pode ser inserido em colunas ou linhas de um Segmento;
- `both`: funciona tanto como seção independente quanto dentro de uma célula.

Pacotes antigos sem `composition` continuam instaláveis e recebem o papel compatível `both`. Isso preserva o uso anterior e permite testar o componente dentro de um Segmento sem reempacotá-lo. O projeto antigo também conserva sua lista plana de `sections`; o Segmento usa o contrato de layout para agrupar apenas os blocos seguintes que pertencem a ele.

O container nativo declara:

```json
"layout": {
  "mode": "segment-slots",
  "slot": "<!--IMOBIFY_SEGMENT_SLOTS-->",
  "maxChildren": 25,
  "maxTracks": 5,
  "acceptRoles": ["item", "both"]
}
```

Cada filho mantém seu próprio manifesto, inspetor, CSS, JavaScript, visibilidade e identidade. A posição fica em `section.settings.layoutSlot`, sem alterar as propriedades do plugin.

### Segmentos aninhados — 5.2.3

O `segment-layout` declara papel de composição `both` e é a exceção segura à regra que bloqueia layouts dentro de células. Assim, um Segmento pode ocupar uma célula de outro Segmento e manter suas próprias divisões e filhos. Outros plugins de layout (`next-sections`) continuam bloqueados dentro das células para evitar ambiguidades estruturais. O renderer percorre a árvore recursivamente e o editor remove/duplica o subsegmento junto com toda a sua descendência.

### Cardinalidade single — 5.0.1.28

Um plugin que representa exatamente um item por instância pode declarar:

```json
"composition": { "role": "both", "cardinality": "single" }
```

Use `single` quando linhas, colunas e repetições pertencem ao Segmento nativo, não ao template do plugin. O template deve renderizar um único item. Para converter um plugin legado que guardava até quatro cards em `card2*`, `card3*` e `card4*`, a migração compatível pode ser declarada assim:

```json
"migration": {
  "legacyGrid": { "slots": 4, "columnsField": "gridColumns", "gapField": "gridGap" }
}
```

O Studio oculta as propriedades antigas em novas instâncias e, ao abrir um projeto anterior, transforma cada card habilitado em uma instância single. Fora de outro container, os cards são envolvidos por um Segmento nativo; dentro de um Segmento existente, passam a ocupar células independentes.


## Âncora global de seção

O Studio 5.0.1.10 oferece `settings.anchorId` para qualquer plugin com `type: "section"`. O plugin não precisa declarar um campo próprio: o Inspector adiciona a opção **Âncora da seção** automaticamente e o renderer aplica o `id` no elemento raiz da seção. Isso permite usar destinos como `#contato`, `#implantacao` ou `#condicoes` sem alterar o pacote do plugin.


## CTA compatível com o Kit Global de Botões — 5.0.1.15

Para que um botão de plugin herde automaticamente o Perfil Visual do projeto, marque o elemento interativo com:

```html
<a href="#contato" data-design-role="cta">Quero saber mais</a>
```

O runtime também reconhece classes usuais como `btn-primary`, `button-primary`, `*-cta`, `__cta` e `_cta`. Para componentes criados dinamicamente, o plugin pode registrar o elemento explicitamente:

```js
window.Imobify?.registerCTA?.(elemento);
```

O Kit Global altera apenas a aparência e os estados ópticos do CTA. O plugin continua responsável pelo texto, URL, dimensões, posição, acessibilidade e comportamento funcional. Use `data-design-role="cta"` em CTAs comerciais, não em setas de carrossel, botões de fechar ou controles utilitários.


### Campo `icon` — 5.0.1.17

Use `"type": "icon"` quando o valor do campo representar uma classe Font Awesome. O Inspector oferece uma biblioteca categorizada e mantém um campo manual para classes personalizadas. Campos legados do tipo `text` cujo `key` termina em `Icon` também recebem o seletor automaticamente.

No template, `{{campo|icon}}` transforma classes como `fa-solid fa-house` ou `fas fa-house` em um elemento `<i>` seguro. Se o valor não for uma classe Font Awesome (por exemplo `R$` ou `✓`), o conteúdo textual é preservado.

## Visibilidade responsiva global — 5.0.1.18

Plugins com `type: "section"` não precisam declarar campos próprios de visibilidade. O Studio injeta automaticamente no Inspector:

- `settings.hideMobile` — quando `true`, a seção é publicada apenas em desktop (`>= 721px`).
- `settings.hideDesktop` — quando `true`, a seção é publicada apenas em mobile (`<= 720px`).

O renderer aplica `data-hide-mobile` e `data-hide-desktop` no elemento raiz da seção. Na viewport em que a seção está oculta, o editor mantém um marcador selecionável para permitir edição e reativação. Ambos os campos têm padrão `false`, inclusive ao importar projetos antigos.

Não implemente CSS de ocultação responsiva equivalente dentro do plugin apenas para reproduzir esse comportamento; use os controles globais do Studio para evitar breakpoints conflitantes.

## Plugin documental — `output: "document-tag"` — 5.0.1.19

Para integrações que precisam inserir HTML diretamente no documento publicado, um plugin de `type: "section"` pode declarar:

```json
"output": "document-tag"
```

Esse modo mantém cada instância editável e identificada pelo `section.id` no projeto, mas remove o cartão visual da landing publicada. O renderer reconhece os campos convencionados `placement`, `code` e `runInPreview` e injeta o conteúdo em `head`, `body-start` ou `body-end`. O `Tag Installer Pro` incluído no framework é a implementação de referência.

Use esse recurso apenas para snippets confiáveis. A execução em preview deve permanecer opcional para evitar que scripts externos interfiram no editor.


## Identidade pública por instância — 5.0.1.20

Plugins que precisam ser chamados externamente podem declarar no `plugin.json`:

```json
{
  "instanceIdField": "panelId",
  "instanceIdPrefix": "floating-box"
}
```

O framework gera um valor único nesse campo ao criar ou duplicar a seção. O template também recebe `{{__sectionId}}` como identificador interno reservado.


## Ajuda contextual autodeclarada no inspetor — 5.0.1.22

Plugins podem declarar `inspectorGuide` no próprio manifesto. O editor não precisa conhecer o ID específico do plugin para oferecer o botão **Como usar**.

```json
"inspectorGuide": {
  "enabled": true,
  "kind": "href-container",
  "label": "Como usar",
  "targetField": "panelId",
  "targetPrefix": "#",
  "childCountField": "itemCount",
  "columns": { "desktop": "columns", "tablet": "tabletColumns", "mobile": "mobileColumns" },
  "modes": { "desktop": "displayMode", "mobile": "mobileMode" }
}
```

Para valores derivados, o plugin também pode autodeclarar um campo `computed`:

```json
{
  "key": "hrefTarget",
  "label": "HREF para abrir este container",
  "type": "computed",
  "template": "#{{panelId}}",
  "copy": true
}
```

O campo é somente leitura, acompanha as props reais da instância e pode ser copiado diretamente. No Floating Container Pro o fluxo oficial é apenas `href="#ID"`; a API JavaScript fica como detalhe interno/compatibilidade.


## Editor avançado em modal (5.12.4)

Plugins `section` podem declarar um editor avançado opcional no manifesto:

```json
{
  "editor": {
    "mode": "modal",
    "label": "Abrir editor",
    "title": "Editor do plugin",
    "template": "editor/index.html",
    "style": "editor/styles.css",
    "script": "editor/app.js",
    "field": "configJson"
  }
}
```

O Plugin Play incorpora esses três arquivos no registro do plugin, inclusive quando o plugin é instalado por ZIP. O JavaScript do editor deve expor `window.ImobifyPluginEditor` com:

```js
window.ImobifyPluginEditor = {
  load(value) { /* recebe o valor atual do campo */ },
  save() { /* retorna string ou objeto a persistir */ }
};
```

Abrir o modal nunca altera a section. O valor só é persistido quando o usuário clica em **Salvar**.

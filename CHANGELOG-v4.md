# Imobify Studio 4.0.2

Revisão de motor focada na fronteira **plugin ↔ editor ↔ compilador**, sem redesenhar a interface.

## Corrigido

- **Compilador de mídia genérico.** Campos de imagem, vídeo e áudio, Data URLs e caminhos locais passam a ser incorporados em `assets/images/`, `assets/video/` e `assets/audio/`. O compilador também resolve mídia local referenciada pelo HTML/CSS. URLs HTTPS continuam externas.
- **Assets relativos de plugins bundled.** Caminhos `assets/...` agora são resolvidos contra a pasta do manifesto do próprio plugin. Isso corrige poster, imagens e outros recursos que antes funcionavam em um contexto e quebravam no outro.
- **Scrollytelling 2.1.0 normalizado.** A pasta bundled agora usa `scrollytelling-video-pro-v2.1.0`; projetos antigos com caminhos `v1.0.0` são migrados automaticamente. O poster real foi incluído no bundled e no ZIP instalável. O campo de vídeo usa o tipo `video`.
- **Selects `{label,value}`.** O inspetor suporta opções simples (`"auto"`) e objetos (`{"label":"Normal","value":"forward"}`) sem gerar `[object Object]`.
- **Location virou Plugin Play real.** Saiu de `catalog.js`, ganhou manifesto schema 3, template, campos e ZIP instalável válido. Proximidades usam um único textarea no formato `tempo | ponto` e já são renderizadas semanticamente no HTML estático.
- **Plugins ocultos não incham a publicação.** CSS/JS de seções ocultas são excluídos do build final; no editor continuam carregados para que a seção possa ser reexibida corretamente.

## Segurança

- As prévias usam `sandbox`. O modo padrão não concede `allow-same-origin`; a prévia completa permanece isolada.
- Para preservar o editor visual do Scrollytelling bundled, existe um modo de compatibilidade restrito que habilita `allow-same-origin` somente quando o Scrollytelling bundled está ativo **e não há plugin instalado pelo usuário ativo**.
- Mensagens recebidas pelo editor são aceitas apenas quando `event.source` corresponde a um dos iframes de prévia.
- `frame-ancestors` foi removido da CSP via `<meta>` (onde não é efetivo) e passou para `_headers`/`security/headers.conf`, que devem ser aplicados como header HTTP pela hospedagem.

## Testes

- A suíte percorre **todos os ZIPs** em `plugin-packs/` e exige que cada um seja aceito pelo parser real do Plugin Play.
- Foram adicionadas regressões para Location bundled, assets relativos, mídia de vídeo/áudio, seções ocultas, `{label,value}`, sandbox, CSP e versão 4.0.2.

## Versionamento e migração

- `project.json`, `catalog.defaultState()` e `normalizeState()` usam `4.0.2`.
- As chaves de armazenamento passam para `v4`, mantendo leitura das chaves `v3/v2/v1` e reaproveitando os projetos existentes.

---

# Histórico — Imobify Studio 4.0.0

Esta versão foca em consistência interna do sistema de plugins e em fechar lacunas encontradas numa auditoria do código da v3.0.0. Não há mudanças no fluxo de uso do editor — quem já usa a v3 não precisa reaprender nada.

## Corrigido

- **Duplicação do Slider imobiliário.** A v3 carregava `property-slider` de duas fontes ao mesmo tempo: um objeto hardcoded em `catalog.js` (com campo `slides` de tamanho livre) e um pacote Plugin Play completo em `plugins/property-slider/` que nunca era referenciado por `registry.json` — ou seja, ficava morto, mesmo com um `.zip` pronto em `plugin-packs/`. A v4 remove a definição duplicada de `catalog.js` e adota o pacote Plugin Play como única fonte, registrado em `registry.json → packages`. Efeito colateral aceito: o slider passa a ter 3 slots fixos (como galeria e flip-card), em troca de instalação/versionamento/desinstalação reais e de campos de imagem com upload no inspetor — recursos que a versão hardcoded não tinha.
- **Caminhos de imagem padrão quebrados no `property-slider`.** Ao corrigir o item acima, o pacote passou a ser carregado como "bundled" pela primeira vez — e isso expôs um bug latente: os `defaults` apontavam para `assets/hero-placeholder.jpg`, `assets/gallery-1.jpg` e `assets/gallery-2.jpg` (pasta local do plugin, achatada), enquanto os demais pacotes bundled (`flip-card-pro`, `gallery-big-four`) usam `assets/images/<arquivo>` espelhando a pasta compartilhada do framework. Corrigido o manifesto e reorganizada a pasta `plugins/property-slider/assets/` para `assets/images/`, e o `plugin-packs/property-slider.zip` foi reempacotado com a estrutura nova.
- **IDs reservados agora têm efeito.** `registry.json → corePlugins` existia desde a v3 mas nenhum código o lia — era só documentação solta. A v4 usa essa lista para bloquear a instalação de um ZIP cujo `id` colida com um componente hardcoded do núcleo (ex.: alguém subir um pacote com `"id": "hero"` e sobrescrever silenciosamente o Hero do framework, sem o mecanismo de reversão que os pacotes bundled têm).
- **`escapeHtml`/`truthy` duplicados.** Existiam duas implementações idênticas, uma em `catalog.js` e outra em `plugin-loader.js`. Extraídas para `assets/js/util.js`, carregado antes dos dois.

## Adicionado

- **Aviso de versão na reinstalação.** Ao reinstalar um plugin já existente, o editor agora compara versões (`ImobifyUtil.compareVersions`, comparação numérica por segmento) e avisa explicitamente se a operação é um downgrade ou repete a versão atual, antes do usuário confirmar.
- **Content-Security-Policy no HTML compilado.** O documento exportado passa a incluir `object-src 'none'`, `base-uri 'self'` e `frame-ancestors 'self'`, reduzindo a superfície para injeção de `<object>`/`<embed>`, sequestro de `<base>` e clickjacking.
- **Testes automatizados para os plugins do núcleo.** A suíte agora renderiza todos os plugins hardcoded de `catalog.js` com seus valores padrão e confere que cada um produz `data-plugin` e uma tag de seção válida — antes só os pacotes Plugin Play tinham essa cobertura.
- **Teste de regressão para a duplicação do slider** e para o bloqueio de IDs reservados, para que essas duas classes de bug não voltem sem que a suíte quebre.

## Limitação conhecida, deixada de fora por honestidade

- **`script-src` da CSP inclui `'unsafe-inline'`.** O ideal seria removê-lo, mas o Form.v4 (`plugins/form-sender-v4/js/notify-send.js`) — arquivo protegido por hash na suíte de testes e que não deve ser reescrito — usa atributos `onclick`/`onerror` inline para o botão de fechar notificação e o fallback de avatar. Bloquear scripts inline quebraria essa funcionalidade. A CSP entregue nesta versão é uma mitigação parcial e honesta, não uma proteção completa contra XSS.
- **Sem repetição real no motor de template** (`{{#each}}` ou similar). Plugins com N itens (galeria, slider) continuam usando campos numerados fixos (`image1`, `image2`, `image3`...). Avaliado para esta versão e adiado: implementar um repetidor genérico sem also atualizar a UI do inspetor para editá-lo corretamente teria risco maior que benefício num único ciclo. Fica registrado como próximo passo natural do SDK.
- **Sem compressão/redimensionamento de imagem na exportação.** `compiler.js` continua empacotando as imagens como estão. Ficou fora desta versão por exigir um pipeline de canvas testável em navegador real, que o ambiente de testes atual (Node, sem DOM) não cobre com segurança.

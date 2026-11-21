(function(){
  'use strict';
  const groups = [
    ['Imóveis e construção',[
      ['Casa','fa-solid fa-house'],['Casa com sinal','fa-solid fa-house-circle-check'],['Prédio','fa-solid fa-building'],['Cidade','fa-solid fa-city'],['Terreno / mapa','fa-solid fa-map'],['Localização','fa-solid fa-location-dot'],['Chave','fa-solid fa-key'],['Porta','fa-solid fa-door-open'],['Cama','fa-solid fa-bed'],['Sofá','fa-solid fa-couch'],['Banheiro','fa-solid fa-bath'],['Cozinha','fa-solid fa-kitchen-set'],['Escadas','fa-solid fa-stairs'],['Régua','fa-solid fa-ruler-combined'],['Projeto','fa-solid fa-drafting-compass'],['Ferramentas','fa-solid fa-screwdriver-wrench'],['Martelo','fa-solid fa-hammer'],['Capacete de obra','fa-solid fa-helmet-safety'],['Tijolos','fa-solid fa-cubes-stacked'],['Árvore','fa-solid fa-tree'],['Folha','fa-solid fa-leaf'],['Pet','fa-solid fa-paw'],['Carro','fa-solid fa-car'],['Garagem','fa-solid fa-square-parking']
    ]],
    ['Condomínio, lazer e infraestrutura',[
      ['Piscina','fa-solid fa-water-ladder'],['Natação','fa-solid fa-person-swimming'],['Spa / hidromassagem','fa-solid fa-hot-tub-person'],['Bem-estar / spa','fa-solid fa-spa'],['Sauna / temperatura','fa-solid fa-temperature-high'],['Chuveiro','fa-solid fa-shower'],['Banheira','fa-solid fa-bath'],
      ['Academia','fa-solid fa-dumbbell'],['Corrida','fa-solid fa-person-running'],['Caminhada','fa-solid fa-person-walking'],['Bicicleta','fa-solid fa-bicycle'],['Ciclismo','fa-solid fa-person-biking'],['Futebol','fa-solid fa-futbol'],['Basquete','fa-solid fa-basketball'],['Vôlei','fa-solid fa-volleyball'],['Tênis de mesa','fa-solid fa-table-tennis-paddle-ball'],
      ['Salão de festas','fa-solid fa-champagne-glasses'],['Espaço gourmet','fa-solid fa-utensils'],['Cozinha gourmet','fa-solid fa-kitchen-set'],['Churrasqueira / fogo','fa-solid fa-fire'],['Bar / drinks','fa-solid fa-martini-glass-citrus'],['Adega','fa-solid fa-wine-bottle'],['Taça de vinho','fa-solid fa-wine-glass'],['Café','fa-solid fa-mug-saucer'],['Restaurante','fa-solid fa-bell-concierge'],
      ['Coworking','fa-solid fa-laptop'],['Sala de reunião','fa-solid fa-users'],['Biblioteca','fa-solid fa-book-open'],['Cinema','fa-solid fa-film'],['TV','fa-solid fa-tv'],['Música','fa-solid fa-music'],['Games','fa-solid fa-gamepad'],['Brinquedoteca','fa-solid fa-puzzle-piece'],['Espaço kids','fa-solid fa-children'],['Baby space','fa-solid fa-baby-carriage'],
      ['Praia','fa-solid fa-umbrella-beach'],['Lago / água','fa-solid fa-water'],['Marina','fa-solid fa-sailboat'],['Paisagismo','fa-solid fa-seedling'],['Áreas verdes','fa-solid fa-tree'],['Jardim','fa-solid fa-leaf'],['Pet place','fa-solid fa-paw'],['Pet friendly','fa-solid fa-dog'],['Solarium','fa-solid fa-sun'],
      ['Garagem','fa-solid fa-square-parking'],['Carro','fa-solid fa-car'],['Carro elétrico','fa-solid fa-charging-station'],['Bicicletário','fa-solid fa-bicycle'],['Acesso viário','fa-solid fa-road'],['Elevador','fa-solid fa-elevator'],['Escadas','fa-solid fa-stairs'],['Acessibilidade','fa-solid fa-universal-access'],['Cadeirante','fa-solid fa-wheelchair'],
      ['Portaria','fa-solid fa-user-shield'],['Segurança','fa-solid fa-shield-halved'],['CFTV','fa-solid fa-video'],['Fechadura digital','fa-solid fa-fingerprint'],['Controle de acesso','fa-solid fa-id-card'],['Portão / entrada','fa-solid fa-door-open'],['Interfone / telefone','fa-solid fa-phone'],['Cadeado','fa-solid fa-lock'],
      ['Wi-Fi','fa-solid fa-wifi'],['Energia','fa-solid fa-bolt'],['Energia solar','fa-solid fa-solar-panel'],['Tomada','fa-solid fa-plug'],['Climatização','fa-solid fa-fan'],['Ventilação','fa-solid fa-wind'],['Ar-condicionado / frio','fa-solid fa-snowflake'],['Água','fa-solid fa-droplet'],['Reciclagem','fa-solid fa-recycle'],['Resíduos','fa-solid fa-trash-can'],['Depósito','fa-solid fa-warehouse'],['Box / armazenamento','fa-solid fa-box-open'],
      ['Mercado / conveniência','fa-solid fa-cart-shopping'],['Loja','fa-solid fa-store'],['Delivery','fa-solid fa-truck-fast'],['Lavanderia','fa-solid fa-shirt'],['Ferramentas / manutenção','fa-solid fa-screwdriver-wrench'],['Gerenciamento','fa-solid fa-gears'],['Calendário de espaços','fa-solid fa-calendar-days']
    ]],
    ['Financeiro',[
      ['Dinheiro','fa-solid fa-money-bill-wave'],['Carteira','fa-solid fa-wallet'],['Moedas','fa-solid fa-coins'],['Real / cifrão','fa-solid fa-dollar-sign'],['Cartão','fa-solid fa-credit-card'],['Banco','fa-solid fa-building-columns'],['Calculadora','fa-solid fa-calculator'],['Gráfico','fa-solid fa-chart-line'],['Gráfico colunas','fa-solid fa-chart-column'],['Porcentagem','fa-solid fa-percent'],['Recibo','fa-solid fa-receipt'],['Documento financeiro','fa-solid fa-file-invoice-dollar'],['Mão com dinheiro','fa-solid fa-hand-holding-dollar'],['Cofrinho','fa-solid fa-piggy-bank'],['Escala','fa-solid fa-scale-balanced']
    ]],
    ['Pessoas e perfil',[
      ['Pessoa','fa-solid fa-user'],['Usuários','fa-solid fa-users'],['Família','fa-solid fa-people-roof'],['Casal','fa-solid fa-user-group'],['Criança','fa-solid fa-child-reaching'],['Profissional','fa-solid fa-user-tie'],['Autônomo','fa-solid fa-briefcase'],['ID','fa-solid fa-id-card'],['Usuário aprovado','fa-solid fa-user-check'],['Usuário dúvida','fa-solid fa-user-question'],['Aperto de mãos','fa-solid fa-handshake']
    ]],
    ['Contato e conversão',[
      ['WhatsApp','fa-brands fa-whatsapp'],['Telefone','fa-solid fa-phone'],['Celular','fa-solid fa-mobile-screen-button'],['E-mail','fa-solid fa-envelope'],['Mensagem','fa-solid fa-comment'],['Comentários','fa-solid fa-comments'],['Chat','fa-solid fa-message'],['Enviar','fa-solid fa-paper-plane'],['Calendário','fa-solid fa-calendar-days'],['Relógio','fa-solid fa-clock'],['Atendimento','fa-solid fa-headset'],['Link','fa-solid fa-link'],['QR Code','fa-solid fa-qrcode']
    ]],
    ['Ações e navegação',[
      ['Seta direita','fa-solid fa-arrow-right'],['Seta esquerda','fa-solid fa-arrow-left'],['Seta baixo','fa-solid fa-arrow-down'],['Seta cima','fa-solid fa-arrow-up'],['Avançar','fa-solid fa-circle-arrow-right'],['Voltar','fa-solid fa-circle-arrow-left'],['Chevron direito','fa-solid fa-chevron-right'],['Chevron baixo','fa-solid fa-chevron-down'],['Mais','fa-solid fa-plus'],['Menos','fa-solid fa-minus'],['Check','fa-solid fa-check'],['Check círculo','fa-solid fa-circle-check'],['X','fa-solid fa-xmark'],['Play','fa-solid fa-play'],['Pausa','fa-solid fa-pause'],['Atualizar','fa-solid fa-rotate'],['Expandir','fa-solid fa-up-right-and-down-left-from-center']
    ]],
    ['Informação e confiança',[
      ['Informação','fa-solid fa-circle-info'],['Dúvida','fa-solid fa-circle-question'],['Ideia','fa-solid fa-lightbulb'],['Alvo','fa-solid fa-bullseye'],['Bússola','fa-solid fa-compass'],['Escudo','fa-solid fa-shield-halved'],['Cadeado','fa-solid fa-lock'],['Desbloqueado','fa-solid fa-lock-open'],['Certificado','fa-solid fa-certificate'],['Selo','fa-solid fa-award'],['Estrela','fa-solid fa-star'],['Coração','fa-solid fa-heart'],['Olho','fa-solid fa-eye'],['Aviso','fa-solid fa-triangle-exclamation'],['Proibido','fa-solid fa-ban']
    ]],
    ['Documentos e dados',[
      ['Arquivo','fa-solid fa-file'],['Documento','fa-solid fa-file-lines'],['Contrato','fa-solid fa-file-signature'],['PDF','fa-solid fa-file-pdf'],['Lista','fa-solid fa-list-check'],['Clipboard','fa-solid fa-clipboard-check'],['Pasta','fa-solid fa-folder-open'],['Banco de dados','fa-solid fa-database'],['Tabela','fa-solid fa-table'],['Filtro','fa-solid fa-filter'],['Pesquisa','fa-solid fa-magnifying-glass'],['Código','fa-solid fa-code'],['Configurações','fa-solid fa-gear']
    ]],
    ['Mídia e visual',[
      ['Imagem','fa-solid fa-image'],['Imagens','fa-solid fa-images'],['Câmera','fa-solid fa-camera'],['Vídeo','fa-solid fa-video'],['Filme','fa-solid fa-film'],['Volume','fa-solid fa-volume-high'],['Mudo','fa-solid fa-volume-xmark'],['Sol','fa-solid fa-sun'],['Lua','fa-solid fa-moon'],['Paleta','fa-solid fa-palette'],['Camadas','fa-solid fa-layer-group'],['Cubo 3D','fa-solid fa-cube'],['Varinha','fa-solid fa-wand-magic-sparkles']
    ]],
    ['Mobilidade e localização',[
      ['Mapa','fa-solid fa-map-location-dot'],['Pin','fa-solid fa-location-pin'],['Rota','fa-solid fa-route'],['Rua','fa-solid fa-road'],['Carro','fa-solid fa-car-side'],['Ônibus','fa-solid fa-bus'],['Bicicleta','fa-solid fa-bicycle'],['Caminhada','fa-solid fa-person-walking'],['Avião','fa-solid fa-plane'],['Loja','fa-solid fa-store'],['Escola','fa-solid fa-school'],['Hospital','fa-solid fa-hospital'],['Parque','fa-solid fa-tree-city']
    ]],
    ['Marcas',[
      ['WhatsApp','fa-brands fa-whatsapp'],['Instagram','fa-brands fa-instagram'],['Facebook','fa-brands fa-facebook'],['YouTube','fa-brands fa-youtube'],['LinkedIn','fa-brands fa-linkedin'],['Google','fa-brands fa-google'],['Apple','fa-brands fa-apple'],['Android','fa-brands fa-android'],['GitHub','fa-brands fa-github']
    ]]
  ];
  const flat = groups.flatMap(([group,items])=>items.map(([label,value])=>({group,label,value})));
  function normalize(value){
    let raw=String(value||'').trim().replace(/\s+/g,' ');
    if(!raw)return '';
    raw=raw.replace(/\bfas\b/g,'fa-solid').replace(/\bfar\b/g,'fa-regular').replace(/\bfab\b/g,'fa-brands');
    if(/^fa-[\w-]+$/.test(raw)) raw='fa-solid '+raw;
    return raw;
  }
  function isFontAwesome(value){const raw=normalize(value);return /(?:^|\s)fa-(?:solid|regular|brands|light|thin|duotone)(?:\s|$)/.test(raw)&&/(?:^|\s)fa-[a-z0-9-]+(?:\s|$)/.test(raw)}
  function safeClass(value){return normalize(value).split(/\s+/).filter(v=>/^fa-[a-z0-9-]+$/i.test(v)).slice(0,6).join(' ')}
  window.ImobifyIconLibrary={groups,flat,normalize,isFontAwesome,safeClass};
})();

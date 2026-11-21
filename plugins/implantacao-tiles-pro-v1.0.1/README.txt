IMPLANTAÇÃO TILES PRO v1.0.1

Plugin Play para Imobify Studio 5.0.1+.

CONFIGURAÇÃO PELO tiles.xml
A configuração principal volta a seguir o projeto original.
Por padrão o plugin procura:

  tiles/tiles.xml

No inspetor, altere somente "Caminho da pasta dos tiles" quando a pasta estiver
em outro local. Exemplo:

  implantacao/tiles

Nesse caso o plugin procura:

  implantacao/tiles/tiles.xml

FORMATO ESPERADO DO tiles.xml

  <?xml version="1.0" encoding="UTF-8"?>
  <tiles>
    <tileSize>256</tileSize>
    <originalWidth>5938</originalWidth>
    <originalHeight>3677</originalHeight>
    <maxZoom>3</maxZoom>
  </tiles>

O plugin lê automaticamente:
- tileSize
- originalWidth
- originalHeight
- maxZoom

Também aceita opcionalmente minZoom e zoomSnap se existirem no XML.

CAMINHO DOS ARQUIVOS
O padrão continua igual ao projeto original:

  tiles/{z}/{x}/{y}.webp

O campo "Padrão dos arquivos de tile" permite alterar apenas essa parte, por
exemplo {z}/{x}/{y}.png. A pasta base continua vindo de "Caminho da pasta dos tiles".

FALLBACK
Os campos do grupo "Fallback do XML" só são usados se tiles.xml não puder ser
carregado ou estiver inválido. O XML sempre tem prioridade quando está válido.

MOBILE
O modo "Toque para explorar a implantação" evita que pan/zoom bloqueiem o scroll
vertical da landing page. Os controles mantêm tamanho e posição separados para
mobile e desktop.

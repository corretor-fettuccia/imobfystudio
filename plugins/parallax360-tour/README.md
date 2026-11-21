# Parallax360Tour v1.0.2

Plugin independente com editor de cenas/hotspots derivado do Tour360 Pro. Os arquivos de panorama e marca são incorporados pelo compilador.

Cena e hotspots são percorridos em ordem configurada pelo Tour360 Studio; próximo, anterior, teclado e scroll controlam a narrativa. Em touch, o scroll da página fica livre e os botões permitem avançar.

Formato de configuração compatível com Tour360 Studio v7 (ImobStudioTour360). Para informar o banner, selecione o hotspot → editar → Informação/Texto de apresentação.

## v1.0.2 — Full Bleed

A cena panorâmica ocupa **100vw** de borda a borda, inclusive quando o plugin é inserido em um contêiner de largura limitada. O wrapper da seção não acrescenta espaçamento, contorno ou arredondamento; o cartão informativo e os controles mantêm suas próprias superfícies.

`maxWidth`, `radius` e `paddingY` continuam aceitos nos projetos antigos para compatibilidade de dados, porém não são usados no modo Full Bleed e não aparecem mais como controles. A altura desktop e mobile permanece configurável.

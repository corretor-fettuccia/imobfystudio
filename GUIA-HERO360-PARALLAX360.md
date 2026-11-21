# Guia de uso — Hero360Tour e Parallax360Tour

## Como adicionar
1. Abra o Imobify Studio 6.0.43 via servidor web local (por exemplo, `python -m http.server 8080`).
2. Na biblioteca, selecione **Experiência → Hero360Tour** ou **Parallax360Tour**.
3. Configure Eyebrow, Headline, Subheadline, cores, altura desktop/mobile e CTA no inspetor.
4. Clique em **Configurar cenas e hotspots 360** no inspetor para abrir o Studio.
5. Importe um JSON compatível do Tour360 Pro **ou** adicione cenas equiretangulares 360°; selecione visão inicial de cada cena, crie hotspots com clique no panorama e capture yaw/pitch.
6. Para banners: selecione o hotspot → **Editar** → campo **Texto de apresentação (banner)**. O campo **Texto** é o título do cartão. O tipo **Navegação** oferece também botão para abrir a cena destino; o tipo **Link externo** usa URL validada. Salve a configuração no modal.
7. Exporte a landing page ZIP. Os arquivos carregados no Studio são incorporados à pasta de imagens; os caminhos no tourConfig exportado são reescritos.

## Hero360Tour
- Exploração livre por arraste/toque, menu para navegar pelas cenas, hotspots com banners e CTA geral de hero.
- Após **10 segundos** sem movimento/toque/teclado/foco/click, começa uma oscilação suave de olhar, sem rotação completa.
- Ajuste **inatividade**, **amplitude horizontal**, **amplitude vertical** e **ciclo do observador** no inspetor.
- A primeira interação interrompe o movimento. Fica pausado com banners abertos, em aba oculta, fora da tela e com `prefers-reduced-motion`.

## Parallax360Tour
- Navega por uma sequência calculada automaticamente da ordem das cenas (cena → hotspot 1 → hotspot 2 → próxima cena…). O botão **Próximo** focaliza o hotspot; o botão **Anterior** retorna.
- O scroll (opcional) avança com gesto de roda/trackpad dentro do panorama e libera a rolagem normal no início/fim. Mobile oferece botões sem capturar o scroll da página.
- Hotspots clicáveis exibem banner e sincronizam a posição da sequência. A cena e o ponto são editados no Tour360 Studio.

## Requisitos e limites
- Panoramas devem ser imagens **equiretangulares 2:1** para cobertura esférica real.
- Engine panorâmica: **Pannellum 2.5.6**, a mesma biblioteca já usada pelo Tour360 original. Seu JS/CSS são obtidos do CDN público na primeira visita; **a experiência 360 não é totalmente offline** sem disponibilizar essa biblioteca localmente. Arquivos de panorama carregados são empacotados.
- Primeiro teste de UX foi feito no Chromium com motor 360 simulado para validar controles, banners, sequência, timers e mobile. Renderização panorâmica real requer panoramas e acesso à biblioteca em um ambiente publicado.
- Links relativos sem protocolo devem ser usados com cautela: os CTAs do componente aceitam endereços HTTP/HTTPS, mailto e tel; ações inseguras são bloqueadas.

## Compatibilidade
Os dois plugins são independentes, IDs `hero360-tour` e `parallax360-tour`. O Tour360 Pro original permanece inalterado. Os dois novos editores aceitam dados do Tour360 Studio no formato `ImobStudioTour360` v7.

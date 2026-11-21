# Imobify Studio 5.6.1

## Parallax 2.8.1 — correção da máquina de estados

- **IN não é banner**: volta a ser somente o limite inicial da timeline.
- O Studio não oferece mais “Criar/editar chave IN” e impede mover/criar banners sobre o IN.
- Projetos 2.8.0 que tenham criado uma chave exatamente no IN são normalizados ao detectar os metadados do vídeo.
- Ao voltar por gesto do Banner 1 até IN, o vídeo toca automaticamente para frente até o Banner 1, sem congelar no início.
- O retorno automático é disparado somente por navegação reversa do usuário; ações de controle não herdam esse estado.
- Capítulos cancelam auto-start e retorno pendente antes de saltar para outra chave.
- **Pular introdução** vai ao OUT e libera a próxima seção sem reiniciar a experiência.
- **Reiniciar** é o único controle que volta ao IN e relança deliberadamente a primeira etapa.
- Pointer/touch da toolbar ficam isolados dos gestos de navegação cinematográfica.

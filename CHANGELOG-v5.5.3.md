# Imobify Studio 5.5.3

## Parallax 2.7.3 — mobile e frame inicial

- No mobile, o indicador de navegação deixa de usar a metáfora da roda do mouse.
- O hint mobile exibe dois chevrons animados apontando para cima e o texto **“Deslize para cima”**, acompanhando o gesto físico do dedo.
- O desktop mantém o indicador de mouse e **“Rolar para explorar”**.
- Ao navegar de volta para o início da timeline/frame 0, o Parallax entra em estado estacionado e força `pause()`.
- O retorno ao início invalida qualquer `autoStart` pendente ou futuro daquela execução, evitando que o vídeo avance novamente sozinho.
- O `autoStart` continua funcionando normalmente na primeira entrada, quando habilitado pelo projeto.
- O estado estacionado só é liberado por um novo gesto de avanço.
- Mantidas as proteções de exportação e bundle isolado introduzidas na 5.5.2.

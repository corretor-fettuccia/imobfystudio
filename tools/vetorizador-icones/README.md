# Vetorizador de Ícones

App web que converte imagens (PNG, JPG, WebP) em SVG, pensado para criar ícones de site.
Tudo roda no navegador: nenhuma imagem é enviada para servidor.

## Como usar

1. Abra o `index.html` no navegador (dois cliques já funciona).
2. Envie a imagem pelo botão, arrastando para a página ou colando com Ctrl+V.
3. Ajuste as opções até o SVG ficar parecido com o original.
4. Clique em **Baixar .svg** ou **Copiar SVG**.

## Opções

| Opção | O que faz |
|---|---|
| Tipo de imagem | Atalho que ajusta as outras opções de uma vez |
| Cores | Quantas cores o SVG vai ter. Menos cores = arquivo menor |
| Suavizar curvas | Valores maiores deixam as curvas mais lisas e o arquivo menor |
| Ignorar manchas | Descarta pedacinhos menores que esse tamanho (ruído de JPG) |
| Remover fundo | Deixa transparente a cor do canto superior esquerdo |
| Cor única (currentColor) | O ícone herda a cor do texto pelo CSS |

## Dicas para ícones

- Funciona melhor com desenhos chapados, de poucas cores e sem degradê.
- Fotos e imagens com sombra viram SVGs pesados. Para essas, prefira PNG ou WebP.
- Com **Cor única** ligada, você muda a cor do ícone pelo CSS:

```html
<a href="/" style="color:#1f5bd6">
  <!-- cole o SVG aqui; defina width/height se quiser -->
</a>
```

- Imagens grandes são reduzidas para 400 px no lado maior antes da conversão (mude `MAX` em `js/app.js`).

## Estrutura

```
index.html                     página
css/style.css                  estilos (tema claro e escuro automático)
js/app.js                      lógica do app
vendor/imagetracer_v1.2.6.js   biblioteca de vetorização (imagetracerjs, domínio público)
```

## Publicar

É um site estático: suba a pasta inteira em qualquer hospedagem
(GitHub Pages, Netlify, Vercel, Hostinger etc.). Não precisa de servidor nem de instalação.

As fontes vêm do Google Fonts. Sem internet, o app continua funcionando com as fontes do sistema.

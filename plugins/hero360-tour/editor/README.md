# Tour 360 Editor v3.2.0

Consulte `VERSION.md` para o escopo desta compilação e `CHANGELOG.md` para o histórico funcional acumulado.

## Edição

- Selecionar uma cena mantém o modo de visualização / navegação.
- A caneta ✎ da cena habilita edição, enquadramento e criação de hotspots.
- Abrir um hotspot mostra seus atributos em leitura.
- A caneta ✎ do hotspot habilita alteração e reposicionamento.
- Cada hotspot de navegação pode guardar yaw, pitch e HFOV da visão de chegada.

## Branding

Na aba **Projeto**, configure um branding compacto com texto, imagem/logotipo opcional, link e posição. A imagem local é mantida no editor para prévia, mas no pacote de publicação é gravada como arquivo físico em `branding/`. No player exportado, branding e menu usam zona segura para não cobrir controles ou bússola.

## Exportação para publicação

O ZIP publicado contém:

```text
<nome-do-projeto>/
├── index.html
├── tour.js
├── tour.json
├── README.txt
├── 360/
│   └── panoramas locais
└── branding/
    └── banner.*   (quando configurado)
```

As panorâmicas locais e o banner local não ficam em Base64 no pacote publicado. URLs externas são preservadas.

O player publicado possui painel recolhível de **Pontos**, atualizado automaticamente para a cena atual.

## Publicação

Descompacte o ZIP e faça upload preservando a estrutura de diretórios. O player usa `fetch()` para carregar `tour.json`, portanto deve ser servido por HTTP/HTTPS.

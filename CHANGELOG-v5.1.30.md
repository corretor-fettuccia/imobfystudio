# Imobify Studio 5.1.30

## Estado individual de componentes

- o inspetor recebe um menu compacto de três linhas para **Salvar componente**, **Salvar grupo** e **Carregar estado**;
- componentes individuais são exportados sem os demais dados do projeto;
- Segmentos e containers podem ser exportados com todos os componentes internos;
- os arquivos seguem o padrão `nome-do-componente.saved.json`;
- o carregamento exige um componente ou grupo compatível e preserva a identidade da instância, a chamada do Floating Container e a posição no Segmento;
- o JSON usa schema próprio e não é confundido com um arquivo de projeto completo.

## Interface

- remove o botão `collapseInspector`, mantendo o painel direito redimensionável pela régua lateral;
- o menu de estado ocupa somente o cabeçalho do inspetor e fecha ao clicar fora ou pressionar Esc.

## Plugin Play

- o interpretador agora processa condicionais `if` e `unless` aninhadas;
- marcadores condicionais malformados não vazam como texto na página;
- corrige o caso do Floating Container que exibia `{{/if}}` quando o cabeçalho ou seus textos eram condicionais.

## Novos plugins

- **Botão 1.0.0**: CTA único com HREF seguro, ícone, alinhamento, tamanho, largura e integração ao Button Kit global;
- **Imagem Single 1.0.0**: uma imagem por instância, com upload, texto alternativo, legenda, link, proporção, recorte, alinhamento e sombra.

## Compatibilidade

Projetos, plugins e blocos reutilizáveis das versões anteriores continuam válidos. O Form Sender v4 permanece byte a byte preservado.

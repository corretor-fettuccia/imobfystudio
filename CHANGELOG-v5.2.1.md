# Imobify Studio 5.2.1

## Projeto no disco local

- O botão superior `Salvar` passa a se chamar **Projeto**.
- Ao clicar, abre um menu flutuante com **Carregar** e **Salvar**.
- **Carregar** abre um projeto JSON diretamente do armazenamento local.
- **Salvar** grava o projeto JSON no armazenamento local; em navegadores compatíveis usa o seletor nativo de arquivo/diretório.
- Quando um projeto é carregado pelo seletor nativo, o identificador do arquivo é mantido apenas na memória da sessão para permitir salvar novamente no mesmo arquivo.
- `Ctrl+S` agora salva o projeto no disco local.
- Removidos os controles duplicados de importar/exportar JSON da aba Projeto.
- O projeto deixou de ser persistido automaticamente em `localStorage` e `IndexedDB`. A edição permanece apenas na memória até o usuário salvar o JSON.
- A barra de status informa **Alterações não salvas** ou **Salvo em disco**.

## Compatibilidade

- Mantidos os recursos e o formato de projeto da série 5.2; projetos anteriores continuam sendo normalizados ao carregar.
- Preferências de interface e biblioteca de blocos reutilizáveis continuam podendo usar armazenamento do navegador; a alteração desta versão se refere ao arquivo do projeto.

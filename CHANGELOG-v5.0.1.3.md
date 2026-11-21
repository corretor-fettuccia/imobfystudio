# Imobify Studio 5.0.1.3 — estabilidade Scrollytelling

## Scrollytelling Vídeo Pro 2.2.1

- removido o `MutationObserver` global da prévia, que podia ser reacionado pelo próprio plugin;
- observer do editor de pontos limitado aos filhos diretos do Inspector;
- seeks de vídeo coalescidos e limitados para evitar saturação do decoder;
- loop de render suspenso quando a seção ou a aba não estão ativas;
- atualizações de atributos/HUD evitam escritas DOM redundantes;
- bridge do editor de pontos atualizado para a geração v4;
- poster padrão restaurado no pacote instalável.

## Carregamento de plugins

- plugins bundled são carregados antes dos plugins persistidos;
- uma versão antiga persistida no IndexedDB não pode mais sobrescrever uma correção bundled mais nova;
- caminhos antigos do Scrollytelling são migrados para `v2.2.1`.

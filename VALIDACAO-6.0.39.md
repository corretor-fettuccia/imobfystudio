# Verificação de distribuição — 6.0.39

## Como executar

1. Extraia `imobify-studio-6.0.39.zip` sem mover os caminhos internos.
2. Execute o editor através de servidor HTTP estático, porque leitura dos manifestos via `fetch` pode falhar em `file://`. Exemplo: na pasta onde está a pasta `imobify-studio-6.0.39`, execute `python3 -m http.server 8080` e abra `http://localhost:8080/imobify-studio-6.0.39/`.
3. Para validar localmente o pacote, com Node.js 18+ instalado: `bash scripts/verify-release.sh` a partir da pasta do projeto.

## Evidências automatizadas

| Verificação | Resultado | Alcance |
|---|---|---|
| Testes `.test.cjs` do projeto | 31/31 aprovados | Contratos de código, geração e regressões automatizadas |
| Compilação por plugin | 48/48 executados | 47 checagens de marcação, Tag Installer documental por exceção |
| Sintaxe de JavaScript | Aprovada | Arquivos JS/CJS de editor, runtime, plugins e testes |
| Exportação 6.0.39 | Aprovada | HTML, CSS, JS, README, readiness, projeto no ZIP, imagem Data URL e imutabilidade do estado |
| Zoom editor/landing | Aprovada em inspeção e teste estático | Viewport acessível e sem bloqueio global dos eventos de gesto |
| JSON de manifestos ativos | Aprovado | `plugin-sdk/plugin-package.schema.json` e `plugins/registry.json` |
| Execução real de navegador | **Não realizada** | Infraestrutura da auditoria anterior bloqueou Playwright; requer smoke manual |
| Web Vitals de campo | **Não medidos** | Não substituir métricas reais por pontuações calculadas de readiness |

## Testes manuais recomendados antes de usar em produção

- Abrir editor pelo endereço HTTP, criar projeto em branco, salvar e carregar projeto 6.0.38.
- Confirmar que projeto anterior mantém estrutura e propriedades ao ser carregado.
- Inserir Hero, Slider, Parallax, Pop-up, Form Sender, Smart Plant e Tour 360; alterar uma configuração e verificar no editor, no preview e no ZIP compilado.
- Publicar um ZIP exportado num host de testes; abrir a landing page em desktop e no navegador do celular.
- Pinch-zoom na página e validação de toque, scroll, foco de teclado, CTA, modal, fechar/ESC e mídia (incluindo retomada após bloqueio de tela).
- Testar assets remotos indisponíveis, offline, tela estreita e `prefers-reduced-motion`.
- Avaliar LCP, INP e CLS com DevTools/medidas de campo; registrar diferenças entre ambiente de preview e publicação.

## Pendência de mídia na baseline original

Os três arquivos de sprite do Leaflet referenciados em `plugins/implantacao-tiles-pro-v1.0.1/leaflet/leaflet.css` não foram encontrados na versão base e causaram avisos durante o smoke test desse plugin. As funcionalidades de implantações reais com XML e tiles dependem também de dados fornecidos pelo projeto; o teste isolado não cobre uma implantação com tiles reais.

### Avisos registrados no smoke isolado

Além das três imagens do Leaflet ausentes no pacote base, foram registrados dois avisos de fetch do mesmo arquivo MP4 remoto de demonstração do Parallax (`raw.githubusercontent.com`). O teste intencionalmente não faz downloads HTTP; esses dois avisos **não** provam falha em navegação com acesso à internet, mas devem ser verificados no navegador para confirmação de CORS, disponibilidade e capacidade de empacotar mídia remota.

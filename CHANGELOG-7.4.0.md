# Imobify Studio 7.4.0 — Auditoria de seções

**Base:** Imobify Studio 7.3.9 (Otimizador de Nota SEO). Nenhuma funcionalidade anterior removida.

## Adicionado
- Aba **Auditoria** no painel esquerdo (entre Estrutura da página e Design), com contador de pontos de atenção.
- `assets/js/section-audit.js` 1.0.0 e `assets/css/section-audit.css`.
- Nota de auditoria (0–100; alta −8, média −4, baixa −1,5), filtros por prioridade, agrupamento por seção na ordem da página.
- Clique no ponto: seleciona a seção, abre o grupo recolhido do inspetor e foca o campo exato.
- Correções de um clique (passam pelo commit do Studio; Desfazer funciona): CTA obrigatório, CTA genérico, âncora quebrada/botão sem destino → `#contato`, ocultar imagem vazia ou botão repetido, bloquear GPTBot.
- **Ignorar/Reativar** por ponto (guardado por projeto neste navegador).

### Regras técnicas (qualquer projeto)
Texto provisório/instrução editorial visível; variável não preenchida (`[VALOR]`, `{{x}}`); âncora quebrada; botão sem destino; imagem vazia; texto alternativo ausente, curto ou em CAIXA ALTA (inclusive slides); botão repetido em sequência; linguagem fraca em título/botão; CTA genérico; título com mais de 12 palavras; nota SEO abaixo de 100%.

### Regras comerciais — Engenharia de Conversão MCMV-RS 3.1 (só projetos MCMV)
Termos proibidos (2.7, com exceção de negações como "não é canal oficial do Governo Federal"); clichê no título; CTAs obrigatórios por seção (5); valor sem nota vinculada (3.9); tempos de deslocamento sem fonte (11); página sem formulário (12); lançamento sem aviso de imagens ilustrativas (10.4); treinamento por IA liberado com política anti-IA ativa.

## Alterado
- `app.js`: ponte `window.ImobifyStudioBridge` (somente leitura do estado, seleção, troca de aba, commit e aviso de mudança). Nenhum comportamento existente alterado.
- Versão 7.3.9 → 7.4.0 (editor, projetos salvos e compilador).

## Validação
- Chromium 1440×1100. Las Palmas v1: nota 67, 12 pontos; clique foca o campo certo em Hero, Smart Plant, Botão e Localização; correções sobem a nota; Desfazer volta; Ignorar funciona. Las Palmas v2: nota 92, 2 pontos (tempos sem fonte e GPTBot). Sem erros de console.
- Testes automáticos: mesmas 15 falhas pré-existentes da 7.3.8; nenhuma nova.

# ImobStudio 6.0.72 — correção do Hero360Tour

Ajuste no renderizador 360 para eliminar a tela preta em panoramas com resolução não potência de dois em WebGL 1. O plugin 1.1.4 mantém o poster até o primeiro frame e inclui recuperação para Canvas 2D quando o contexto gráfico falhar. Não altera a estrutura JSON do tour nem os demais plugins.

Testes: regressão da configuração, entrada por cena, validação do shader e renderização real no Chromium em modo Canvas 2D. A renderização foi reproduzida e validada em Chromium com WebGL ativo via Xvfb: a versão 6.0.71 desenhou preto com panorâmica 3000×1500 e a 6.0.72 desenhou corretamente a mesma cena. Também validado Canvas 2D e compatibilidade da exportação.

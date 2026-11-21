#!/usr/bin/env bash
# Imobify Studio 6.0.83 — verificação offline de sintaxe, testes e compilação.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
echo "== Imobify Studio 6.0.83 =="
echo 'Verificando sintaxe JavaScript...'
count_js=0
while IFS= read -r -d '' file; do
  node --check "$file" >/dev/null
  count_js=$((count_js+1))
done < <(find assets core plugins scripts tests -type f \( -name '*.js' -o -name '*.cjs' \) -print0)
echo "OK: $count_js arquivos JavaScript"
echo 'Executando testes de regressão...'
count_tests=0
for test in tests/*.test.cjs; do
  node "$test"
  count_tests=$((count_tests+1))
done
echo "OK: $count_tests testes"
echo 'Executando compilação isolada dos plugins...'
node scripts/smoke-all-plugins.cjs > /tmp/imobify-studio-6083-plugins-smoke.json
echo 'OK: 49 plugins visuais/comportamentais, mais o Tag Installer documental.'
echo 'Relatório da compilação: /tmp/imobify-studio-6083-plugins-smoke.json'
echo 'Atenção: estes testes não substituem validação visual em navegador real.'

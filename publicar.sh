#!/usr/bin/env bash
# Único caminho para publicar o oferta.vloom.pt desde 16/09/2026.
# NUNCA `vercel deploy --prod` pelo CLI: o push seguinte apaga tudo o que não estiver
# commitado (Blueprint 17/09, guias bónus 16-18/09).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

alteracoes="$(git status --porcelain)"

if [ -n "$alteracoes" ]; then
  echo "⛔ Não publico: estes ficheiros não estão no GitHub e o próximo push apagava-os de produção:"
  echo "$alteracoes"
  exit 1
fi

git push
echo "✅ enviado para o GitHub — a Vercel publica em ~1 min"

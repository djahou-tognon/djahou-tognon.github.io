#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Checking JSON files in content/..."
failed=0
for file in content/*.json; do
  if python3 -m json.tool "$file" > /dev/null; then
    echo "  OK  $file"
  else
    echo "  ERR $file"
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Fix JSON syntax errors before previewing."
  exit 1
fi

echo ""
echo "All content files are valid."

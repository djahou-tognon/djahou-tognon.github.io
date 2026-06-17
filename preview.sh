#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

./check-content.sh
./check-site.sh
echo ""
echo "Starting local preview at http://localhost:8080"
echo "Live site: https://djahou-tognon.github.io"
echo "Press Ctrl+C to stop."
echo ""
python3 -m http.server 8080

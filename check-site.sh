#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Checking site readiness for GitHub Pages..."
failed=0

check() {
  if [ -e "$1" ]; then
    echo "  OK  $1"
  else
    echo "  ERR $1 (missing)"
    failed=1
  fi
}

check ".nojekyll"
check "index.html"
check "content/profile.json"
check "assets/cv.pdf"
check "assets/photo.png"

site_url=$(python3 -c "import json; print(json.load(open('content/profile.json')).get('siteUrl', ''))")
if [ "$site_url" = "https://djahou-tognon.github.io" ]; then
  echo "  OK  siteUrl = $site_url"
else
  echo "  ERR siteUrl should be https://djahou-tognon.github.io (got: $site_url)"
  failed=1
fi

for page in index.html research.html publications.html talks.html teaching.html project.html; do
  check "$page"
done

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Fix the issues above before publishing."
  exit 1
fi

echo ""
echo "Site is ready for https://djahou-tognon.github.io"
echo ""
echo "Publish:"
echo "  git add ."
echo "  git commit -m \"Publish site\""
echo "  git remote add origin https://github.com/djahou-tognon/djahou-tognon.github.io.git  # once"
echo "  git push -u origin main"
echo ""
echo "Then on GitHub: Settings → Pages → branch main / root"

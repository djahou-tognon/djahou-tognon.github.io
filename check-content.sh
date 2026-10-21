#!/usr/bin/env bash
cd "$(dirname "$0")"
src="../website/djahou-tognon.github.io/content"
ok=0
for f in profile about keywords announcement research projects teaching publications talks; do
  if cmp -s "$src/$f.json" "content/$f.json"; then
    echo "identique  content/$f.json"
  else
    echo "DIFFÉRENT content/$f.json"
    ok=1
  fi
done
exit "$ok"

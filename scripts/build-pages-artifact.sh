#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_DIR="${ROOT_DIR}/autofiller/static"
OUT_DIR="${ROOT_DIR}/dist-pages"

if [[ ! -f "${STATIC_DIR}/app.js" ]]; then
  echo "Missing ${STATIC_DIR}/app.js. Run frontend build first." >&2
  exit 1
fi

rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"

cp "${STATIC_DIR}/app.js" "${OUT_DIR}/app.js"
if [[ -d "${STATIC_DIR}/assets" ]]; then
  cp -R "${STATIC_DIR}/assets" "${OUT_DIR}/assets"
fi
if [[ -d "${STATIC_DIR}/chunks" ]]; then
  cp -R "${STATIC_DIR}/chunks" "${OUT_DIR}/chunks"
fi

CSS_PATH=""
if compgen -G "${OUT_DIR}/assets/main-*.css" > /dev/null; then
  CSS_FILE="$(basename "$(ls "${OUT_DIR}"/assets/main-*.css | head -n 1)")"
  CSS_PATH="./assets/${CSS_FILE}"
fi

if [[ -n "${CSS_PATH}" ]]; then
  CSS_LINK="    <link rel=\"stylesheet\" href=\"${CSS_PATH}\" />"
else
  CSS_LINK=""
fi

cat > "${OUT_DIR}/index.html" <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jisho2Anki Capture</title>
${CSS_LINK}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./app.js"></script>
  </body>
</html>
EOF

cp "${OUT_DIR}/index.html" "${OUT_DIR}/404.html"
touch "${OUT_DIR}/.nojekyll"

echo "Built Pages artifact in ${OUT_DIR}"

#!/bin/sh
# Runtime entrypoint to generate env-config.js from environment variables
set -e

TARGET_DIR=/usr/share/nginx/html
TARGET_FILE="$TARGET_DIR/env-config.js"

echo "// This file is generated at container start by docker-entrypoint.sh" > "$TARGET_FILE"
echo "window.__REACT_APP_API_URL = \"${REACT_APP_API_URL:-}\";" >> "$TARGET_FILE"

# Ensure index.html loads env-config.js before the app bundle
INDEX_HTML="$TARGET_DIR/index.html"
if [ -f "$INDEX_HTML" ]; then
	if ! grep -q "env-config.js" "$INDEX_HTML"; then
		# Insert script tag before closing </head>
		sed -i "s|</head>|  <script src=\"/env-config.js\"></script>\n</head>|" "$INDEX_HTML"
	fi
fi

exec nginx -g 'daemon off;'

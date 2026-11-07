#!/usr/bin/env bash
# Package the site as a WordPress plugin: dist/ncc-site.zip
# Upload that zip in WordPress under Plugins, Add New, Upload Plugin.
set -euo pipefail
cd "$(dirname "$0")/.."

out="dist/ncc-site"
rm -rf "$out" dist/ncc-site.zip
mkdir -p "$out/site"

cp wordpress/ncc-site/ncc-site.php wordpress/ncc-site/readme.txt "$out/"
# Shipped as template.html so the plugin folder never serves a second copy of the homepage.
cp index.html "$out/site/template.html"
cp styles.css main.js config.js "$out/site/"
cp -R assets "$out/site/assets"
cp -R emails "$out/emails"
find "$out" -name '.DS_Store' -delete

(cd dist && zip -qr ncc-site.zip ncc-site)
echo "Built dist/ncc-site.zip ($(du -h dist/ncc-site.zip | cut -f1))"

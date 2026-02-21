#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Removing Chrome extension..."

# Remove the extension app directory
rm -rf "$ROOT_DIR/apps/wxt"

cd "$ROOT_DIR"

# Remove dev-wxt script from package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

delete pkg.scripts['dev-wxt'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Remove .wxt/ from .gitignore
node -e "
const fs = require('fs');
let content = fs.readFileSync('.gitignore', 'utf8');

content = content.replace(/\n# wxt\n\.wxt\/\n/, '\n');

fs.writeFileSync('.gitignore', content);
"

echo "Running pnpm install to update lockfile..."
pnpm install

echo "Chrome extension removed successfully!"

# Remove this script
rm -- "$0"

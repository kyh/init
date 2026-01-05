#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Removing Chrome extension..."

# Remove the extension app directory
rm -rf "$ROOT_DIR/apps/extension"

# Remove dev-extension script from package.json
cd "$ROOT_DIR"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove extension-related scripts
delete pkg.scripts['dev-extension'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Running pnpm install to update lockfile..."
pnpm install

echo "Chrome extension removed successfully!"

# Remove this script
rm -- "$0"

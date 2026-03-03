#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Removing Tauri app..."

# Remove the tauri app directory
rm -rf "$ROOT_DIR/apps/tauri"

cd "$ROOT_DIR"

# Remove dev-tauri script from package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

delete pkg.scripts['dev-tauri'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Running pnpm install to update lockfile..."
pnpm install

echo "Tauri app removed successfully!"

# Remove this script
rm -- "$0"

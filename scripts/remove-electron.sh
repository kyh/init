#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Removing Electron app..."

# Remove the electron app directory
rm -rf "$ROOT_DIR/apps/electron"

# Remove dev-electron script from package.json
cd "$ROOT_DIR"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove electron-related scripts
delete pkg.scripts['dev-electron'];

// Remove electron from onlyBuiltDependencies
if (pkg.pnpm?.onlyBuiltDependencies) {
  pkg.pnpm.onlyBuiltDependencies = pkg.pnpm.onlyBuiltDependencies.filter(d => d !== 'electron');
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Running pnpm install to update lockfile..."
pnpm install

echo "Electron app removed successfully!"

# Remove this script
rm -- "$0"

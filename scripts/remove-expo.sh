#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Removing Expo app..."

# Remove the expo app directory
rm -rf "$ROOT_DIR/apps/expo"

# Remove dev-expo script from package.json
cd "$ROOT_DIR"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove expo-related scripts
delete pkg.scripts['dev-expo'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Remove @better-auth/expo from pnpm-workspace.yaml catalog
node -e "
const fs = require('fs');
let content = fs.readFileSync('pnpm-workspace.yaml', 'utf8');

// Remove the @better-auth/expo line
content = content.replace(/\\s*\"@better-auth\\/expo\":[^\\n]*\\n/g, '\\n');

fs.writeFileSync('pnpm-workspace.yaml', content);
"

echo "Running pnpm install to update lockfile..."
pnpm install

echo "Expo app removed successfully!"

# Remove this script
rm -- "$0"

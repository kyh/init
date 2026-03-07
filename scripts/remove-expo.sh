#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Removing Expo app..."

# Remove the expo app directory
rm -rf "$ROOT_DIR/apps/mobile"

cd "$ROOT_DIR"

# Remove dev-expo script from package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

delete pkg.scripts['dev-mobile'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Remove @better-auth/expo from pnpm-workspace.yaml catalog
node -e "
const fs = require('fs');
let content = fs.readFileSync('pnpm-workspace.yaml', 'utf8');

content = content.replace(/\s*\"@better-auth\/expo\":[^\n]*\n/g, '\n');

fs.writeFileSync('pnpm-workspace.yaml', content);
"

# Remove @better-auth/expo from packages/api and clean auth.ts
node -e "
const fs = require('fs');

// Remove @better-auth/expo from packages/api/package.json
const apiPkg = JSON.parse(fs.readFileSync('packages/api/package.json', 'utf8'));
delete apiPkg.dependencies['@better-auth/expo'];
fs.writeFileSync('packages/api/package.json', JSON.stringify(apiPkg, null, 2) + '\n');

// Remove expo import and plugin from auth.ts
let auth = fs.readFileSync('packages/api/src/auth/auth.ts', 'utf8');
auth = auth.replace(/import \{ expo \} from \"@better-auth\/expo\";\n/, '');
auth = auth.replace(/\s*expo\(\),\n/, '\n');
auth = auth.replace(/\s*trustedOrigins: \[\"expo:\/\/\"\],\n/, '\n');
fs.writeFileSync('packages/api/src/auth/auth.ts', auth);
"

# Remove expo entries from .gitignore
node -e "
const fs = require('fs');
let content = fs.readFileSync('.gitignore', 'utf8');

content = content.replace(/\n# expo\n\.expo\/\ndist\/\nexpo-env\.d\.ts\napps\/mobile\/\.gitignore\n/, '\n');

fs.writeFileSync('.gitignore', content);
"

# Remove expo VSCode extension recommendation
node -e "
const fs = require('fs');
const ext = JSON.parse(fs.readFileSync('.vscode/extensions.json', 'utf8'));
ext.recommendations = ext.recommendations.filter(r => r !== 'expo.vscode-expo-tools');
fs.writeFileSync('.vscode/extensions.json', JSON.stringify(ext, null, 2) + '\n');
"

echo "Running pnpm install to update lockfile..."
pnpm install

echo "Expo app removed successfully!"

# Remove this script
rm -- "$0"

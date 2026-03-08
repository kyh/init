#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo ""
echo "Welcome to init setup!"
echo "Select which apps to include in your project."
echo ""

# Track selections (1 = keep, 0 = remove)
keep_web=0
keep_mobile=0
keep_extension=0
keep_desktop=0

prompt_app() {
  local app_name="$1"
  local default="$2"
  local prompt_char="Y/n"
  if [ "$default" = "n" ]; then
    prompt_char="y/N"
  fi

  while true; do
    printf "  Include %s? (%s): " "$app_name" "$prompt_char"
    read -r answer
    answer=$(echo "$answer" | tr '[:upper:]' '[:lower:]')

    if [ -z "$answer" ]; then
      answer="$default"
    fi

    case "$answer" in
      y|yes) return 0 ;;
      n|no) return 1 ;;
      *) echo "  Please answer y or n." ;;
    esac
  done
}

if prompt_app "Web (Next.js)" "y"; then
  keep_web=1
fi

if prompt_app "Mobile (Expo/React Native)" "y"; then
  keep_mobile=1
fi

if prompt_app "Extension (Chrome/WXT)" "y"; then
  keep_extension=1
fi

if prompt_app "Desktop (Electron)" "y"; then
  keep_desktop=1
fi

if [ "$keep_web" -eq 0 ] && [ "$keep_mobile" -eq 0 ] && [ "$keep_extension" -eq 0 ] && [ "$keep_desktop" -eq 0 ]; then
  echo ""
  echo "Error: You must keep at least one app."
  exit 1
fi

echo ""
echo "Apps to keep:"
[ "$keep_web" -eq 1 ] && echo "  - Web"
[ "$keep_mobile" -eq 1 ] && echo "  - Mobile"
[ "$keep_extension" -eq 1 ] && echo "  - Extension"
[ "$keep_desktop" -eq 1 ] && echo "  - Desktop"

echo ""
echo "Apps to remove:"
removed=0
[ "$keep_web" -eq 0 ] && echo "  - Web" && removed=1
[ "$keep_mobile" -eq 0 ] && echo "  - Mobile" && removed=1
[ "$keep_extension" -eq 0 ] && echo "  - Extension" && removed=1
[ "$keep_desktop" -eq 0 ] && echo "  - Desktop" && removed=1
[ "$removed" -eq 0 ] && echo "  (none)"

echo ""
printf "Proceed? (Y/n): "
read -r confirm
confirm=$(echo "$confirm" | tr '[:upper:]' '[:lower:]')
if [ "$confirm" = "n" ] || [ "$confirm" = "no" ]; then
  echo "Setup cancelled."
  exit 0
fi

echo ""

# --- Remove Web ---
if [ "$keep_web" -eq 0 ]; then
  echo "Removing Web app..."
  rm -rf "$ROOT_DIR/apps/web"

  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.scripts['dev-web'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
fi

# --- Remove Mobile (Expo) ---
if [ "$keep_mobile" -eq 0 ]; then
  echo "Removing Mobile app..."
  rm -rf "$ROOT_DIR/apps/mobile"

  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.scripts['dev-mobile'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

  node -e "
const fs = require('fs');
let content = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
content = content.replace(/\s*\"@better-auth\/expo\":[^\n]*\n/g, '\n');
fs.writeFileSync('pnpm-workspace.yaml', content);
"

  node -e "
const fs = require('fs');

const apiPkg = JSON.parse(fs.readFileSync('packages/api/package.json', 'utf8'));
delete apiPkg.dependencies['@better-auth/expo'];
fs.writeFileSync('packages/api/package.json', JSON.stringify(apiPkg, null, 2) + '\n');

let auth = fs.readFileSync('packages/api/src/auth/auth.ts', 'utf8');
auth = auth.replace(/import \{ expo \} from \"@better-auth\/expo\";\n/, '');
auth = auth.replace(/\s*expo\(\),\n/, '\n');
auth = auth.replace(/\s*trustedOrigins: \[\"expo:\/\/\"\],\n/, '\n');
fs.writeFileSync('packages/api/src/auth/auth.ts', auth);
"

  node -e "
const fs = require('fs');
let content = fs.readFileSync('.gitignore', 'utf8');
content = content.replace(/\n# expo\n\.expo\/\ndist\/\nexpo-env\.d\.ts\napps\/mobile\/\.gitignore\n/, '\n');
fs.writeFileSync('.gitignore', content);
"

  node -e "
const fs = require('fs');
const ext = JSON.parse(fs.readFileSync('.vscode/extensions.json', 'utf8'));
ext.recommendations = ext.recommendations.filter(r => r !== 'expo.vscode-expo-tools');
fs.writeFileSync('.vscode/extensions.json', JSON.stringify(ext, null, 2) + '\n');
"
fi

# --- Remove Extension ---
if [ "$keep_extension" -eq 0 ]; then
  echo "Removing Extension app..."
  rm -rf "$ROOT_DIR/apps/extension"

  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.scripts['dev-extension'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

  node -e "
const fs = require('fs');
let content = fs.readFileSync('.gitignore', 'utf8');
content = content.replace(/\n# wxt\n\.wxt\/\n/, '\n');
fs.writeFileSync('.gitignore', content);
"
fi

# --- Remove Desktop (Electron) ---
if [ "$keep_desktop" -eq 0 ]; then
  echo "Removing Desktop app..."
  rm -rf "$ROOT_DIR/apps/desktop"

  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

delete pkg.scripts['dev-desktop'];

if (pkg.pnpm?.onlyBuiltDependencies) {
  pkg.pnpm.onlyBuiltDependencies = pkg.pnpm.onlyBuiltDependencies.filter(d => d !== 'electron-winstaller');
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
fi

echo ""
echo "Running pnpm install to update lockfile..."
pnpm install

echo ""
echo "Setup complete!"

# Remove this script and any leftover removal scripts
rm -f "$SCRIPT_DIR/remove-expo.sh"
rm -f "$SCRIPT_DIR/remove-electron.sh"
rm -f "$SCRIPT_DIR/remove-extension.sh"
rm -- "$0"

import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

// ── Helpers ──────────────────────────────────────────────

const fileExists = (p: string) => fs.existsSync(path.resolve(ROOT_DIR, p));
const readJson = (p: string) => JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8"));
const writeJson = (p: string, data: unknown) =>
  fs.writeFileSync(path.resolve(ROOT_DIR, p), JSON.stringify(data, null, 2) + "\n");
const readText = (p: string) => fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8");
const writeText = (p: string, data: string) => fs.writeFileSync(path.resolve(ROOT_DIR, p), data);
const rmDir = (p: string) => {
  const full = path.resolve(ROOT_DIR, p);
  if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
};
const rmFile = (p: string) => {
  const full = path.resolve(ROOT_DIR, p);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

// ── Checkbox prompt ──────────────────────────────────────

const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const CLEAR_LINE = "\x1b[2K\r";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";

interface CheckboxItem {
  label: string;
  checked: boolean;
}

function checkbox(message: string, items: CheckboxItem[]): Promise<boolean[]> {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let cursor = 0;

    const render = () => {
      // Move cursor up to re-render (except first render)
      stdout.write(HIDE_CURSOR);
      for (let i = 0; i < items.length; i++) {
        stdout.write(CLEAR_LINE);
        const isActive = i === cursor;
        const item = items[i];
        const checkbox = item.checked ? `${GREEN}◼${RESET}` : `${DIM}◻${RESET}`;
        const label = isActive ? `${CYAN}${BOLD}${item.label}${RESET}` : item.label;
        const pointer = isActive ? `${CYAN}❯${RESET}` : " ";
        stdout.write(`  ${pointer} ${checkbox} ${label}\n`);
      }
      stdout.write(`${DIM}  ↑/↓ navigate · space toggle · enter confirm${RESET}`);
      // Move cursor back up to top of list
      stdout.write(`\x1b[${items.length}A\r`);
    };

    // Print question
    stdout.write(`\n${CYAN}?${RESET} ${BOLD}${message}${RESET}\n`);

    render();

    const onKey = (key: string) => {
      // ctrl+c
      if (key === "\x03") {
        stdout.write(SHOW_CURSOR);
        process.exit(0);
      }

      // Up arrow or k
      if (key === "\x1b[A" || key === "k") {
        cursor = (cursor - 1 + items.length) % items.length;
        render();
        return;
      }

      // Down arrow or j
      if (key === "\x1b[B" || key === "j") {
        cursor = (cursor + 1) % items.length;
        render();
        return;
      }

      // Space – toggle
      if (key === " ") {
        items[cursor].checked = !items[cursor].checked;
        render();
        return;
      }

      // a – toggle all
      if (key === "a") {
        const allChecked = items.every((i) => i.checked);
        for (const item of items) item.checked = !allChecked;
        render();
        return;
      }

      // Enter – confirm
      if (key === "\r" || key === "\n") {
        stdin.removeListener("data", onKey);
        stdin.setRawMode(false);
        stdin.pause();
        // Move below rendered list and clear
        stdout.write(`\x1b[${items.length + 1}B\r\n`);
        stdout.write(SHOW_CURSOR);
        resolve(items.map((i) => i.checked));
      }
    };

    stdin.on("data", onKey);
  });
}

// ── App definitions ──────────────────────────────────────

interface App {
  name: string;
  dir: string;
  devScript: string;
  remove: () => void;
}

const apps: App[] = [
  {
    name: "Web (Next.js)",
    dir: "apps/web",
    devScript: "dev-web",
    remove: removeWeb,
  },
  {
    name: "Mobile (Expo/React Native)",
    dir: "apps/mobile",
    devScript: "dev-mobile",
    remove: removeMobile,
  },
  {
    name: "Extension (Chrome/WXT)",
    dir: "apps/extension",
    devScript: "dev-extension",
    remove: removeExtension,
  },
  {
    name: "Desktop (Electron)",
    dir: "apps/desktop",
    devScript: "dev-desktop",
    remove: removeDesktop,
  },
];

// ── Removal functions ────────────────────────────────────

function removeWeb() {
  rmDir("apps/web");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev-web"];
  writeJson("package.json", pkg);
}

function removeMobile() {
  rmDir("apps/mobile");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev-mobile"];
  writeJson("package.json", pkg);

  if (fileExists("pnpm-workspace.yaml")) {
    let ws = readText("pnpm-workspace.yaml");
    ws = ws.replace(/\s*"@better-auth\/expo":[^\n]*\n/g, "\n");
    writeText("pnpm-workspace.yaml", ws);
  }

  if (fileExists("packages/api/package.json")) {
    const apiPkg = readJson("packages/api/package.json");
    delete apiPkg.dependencies?.["@better-auth/expo"];
    writeJson("packages/api/package.json", apiPkg);
  }

  const authPath = "packages/api/src/auth/auth.ts";
  if (fileExists(authPath)) {
    let auth = readText(authPath);
    auth = auth.replace(/import \{ expo \} from "@better-auth\/expo";\n/, "");
    auth = auth.replace(/\s*expo\(\),\n/, "\n");
    auth = auth.replace(/\s*trustedOrigins: \["expo:\/\/"\],\n/, "\n");
    writeText(authPath, auth);
  }

  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(
      /\n# expo\n\.expo\/\ndist\/\nexpo-env\.d\.ts\napps\/mobile\/\.gitignore\n/,
      "\n",
    );
    writeText(".gitignore", gi);
  }

  if (fileExists(".vscode/extensions.json")) {
    const ext = readJson(".vscode/extensions.json");
    ext.recommendations = ext.recommendations.filter((r: string) => r !== "expo.vscode-expo-tools");
    writeJson(".vscode/extensions.json", ext);
  }
}

function removeExtension() {
  rmDir("apps/extension");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev-extension"];
  writeJson("package.json", pkg);

  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# wxt\n\.wxt\/\n/, "\n");
    writeText(".gitignore", gi);
  }
}

function removeDesktop() {
  rmDir("apps/desktop");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev-desktop"];
  if (pkg.pnpm?.onlyBuiltDependencies) {
    pkg.pnpm.onlyBuiltDependencies = pkg.pnpm.onlyBuiltDependencies.filter(
      (d: string) => d !== "electron-winstaller",
    );
  }
  writeJson("package.json", pkg);
}

// ── Dependency checks ────────────────────────────────────

async function checkDependencies(kept: App[]) {
  const keptDirs = new Set(kept.map((a) => a.dir));

  if (keptDirs.has("apps/web") || keptDirs.has("apps/mobile")) {
    const { execSync } = await import("node:child_process");
    try {
      execSync("docker --version", { stdio: "ignore" });
      console.log("  ✓ Docker found (required by Supabase)");
    } catch {
      console.log("  ⚠ Docker not found. Supabase requires Docker for local development.");
      console.log("    Install Docker: https://docs.docker.com/get-docker/");
    }
  }
}

// ── Self-cleanup ─────────────────────────────────────────

function cleanupSelf() {
  const pkg = readJson("package.json");
  delete pkg.scripts["setup"];
  writeJson("package.json", pkg);

  rmFile("scripts/setup.ts");

  const scriptsDir = path.resolve(ROOT_DIR, "scripts");
  if (fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length === 0) {
    fs.rmdirSync(scriptsDir);
  }
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log("\n  Welcome to init setup!\n");

  const available = apps.filter((app) => fileExists(app.dir));

  if (available.length === 0) {
    console.log("No apps left to configure. Cleaning up setup script...");
    cleanupSelf();
    return;
  }

  const selected = await checkbox(
    "Which apps do you want to include?",
    available.map((app) => ({ label: app.name, checked: true })),
  );

  const toKeep = available.filter((_, i) => selected[i]);
  const toRemove = available.filter((_, i) => !selected[i]);

  if (toKeep.length === 0) {
    console.log("You must keep at least one app.");
    process.exit(1);
  }

  if (toRemove.length === 0) {
    console.log("Keeping all apps. Nothing to remove.");
  } else {
    for (const app of toRemove) {
      console.log(`  Removing ${app.name}...`);
      app.remove();
    }
  }

  console.log("\nChecking dependencies...");
  await checkDependencies(toKeep);

  console.log("\nRunning pnpm install...");
  const { execSync } = await import("node:child_process");
  execSync("pnpm install", { cwd: ROOT_DIR, stdio: "inherit" });

  console.log("\nCleaning up setup script...");
  cleanupSelf();

  console.log("\nSetup complete!\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

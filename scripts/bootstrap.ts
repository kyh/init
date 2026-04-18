import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ──────────────────────────────────────────────

const fileExists = (p: string) => fs.existsSync(path.resolve(ROOT_DIR, p));
const readJson = (p: string) => JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8"));
const writeJson = (p: string, data: unknown) => {
  if (DRY_RUN) return console.log(`  [dry-run] write ${p}`);
  fs.writeFileSync(path.resolve(ROOT_DIR, p), JSON.stringify(data, null, 2) + "\n");
};
const readText = (p: string) => fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8");
const writeText = (p: string, data: string) => {
  if (DRY_RUN) return console.log(`  [dry-run] write ${p}`);
  fs.writeFileSync(path.resolve(ROOT_DIR, p), data);
};
const rmDir = (p: string) => {
  if (DRY_RUN) return console.log(`  [dry-run] rm -rf ${p}`);
  const full = path.resolve(ROOT_DIR, p);
  if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
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
    devScript: "dev:web",
    remove: removeWeb,
  },
  {
    name: "Mobile (Expo/React Native)",
    dir: "apps/mobile",
    devScript: "dev:mobile",
    remove: removeMobile,
  },
  {
    name: "Extension (Chrome/WXT)",
    dir: "apps/extension",
    devScript: "dev:extension",
    remove: removeExtension,
  },
  {
    name: "Desktop (Electron)",
    dir: "apps/desktop",
    devScript: "dev:desktop",
    remove: removeDesktop,
  },
];

// ── Removal functions ────────────────────────────────────

function removeWeb() {
  rmDir("apps/web");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev:web"];
  writeJson("package.json", pkg);
}

function removeMobile() {
  rmDir("apps/mobile");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev:mobile"];
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
  delete pkg.scripts["dev:extension"];
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
  delete pkg.scripts["dev:desktop"];
  if (pkg.pnpm?.onlyBuiltDependencies) {
    pkg.pnpm.onlyBuiltDependencies = pkg.pnpm.onlyBuiltDependencies.filter(
      (d: string) => d !== "electron-winstaller",
    );
  }
  writeJson("package.json", pkg);
}

// ── Dependency checks ────────────────────────────────────

function exec(cmd: string, opts?: { stdio?: "inherit" | "ignore" | "pipe" }): Buffer {
  if (DRY_RUN) {
    console.log(`  [dry-run] exec: ${cmd}`);
    return Buffer.from("");
  }
  return execSync(cmd, { cwd: ROOT_DIR, ...opts });
}

function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { cwd: ROOT_DIR, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkDocker() {
  if (!commandExists("docker")) {
    console.log("  ✗ Docker not found. Supabase requires Docker for local development.");
    console.log("    Install Docker: https://docs.docker.com/get-docker/");
    process.exit(1);
  }
  console.log("  ✓ Docker found");
}

// ── Supabase + env setup ─────────────────────────────────

function startSupabase(): Record<string, string> {
  console.log("\nStarting Supabase...");
  const output = exec("pnpm -F db supabase start", { stdio: "pipe" }).toString();

  const values: Record<string, string> = {};
  for (const line of output.split("\n")) {
    const match = line.match(/^\s*(.+?):\s+(.+)$/);
    if (match) {
      values[match[1].trim()] = match[2].trim();
    }
  }
  console.log("  ✓ Supabase started");
  return values;
}

function createEnv(supabaseValues: Record<string, string>) {
  const envPath = ".env";
  if (fileExists(envPath)) {
    console.log("  ✓ .env already exists, skipping");
    return;
  }

  const apiUrl = supabaseValues["API URL"] ?? "";
  const anonKey = supabaseValues["anon key"] ?? "";
  const serviceRoleKey = supabaseValues["service_role key"] ?? "";

  const env = [
    `NEXT_PUBLIC_SUPABASE_URL="${apiUrl}"`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey}"`,
    `SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"`,
    `POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"`,
    `AI_GATEWAY_API_KEY=""`,
    "",
  ].join("\n");

  writeText(envPath, env);
  console.log("  ✓ .env created with Supabase credentials");
}

function pushSchema() {
  console.log("\nPushing database schema...");
  exec("pnpm db:push", { stdio: "inherit" });
  console.log("  ✓ Schema pushed");
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log("\n  Welcome to init setup!\n");

  // ── Step 1: Select apps ──
  const available = apps.filter((app) => fileExists(app.dir));

  if (available.length === 0) {
    console.log("No apps found to configure.");
    return;
  }

  const selected = DRY_RUN
    ? available.map(() => true)
    : await checkbox(
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

    console.log("\nReinstalling dependencies...");
    exec("pnpm install", { stdio: "inherit" });
  }

  // ── Step 2: Check dependencies ──
  console.log("\nChecking dependencies...");
  checkDocker();

  // ── Step 3: Start Supabase + create .env ──
  const supabaseValues = startSupabase();
  console.log("\nConfiguring environment...");
  createEnv(supabaseValues);

  // ── Step 4: Push database schema ──
  pushSchema();

  console.log(`\n  ${GREEN}Setup complete!${RESET}\n`);
  console.log(`  Run ${CYAN}pnpm dev${RESET} to start developing.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

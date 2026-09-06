import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");
// Non-TTY runs keep all apps so agents never enter the raw-mode prompt.
const YES = process.argv.includes("--yes") || !process.stdin.isTTY;

const fileExists = (p: string) => fs.existsSync(path.resolve(ROOT_DIR, p));
const packageSchema = z
  .object({
    scripts: z.record(z.string(), z.string()).optional(),
    dependencies: z.record(z.string(), z.string()).optional(),
  })
  .catchall(z.json());
const readPackage = (p: string) => packageSchema.parse(JSON.parse(readText(p)));
const writeJson = (p: string, data: z.JSONType) => {
  writeText(p, JSON.stringify(data, null, 2) + "\n");
};
const readText = (p: string) => fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8");
const writeText = (p: string, data: string) => {
  if (DRY_RUN) return console.log(`  [dry-run] write ${p}`);
  fs.writeFileSync(path.resolve(ROOT_DIR, p), data);
};
const rmDir = (p: string) => {
  if (DRY_RUN) return console.log(`  [dry-run] rm -rf ${p}`);
  fs.rmSync(path.resolve(ROOT_DIR, p), { recursive: true, force: true });
};

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
      stdout.write(HIDE_CURSOR);
      for (const [i, item] of items.entries()) {
        stdout.write(CLEAR_LINE);
        const isActive = i === cursor;
        const checkbox = item.checked ? `${GREEN}◼${RESET}` : `${DIM}◻${RESET}`;
        const label = isActive ? `${CYAN}${BOLD}${item.label}${RESET}` : item.label;
        const pointer = isActive ? `${CYAN}❯${RESET}` : " ";
        stdout.write(`  ${pointer} ${checkbox} ${label}\n`);
      }
      stdout.write(`${DIM}  ↑/↓ navigate · space toggle · enter confirm${RESET}`);
      // Move cursor back up to top of list
      stdout.write(`\x1b[${items.length}A\r`);
    };

    stdout.write(`\n${CYAN}?${RESET} ${BOLD}${message}${RESET}\n`);

    render();

    const onKey = (key: string) => {
      // ctrl+c
      if (key === "\x03") {
        stdin.setRawMode(false);
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
        const item = items[cursor];
        if (item) item.checked = !item.checked;
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

interface App {
  name: string;
  dir: string;
  devScript: string;
  cleanup?: () => void;
}

const apps: App[] = [
  {
    name: "Web (Next.js)",
    dir: "apps/web",
    devScript: "dev:web",
  },
  {
    name: "Mobile (Expo/React Native)",
    dir: "apps/mobile",
    devScript: "dev:mobile",
    cleanup: removeMobile,
  },
  {
    name: "Extension (Chrome/WXT)",
    dir: "apps/extension",
    devScript: "dev:extension",
    cleanup: removeExtension,
  },
  {
    name: "Desktop (Electron)",
    dir: "apps/desktop",
    devScript: "dev:desktop",
    cleanup: removeDesktop,
  },
];

function removeMobile() {
  if (fileExists("pnpm-workspace.yaml")) {
    let ws = readText("pnpm-workspace.yaml");
    ws = ws.replace(/^  "@better-auth\/expo":[^\n]*\n/gm, "");
    ws = ws.replace(/^  "@expo\/dom-webview":[^\n]*\n/gm, "");
    ws = ws.replace(/^  expo:\n(?:    [^\n]*\n)+/m, "");
    ws = ws.replace(/^catalogs:\n(?:[ \t]*#[^\n]*\n|\n)*(?=\S|$)/m, "");
    writeText("pnpm-workspace.yaml", ws);
  }

  if (fileExists("packages/api/package.json")) {
    const apiPkg = readPackage("packages/api/package.json");
    delete apiPkg.dependencies?.["@better-auth/expo"];
    writeJson("packages/api/package.json", apiPkg);
  }

  const authPath = "packages/api/src/auth/auth.ts";
  if (fileExists(authPath)) {
    let auth = readText(authPath);
    auth = auth.replace(/import \{ expo \} from "@better-auth\/expo";\n/, "");
    auth = auth.replace(/\s*expo\(\),\n/, "\n");
    auth = auth.replace(/, "expo:\/\/"/, "");
    writeText(authPath, auth);
  }

  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# expo\n\.expo\/\nexpo-env\.d\.ts\napps\/mobile\/\.gitignore\n/, "\n");
    writeText(".gitignore", gi);
  }

  if (fileExists(".vscode/extensions.json")) {
    const ext = z
      .object({ recommendations: z.array(z.string()) })
      .catchall(z.json())
      .parse(JSON.parse(readText(".vscode/extensions.json")));
    ext.recommendations = ext.recommendations.filter((r) => r !== "expo.vscode-expo-tools");
    writeJson(".vscode/extensions.json", ext);
  }
}

function removeExtension() {
  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# wxt\n\.wxt\/\n/, "\n");
    writeText(".gitignore", gi);
  }
}

function removeDesktop() {
  if (fileExists("pnpm-workspace.yaml")) {
    const workspace = readText("pnpm-workspace.yaml").replace(
      /^  electron(?:-winstaller)?: true\n/gm,
      "",
    );
    writeText("pnpm-workspace.yaml", workspace);
  }
}

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

function startSupabase() {
  console.log("\nStarting Supabase...");
  const output = exec("pnpm -F db supabase start", { stdio: "pipe" }).toString();

  const values: Record<string, string> = {};
  for (const line of output.split("\n")) {
    const [, key, value] = line.match(/^\s*(.+?):\s+(.+)$/) ?? [];
    if (key && value) {
      values[key.trim()] = value.trim();
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

  // With the Data API disabled, `supabase start` doesn't print these — fall
  // back to the fixed local-dev values (identical for every local instance)
  const apiUrl = supabaseValues["API URL"] ?? "http://127.0.0.1:54321";
  const serviceRoleKey =
    supabaseValues["service_role key"] ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

  const env = [
    `NEXT_PUBLIC_SUPABASE_URL="${apiUrl}"`,
    `SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"`,
    `POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"`,
    `BETTER_AUTH_SECRET="${randomBytes(32).toString("base64")}"`,
    "",
    "# Uncomment + run 'pnpm emulate' so the GitHub button works offline (see AGENTS.md)",
    `# NEXT_PUBLIC_GITHUB_EMULATOR_URL="http://localhost:4000"`,
    `# EXPO_PUBLIC_GITHUB_EMULATOR_URL="http://localhost:4000"`,
    "",
  ].join("\n");

  writeText(envPath, env);
  console.log("  ✓ .env created with Supabase credentials");
}

// Namespace Supabase volumes per checkout folder to isolate cloned projects.
function ensureProjectId() {
  const configPath = "packages/db/supabase/config.toml";
  if (!fileExists(configPath)) return;
  const slug =
    path
      .basename(ROOT_DIR)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "init";
  const projectId = /^[a-z]/.test(slug) ? slug : `app-${slug}`;
  const config = readText(configPath);
  const current = config.match(/^project_id\s*=\s*"([^"]*)"/m)?.[1];
  if (current === projectId) return;
  writeText(
    configPath,
    config.replace(/^project_id\s*=\s*"[^"]*"/m, `project_id = "${projectId}"`),
  );
  console.log(`  ✓ Supabase project_id → "${projectId}" (isolates this project's local DB volume)`);
}

function pushSchema() {
  console.log("\nPushing database schema...");
  exec("pnpm db:push", { stdio: "inherit" });
  console.log("  ✓ Schema pushed");
}

function runSeed() {
  console.log("\nSeeding database...");
  try {
    exec("pnpm db:seed", { stdio: "inherit" });
  } catch (error) {
    console.log(
      `\n  ${DIM}✗ Seeding failed.${RESET} If the local database has a leftover or conflicting ` +
        "schema (e.g. a Supabase volume shared with another project), run 'pnpm db:reset' to " +
        "rebuild it, then re-run 'pnpm bootstrap'.",
    );
    throw error;
  }
  console.log("  ✓ Seeded dev user + sample data");
}

function checkAgentTooling() {
  console.log("\nAgent tooling...");
  if (commandExists("agent-browser")) {
    console.log("  ✓ agent-browser found");
  } else {
    console.log(
      `  ${DIM}○ agent-browser not found${RESET} (optional — drives the web app end-to-end)`,
    );
    console.log("    Install: npm i -g agent-browser && agent-browser install");
  }
  if (fileExists("emulate.config.yaml")) {
    console.log("  ✓ emulate.config.yaml present (run 'pnpm emulate' for offline GitHub OAuth)");
  }
}

async function main() {
  console.log("\n  Welcome to init setup!\n");

  const available = apps.filter((app) => fileExists(app.dir));

  if (available.length === 0) {
    console.log("No apps found to configure.");
    return;
  }

  const selected =
    DRY_RUN || YES
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
      rmDir(app.dir);
      const pkg = readPackage("package.json");
      delete pkg.scripts?.[app.devScript];
      writeJson("package.json", pkg);
      app.cleanup?.();
    }

    console.log("\nReinstalling dependencies...");
    exec("pnpm install", { stdio: "inherit" });
  }

  console.log("\nChecking dependencies...");
  checkDocker();
  ensureProjectId();

  const supabaseValues = startSupabase();
  console.log("\nConfiguring environment...");
  createEnv(supabaseValues);

  pushSchema();

  runSeed();

  checkAgentTooling();

  console.log(`\n  ${GREEN}Setup complete!${RESET}\n`);
  console.log(`  Start:  ${CYAN}pnpm dev${RESET}       (web → http://localhost:3000)`);
  console.log(`  Verify: ${CYAN}pnpm verify${RESET}    (typecheck · lint · format · test)`);
  console.log(`  Login:  ${CYAN}dev@init.local${RESET} / ${CYAN}password${RESET}  (seeded)`);
  console.log(`  Agents: read ${CYAN}AGENTS.md${RESET}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

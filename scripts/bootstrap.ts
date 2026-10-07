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
    dependencies: z.record(z.string(), z.string()).optional(),
    scripts: z.record(z.string(), z.string()).optional(),
  })
  .catchall(z.json());
const readText = (p: string) => fs.readFileSync(path.resolve(ROOT_DIR, p), "utf-8");
const writeText = (p: string, data: string) => {
  if (DRY_RUN) {
    return console.log(`  [dry-run] write ${p}`);
  }
  fs.writeFileSync(path.resolve(ROOT_DIR, p), data);
};
const readPackage = (p: string) => packageSchema.parse(JSON.parse(readText(p)));
const writeJson = (p: string, data: z.JSONType) => {
  writeText(p, `${JSON.stringify(data, null, 2)}\n`);
};
const rmDir = (p: string) => {
  if (DRY_RUN) {
    return console.log(`  [dry-run] rm -rf ${p}`);
  }
  fs.rmSync(path.resolve(ROOT_DIR, p), { force: true, recursive: true });
};

const CYAN = "\u001B[36m";
const DIM = "\u001B[2m";
const BOLD = "\u001B[1m";
const RESET = "\u001B[0m";
const GREEN = "\u001B[32m";
const CLEAR_LINE = "\u001B[2K\r";
const HIDE_CURSOR = "\u001B[?25l";
const SHOW_CURSOR = "\u001B[?25h";

interface CheckboxItem {
  label: string;
  checked: boolean;
}

const checkbox = (message: string, items: CheckboxItem[]): Promise<boolean[]> =>
  // oxlint-disable-next-line promise/avoid-new -- adapts raw stdin key events into a promise
  new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf-8");

    let cursor = 0;

    const render = () => {
      stdout.write(HIDE_CURSOR);
      for (const [i, item] of items.entries()) {
        stdout.write(CLEAR_LINE);
        const isActive = i === cursor;
        const mark = item.checked ? `${GREEN}◼${RESET}` : `${DIM}◻${RESET}`;
        const label = isActive ? `${CYAN}${BOLD}${item.label}${RESET}` : item.label;
        const pointer = isActive ? `${CYAN}❯${RESET}` : " ";
        stdout.write(`  ${pointer} ${mark} ${label}\n`);
      }
      stdout.write(`${DIM}  ↑/↓ navigate · space toggle · enter confirm${RESET}`);
      // Move cursor back up to top of list
      stdout.write(`\u001B[${items.length}A\r`);
    };

    stdout.write(`\n${CYAN}?${RESET} ${BOLD}${message}${RESET}\n`);

    render();

    const onKey = (key: string) => {
      // ctrl+c
      if (key === "\u0003") {
        stdin.setRawMode(false);
        stdout.write(SHOW_CURSOR);
        process.exit(0);
      }

      // Up arrow or k
      if (key === "\u001B[A" || key === "k") {
        cursor = (cursor - 1 + items.length) % items.length;
        render();
        return;
      }

      // Down arrow or j
      if (key === "\u001B[B" || key === "j") {
        cursor = (cursor + 1) % items.length;
        render();
        return;
      }

      // Space – toggle
      if (key === " ") {
        const item = items[cursor];
        if (item) {
          item.checked = !item.checked;
        }
        render();
        return;
      }

      // a – toggle all
      if (key === "a") {
        const allChecked = items.every((i) => i.checked);
        for (const item of items) {
          item.checked = !allChecked;
        }
        render();
        return;
      }

      // Enter – confirm
      if (key === "\r" || key === "\n") {
        stdin.removeListener("data", onKey);
        stdin.setRawMode(false);
        stdin.pause();
        // Move below rendered list and clear
        stdout.write(`\u001B[${items.length + 1}B\r\n`);
        stdout.write(SHOW_CURSOR);
        resolve(items.map((i) => i.checked));
      }
    };

    stdin.on("data", onKey);
  });

interface App {
  name: string;
  dir: string;
  devScript: string;
  cleanup?: () => void;
}

const dropRecommendations = (...ids: string[]) => {
  if (!fileExists(".vscode/extensions.json")) {
    return;
  }
  const ext = z
    .object({ recommendations: z.array(z.string()) })
    .catchall(z.json())
    .parse(JSON.parse(readText(".vscode/extensions.json")));
  ext.recommendations = ext.recommendations.filter((r) => !ids.includes(r));
  writeJson(".vscode/extensions.json", ext);
};

const removeMobile = () => {
  if (fileExists("pnpm-workspace.yaml")) {
    let ws = readText("pnpm-workspace.yaml");
    ws = ws.replaceAll(/^ {2}"@better-auth\/expo":[^\n]*\n/gmu, "");
    ws = ws.replaceAll(/^ {2}"@expo\/dom-webview":[^\n]*\n/gmu, "");
    ws = ws.replace(/^ {2}expo:\n(?:    [^\n]*\n)+/mu, "");
    ws = ws.replace(/^catalogs:\n(?:[ \t]*#[^\n]*\n|\n)*(?=\S|$)/mu, "");
    writeText("pnpm-workspace.yaml", ws);
  }

  if (fileExists("packages/service/package.json")) {
    const apiPkg = readPackage("packages/service/package.json");
    delete apiPkg.dependencies?.["@better-auth/expo"];
    writeJson("packages/service/package.json", apiPkg);
  }

  const authPath = "packages/service/src/auth/auth.ts";
  if (fileExists(authPath)) {
    let auth = readText(authPath);
    auth = auth.replace(/import \{ expo \} from "@better-auth\/expo";\n/u, "");
    auth = auth.replace(/\s*expo\(\),\n/u, "\n");
    auth = auth.replace(/, "expo:\/\/"/u, "");
    writeText(authPath, auth);
  }

  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# expo\n\.expo\/\nexpo-env\.d\.ts\napps\/mobile\/\.gitignore\n/u, "\n");
    writeText(".gitignore", gi);
  }

  dropRecommendations("expo.vscode-expo-tools");
};

const removeExtension = () => {
  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# wxt\n\.wxt\/\n/u, "\n");
    writeText(".gitignore", gi);
  }
};

const removeDesktop = () => {
  dropRecommendations("tauri-apps.tauri-vscode", "rust-lang.rust-analyzer");

  const ciPath = ".github/workflows/ci.yml";
  if (fileExists(ciPath)) {
    // the steps only the desktop app's Rust build needs, each named `Desktop …`
    const ci = readText(ciPath).replaceAll(
      /^(?: {6}# [^\n]*\n)?^ {6}- name: Desktop [^\n]*\n(?: {8}[^\n]*\n)*\n/gmu,
      "",
    );
    writeText(ciPath, ci);
  }
};

const apps: App[] = [
  {
    devScript: "dev:web",
    dir: "apps/web",
    name: "Web (Next.js)",
  },
  {
    cleanup: removeMobile,
    devScript: "dev:mobile",
    dir: "apps/mobile",
    name: "Mobile (Expo/React Native)",
  },
  {
    cleanup: removeExtension,
    devScript: "dev:extension",
    dir: "apps/extension",
    name: "Extension (Chrome/WXT)",
  },
  {
    cleanup: removeDesktop,
    devScript: "dev:desktop",
    dir: "apps/desktop",
    name: "Desktop (Tauri)",
  },
];

const exec = (cmd: string, opts?: { stdio?: "inherit" | "ignore" | "pipe" }): Buffer => {
  if (DRY_RUN) {
    console.log(`  [dry-run] exec: ${cmd}`);
    return Buffer.from("");
  }
  return execSync(cmd, { cwd: ROOT_DIR, ...opts });
};

const commandExists = (cmd: string): boolean => {
  try {
    execSync(`command -v ${cmd}`, { cwd: ROOT_DIR, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// ── Postgres + env setup ─────────────────────────────────

const createEnv = () => {
  const envPath = ".env";

  if (fileExists(envPath)) {
    console.log("  ✓ .env already exists, skipping");
    return;
  }

  const env = [
    `BETTER_AUTH_SECRET="${randomBytes(32).toString("base64")}"`,
    "",
    "# Avatar uploads need a Vercel Blob store; unset, that one route 501s",
    `BLOB_READ_WRITE_TOKEN=""`,
    "",
    "# Uncomment + run 'pnpm emulate' so the GitHub button works offline (see AGENTS.md)",
    `# NEXT_PUBLIC_GITHUB_EMULATOR_URL="http://localhost:4000"`,
    `# EXPO_PUBLIC_GITHUB_EMULATOR_URL="http://localhost:4000"`,
    "",
  ].join("\n");

  writeText(envPath, env);
  console.log("  ✓ .env created");
};

// Local Supabase gives every checkout and git branch its own database on its own
// port, so clones of this template never share data or fight over a port. The
// CLI picks the port; `pnpm db:start` has it write the URL into .env.local.
const startPostgres = () => {
  console.log("\nStarting local Supabase...");
  try {
    exec("pnpm db:start", { stdio: "inherit" });
  } catch (error) {
    console.log(
      `\n  ${DIM}✗ Local Supabase didn't start.${RESET} Its native runtime needs macOS 14+ on ` +
        "Apple silicon or Linux (glibc 2.35+); elsewhere, re-run with SUPABASE_RUNTIME=docker " +
        "and Docker running. As root, the CLI's message above says how to run Postgres as " +
        "another user.",
    );
    throw error;
  }
  console.log("  ✓ Postgres ready");
};

const pushSchema = () => {
  console.log("\nPushing database schema...");
  exec("pnpm db:push", { stdio: "inherit" });
  console.log("  ✓ Schema pushed");
};

const runSeed = () => {
  console.log("\nSeeding database...");
  try {
    exec("pnpm db:seed", { stdio: "inherit" });
  } catch (error) {
    console.log(
      `\n  ${DIM}✗ Seeding failed.${RESET} If the local database has a leftover or conflicting ` +
        "schema, run 'pnpm db:reset' to rebuild it, then re-run 'pnpm bootstrap'.",
    );
    throw error;
  }
  console.log("  ✓ Seeded dev user + sample data");
};

const checkAgentTooling = () => {
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
};

const main = async () => {
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
          available.map((app) => ({ checked: true, label: app.name })),
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

  // ── Step 3: Create .env, then start Postgres ──
  // .env first, then the database: `pnpm db:start` writes POSTGRES_URL into .env.local
  console.log("\nConfiguring environment...");
  createEnv();
  startPostgres();

  pushSchema();

  runSeed();

  checkAgentTooling();

  console.log(`\n  ${GREEN}Setup complete!${RESET}\n`);
  console.log(`  Start:  ${CYAN}pnpm dev${RESET}       (web → http://localhost:3000)`);
  console.log(`  Verify: ${CYAN}pnpm verify${RESET}    (typecheck · lint · format · test)`);
  console.log(`  Login:  ${CYAN}dev@init.local${RESET} / ${CYAN}password${RESET}  (seeded)`);
  console.log(`  Agents: read ${CYAN}AGENTS.md${RESET}\n`);
};

try {
  await main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}

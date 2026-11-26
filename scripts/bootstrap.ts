import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");
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
    console.log(`  [dry-run] write ${p}`);

    return;
  }

  fs.writeFileSync(path.resolve(ROOT_DIR, p), data);
};

const readPackage = (p: string) => packageSchema.parse(JSON.parse(readText(p)));

const writeJson = (p: string, data: z.JSONType) => {
  writeText(p, `${JSON.stringify(data, null, 2)}\n`);
};

const rmDir = (p: string) => {
  if (DRY_RUN) {
    console.log(`  [dry-run] rm -rf ${p}`);

    return;
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

const checkbox = async (message: string, items: CheckboxItem[]) =>
  // oxlint-disable-next-line promise/avoid-new -- adapts raw stdin key events into a promise
  await new Promise<boolean[]>((resolve) => {
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
      stdout.write(`\u001B[${items.length}A\r`);
    };

    stdout.write(`\n${CYAN}?${RESET} ${BOLD}${message}${RESET}\n`);

    render();

    const onKey = (key: string) => {
      if (key === "\u0003") {
        stdin.setRawMode(false);
        stdout.write(SHOW_CURSOR);
        process.exit(0);
      }

      if (key === "\u001B[A" || key === "k") {
        cursor = (cursor - 1 + items.length) % items.length;
        render();

        return;
      }

      if (key === "\u001B[B" || key === "j") {
        cursor = (cursor + 1) % items.length;
        render();

        return;
      }

      if (key === " ") {
        const item = items[cursor];

        if (item) {
          item.checked = !item.checked;
        }

        render();

        return;
      }

      if (key === "a") {
        const allChecked = items.every((i) => i.checked);

        for (const item of items) {
          item.checked = !allChecked;
        }

        render();

        return;
      }

      if (key === "\r" || key === "\n") {
        stdin.removeListener("data", onKey);
        stdin.setRawMode(false);
        stdin.pause();
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
  const workspacePath = "pnpm-workspace.yaml";

  if (fileExists(workspacePath)) {
    writeText(
      workspacePath,
      readText(workspacePath).replace(/^ {2}electron-winstaller: false\n/mu, ""),
    );
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
    name: "Desktop (Electron)",
  },
];

const exec = (cmd: string, opts?: { stdio?: "inherit" | "ignore" | "pipe" }) => {
  if (DRY_RUN) {
    console.log(`  [dry-run] exec: ${cmd}`);

    return Buffer.from("");
  }

  return execSync(cmd, { cwd: ROOT_DIR, ...opts });
};

const commandExists = (cmd: string) => {
  try {
    execSync(`command -v ${cmd}`, { cwd: ROOT_DIR, stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
};

const createEnv = () => {
  const envPath = ".env";

  if (fileExists(envPath)) {
    console.log("  ✓ .env already exists, skipping");

    return;
  }

  const secret = `BETTER_AUTH_SECRET="${randomBytes(32).toString("base64")}"`;
  const env = readText(".env.example").replace(/^BETTER_AUTH_SECRET=.*$/mu, secret);

  writeText(envPath, env);
  console.log("  ✓ .env created from .env.example, with a fresh BETTER_AUTH_SECRET");
};

const startPostgres = () => {
  console.log("\nStarting local Supabase...");

  try {
    exec("pnpm db:start", { stdio: "inherit" });
  } catch (error) {
    console.log(
      `\n  ${DIM}✗ Local Supabase didn't start.${RESET} Its native runtime needs macOS 14+ on ` +
        "Apple silicon or Linux (glibc 2.35+); other platforms aren't supported. As root, the " +
        "CLI's message above says how to run Postgres as another user.",
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

  const toKeep = available.filter((_, i) => selected[i] === true);
  const toRemove = available.filter((_, i) => selected[i] !== true);

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

  console.log("\nConfiguring environment...");
  createEnv();
  startPostgres();

  pushSchema();

  runSeed();

  checkAgentTooling();

  console.log(`\n  ${GREEN}Setup complete!${RESET}\n`);
  console.log(`  Start:  ${CYAN}pnpm dev${RESET}       (web → http://localhost:3000)`);
  console.log(`  Verify: ${CYAN}pnpm verify${RESET}    (typecheck · lint · format · test)`);
  console.log(
    `  Login:  ${CYAN}dev@init.local${RESET}, code from ${CYAN}pnpm sign-in-code${RESET}  (seeded)`,
  );
  console.log(`  Agents: read ${CYAN}AGENTS.md${RESET}\n`);
};

try {
  await main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}

import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { once } from "node:events";
import { createServer } from "node:net";
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

const removeMobile = () => {
  if (fileExists("pnpm-workspace.yaml")) {
    let ws = readText("pnpm-workspace.yaml");
    ws = ws.replaceAll(/^ {2}"@better-auth\/expo":[^\n]*\n/gmu, "");
    ws = ws.replaceAll(/^ {2}"@expo\/dom-webview":[^\n]*\n/gmu, "");
    ws = ws.replace(/^ {2}expo:\n(?:    [^\n]*\n)+/mu, "");
    ws = ws.replace(/^catalogs:\n(?:[ \t]*#[^\n]*\n|\n)*(?=\S|$)/mu, "");
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

  if (fileExists(".vscode/extensions.json")) {
    const ext = z
      .object({ recommendations: z.array(z.string()) })
      .catchall(z.json())
      .parse(JSON.parse(readText(".vscode/extensions.json")));
    ext.recommendations = ext.recommendations.filter((r) => r !== "expo.vscode-expo-tools");
    writeJson(".vscode/extensions.json", ext);
  }
};

const removeExtension = () => {
  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# wxt\n\.wxt\/\n/u, "\n");
    writeText(".gitignore", gi);
  }
};

const removeDesktop = () => {
  if (fileExists("pnpm-workspace.yaml")) {
    const workspace = readText("pnpm-workspace.yaml").replaceAll(
      /^ {2}electron(?:-winstaller)?: true\n/gmu,
      "",
    );
    writeText("pnpm-workspace.yaml", workspace);
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

const checkDocker = () => {
  if (!commandExists("docker")) {
    console.log("  ✗ Docker not found. Local Postgres runs in a Docker container.");
    console.log("    Install Docker: https://docs.docker.com/get-docker/");
    process.exit(1);
  }
  console.log("  ✓ Docker found");
};

// ── Postgres + env setup ─────────────────────────────────

// Docker Compose derives its project name from the compose file's directory,
// which is `db` for every repo cloned from this template — so they'd all share
// one volume and leak schema between each other. COMPOSE_PROJECT_NAME pins it
// to this repo's folder instead.
const composeProjectName = () => {
  const slug =
    path
      .basename(ROOT_DIR)
      .toLowerCase()
      .replaceAll(/[^a-z0-9_-]+/gu, "-")
      .replaceAll(/^-+|-+$/gu, "") || "init";
  return /^[a-z]/u.test(slug) ? slug : `app-${slug}`;
};

// COMPOSE_PROJECT_NAME keeps two clones off each other's data, but they'd
// still both try to publish Postgres on the same host port and the second one
// would fail to start. Give each project its own port so they can run at once.
const isPortFree = async (port: number) => {
  const server = createServer();
  try {
    // No host: bind every interface, matching what Docker does, so a port
    // another project already published is correctly seen as taken
    server.listen(port);
    await once(server, "listening");
  } catch {
    return false;
  }
  server.close();
  await once(server, "close");
  return true;
};

const findFreePort = async (start = 54_322, range = 50) => {
  for (let port = start; port < start + range; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`No free port for local Postgres in ${start}-${start + range - 1}`);
};

/** The port a previous run wrote, for logging. */
const envPort = () => {
  if (!fileExists(".env")) {
    return "54322";
  }
  return readText(".env").match(/^POSTGRES_PORT="?(?<port>\d+)"?/mu)?.groups?.port ?? "54322";
};

const createEnv = async () => {
  const envPath = ".env";

  if (fileExists(envPath)) {
    console.log("  ✓ .env already exists, skipping");
    return;
  }

  const projectName = composeProjectName();
  const port = await findFreePort();

  const env = [
    `POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:${port}/postgres"`,
    `POSTGRES_PORT="${port}"`,
    `COMPOSE_PROJECT_NAME="${projectName}"`,
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
  console.log(`  ✓ .env created (Compose project "${projectName}", Postgres on ${port})`);
};

/** Points .env at a different host port, both the bare port and the URL's. */
const repointEnvPort = (port: number) => {
  const env = readText(".env")
    .replace(/^POSTGRES_PORT="?\d+"?/mu, `POSTGRES_PORT="${port}"`)
    .replace(/^(?<head>POSTGRES_URL="[^"]*:)\d+(?<tail>\/[^"]*")/mu, `$<head>${port}$<tail>`);
  writeText(".env", env);
};

const startPostgres = async () => {
  console.log("\nStarting Postgres...");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      // `--wait` blocks on the container's healthcheck, so the schema push
      // below never races the database's first boot
      exec("pnpm db:start", { stdio: "inherit" });
      console.log(`  ✓ Postgres ready on port ${envPort()}`);
      return;
    } catch (error) {
      // Picking a free port and publishing it aren't atomic, so another
      // project can claim it in between — and a port chosen by an earlier
      // bootstrap may have been taken since. Re-probe the port rather than
      // parsing Docker's error text: if it really is free, the failure was
      // something else and belongs to the caller.
      const port = Number(envPort());
      if (await isPortFree(port)) {
        throw error;
      }

      const next = await findFreePort(port + 1);
      console.log(`  ○ port ${port} is taken; moving this project to ${next}`);
      repointEnvPort(next);
    }
  }

  throw new Error("Could not start Postgres: every candidate host port was taken");
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
        "schema (e.g. a Docker volume shared with another project), run 'pnpm db:reset' to " +
        "rebuild it, then re-run 'pnpm bootstrap'.",
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

  console.log("\nChecking dependencies...");
  checkDocker();

  // ── Step 3: Create .env, then start Postgres ──
  // .env first: the local connection string is a constant, and `pnpm db:start`
  // reads COMPOSE_PROJECT_NAME from it
  console.log("\nConfiguring environment...");
  await createEnv();
  await startPostgres();

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

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

// ── Helpers ──────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

const confirm = async (question: string, defaultYes = true): Promise<boolean> => {
  const hint = defaultYes ? "Y/n" : "y/N";
  const answer = (await ask(`  ${question} (${hint}): `)).trim().toLowerCase();
  if (answer === "") return defaultYes;
  return answer === "y" || answer === "yes";
};

const fileExists = (p: string) => fs.existsSync(path.resolve(ROOT_DIR, p));
const readJson = (p: string) => JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8"));
const writeJson = (p: string, data: unknown) =>
  fs.writeFileSync(path.resolve(ROOT_DIR, p), JSON.stringify(data, null, 2) + "\n");
const readText = (p: string) => fs.readFileSync(path.resolve(ROOT_DIR, p), "utf8");
const writeText = (p: string, data: string) =>
  fs.writeFileSync(path.resolve(ROOT_DIR, p), data);
const rmDir = (p: string) => {
  const full = path.resolve(ROOT_DIR, p);
  if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
};
const rmFile = (p: string) => {
  const full = path.resolve(ROOT_DIR, p);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

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

  // root package.json
  const pkg = readJson("package.json");
  delete pkg.scripts["dev-mobile"];
  writeJson("package.json", pkg);

  // pnpm-workspace.yaml – remove @better-auth/expo catalog entry
  if (fileExists("pnpm-workspace.yaml")) {
    let ws = readText("pnpm-workspace.yaml");
    ws = ws.replace(/\s*"@better-auth\/expo":[^\n]*\n/g, "\n");
    writeText("pnpm-workspace.yaml", ws);
  }

  // packages/api/package.json – remove @better-auth/expo dep
  if (fileExists("packages/api/package.json")) {
    const apiPkg = readJson("packages/api/package.json");
    delete apiPkg.dependencies?.["@better-auth/expo"];
    writeJson("packages/api/package.json", apiPkg);
  }

  // packages/api/src/auth/auth.ts – remove expo imports/config
  const authPath = "packages/api/src/auth/auth.ts";
  if (fileExists(authPath)) {
    let auth = readText(authPath);
    auth = auth.replace(/import \{ expo \} from "@better-auth\/expo";\n/, "");
    auth = auth.replace(/\s*expo\(\),\n/, "\n");
    auth = auth.replace(/\s*trustedOrigins: \["expo:\/\/"\],\n/, "\n");
    writeText(authPath, auth);
  }

  // .gitignore – remove expo section
  if (fileExists(".gitignore")) {
    let gi = readText(".gitignore");
    gi = gi.replace(/\n# expo\n\.expo\/\ndist\/\nexpo-env\.d\.ts\napps\/mobile\/\.gitignore\n/, "\n");
    writeText(".gitignore", gi);
  }

  // .vscode/extensions.json – remove expo extension
  if (fileExists(".vscode/extensions.json")) {
    const ext = readJson(".vscode/extensions.json");
    ext.recommendations = ext.recommendations.filter(
      (r: string) => r !== "expo.vscode-expo-tools",
    );
    writeJson(".vscode/extensions.json", ext);
  }
}

function removeExtension() {
  rmDir("apps/extension");

  const pkg = readJson("package.json");
  delete pkg.scripts["dev-extension"];
  writeJson("package.json", pkg);

  // .gitignore – remove wxt section
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
  const keptNames = kept.map((a) => a.dir);
  const needsDocker = keptNames.some((d) => d === "apps/web" || d === "apps/mobile");

  if (needsDocker) {
    const { execSync } = await import("node:child_process");
    try {
      execSync("docker --version", { stdio: "ignore" });
      console.log("  ✓ Docker found (required by Supabase)");
    } catch {
      console.log(
        "  ⚠ Docker not found. Supabase requires Docker for local development.",
      );
      console.log("    Install Docker: https://docs.docker.com/get-docker/");
    }
  }
}

// ── Self-cleanup ─────────────────────────────────────────

function cleanupSelf() {
  // Remove setup script from package.json
  const pkg = readJson("package.json");
  delete pkg.scripts["setup"];
  writeJson("package.json", pkg);

  // Remove this script file
  rmFile("scripts/setup.ts");

  // Remove scripts dir if empty
  const scriptsDir = path.resolve(ROOT_DIR, "scripts");
  if (fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length === 0) {
    fs.rmdirSync(scriptsDir);
  }
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("Welcome to init setup!");
  console.log("Select which apps to include in your project.");
  console.log("");

  // Only show apps that still exist (idempotent)
  const available = apps.filter((app) => fileExists(app.dir));

  if (available.length === 0) {
    console.log("No apps left to configure. Cleaning up setup script...");
    cleanupSelf();
    rl.close();
    return;
  }

  const toKeep: App[] = [];
  const toRemove: App[] = [];

  for (const app of available) {
    if (await confirm(`Include ${app.name}?`)) {
      toKeep.push(app);
    } else {
      toRemove.push(app);
    }
  }

  if (toKeep.length === 0) {
    console.log("\nYou must keep at least one app.");
    rl.close();
    process.exit(1);
  }

  if (toRemove.length === 0) {
    console.log("\nKeeping all apps. Nothing to remove.");
  } else {
    console.log("\nApps to remove:");
    for (const app of toRemove) {
      console.log(`  - ${app.name}`);
    }
    console.log("");

    if (!(await confirm("Proceed?", true))) {
      console.log("Setup cancelled.");
      rl.close();
      return;
    }

    console.log("");

    for (const app of toRemove) {
      console.log(`Removing ${app.name}...`);
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

  console.log("\nSetup complete!");
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});

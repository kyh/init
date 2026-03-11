import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PackageJson = {
  version: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const distDir = path.join(appDir, "dist");
const outDir = path.join(appDir, "out");
const packageJsonPath = path.join(appDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
const version = packageJson.version;
const appBundlePath = path.join(distDir, "mac-arm64", "Init.app");
const zipPath = path.join(distDir, `Init-${version}-arm64-mac.zip`);

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: appDir,
    stdio: "inherit",
  });
}

function cleanOutputs(): void {
  rmSync(outDir, { force: true, recursive: true });
  rmSync(distDir, { force: true, recursive: true });
}

cleanOutputs();

run("pnpm", ["build"]);
run("electron-builder", ["--mac", "dir"]);

if (!existsSync(appBundlePath)) {
  throw new Error(`Expected app bundle at ${appBundlePath}`);
}

run("codesign", ["--force", "--deep", "--sign", "-", appBundlePath]);
run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appBundlePath]);

if (existsSync(zipPath)) {
  rmSync(zipPath, { force: true });
}

run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appBundlePath, zipPath]);

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const outputDir = path.join(appDir, ".output");
const appBuildDir = path.join(outputDir, "app");
const binaryOutputDir = path.join(outputDir, "bin");
const packageJsonPath = path.join(appDir, "package.json");
const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"));
if (
  typeof packageJson !== "object" ||
  packageJson === null ||
  !("version" in packageJson) ||
  typeof packageJson.version !== "string"
) {
  throw new Error(`Expected a string "version" in ${packageJsonPath}`);
}
const version = packageJson.version;
const appBundlePath = path.join(binaryOutputDir, "mac-arm64", "Init.app");
const zipPath = path.join(binaryOutputDir, `Init-${version}-arm64-mac.zip`);

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: appDir,
    stdio: "inherit",
  });
}

function cleanOutputs(): void {
  rmSync(outputDir, { force: true, recursive: true });
}

cleanOutputs();

run("pnpm", ["build"]);
run("electron-builder", ["--mac", "dir"]);

if (!existsSync(appBundlePath)) {
  throw new Error(`Expected app bundle at ${appBundlePath}`);
}

if (!existsSync(appBuildDir)) {
  throw new Error(`Expected app build output at ${appBuildDir}`);
}

run("codesign", ["--force", "--deep", "--sign", "-", appBundlePath]);
run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appBundlePath]);

if (existsSync(zipPath)) {
  rmSync(zipPath, { force: true });
}

run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appBundlePath, zipPath]);

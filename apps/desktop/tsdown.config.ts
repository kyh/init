import { defineConfig } from "tsdown";

const shared = {
  format: "cjs" as const,
  outDir: "dist",
  sourcemap: true,
  outExtensions: () => ({ js: ".js" }),
};

export default defineConfig([
  {
    ...shared,
    entry: ["src/main.ts"],
    clean: true,
  },
  {
    ...shared,
    entry: ["src/preload.ts"],
  },
]);

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
    entry: ["src/main.ts", "src/preload.ts"],
    clean: true,
  },
]);

import path from "node:path";
import { defineConfig } from "electron-vite";

const packagedWebAppUrl = process.env["WEBAPP_URL"] ?? "https://init.kyh.io/";

export default defineConfig({
  main: {
    build: {
      externalizeDeps: false,
      outDir: ".output/app/main",
      rolldownOptions: {
        input: { index: path.resolve(import.meta.dirname, "src/main/index.ts") },
      },
    },
    define: {
      __PACKAGED_WEBAPP_URL__: JSON.stringify(packagedWebAppUrl),
    },
  },
  preload: {
    build: {
      externalizeDeps: false,
      outDir: ".output/app/preload",
      rolldownOptions: {
        input: { index: path.resolve(import.meta.dirname, "src/preload/index.ts") },
        output: { entryFileNames: "[name].cjs", format: "cjs" },
      },
    },
  },
});

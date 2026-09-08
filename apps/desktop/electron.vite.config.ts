import path from "node:path";
import { defineConfig } from "electron-vite";

const packagedWebAppUrl = process.env["WEBAPP_URL"] ?? "https://init.kyh.io/";

export default defineConfig({
  main: {
    build: {
      outDir: ".output/app/main",
      rollupOptions: {
        input: {
          index: path.resolve(import.meta.dirname, "src/main/index.ts"),
        },
      },
    },
    define: {
      __PACKAGED_WEBAPP_URL__: JSON.stringify(packagedWebAppUrl),
    },
  },
  preload: {
    build: {
      // Sandboxed preloads require CommonJS with third-party dependencies bundled.
      externalizeDeps: false,
      outDir: ".output/app/preload",
      rollupOptions: {
        input: {
          index: path.resolve(import.meta.dirname, "src/preload/index.ts"),
        },
        output: { entryFileNames: "[name].cjs", format: "cjs" },
      },
    },
  },
  renderer: {
    build: {
      outDir: ".output/app/renderer",
      rollupOptions: {
        input: {
          index: path.resolve(import.meta.dirname, "src/renderer/index.html"),
        },
      },
    },
  },
});

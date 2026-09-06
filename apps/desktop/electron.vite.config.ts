import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

const packagedWebAppUrl = process.env["WEBAPP_URL"] ?? "https://init.kyh.io/";

export default defineConfig({
  main: {
    define: {
      __PACKAGED_WEBAPP_URL__: JSON.stringify(packagedWebAppUrl),
    },
    build: {
      outDir: ".output/app/main",
      rollupOptions: {
        input: {
          index: resolve(import.meta.dirname, "src/main/index.ts"),
        },
      },
    },
  },
  preload: {
    build: {
      outDir: ".output/app/preload",
      // Sandboxed preloads require CommonJS with third-party dependencies bundled.
      externalizeDeps: false,
      rollupOptions: {
        output: { format: "cjs", entryFileNames: "[name].cjs" },
        input: {
          index: resolve(import.meta.dirname, "src/preload/index.ts"),
        },
      },
    },
  },
  renderer: {
    build: {
      outDir: ".output/app/renderer",
      rollupOptions: {
        input: {
          index: resolve(import.meta.dirname, "src/renderer/index.html"),
        },
      },
    },
  },
});

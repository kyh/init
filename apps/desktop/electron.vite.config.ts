import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagedWebAppUrl = process.env["WEBAPP_URL"] ?? "https://init.kyh.io/";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __PACKAGED_WEBAPP_URL__: JSON.stringify(packagedWebAppUrl),
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
  },
});

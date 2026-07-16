import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  srcDir: "src",
  dev: {
    server: {
      port: 3001,
    },
  },
  manifest: {
    name: "Init - AI Starter Kit",
    version: "0.1.0",
    description:
      "Chrome extension for Init - your AI-native starter kit for building, launching, and scaling applications.",
    permissions: ["storage"],
    // Host permissions also exempt these sites from third-party cookie
    // blocking inside the popup iframe — keep in sync with where the app is
    // deployed. Forks add their own deploy origin here (Chrome match patterns
    // can't scope to one project's Vercel preview subdomains, and a wildcard
    // costs broad install warnings + CWS review friction — use
    // optional_host_permissions for previews if you need them).
    host_permissions: ["http://localhost:3000/*", "https://init.kyh.io/*"],
  },
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
});

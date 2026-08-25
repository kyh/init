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
    // `storage` alone: the popup opens the app in a tab rather than embedding
    // or scripting it, and `tabs.create` needs no permission. Adding
    // host_permissions costs a broad install warning and CWS review friction,
    // so add them only when something here actually reads a page.
    permissions: ["storage"],
  },
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
});

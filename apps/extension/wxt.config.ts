import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  dev: {
    server: {
      port: 3001,
    },
  },
  manifest: {
    description:
      "Chrome extension for Init - your AI-native starter kit for building, launching, and scaling applications.",
    name: "Init - AI Starter Kit",
    // Opening a tab needs no host or tabs permission.
    permissions: ["storage"],
    version: "0.1.0",
  },
  srcDir: "src",
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
});

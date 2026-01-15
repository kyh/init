import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "Init - AI Starter Kit",
    version: "0.1.0",
    description:
      "Chrome extension for Init - your AI-native starter kit for building, launching, and scaling applications.",
    permissions: ["storage"],
    host_permissions: [
      "http://localhost:3000/*",
      "http://localhost:5173/*",
      "https://*.vercel.app/*",
    ],
  },
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
});

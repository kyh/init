import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Init - AI Starter Kit",
  version: "0.1.0",
  description:
    "Chrome extension for Init - your AI-native starter kit for building, launching, and scaling applications.",
  icons: {
    "16": "public/icon-16.png",
    "32": "public/icon-32.png",
    "48": "public/icon-48.png",
    "128": "public/icon-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "public/icon-16.png",
      "32": "public/icon-32.png",
      "48": "public/icon-48.png",
      "128": "public/icon-128.png",
    },
  },
  options_page: "src/options/index.html",
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  permissions: ["storage"],
  host_permissions: ["http://localhost:3000/*", "https://*.vercel.app/*"],
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'self'; frame-src http://localhost:3000 https://*.vercel.app",
  },
});

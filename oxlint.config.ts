import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import landmines from "ultracite/oxlint/landmines";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, antiSlop, landmines],
  jsPlugins: landmines.jsPlugins,
  ignorePatterns: [...core.ignorePatterns, ".wxt", ".source", ".claude", ".codex", ".agents"],
  overrides: [{ files: ["apps/web/**"], plugins: next.plugins, rules: next.rules }],
});

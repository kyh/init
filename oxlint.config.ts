import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, antiSlop],
  ignorePatterns: [...core.ignorePatterns, ".wxt", ".source", ".claude", ".codex", ".agents"],
  overrides: [{ files: ["apps/web/**"], plugins: next.plugins, rules: next.rules }],
  rules: {
    // Sequential awaits in loops are deliberate here (ordered seeds and migrations).
    "no-await-in-loop": "off",
  },
});

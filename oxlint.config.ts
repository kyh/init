import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import landmines from "ultracite/oxlint/landmines";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react, antiSlop, landmines],
  jsPlugins: landmines.jsPlugins,
  options: { typeAware: true },
  ignorePatterns: [...core.ignorePatterns, ".wxt", ".source", ".claude", ".codex", ".agents"],
  overrides: [
    { files: ["apps/web/**"], plugins: next.plugins, rules: next.rules },
    {
      files: ["apps/mobile/metro.config.cjs"],
      rules: {
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
      },
    },
  ],
  rules: {
    "eslint/require-await": "off",
    "typescript/require-await": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-floating-promises": [
      "error",
      {
        allowForKnownSafeCalls: [
          { from: "package", package: "node:test", name: ["describe", "it", "suite", "test"] },
        ],
      },
    ],
  },
});

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
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    ".wxt",
    ".source",
    ".claude",
    ".codex",
    ".agents",
  ],
  overrides: [
    { files: ["apps/web/**"], plugins: next.plugins, rules: next.rules },
    {
      files: ["**/*.cjs", "**/*.mjs", "**/*.js"],
      rules: {
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
      },
    },
  ],
  rules: {
    "anti-slop/require-safety-comment-for-type-assertion": "off",
    "no-await-in-loop": "off",
    "typescript/consistent-return": "off",
    "typescript/no-confusing-void-expression": "off",
    "typescript/no-floating-promises": [
      "error",
      {
        allowForKnownSafeCalls: [
          { from: "package", package: "node:test", name: ["describe", "it", "suite", "test"] },
        ],
      },
    ],
    "typescript/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    "typescript/prefer-nullish-coalescing": ["error", { ignorePrimitives: { boolean: true } }],
    "typescript/promise-function-async": "off",
    "typescript/strict-boolean-expressions": "off",
    "typescript/strict-void-return": "off",
    "typescript/switch-exhaustiveness-check": [
      "error",
      { considerDefaultExhaustiveForUnions: true },
    ],
  },
});

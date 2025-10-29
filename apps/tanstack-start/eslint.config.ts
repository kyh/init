import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@kyh/eslint-config/base";
import { reactConfig } from "@kyh/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);

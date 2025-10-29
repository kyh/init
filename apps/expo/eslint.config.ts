import { baseConfig } from "@kyh/eslint-config/base";
import { reactConfig } from "@kyh/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);

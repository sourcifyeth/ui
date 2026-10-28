// ESLint flat config, based on the official Vite "react-ts" template.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["build"]),
  {
    files: ["src/**/*.{ts,tsx,js}", "vite.config.mts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    // These rules flag code that works today. Fixing it needs refactoring, so they only warn for now.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-refresh/only-export-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

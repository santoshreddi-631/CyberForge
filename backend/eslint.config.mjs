// @ts-check
import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
export default [
  eslint.configs.recommended,

  // ── Source files: full type-aware linting ────────────────────────────────
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        // v8 flat-config style: use projectService instead of project+tsconfigRootDir
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        process: "readonly",
        setTimeout: "readonly",
        Promise: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },

  // ── Test files: syntax-only linting (no type project needed) ─────────────
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        // No 'project' — avoids tsconfig lookup issues for test files
      },
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
      "no-undef": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  { files: ["src/db/**/*.js", "tests/**/*.js"], languageOptions: { globals: {require:"readonly",module:"readonly",process:"readonly",Buffer:"readonly",__dirname:"readonly"} } },
  {
    ignores: ["dist/**", "dist-test/**", "node_modules/**", "*.mjs", "*.cjs"],
  },
];

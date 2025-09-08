import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { includeIgnoreFile } from "@eslint/compat";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  includeIgnoreFile(join(__dirname, ".gitignore")),
  {
    ignores: [
      "src/types/supabase.gen.ts",
      "eslint.config.mjs"
    ],
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "@typescript-eslint": ts,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      semi: ["error", "never"],
      "simple-import-sort/imports": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [".*"],
        },
      ],
      indent: ["error", 2],
      quotes: ["error", "single"],
      "no-console": "error",
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "comma-spacing": ["error", { before: false, after: true }],
    },
  },
];

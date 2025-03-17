import { defineConfig } from 'eslint-define-config';
import eslint from 'typescript-eslint';
import js from "@eslint/js";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["dist", "node_modules"]
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Make sure there are no extra spaces around the key name
        "AudioWorkletGlobalScope": 'readonly',
        ...globals.browser
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-explicit-any": "off",
      "prefer-const": "warn"
    }
  }
]);

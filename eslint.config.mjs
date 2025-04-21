import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // Configuration React
  pluginReact.configs.flat.recommended,
  // Paramètres supplémentaires pour React
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    // Règles personnalisées pour désactiver certaines erreurs
    rules: {
      "react/react-in-jsx-scope": "off", // Désactive l'erreur d'import React
      "react/no-unescaped-entities": "off", // Désactive l'erreur d'entités HTML
      "@typescript-eslint/no-require-imports": "off", // Désactive l'erreur de require()
    },
  },
  // Configuration pour les fichiers de test
  {
    files: ["**/*.test.js", "**/*.test.ts", "**/*-test.js", "**/__tests__/**"],
    languageOptions: {
      globals: {
        ...globals.jest,
        it: "readonly",
        expect: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
];

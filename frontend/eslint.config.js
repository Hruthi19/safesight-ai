// eslint.config.js
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import jestPlugin from "eslint-plugin-jest";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules","dist", "build"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // window: "readonly",
        // document: "readonly",
        // test: "readonly",
        // expect: "readonly",
        // browser: true,
        // node: true
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      jest: jestPlugin,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "warn",
      "jest/expect-expect": "warn",
      "no-undef": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];

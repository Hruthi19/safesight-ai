// eslint.config.js
import js from "@eslint/js";
import react from "eslint-plugin-react";
import jest from "eslint-plugin-jest";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      requireConfigFile: false,
      globals: {
        window: "readonly",
        document: "readonly",
        test: "readonly",
        expect: "readonly",
      },
    },
    plugins: {
      react,
      jest,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "warn",
      "jest/expect-expect": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];

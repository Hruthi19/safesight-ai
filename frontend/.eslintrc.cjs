module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true, 
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jest/recommended", 
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    requireConfigFile: false,
  },
  plugins: ["react", "jest"],
  settings: {
    react: {
      version: "detect", 
    },
  },
  rules: {
    "react/react-in-jsx-scope": "off", 
    "no-unused-vars": "warn",
    "jest/expect-expect": "warn",
  },
};

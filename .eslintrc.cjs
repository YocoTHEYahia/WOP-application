module.exports = {
  root: true,
  env: {
    es2022: true,
    "react-native/react-native": true,
  },
  extends: ["plugin:react-native/all", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "react-native", "@typescript-eslint", "prettier"],
  rules: {
    "react-native/no-unused-styles": "error",
    "react-native/split-platform-components": "error",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-raw-text": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "prettier/prettier": "error",
  },
  settings: {
    react: {
      version: "18.2.0",
    },
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    ".expo/",
    "dist-domain/",
    "*.config.js",
    "*.config.ts",
  ],
};

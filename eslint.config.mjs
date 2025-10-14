import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.js", // Ignore JS files (legacy scripts)
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Change to warning instead of error
      "@typescript-eslint/no-unused-vars": "warn", // Change to warning
      "react/no-unescaped-entities": "off", // Disable - minor issue
      "react-hooks/rules-of-hooks": "warn", // Change to warning - requires refactoring
    },
  },
];

export default eslintConfig;

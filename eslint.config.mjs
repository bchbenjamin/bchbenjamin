import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"])
]);

export default eslintConfig;

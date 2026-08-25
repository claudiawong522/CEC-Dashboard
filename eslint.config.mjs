import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch files the Supabase CLI writes when the local stack starts. Not
    // ours, not committed (supabase/.gitignore covers them), and 205 lint
    // problems deep, which drowns out anything real in `npm run lint`.
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;

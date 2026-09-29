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
    // The local Supabase stack writes a bundled, minified edge runtime here
    // while it is running. It is gitignored but eslint still walked it, so
    // `npm run lint` reported 183 errors about single-letter variables in
    // somebody else's build output and buried the one real error in ours.
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;

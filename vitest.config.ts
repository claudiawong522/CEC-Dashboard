import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests import modules that use the app's "@/..." paths, which Vitest
// doesn't pick up from tsconfig on its own — mirror the one alias here so a
// test can cover any module rather than only the import-free ones.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});

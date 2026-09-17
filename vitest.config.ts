import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Standalone test config: it deliberately does NOT import `vite.config.ts`,
 * because that file pulls in the whole React/Tailwind plugin chain (and the
 * content layer) at load time. The only thing tests need from it is the `@`
 * alias, mirrored here and in `tsconfig.json`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    // Node by default; files that need a DOM opt in per-file with
    // `// @vitest-environment jsdom` on the first line.
    environment: "node",
    include: [
      "client/src/**/*.test.ts",
      "api/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    clearMocks: true,
    restoreMocks: true,
  },
});

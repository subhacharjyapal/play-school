import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./tests/globalSetup.ts",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 90000,
    // Each test file gets a fresh module graph (fresh prisma client + limiter
    // state). Files run sequentially because they share one test database.
    isolate: true,
    fileParallelism: false,
  },
});

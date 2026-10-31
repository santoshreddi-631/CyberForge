import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['tests/setup.js'],
    environment: "node",
    include: ["tests/**/*.test.{ts,js}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts"],
    },
    // Prevent port conflicts in parallel test runs
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});


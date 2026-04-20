import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
    alias: {
      // server-only is a Next.js stub that throws in non-server environments.
      // Replace it with an empty module so server-only files can be tested.
      "server-only": "/dev/null",
    },
  },
});

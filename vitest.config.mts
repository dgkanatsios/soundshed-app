import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/spork/src/devices/spark/__tests__/setup.ts"],
    reporters: "default",
    coverage: {
      provider: "v8",
      include: ["src/spork/src/devices/spark/**/*.ts"],
      exclude: ["src/spork/src/devices/spark/sparkFxCatalog.ts"],
    },
  },
});

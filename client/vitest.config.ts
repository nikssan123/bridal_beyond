import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/types.ts",
        "**/*.config.{ts,js,mjs}",
        "**/vite-env.d.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/i18n.ts",
        "**/dist/**",
        "**/build/**",
        "src/pages/**",
        "src/components/**",
        "src/features/admin/**",
        "src/features/listings/**",
        "src/features/orders/**",
        "src/features/payments/**",
        "src/features/stripe/**",
        "src/features/sellers/**",
        "src/features/conversations/**",
        "src/data/**",
        "src/hooks/**",
        "src/layouts/**",
        "src/theme/**",
        "src/api/**",
        "src/app/**",
        "src/lib/apiBase.ts",
        "src/lib/socket.ts",
        "src/lib/metaPixel.ts",
        "src/lib/stripeErrors.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

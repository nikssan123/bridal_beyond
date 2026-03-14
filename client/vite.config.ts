import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import istanbul from "vite-plugin-istanbul";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const useIstanbul =
    process.env.VITE_COVERAGE === "true" || process.env.VITE_COVERAGE === "1";
  return {
    server: {
      host: "::",
      port: 3000,
      allowedHosts: true,
      hmr: {
        overlay: false,
      },
    },
    preview: {
      allowedHosts: ["lovereworn.com"],
    },
    build: {
      sourcemap: true,
    },
    plugins: [
      react(),
      ...(useIstanbul
        ? [
            istanbul({
              include: "src/**",
              exclude: ["node_modules", "e2e", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
              extension: [".js", ".ts", ".tsx", ".jsx"],
              requireEnv: true,
              checkProd: true,
            }),
          ]
        : []),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

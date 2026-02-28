/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  preview: {
    port: parseInt(process.env.PORT || "4173"),
    host: "0.0.0.0",
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test-utils/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

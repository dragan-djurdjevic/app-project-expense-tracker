// Spec: AR-006, AR-009, AR-011
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  build: { target: "es2022" },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});

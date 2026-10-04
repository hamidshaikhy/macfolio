import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"], port: 4173, watch: { usePolling: true, interval: 300, ignored: ["**/artifacts/**", "**/public/assets/audio/**", "**/test-results/**", "**/playwright-report/**"] } },
  preview: { port: 4173 },
  build: { target: "es2022" },
});

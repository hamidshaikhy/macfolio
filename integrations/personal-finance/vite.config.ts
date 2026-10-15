import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({base:'/apps/personal-finance/',
  plugins: [react()],
  build: { target: ["es2022", "safari15"] },
});

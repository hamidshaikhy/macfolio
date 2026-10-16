import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      {
        name: "local-neshan-gateway",
        configureServer(server) {
          server.middlewares.use("/api/neshan", async (req, res) => {
            try {
              const { default: handler } = await import("./api/neshan.mjs");
              process.env.NESHAN_API_KEY =
                env.NESHAN_API_KEY || process.env.NESHAN_API_KEY;
              await handler(req, res);
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Gateway error" }));
            }
          });
        },
      },
    ],
    base: "/apps/koja-berim/",
    build: { target: "es2020", chunkSizeWarningLimit: 1200 },
  };
});

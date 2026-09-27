import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodeApiHandler } from "./server/runtime.js";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "abhilekh-research-api",
      configureServer(server) {
        server.middlewares.use(nodeApiHandler);
      },
      configurePreviewServer(server) {
        server.middlewares.use(nodeApiHandler);
      },
    },
  ],
  server: { port: 5173, strictPort: true, headers: { "Permissions-Policy": "camera=(), microphone=(self)" } },
});

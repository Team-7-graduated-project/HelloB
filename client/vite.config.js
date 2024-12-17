import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Create a configuration function that takes environment variables
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, ".");

  return {
    plugins: [react()],
   
    server: {
      proxy: {
        "/ws": {
          target: "ws://localhost:3000",
          ws: true,
        },
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
    define: {
      __GOOGLE_CLIENT_ID__: JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
    },
  };
});

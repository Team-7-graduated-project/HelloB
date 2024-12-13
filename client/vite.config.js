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
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log(
                "Sending Request to the Target:",
                req.method,
                req.url
              );
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log(
                "Received Response from the Target:",
                proxyRes.statusCode,
                req.url
              );
            });
          },
        },
      },
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    },
    define: {
      __GOOGLE_CLIENT_ID__: JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ""),
    },
  };
});

import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  appType: "spa",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@starkware-libs/starknet-privacy-sdk")) return "privacy-sdk";
          if (id.includes("@starknet-io/get-starknet")) return "wallet-ui";
          if (id.includes("/starknet/")) return "starknet-sdk";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});

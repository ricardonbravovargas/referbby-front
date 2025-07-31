import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
   alias: {
      '@': '/src',
    },
  },
  server: {
    historyApiFallback: true, // Importante para SPA con hash
  },
  optimizeDeps: {
    include: ['source-map-js'], // Ensure Vite includes source-map-js
  },
  build: {
    sourcemap: true, // Enable source maps for debugging
    chunkSizeWarningLimit: 2000,
  },
});

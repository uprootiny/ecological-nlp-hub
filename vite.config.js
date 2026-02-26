import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ecological-nlp-hub/",
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      "/api": "http://localhost:49152",
    },
  },
});

/**
 * Build config for the standalone UI preview.
 *
 * Produces a single self-contained HTML file (CSS + JS inlined) that renders
 * the real interface against demo data, so the redesign can be reviewed by
 * opening one file — no server, no login, no MetaTrader export.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/preview"),
    emptyOutDir: true,
    // Inline every asset so the output is one portable file.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "preview.html"),
      output: { inlineDynamicImports: true },
    },
  },
});

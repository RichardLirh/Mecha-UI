import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "dist/lib",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/lib/index.ts"),
      name: "MechaUI",
      fileName: (format) => `mecha-ui.${format}.js`
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue"
        }
      }
    }
  }
});

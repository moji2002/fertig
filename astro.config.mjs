import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://moji2002.github.io",
  base: "/fertig",
  outDir: "./dist",
  publicDir: "./.astro-public",
  build: {
    format: "file",
  },
});

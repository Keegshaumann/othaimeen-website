// @ts-check
import { defineConfig } from "astro/config";

// Static build. Every page is plain HTML in dist/; the only server code is the small PHP
// contact-form handler in server/api, copied into dist/api by scripts/postbuild.mjs.
export default defineConfig({
  site: "https://othaimeengrp.com",
  trailingSlash: "always",
  build: { format: "directory" },
  compressHTML: true,
  devToolbar: { enabled: false },
});

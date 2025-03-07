// vite.config.js
export default {
  root: "./",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
  server: {
    host: true,
    open: true,
  },
};

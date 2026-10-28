import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "build" }, // the deploy workflow and Netlify upload this directory
  server: { port: 3000 }, // same port as Create React App, so bookmarks keep working
});

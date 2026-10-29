import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Adds the Umami analytics script only when VITE_UMAMI_WEBSITE_ID is set (the GCS builds of staging and
// production). The dev server and Netlify previews then load no third-party script. A %VITE_…% placeholder
// in index.html would not work here: Vite leaves it in the page as it is when the variable is not set.
function umami(websiteId: string | undefined): Plugin {
  return {
    name: "umami",
    transformIndexHtml() {
      if (!websiteId) return [];
      return [
        {
          tag: "script",
          attrs: { defer: true, src: "https://cloud.umami.is/script.js", "data-website-id": websiteId },
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv also reads VITE_ variables from the process environment, for example the ones from netlify.toml.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), umami(env.VITE_UMAMI_WEBSITE_ID)],
    build: {
      outDir: "build", // the deploy workflow and Netlify upload this directory
      // The oldest browsers that the Create React App build supported (">0.2%, not dead" in browserslist).
      // Vite does not read browserslist for JS. Without this, it targets Chrome 111 and Safari 16.4.
      // Vite rewrites newer syntax for these browsers, but it does not add polyfills. Create React App did not either.
      target: ["chrome109", "edge109", "firefox115", "safari15.6", "ios15.6"],
    },
    server: { port: 3000 }, // same port as Create React App, so bookmarks keep working
  };
});

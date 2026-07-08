import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
// @ts-expect-error - No type declarations for custom plugin
import clearLogPlugin from "./dala-internal-vite-clear-log-plugin.js";

import dns from "node:dns";

dns.setDefaultResultOrder("verbatim");

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    clearLogPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "AMPHY THEATRE",
        short_name: "AMPHY",
        description: "Application de génération de certificats de conformité pour appareils de levage",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-icon-512.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "pwa-icon-192.webp",
            sizes: "192x192",
            type: "image/webp",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-assets-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000, // Increases the limit to 5MB
  },
});

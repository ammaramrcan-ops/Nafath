import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: true,
      crawlLinks: true,
    },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      hmr: {
        clientPort: 443,
        protocol: "wss",
      },
    },
  },
});

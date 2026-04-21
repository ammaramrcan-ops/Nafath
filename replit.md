# TanStack Start App (متكيف)

Arabic adaptive learning SPA built with TanStack Start (React 19, Vite 7, TanStack Router, Tailwind v4, shadcn/Radix UI).

## Structure
- `src/routes` — file-based routes (TanStack Router)
- `src/components`, `src/hooks` — UI and hooks
- `vite.config.ts` — uses `@lovable.dev/vite-tanstack-config` (Cloudflare plugin disabled for Replit)
- `server.mjs` — Node SSR entry that wraps the built fetch handler with `srvx` and serves `dist/client` static assets

## Replit setup
- Workflow `Start application` runs `npm run dev` on port 5000 (host 0.0.0.0, allowedHosts: true) for the iframe preview.
- Deployment: autoscale — build `npm run build`, run `node server.mjs`.
- Node 20 (engine warnings from TanStack Start are non-blocking in this environment).

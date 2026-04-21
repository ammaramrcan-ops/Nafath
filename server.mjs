import { serve } from "srvx";
import server from "./dist/server/server.js";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CLIENT_DIR = new URL("./dist/client/", import.meta.url);

const MIME = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain",
};

async function tryServeStatic(req) {
  const url = new URL(req.url);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") return null;
  const safe = normalize(pathname).replace(/^(\.\.[\\/])+/, "");
  const filePath = new URL("." + safe, CLIENT_DIR);
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return null;
    const data = await readFile(filePath);
    const type = MIME[extname(filePath.pathname).toLowerCase()] || "application/octet-stream";
    const headers = { "content-type": type };
    if (safe.startsWith("/assets/")) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    }
    return new Response(data, { headers });
  } catch {
    return null;
  }
}

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || "0.0.0.0";

serve({
  port,
  hostname: host,
  fetch: async (req) => {
    const staticRes = await tryServeStatic(req);
    if (staticRes) return staticRes;
    return server.fetch(req);
  },
});

console.log(`Server listening on http://${host}:${port}`);

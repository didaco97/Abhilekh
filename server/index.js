import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { nodeApiHandler } from "./runtime.js";
import { parseByteRange } from "./byte-range.js";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".vtt": "text/vtt; charset=utf-8",
  ".webp": "image/webp",
  ".zip": "application/zip",
};
createServer(async (req, res) => {
  await nodeApiHandler(req, res, async () => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const contents = await readFile(file);
      const range = req.method === "GET" && req.headers.range ? parseByteRange(req.headers.range, contents.length) : undefined;
      if (range === null) {
        res.writeHead(416, { "Content-Range": `bytes */${contents.length}` });
        res.end();
        return;
      }
      const body = range ? contents.subarray(range.start, range.end + 1) : contents;
      res.writeHead(range ? 206 : 200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Content-Length": body.length,
        ...(range ? { "Content-Range": `bytes ${range.start}-${range.end}/${contents.length}` } : {}),
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(self)",
        "Cache-Control": pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}).listen(
  Number(process.env.PORT) || 5173,
  process.env.HOST || "127.0.0.1",
  () => console.log("Abhilekh server ready"),
);

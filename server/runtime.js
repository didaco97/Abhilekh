import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createResearchService } from "./research.js";
import { createVoiceService, VOICE_REQUEST_LIMIT } from "./voice.js";

// This module is imported only by server entry points, never by React.
const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
export const researchService = createResearchService({
  apiKey: process.env.PERPLEXITY_API_KEY,
  model: process.env.RESEARCH_MODEL || "sonar-pro",
  hourlyLimit: Number(process.env.RESEARCH_HOURLY_LIMIT) || 60,
});
export const voiceService = createVoiceService({
  apiKey: process.env.SARVAM_API_KEY,
  hourlyLimit: Number(process.env.VOICE_HOURLY_LIMIT) || 120,
});

export async function nodeApiHandler(req, res, next = () => {}) {
  const pathname = (req.url || "").split("?")[0];
  if (!["/api/chat", "/api/voice"].includes(pathname)) return next();
  const isVoice = pathname === "/api/voice";
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > (isVoice ? VOICE_REQUEST_LIMIT : 18000)) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ message: isVoice ? "Please record a shorter question." : "Please start a shorter conversation." }),
        );
        return;
      }
      chunks.push(chunk);
    }
    const origin = process.env.APP_ORIGIN || `http://${req.headers.host}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (typeof value === "string") headers.set(key, value);
    const request = new Request(origin + pathname, {
      method: req.method,
      headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: Buffer.concat(chunks) }
        : {}),
    });
    const result = await (isVoice ? voiceService : researchService).handle(
      request,
      req.socket.remoteAddress || "local",
    );
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(await result.text());
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ message: "The research service is unavailable." }),
    );
  }
}

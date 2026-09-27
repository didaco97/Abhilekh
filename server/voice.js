import { findResearchLanguage, RESEARCH_LANGUAGES } from "../src/research-languages.js";
import { CLOUD_SPEECH_CHUNK_LIMIT, speechText } from "../src/speech.js";

export const VOICE_REQUEST_LIMIT = 1500000;
// Leave headroom for JSON and the function envelope below Netlify's 6 MB limit.
export const VOICE_RESPONSE_AUDIO_LIMIT = 5500000;
const AUDIO_LIMIT = 1000000;
const TYPES = new Map([["audio/webm", "webm"], ["audio/mp4", "m4a"], ["audio/ogg", "ogg"], ["audio/wav", "wav"]]);
class VoiceError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const reply = (status, data) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

// Speech uses the same locale allowlist as research. Credentials never leave Node.
export function createVoiceService({ apiKey, fetchImpl = fetch, now = Date.now, hourlyLimit = 120 } = {}) {
  let hourStart = now(), calls = 0;
  const clients = new Map();
  async function upstream(path, options, request) {
    if (now() - hourStart >= 3600000) { calls = 0; hourStart = now(); }
    if (calls >= hourlyLimit) throw new VoiceError(429, "The demo voice limit has been reached. You can still type and read.");
    calls++;
    try {
      const response = await fetchImpl(`https://api.sarvam.ai/${path}`, {
        ...options,
        method: "POST",
        headers: { ...options.headers, "api-subscription-key": apiKey },
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(35000)]),
      });
      if (!response.ok) throw new VoiceError(response.status === 429 ? 429 : 502,
        response.status === 429 ? "The voice service is busy. Please try again shortly." : "The voice service is unavailable. Check its server configuration or try again later.");
      return await response.json();
    } catch (error) {
      if (error instanceof VoiceError) throw error;
      throw new VoiceError(504, "The voice service did not respond. Please retry or type your question.");
    }
  }
  return {
    async handle(request, clientId = "local") {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) return reply(403, { message: "This request is not permitted." });
      if (request.method === "GET") return reply(200, {
        cloud: Boolean(apiKey), languages: RESEARCH_LANGUAGES.map(l => l.code), maxRecordingSeconds: 25,
      });
      if (request.method !== "POST") return reply(405, { message: "Use POST for speech requests." });
      try {
        if (!(request.headers.get("content-type") || "").startsWith("application/json"))
          throw new VoiceError(415, "Send a JSON speech request.");
        if (Number(request.headers.get("content-length")) > VOICE_REQUEST_LIMIT)
          throw new VoiceError(413, "This recording is too large. Please record a shorter question.");
        const raw = await request.text();
        if (Buffer.byteLength(raw) > VOICE_REQUEST_LIMIT)
          throw new VoiceError(413, "This recording is too large. Please record a shorter question.");
        let input;
        try { input = JSON.parse(raw); } catch { throw new VoiceError(400, "The speech request could not be read."); }
        const language = findResearchLanguage(input?.language);
        if (!language || !["transcribe", "speak"].includes(input?.action))
          throw new VoiceError(400, "Choose a supported language and speech action.");
        let body, path, headers;
        if (input.action === "transcribe") {
          const type = typeof input.mimeType === "string" ? input.mimeType.split(";")[0].toLowerCase() : "";
          if (!TYPES.has(type) || typeof input.audio !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio))
            throw new VoiceError(400, "The recording format is unsupported. Please record again.");
          const bytes = Buffer.from(input.audio, "base64");
          if (bytes.length < 100 || bytes.length > AUDIO_LIMIT)
            throw new VoiceError(400, "Please record a question of up to 25 seconds.");
          body = new FormData();
          body.append("file", new Blob([bytes], { type }), `question.${TYPES.get(type)}`);
          body.append("model", "saaras:v3");
          body.append("mode", "transcribe");
          body.append("language_code", language.locale);
          path = "speech-to-text";
        } else {
          if (typeof input.text !== "string" || !input.text.trim() || input.text.length > CLOUD_SPEECH_CHUNK_LIMIT)
            throw new VoiceError(400, `Please read a shorter passage of up to ${CLOUD_SPEECH_CHUNK_LIMIT} characters.`);
          const text = speechText(input.text);
          if (!text) throw new VoiceError(400, "There is no readable text in this passage.");
          body = JSON.stringify({ text, language_code: language.locale, model: "bulbul:v3", speaker: "shubh", pace: 1, speech_sample_rate: 24000, output_audio_codec: "wav" });
          headers = { "Content-Type": "application/json" };
          path = "text-to-speech";
        }
        if (!apiKey) throw new VoiceError(503, "Cloud voice is not connected yet. You can still type and use available device reading voices.");
        const timestamp = now();
        for (const [key, value] of clients) if (timestamp - value.start >= 60000) clients.delete(key);
        const bucket = clients.get(clientId);
        if (bucket && ++bucket.count > 20) throw new VoiceError(429, "Please pause briefly before using voice again.");
        if (!bucket) clients.set(clientId, { start: timestamp, count: 1 });
        const data = await upstream(path, { body, headers }, request);
        if (input.action === "transcribe") {
          if (typeof data.transcript !== "string" || !data.transcript.trim())
            throw new VoiceError(422, "No speech was recognised. Move closer to the microphone and try again.");
          const transcript = data.transcript.trim();
          return reply(200, { transcript: transcript.slice(0, 1200), truncated: transcript.length > 1200, language: language.code });
        }
        const audio = data.audios?.[0];
        if (typeof audio === "string" && audio.length > VOICE_RESPONSE_AUDIO_LIMIT)
          throw new VoiceError(502, "This narration is too long to play. Please try a shorter passage.");
        if (typeof audio !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio))
          throw new VoiceError(502, "The voice service returned no playable audio. Please try again.");
        return reply(200, { audio, mimeType: "audio/wav" });
      } catch (error) {
        return reply(error instanceof VoiceError ? error.status : 502, {
          message: error instanceof VoiceError ? error.message : "Voice is temporarily unavailable. You can still type and read.",
        });
      }
    },
  };
}

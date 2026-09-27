import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceService, VOICE_REQUEST_LIMIT } from "../server/voice.js";
const audio = Buffer.alloc(1200, 1).toString("base64");
const request = (data, origin) => new Request("http://localhost/api/voice", { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { origin } : {}) }, body: JSON.stringify(data) });
const input = { action: "transcribe", audio, mimeType: "audio/webm;codecs=opus", language: "mr" };

test("voice configuration reports availability without exposing credentials", async () => {
  const missing = createVoiceService();
  const config = await (await missing.handle(new Request("http://localhost/api/voice"))).json();
  assert.equal(config.cloud, false);
  assert.equal((await missing.handle(request(input))).status, 503);
  const connected = createVoiceService({ apiKey: "private-key" });
  const response = await connected.handle(new Request("http://localhost/api/voice"));
  const text = await response.text();
  assert.ok(text.includes('"cloud":true'));
  assert.ok(!text.includes("private-key"));
});

test("transcription is native-script multipart audio with a server-only Sarvam credential", async () => {
  const service = createVoiceService({ apiKey: "private-key", fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.sarvam.ai/speech-to-text");
    assert.equal(options.headers["api-subscription-key"], "private-key");
    assert.equal(options.body.get("model"), "saaras:v3");
    assert.equal(options.body.get("mode"), "transcribe");
    assert.equal(options.body.get("language_code"), "mr-IN");
    assert.equal(options.body.get("file").name, "question.webm");
    assert.equal(options.body.get("file").size, 1200);
    return Response.json({ transcript: "महाड सत्याग्रहाबद्दल सांगा", language_code: "mr-IN" });
  } });
  const result = await (await service.handle(request(input))).json();
  assert.equal(result.transcript, "महाड सत्याग्रहाबद्दल सांगा");
  assert.equal(result.language, "mr");
});

test("narration removes citation markers and keeps the original selected language", async () => {
  const service = createVoiceService({ apiKey: "private", fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.sarvam.ai/text-to-speech");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "bulbul:v3");
    assert.equal(body.language_code, "ta-IN");
    assert.equal(body.text, "சமத்துவம்");
    assert.equal(body.output_audio_codec, "wav");
    return Response.json({ audios: [audio] });
  } });
  const response = await service.handle(request({ action: "speak", language: "ta", text: "**சமத்துவம்**[1]" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mimeType, "audio/wav");
});

test("voice rejects cross-origin, malformed, oversized and unsupported inputs before paid requests", async () => {
  let calls = 0;
  const service = createVoiceService({ apiKey: "private", fetchImpl: async () => { calls++; return Response.json({}); } });
  assert.equal((await service.handle(request(input, "https://elsewhere.test"))).status, 403);
  for (const data of [null, { ...input, language: "xx" }, { ...input, mimeType: "text/html" }, { ...input, audio: "%%%" }, { action: "speak", language: "hi", text: "x".repeat(2501) }])
    assert.equal((await service.handle(request(data))).status, 400);
  assert.equal((await service.handle(request({ ...input, audio: "x".repeat(VOICE_REQUEST_LIMIT) }))).status, 413);
  assert.equal(calls, 0);
});

test("upstream failures hide provider details and enforce the combined voice budget", async () => {
  let calls = 0;
  const service = createVoiceService({ apiKey: "private", hourlyLimit: 1, fetchImpl: async () => { calls++; return new Response("private account information", { status: 401 }); } });
  const failed = await service.handle(request(input));
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.text()).includes("private"));
  assert.equal((await service.handle(request(input))).status, 429);
  assert.equal(calls, 1);
});

test("silence and missing narration audio produce actionable failures", async () => {
  const service = createVoiceService({ apiKey: "private", fetchImpl: async () => Response.json({ transcript: " " }) });
  assert.equal((await service.handle(request(input))).status, 422);
  assert.equal((await service.handle(request({ action: "speak", text: "Hello", language: "en" }))).status, 502);
});

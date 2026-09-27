// Opt-in live integration check. Makes paid speech and research requests.
// No credential or audio payload is printed or written to disk.
import assert from "node:assert/strict";
const base = new URL(process.env.CHECK_BASE_URL || "http://127.0.0.1:5173").origin;
async function post(path, body) {
  const response = await fetch(base + path, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify(body), signal: AbortSignal.timeout(55000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}. ${data.message || "Request failed"}`);
  return data;
}
try {
  const question = "डॉक्टर आंबेडकर ने कोलंबिया विश्वविद्यालय में क्या पढ़ा था?";
  const speech = await post("/api/voice", { action: "speak", language: "hi", text: question });
  const bytes = Buffer.from(speech.audio, "base64");
  assert.equal(bytes.subarray(0, 4).toString(), "RIFF");
  console.log(JSON.stringify({ step: "Hindi question narration", result: "passed", audioBytes: bytes.length }));
  const transcript = await post("/api/voice", { action: "transcribe", language: "hi", mimeType: speech.mimeType, audio: speech.audio });
  assert.ok(transcript.transcript.length > 5);
  assert.match(transcript.transcript, /[\u0900-\u097F]/);
  console.log(JSON.stringify({ step: "Hindi transcription", result: "passed", transcript: transcript.transcript }));
  const answer = await post("/api/chat", { query: transcript.transcript, language: "hi" });
  assert.equal(answer.mode, "web-research");
  assert.equal(answer.language, "hi");
  assert.ok(answer.answer.length > 20);
  assert.ok(answer.citations.length > 0);
  console.log(JSON.stringify({ step: "Hindi research with citations", result: "passed", references: answer.citations.length }));
  const narration = await post("/api/voice", { action: "speak", language: answer.language, text: answer.answer.slice(0, 500) });
  const narrationBytes = Buffer.from(narration.audio, "base64");
  assert.equal(narrationBytes.subarray(0, 4).toString(), "RIFF");
  console.log(JSON.stringify({ step: "Research answer narration excerpt", result: "passed", audioBytes: narrationBytes.length }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

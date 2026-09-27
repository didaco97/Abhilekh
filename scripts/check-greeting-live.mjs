// Local API check. --speech also makes one paid Sarvam narration request.
// No microphone input, credential output or saved audio.
import assert from "node:assert/strict";
async function post(path, body) {
  const response = await fetch("http://127.0.0.1:5173" + path, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(55000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.message || "Service unavailable"}`);
  return data;
}
let greeting;
for (const query of ["नमस्कार", "Namaskar", "नमस्कार, तुम्ही कसे आहात?", "धन्यवाद"]) {
  const reply = await post("/api/chat", { query, language: "mr", responseStyle: "voice" });
  assert.equal(reply.mode, "conversation");
  assert.equal(reply.language, "mr");
  assert.equal(reply.evidence, "not-applicable");
  assert.equal(reply.citations.length, 0);
  assert.doesNotMatch(reply.answer, /आंबेडकर|अंबेडकर|Ambedkar/);
  greeting ||= reply;
  console.log(JSON.stringify({ query, reply: reply.answer, passed: true }));
}
if (process.argv.includes("--speech")) {
  const narration = await post("/api/voice", { action: "speak", language: "mr", text: greeting.answer });
  assert.equal(Buffer.from(narration.audio, "base64").subarray(0, 4).toString(), "RIFF");
  console.log(JSON.stringify({ step: "Marathi greeting narration", passed: true }));
}

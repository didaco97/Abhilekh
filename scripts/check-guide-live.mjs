// Opt-in paid check of spoken-answer mode. No microphone or credentials in this script.
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5173";
async function post(path, body) {
  const response = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(55000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.message || "Service unavailable"}`);
  return data;
}
try {
  const question = "What did Ambedkar study at Columbia?";
  const answer = await post("/api/chat", { query: question, language: "en", responseStyle: "voice" });
  assert.ok(answer.citations.length);
  assert.ok(answer.answer.length > 20);
  console.log(JSON.stringify({ step: "Concise spoken research", words: answer.answer.split(/\s+/).length, sources: answer.citations.length, passed: true }));
  const narration = await post("/api/voice", { action: "speak", language: "en", text: answer.answer });
  assert.equal(Buffer.from(narration.audio, "base64").subarray(0, 4).toString(), "RIFF");
  console.log(JSON.stringify({ step: "Spoken answer narration", passed: true }));
  const followUp = await post("/api/chat", { query: "What was the subject of his doctoral thesis?", language: "en", responseStyle: "voice", history: [{ role: "user", content: question }, { role: "assistant", content: answer.answer }] });
  assert.ok(followUp.answer.length > 20);
  assert.ok(followUp.citations.length);
  console.log(JSON.stringify({ step: "Contextual voice follow-up", words: followUp.answer.split(/\s+/).length, sources: followUp.citations.length, passed: true }));
} catch (error) { console.error(error.message); process.exitCode = 1; }

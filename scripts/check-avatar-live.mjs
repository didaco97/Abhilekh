// Opt-in integration check: one paid TTS call, optional transcription, and local A2E.
import assert from 'node:assert/strict';
const base = new URL(process.env.CHECK_BASE_URL || 'http://127.0.0.1:5174').origin;
async function post(path, data) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify(data), signal: AbortSignal.timeout(55000) });
  const result = await response.json();
  assert.ok(response.ok, `${path}: ${result.message || response.status}`);
  return result;
}
const speech = await post('/api/voice', { action: 'speak', language: 'mr',
  text: 'नमस्कार. अभिलेखमध्ये आपले स्वागत आहे. डॉक्टर आंबेडकरांच्या जीवनाबद्दल तुम्हाला काय जाणून घ्यायचे आहे?' });
const started = performance.now();
const motion = await post('/api/avatar', speech);
const elapsed = performance.now() - started;
assert.equal(motion.fps, 30);
assert.equal(motion.names.length, 52);
assert.ok(Math.abs(motion.frames.length / 30 - motion.duration) < 0.04);
const jaw = motion.names.indexOf('jawOpen');
const values = motion.frames.map(frame => frame[jaw]);
assert.ok(Math.max(...values) - Math.min(...values) > 0.05);
console.log(JSON.stringify({ test: 'Sarvam Marathi to LAM expression', audioSeconds: motion.duration,
  inferenceMs: Math.round(elapsed), frames: motion.frames.length, jawRange: [Math.min(...values), Math.max(...values)] }));
if (process.env.CHECK_TRANSCRIPTION === '1') {
  const transcript = await post('/api/voice', { ...speech, action: 'transcribe', language: 'mr' });
  assert.match(transcript.transcript, /[\u0900-\u097f]/);
  console.log(JSON.stringify({ test: 'Marathi audio round trip', transcript: transcript.transcript }));
}

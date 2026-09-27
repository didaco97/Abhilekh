import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceConversation } from "../src/voice-conversation.js";
import { createBoundaryDetector } from "../src/speech-boundary.js";
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };
const answer = { id: "answer-1", language: "hi", answer: "एक संक्षिप्त उत्तर।[1]", citations: [{ number: 1, url: "https://www.columbia.edu/", title: "Source" }] };
function setup(fetchImpl = async () => Response.json(answer), language = { code: "hi", locale: "hi-IN", name: "Hindi" }) {
  let hooks;
  const states = [], listens = [], readings = [], requests = [];
  const speech = {
    startListening(options) { listens.push(options); hooks.onCaptureStart(); },
    stopAll() {}, dispose() {}, finishListening() { hooks.onState({ transcribing: true }); },
    speak(value) { readings.push(value); hooks.onPlaybackStart(); },
  };
  const session = createVoiceConversation({ language, nextTurnDelay: 0,
    createSpeech: callbacks => { hooks = callbacks; return speech; },
    onChange: state => states.push(state),
    fetchImpl: async (url, options) => { requests.push({ ...JSON.parse(options.body), signal: options.signal }); return fetchImpl(url, options); },
  });
  return { session, states, listens, readings, requests, hooks };
}

test('avatar sample uses the real speech path without opening the microphone afterward', async () => {
  const f = setup(async () => Response.json({ ...answer, mode: 'conversation' }));
  f.session.preview();
  await flush();
  assert.equal(f.requests[0].query, 'Hello');
  assert.equal(f.readings.length, 1);
  assert.equal(f.listens.length, 0);
  f.hooks.onPlaybackEnd();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(f.states.at(-1).active, false);
  assert.equal(f.listens.length, 0);
  f.session.start();
  assert.equal(f.listens.length, 1);
  f.session.dispose();
});

test("voice guide sends recognised questions automatically, speaks, then listens for a follow-up", async () => {
  const f = setup();
  assert.equal(f.listens.length, 0);
  f.session.pause();
  assert.equal(f.states.length, 0, "opening details before a session must keep the guide idle");
  f.session.start();
  assert.equal(f.listens[0].autoStop, true);
  assert.equal(f.states.at(-1).phase, "listening");
  f.hooks.onDraft("महाड म्हणजे काय?");
  await flush();
  assert.equal(f.requests[0].responseStyle, "voice");
  assert.equal(f.requests[0].language, "hi");
  assert.deepEqual(f.requests[0].history, []);
  assert.equal(f.readings[0].code, "hi");
  assert.equal(f.states.at(-1).phase, "speaking");
  assert.equal(f.listens.length, 1, "microphone must stay off during the answer");
  f.hooks.onPlaybackEnd();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(f.listens.length, 2);
  f.hooks.onDraft("त्याचे महत्त्व काय?");
  await flush();
  assert.deepEqual(f.requests[1].history.map(m => m.role), ["user", "assistant"]);
  assert.equal(f.states.at(-1).turns, 2);
  f.session.dispose();
});

test("pausing aborts research and ignores a late reply", async () => {
  let resolve;
  const f = setup(() => new Promise(done => { resolve = done; }));
  f.session.start(); f.hooks.onDraft("Tell me about Mahad");
  f.session.pause();
  assert.ok(f.requests[0].signal.aborted);
  resolve(Response.json(answer)); await flush();
  assert.equal(f.readings.length, 0);
  assert.equal(f.states.at(-1).active, false);
  assert.equal(f.states.at(-1).phase, "paused");
  f.session.dispose();
});

test("ending cancels automatic follow-up listening and clears conversational history", async () => {
  const f = setup();
  f.session.start(); f.hooks.onDraft("पहिला प्रश्न"); await flush();
  f.hooks.onPlaybackEnd(); f.session.end();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(f.listens.length, 1);
  assert.equal(f.states.at(-1).answer, null);
  f.session.start(); f.hooks.onDraft("नवीन प्रश्न"); await flush();
  assert.deepEqual(f.requests[1].history, []);
  f.session.dispose();
});

test("interrupt stops playback and starts a new listening turn; speech errors never restart recording", async () => {
  const f = setup();
  f.session.start(); f.hooks.onDraft("प्रश्न"); await flush();
  f.session.interrupt();
  assert.equal(f.listens.length, 2);
  assert.equal(f.states.at(-1).phase, "listening");
  f.hooks.onError("Microphone denied");
  f.hooks.onPlaybackEnd(); await flush();
  assert.equal(f.states.at(-1).phase, "error");
  assert.equal(f.states.at(-1).active, false);
  assert.equal(f.listens.length, 2);
  f.session.dispose();
});

test("dispose suppresses all late recognition and research callbacks", async () => {
  let resolve;
  const f = setup(() => new Promise(done => { resolve = done; }));
  f.session.start(); f.hooks.onDraft("प्रश्न"); f.session.dispose();
  const count = f.states.length;
  resolve(Response.json(answer)); f.hooks.onDraft("late question"); f.hooks.onPlaybackEnd(); await flush();
  assert.equal(f.states.length, count);
  assert.equal(f.readings.length, 0);
  assert.equal(f.requests.length, 1);
});

test("a failed answer remains an error instead of being spoken as archival evidence", async () => {
  const f = setup(async () => Response.json({ message: "Research unavailable" }, { status: 503 }));
  f.session.start(); f.hooks.onDraft("प्रश्न"); await flush();
  assert.equal(f.states.at(-1).error, "Research unavailable");
  assert.equal(f.readings.length, 0);
  assert.equal(f.states.at(-1).active, false);
  f.session.dispose();
});

test("end-of-speech detection waits for sustained sound followed by a pause", () => {
  const detect = createBoundaryDetector();
  assert.equal(detect(.001, 0), null);
  for (const time of [100, 200, 300]) assert.equal(detect(.05, time), null);
  assert.equal(detect(.001, 1700), null);
  assert.equal(detect(.001, 1800), "finished");
  assert.equal(detect(.001, 2000), null, "finish emits only once");
});

test("the guide narrates a greeting and listens again without losing the earlier research context", async () => {
  const courtesy = { id: "greeting", mode: "conversation", language: "mr", answer: "नमस्कार! तुमचं स्वागत आहे.", citations: [], evidence: "not-applicable" };
  const f = setup(async (_, options) => Response.json(JSON.parse(options.body).query === "नमस्कार" ? courtesy : { ...answer, language: "mr" }), { code: "mr", locale: "mr-IN", name: "Marathi" });
  f.session.start(); f.hooks.onDraft("Tell me about Mahad"); await flush();
  f.hooks.onPlaybackEnd(); await new Promise(resolve => setTimeout(resolve, 10));
  f.hooks.onDraft("नमस्कार"); await flush();
  assert.equal(f.readings.at(-1).text, courtesy.answer);
  assert.equal(f.readings.at(-1).code, "mr");
  assert.equal(f.states.at(-1).answer.mode, "conversation");
  f.hooks.onPlaybackEnd(); await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(f.listens.length, 3);
  f.hooks.onDraft("What happened next?"); await flush();
  assert.deepEqual(f.requests.at(-1).history.map(m => m.content), ["Tell me about Mahad", answer.answer]);
  f.session.dispose();
});

test("silence and isolated background clicks end without treating them as a question", () => {
  const detect = createBoundaryDetector();
  for (let time = 0; time < 10000; time += 100) assert.equal(detect(time === 300 ? .05 : .001, time), null);
  assert.equal(detect(.001, 10000), "empty");
});

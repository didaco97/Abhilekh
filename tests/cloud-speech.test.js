import test from "node:test";
import assert from "node:assert/strict";
import { createCloudSpeechSession } from "../src/cloud-speech.js";
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };
function setup({ getUserMedia, fetchImpl, callbacks = {} } = {}) {
  const states = [], notices = [], drafts = [], recorders = [], requests = [], sounds = [], revoked = [];
  const track = { stops: 0, stop() { this.stops++; } };
  const stream = { getTracks: () => [track] };
  class Recorder {
    static isTypeSupported(type) { return type === "audio/webm;codecs=opus"; }
    constructor() { recorders.push(this); this.state = "inactive"; }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; this.ondataavailable({ data: new Blob([new Uint8Array(200)]) }); this.onstop(); }
  }
  class Audio {
    constructor(src) { this.src = src; sounds.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() {}
    load() {}
  }
  const session = createCloudSpeechSession({ Recorder, AudioClass: Audio,
    mediaDevices: { getUserMedia: getUserMedia || (async () => stream) },
    fetchImpl: async (url, options) => {
      const data = JSON.parse(options.body); requests.push(data);
      return fetchImpl ? fetchImpl(url, options) : Response.json(data.action === "transcribe" ? { transcript: "नमस्ते" } : { audio: Buffer.from("audio").toString("base64"), mimeType: "audio/wav" });
    },
    makeObjectURL: () => "blob:test", revokeObjectURL: url => revoked.push(url),
    onState: state => states.push(state), onDraft: text => drafts.push(text), onNotice: text => notices.push(text),
    ...callbacks,
  });
  return { session, states, notices, drafts, recorders, requests, sounds, revoked, track, stream };
}

test("cloud input records on demand, releases the mic, and returns an editable transcript", async () => {
  const f = setup();
  assert.equal(f.recorders.length, 0);
  await f.session.startListening({ language: "hi", prefix: "सवाल" });
  assert.match(f.notices.at(-1), /Listening/);
  f.session.finishListening();
  await flush();
  assert.equal(f.track.stops, 1);
  assert.equal(f.requests[0].language, "hi");
  assert.equal(f.requests[0].action, "transcribe");
  assert.deepEqual(f.drafts, ["सवाल नमस्ते"]);
  assert.equal(f.states.at(-1).transcribing, false);
  f.session.dispose();
});

test("cancelled microphone requests close streams that arrive late", async () => {
  let resolveMedia;
  const f = setup({ getUserMedia: () => new Promise(resolve => { resolveMedia = resolve; }) });
  const pending = f.session.startListening({ language: "hi" });
  f.session.stopAll();
  resolveMedia(f.stream);
  await pending;
  assert.equal(f.track.stops, 1);
  assert.equal(f.recorders.length, 0);
  assert.equal(f.requests.length, 0);
  f.session.dispose();
});

test("cancelled transcription cannot overwrite a later question", async () => {
  let resolveFetch;
  const f = setup({ fetchImpl: () => new Promise(resolve => { resolveFetch = resolve; }) });
  await f.session.startListening({ language: "mr" });
  f.session.finishListening();
  await flush();
  f.session.stopAll();
  resolveFetch(Response.json({ transcript: "late reply" }));
  await flush();
  assert.equal(f.drafts.length, 0);
  f.session.dispose();
});

test("cloud narration uses the answer language, caches replay and stops before recording", async () => {
  const f = setup();
  const answer = { id: "answer", text: "समानता[1]", code: "hi", name: "Hindi" };
  await f.session.speak(answer);
  assert.equal(f.requests[0].text, "समानता");
  assert.equal(f.requests[0].language, "hi");
  assert.match(f.notices.at(-1), /Reading in Hindi/);
  f.session.stopAll();
  assert.ok(f.sounds[0].paused);
  assert.equal(f.revoked.length, 1);
  await f.session.speak(answer);
  assert.equal(f.requests.length, 1);
  await f.session.startListening({ language: "mr" });
  assert.ok(f.sounds[1].paused);
  assert.equal(f.states.at(-1).speakingId, null);
  f.session.dispose();
});

test("denied cloud microphone permission leaves the typed path usable", async () => {
  const f = setup({ getUserMedia: async () => { const error = new Error(); error.name = "NotAllowedError"; throw error; } });
  await f.session.startListening({ language: "en" });
  assert.equal(f.states.at(-1).listening, false);
  assert.match(f.notices.at(-1), /denied/);
  assert.equal(f.requests.length, 0);
  f.session.dispose();
});
test("automatic speech boundary transcribes once and releases the audio monitor", async () => {
  let boundary, cleaned = 0, started = 0;
  const f = setup({ callbacks: {
    monitorBoundary: (stream, hooks) => { boundary = hooks; return () => { cleaned++; }; },
    onCaptureStart: () => started++,
  } });
  await f.session.startListening({ language: "hi", autoStop: true });
  boundary.onFinish(); await flush();
  assert.equal(started, 1);
  assert.equal(cleaned, 1);
  assert.equal(f.requests.length, 1);
  assert.deepEqual(f.drafts, ["नमस्ते"]);
  f.session.dispose();
});
test("silence cancels recording without uploading and reports an idle session", async () => {
  let boundary;
  const failures = [];
  const f = setup({ callbacks: {
    monitorBoundary: (stream, hooks) => { boundary = hooks; return () => {}; },
    onError: message => failures.push(message),
  } });
  await f.session.startListening({ language: "hi", autoStop: true });
  boundary.onEmpty(); await flush();
  assert.equal(f.requests.length, 0);
  assert.equal(f.track.stops, 1);
  assert.equal(f.states.at(-1).listening, false);
  assert.match(failures[0], /didn’t hear/);
  f.session.dispose();
});
test("playback callbacks report actual start and completion for the guide loop", async () => {
  let started = 0, finished = 0;
  const f = setup({ callbacks: { onPlaybackStart: () => started++, onPlaybackEnd: () => finished++ } });
  await f.session.speak({ id: "a", text: "नमस्ते", code: "hi", name: "Hindi" });
  assert.equal(started, 1); assert.equal(finished, 0);
  await f.sounds[0].onended();
  assert.equal(finished, 1);
  f.session.dispose();
});

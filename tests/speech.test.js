import test from "node:test";
import assert from "node:assert/strict";
import { createSpeechSession, speechText, speechChunks, matchingVoice } from "../src/speech.js";

function setup() {
  const notices = [], drafts = [], states = [], spoken = [], recordings = [];
  class Recognition {
    constructor() { recordings.push(this); }
    start() { this.onstart?.(); }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; }
  }
  const voices = [{ lang: "en-GB" }, { lang: "hi-IN" }];
  const synthesis = { getVoices: () => voices, speak: u => spoken.push(u), cancel() { this.cancelled = true; } };
  class Utterance { constructor(text) { this.text = text; } }
  const session = createSpeechSession({ Recognition, synthesis, Utterance,
    onState: s => states.push(s), onDraft: s => drafts.push(s), onNotice: s => notices.push(s) });
  return { session, notices, drafts, states, spoken, recordings, synthesis };
}
test("a browser exposing recognition without starting it times out honestly", async () => {
  const notices = [], states = [];
  class UnavailableRecognition { start() {} abort() {} }
  const session = createSpeechSession({ Recognition: UnavailableRecognition, startTimeoutMs: 1,
    onState: state => states.push(state), onNotice: text => notices.push(text), onDraft: () => {} });
  session.startListening({ locale: "en-IN" });
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(states.at(-1).listening, false);
  assert.match(notices.at(-1), /Browser speech did not start/);
  session.dispose();
});

test("narration omits citations and URLs without losing multilingual text", () => {
  assert.equal(speechText("## **समानता**\nविचार.[1][2] [Read the source](https://sansad.in/a)"), "समानता विचार. Read the source");
  const text = "यह एक लंबा उत्तर है। ".repeat(60).trim();
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every(c => c.length <= 220));
  assert.equal(chunks.join(" "), text);
  assert.equal(matchingVoice([{ lang: "en-GB" }], "mr-IN"), undefined);
});

test("dictation stays an editable draft and ignores results after cancellation", () => {
  const f = setup();
  f.session.startListening({ locale: "hi-IN", prefix: "मुझे बताएं" });
  const r = f.recordings[0];
  assert.equal(r.lang, "hi-IN");
  assert.equal(r.continuous, false);
  r.onresult({ results: [[{ transcript: "महाड़ सत्याग्रह" }]] });
  assert.deepEqual(f.drafts, ["मुझे बताएं महाड़ सत्याग्रह"]);
  f.session.finishListening();
  assert.ok(r.stopped);
  r.onend();
  assert.match(f.notices.at(-1), /Review/);
  f.session.stopAll();
  r.onresult({ results: [[{ transcript: "late callback" }]] });
  assert.equal(f.drafts.length, 1);
  assert.equal(f.states.at(-1).listening, false);
  f.session.dispose();
});

test("permission errors release microphone state and offer typed input", () => {
  const f = setup();
  f.session.startListening({ locale: "en-IN" });
  f.recordings[0].onerror({ error: "not-allowed" });
  assert.equal(f.states.at(-1).listening, false);
  assert.match(f.notices.at(-1), /denied.*type/);
  assert.ok(f.recordings[0].aborted);
  f.session.dispose();
});

test("narration uses the answer language, cancels old callbacks and refuses wrong-language voices", () => {
  const f = setup();
  f.session.speak({ id: "a", text: "विचार [1] ".repeat(60), locale: "hi-IN", name: "Hindi" });
  const first = f.spoken[0];
  assert.equal(first.lang, "hi-IN");
  assert.equal(first.voice.lang, "hi-IN");
  assert.ok(!first.text.includes("[1]"));
  first.onend();
  assert.equal(f.spoken.length, 2);
  const second = f.spoken[1];
  f.session.stopAll();
  second.onend();
  assert.equal(f.spoken.length, 2);
  f.session.speak({ id: "b", text: "उत्तर", locale: "mr-IN", name: "Marathi" });
  assert.match(f.notices.at(-1), /No Marathi reading voice/);
  assert.equal(f.states.at(-1).speakingId, null);
  f.session.dispose();
});

test("starting dictation stops narration; dispose rejects late speech and recognition callbacks", () => {
  const f = setup();
  f.session.speak({ id: "a", text: "Long answer. ".repeat(60), locale: "en-IN", name: "English" });
  f.session.startListening({ locale: "hi-IN" });
  f.spoken[0].onend();
  assert.equal(f.spoken.length, 1);
  assert.equal(f.states.at(-1).speakingId, null);
  f.session.dispose();
  f.recordings[0].onresult({ results: [[{ transcript: "late" }]] });
  assert.equal(f.drafts.length, 0);
});

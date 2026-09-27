import { createCloudSpeechSession } from "./cloud-speech.js";

export const initialConversation = { phase: "idle", active: false, question: "", answer: null, turns: 0, notice: "", error: "" };

export function createVoiceConversation({ language, onChange, speechOptions,
  createSpeech = createCloudSpeechSession, fetchImpl = fetch, nextTurnDelay = 650 }) {
  let state = { ...initialConversation }, history = [], version = 0, request, nextTimer, deadline;
  let disposed = false;
  let listenAfterReply = true;
  const update = patch => { state = { ...state, ...patch }; if (!disposed) onChange(state); };
  function cancelWork() {
    version++;
    clearTimeout(nextTimer); clearTimeout(deadline);
    request?.abort(); request = null;
    speech.stopAll();
  }
  function fail(message) {
    if (disposed) return;
    cancelWork();
    update({ active: false, phase: "error", error: message, notice: "Microphone off" });
  }
  const speech = createSpeech({ ...speechOptions,
    onState: value => {
      if (disposed || !state.active) return;
      if (value.transcribing && ["starting", "listening"].includes(state.phase))
        update({ phase: "transcribing", notice: "Understanding your question…" });
    },
    onNotice: notice => {
      if (!disposed && state.active && notice && ["starting", "listening", "preparing"].includes(state.phase)) update({ notice });
    },
    onCaptureStart: () => { if (state.active && !disposed) update({ phase: "listening", notice: "Go ahead. I’m listening." }); },
    onDraft: (question, details = {}) => {
      if (!state.active || disposed || !["listening", "transcribing"].includes(state.phase)) return;
      if (details.truncated) { fail("That question was too long. Please ask it in a shorter sentence."); return; }
      void answerQuestion(question);
    },
    onPlaybackStart: () => { if (state.active && !disposed) update({ phase: "speaking", notice: "The guide is speaking. Microphone off." }); },
    onPlaybackEnd: () => {
      if (!state.active || disposed) return;
      if (!listenAfterReply) {
        update({ active: false, phase: 'paused', notice: 'Sample finished. Start a conversation when you’re ready.' });
        return;
      }
      update({ phase: "ready", notice: "Your turn. Preparing to listen…" });
      const current = version;
      nextTimer = setTimeout(() => { if (!disposed && state.active && current === version) listen(); }, nextTurnDelay);
    },
    onError: fail,
  });
  function listen() {
    if (disposed) return;
    listenAfterReply = true;
    cancelWork();
    update({ active: true, phase: "starting", notice: "Opening the microphone…", error: "" });
    void speech.startListening({ language: language.code, autoStop: true });
  }
  async function answerQuestion(question) {
    if (!question?.trim()) { fail("I didn’t catch that. Please try again."); return; }
    const current = version;
    update({ phase: "thinking", question: listenAfterReply ? question.trim() : '', answer: null, notice: "Preparing a reply…", error: "" });
    const controller = new AbortController();
    request = controller;
    deadline = setTimeout(() => controller.abort(), 50000);
    try {
      const response = await fetchImpl("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question.trim(), language: language.code, responseStyle: "voice", history: history.slice(-6) }), signal: controller.signal });
      const answer = await response.json();
      if (current !== version || disposed || !state.active) return;
      if (!response.ok) throw new Error(answer.message || "I couldn’t reach the archive. Please try again.");
      if (!answer.answer?.trim()) throw new Error("No answer was returned. Please ask again.");
      // Courtesy exchanges must not evict the research context for follow-ups.
      if (answer.mode !== "conversation") history = [...history, { role: "user", content: question.trim() }, { role: "assistant", content: answer.answer }].slice(-6);
      update({ answer, turns: state.turns + 1, phase: "preparing", notice: "Preparing your spoken answer…" });
      void speech.speak({ id: answer.id, text: answer.answer, ...language });
    } catch (error) {
      if (current === version && !disposed && state.active)
        fail(error.name === "AbortError" ? "The archive took too long to respond. Please try again." : error.message);
    } finally {
      if (request === controller) { clearTimeout(deadline); request = null; }
    }
  }
  return {
    start: listen,
    preview() {
      if (disposed) return;
      cancelWork();
      listenAfterReply = false;
      update({ active: true, phase: 'thinking', question: '', notice: 'Preparing an introduction…', error: '' });
      void answerQuestion('Hello');
    },
    finish: () => { if (state.phase === "listening") speech.finishListening(); },
    interrupt: listen,
    pause() {
      if (disposed || !state.active) return;
      cancelWork();
      update({ active: false, phase: "paused", error: "", notice: "Conversation paused. Microphone off." });
    },
    replay() {
      if (disposed || !state.answer) return;
      cancelWork();
      update({ active: true, phase: "preparing", error: "", notice: "Preparing your spoken answer…" });
      void speech.speak({ id: state.answer.id, text: state.answer.answer, ...language });
    },
    end() {
      cancelWork(); speech.dispose(); history = [];
      update({ ...initialConversation });
    },
    dispose() { disposed = true; cancelWork(); speech.dispose(); history = []; },
  };
}

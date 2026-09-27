import { CLOUD_SPEECH_CHUNK_LIMIT, speechChunks, speechText } from "./speech.js";
import { monitorSpeechBoundary } from "./speech-boundary.js";

export function recordingMimeType(Recorder) {
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"]
    .find(type => Recorder?.isTypeSupported?.(type));
}
function toBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
function audioBlob(data) {
  const binary = atob(data.audio);
  return new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type: data.mimeType });
}

export function createCloudSpeechSession({ mediaDevices, Recorder, AudioClass, fetchImpl = fetch,
  makeObjectURL = URL.createObjectURL, revokeObjectURL = URL.revokeObjectURL,
  onState, onDraft, onNotice, onCaptureStart = () => {}, onPlaybackStart = () => {},
  onPlaybackEnd = () => {}, onError = () => {}, monitorBoundary = monitorSpeechBoundary }) {
  let token = 0, stream, recorder, request, recordingTimer, permissionTimer, audio, audioUrl;
  const cache = new Map();
  let cacheBytes = 0;
  let stopBoundary;
  const state = { listening: false, transcribing: false, speakingId: null };
  const update = patch => { Object.assign(state, patch); onState({ ...state }); };
  const fail = message => { onNotice(message); onError(message); };
  const releaseStream = () => { stream?.getTracks().forEach(track => track.stop()); stream = null; };
  function stopAll() {
    token++;
    clearTimeout(recordingTimer);
    clearTimeout(permissionTimer);
    stopBoundary?.(); stopBoundary = null;
    request?.abort(); request = null;
    if (recorder?.state === "recording") { try { recorder.stop(); } catch { /* Already stopped. */ } }
    recorder = null;
    releaseStream();
    if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.removeAttribute?.("src"); audio.load?.(); audio = null; }
    if (audioUrl) { revokeObjectURL(audioUrl); audioUrl = null; }
    update({ listening: false, transcribing: false, speakingId: null });
    onNotice("");
  }
  async function post(body, current) {
    if (current !== token) return null;
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 40000);
    try {
      const response = await fetchImpl("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Voice is temporarily unavailable.");
      return data;
    } finally {
      clearTimeout(timeout);
      if (request === controller) request = null;
    }
  }
  function finishListening() {
    if (recorder?.state === "recording") {
      clearTimeout(recordingTimer);
      recorder.stop();
    } else {
      stopAll();
      onNotice("Microphone request cancelled. Allow microphone access before trying again.");
    }
  }
  async function startListening({ language, prefix = "", autoStop = false }) {
    stopAll();
    const current = token;
    const mimeType = recordingMimeType(Recorder);
    if (!mediaDevices?.getUserMedia || !mimeType) {
      fail("This browser cannot record audio. Open the kiosk in Chrome or Edge over HTTPS, or use the Research Room.");
      return;
    }
    update({ listening: true });
    onNotice("Allow microphone access when your browser asks.");
    permissionTimer = setTimeout(() => {
      if (current !== token) return;
      stopAll();
      fail("Microphone access did not start. Check browser permissions or open the site in Chrome or Edge.");
    }, 12000);
    try {
      const acquired = await mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
      if (current !== token) { acquired.getTracks().forEach(t => t.stop()); return; }
      clearTimeout(permissionTimer);
      stream = acquired;
      const capture = new Recorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      recorder = capture;
      const chunks = [];
      let size = 0;
      capture.ondataavailable = event => {
        if (current !== token || !event.data.size) return;
        size += event.data.size;
        if (size > 1000000) { stopAll(); fail("Recording is too large. Please ask a shorter question."); return; }
        chunks.push(event.data);
      };
      capture.onerror = () => { if (current === token) { stopAll(); fail("Microphone recording failed. Check the device, then try again."); } };
      capture.onstop = async () => {
        if (current !== token) return;
        recorder = null;
        stopBoundary?.(); stopBoundary = null;
        releaseStream();
        clearTimeout(recordingTimer);
        if (size < 100) { update({ listening: false }); fail("No audio was recorded. Speak a question before finishing."); return; }
        update({ listening: false, transcribing: true });
        onNotice("Transcribing your question…");
        try {
          const bytes = new Uint8Array(await new Blob(chunks, { type: mimeType }).arrayBuffer());
          if (current !== token) return;
          const data = await post({ action: "transcribe", audio: toBase64(bytes), mimeType, language }, current);
          if (current !== token) return;
          if (!data?.transcript?.trim()) throw new Error("No speech was recognised. Please try again.");
          const draft = [prefix.trim(), data.transcript.trim()].filter(Boolean).join(" ");
          onDraft(draft.slice(0, 1200), { truncated: data.truncated || draft.length > 1200 });
          if (!autoStop) onNotice(data.truncated || draft.length > 1200 ? "The question reached the length limit. Review it before sending." : "Review your question, then press Send.");
        } catch (error) {
          if (current === token) fail(error.name === "AbortError" ? "Transcription timed out. Please try again." : error.message);
        } finally {
          if (current === token) update({ transcribing: false });
        }
      };
      capture.start(250);
      onNotice(autoStop ? "Listening… pause briefly when you finish your question." : "Listening… tap the microphone to finish (up to 25 seconds).");
      onCaptureStart();
      if (autoStop) stopBoundary = monitorBoundary(stream, {
        onFinish: () => { if (current === token) finishListening(); },
        onEmpty: () => { if (current === token) { stopAll(); fail("I didn’t hear a question. Resume when you’re ready."); } },
        onUnavailable: () => { if (current === token) onNotice("Listening… tap Answer now when you finish."); },
      });
      recordingTimer = setTimeout(finishListening, 25000);
    } catch (error) {
      if (current !== token) return;
      stopAll();
      fail(error.name === "NotAllowedError"
        ? "Microphone access was denied. Allow it in browser settings, then try again."
        : error.name === "NotFoundError" ? "No microphone was found. Connect one, or type your question."
        : "The microphone could not start. Check whether another app is using it, or try Chrome or Edge.");
    }
  }
  async function speak({ id, text, code, name }) {
    stopAll();
    const current = token;
    const chunks = speechChunks(speechText(text), CLOUD_SPEECH_CHUNK_LIMIT);
    if (!chunks.length) { fail("There is no readable text in this answer. Please try another question."); return; }
    update({ speakingId: id });
    let index = 0;
    async function next() {
      if (current !== token) return;
      if (audioUrl) { revokeObjectURL(audioUrl); audioUrl = null; }
      if (index >= chunks.length) { audio = null; update({ speakingId: null }); onNotice(""); onPlaybackEnd(); return; }
      const chunk = chunks[index++];
      const key = `${code}:${chunk}`;
      try {
        onNotice(`Preparing ${name} narration…`);
        let blob = cache.get(key);
        if (!blob) {
          const data = await post({ action: "speak", text: chunk, language: code }, current);
          if (current !== token) return;
          blob = audioBlob(data);
          if (blob.size < 12000000) {
            while (cache.size && (cache.size >= 10 || cacheBytes + blob.size > 12000000)) {
              const oldest = cache.keys().next().value; cacheBytes -= cache.get(oldest).size; cache.delete(oldest);
            }
            cache.set(key, blob); cacheBytes += blob.size;
          }
        }
        if (current !== token) return;
        audioUrl = makeObjectURL(blob);
        audio = new AudioClass(audioUrl);
        audio.onended = next;
        audio.onerror = () => { if (current === token) { stopAll(); fail("Audio could not play. Check your speaker or try again."); } };
        await audio.play();
        if (current === token) { onNotice(`Reading in ${name}.`); onPlaybackStart(); }
      } catch (error) {
        if (current !== token) return;
        stopAll();
        fail(error.name === "NotAllowedError" ? "Tap the audio button to allow playback." : error.name === "AbortError" ? "Narration timed out. Please retry." : error.message || "Narration is unavailable.");
      }
    }
    await next();
  }
  function dispose() { stopAll(); cache.clear(); cacheBytes = 0; }
  return { startListening, finishListening, speak, stopAll, dispose };
}

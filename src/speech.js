export function speechText(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\d+\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/^[\s]*[>#*-]+\s*/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ").trim();
}

export function speechChunks(text, limit = 220) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let chunk = "";
  for (const word of words) {
    if (chunk && chunk.length + word.length + 1 > limit) {
      chunks.push(chunk);
      chunk = "";
    }
    chunk += (chunk ? " " : "") + word;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function matchingVoice(voices, locale) {
  const normalized = locale.toLowerCase().replaceAll("_", "-");
  const language = normalized.split("-")[0];
  return voices.find(v => v.lang.toLowerCase().replaceAll("_", "-") === normalized)
    || voices.find(v => v.lang.toLowerCase().split(/[-_]/)[0] === language);
}

const recognitionErrors = {
  "not-allowed": "Microphone access was denied. Allow it in browser settings, or type your question.",
  "service-not-allowed": "Speech input is unavailable in this browser. You can still type your question.",
  "audio-capture": "No microphone was found. Connect one, or type your question.",
  "network": "Speech input could not connect. Check your connection, or type your question.",
  "no-speech": "No speech was detected. Tap the microphone to try again.",
  "language-not-supported": "This browser cannot recognise the selected language. You can still type in it.",
};

// Browser engines are injected so permission failures and late callbacks are testable.
export function createSpeechSession({ Recognition, synthesis, Utterance, onState, onDraft, onNotice, startTimeoutMs = 12000 }) {
  let recognizer = null;
  let captureTimer;
  let stopTimer;
  let outputToken = 0;
  let utterance = null;
  let hasTranscript = false;
  const state = { listening: false, speakingId: null };
  const update = patch => { Object.assign(state, patch); onState({ ...state }); };
  const clearTimers = () => { clearTimeout(captureTimer); clearTimeout(stopTimer); };

  function cancelListening() {
    clearTimers();
    const previous = recognizer;
    recognizer = null;
    try { previous?.abort(); } catch { /* Already ended. */ }
    update({ listening: false });
  }
  function stopSpeaking() {
    outputToken++;
    utterance = null;
    synthesis?.cancel();
    update({ speakingId: null });
  }
  function stopAll() {
    cancelListening();
    stopSpeaking();
    onNotice("");
  }
  function finishListening() {
    if (!recognizer) return;
    try { recognizer.stop(); } catch { cancelListening(); }
    stopTimer = setTimeout(() => {
      cancelListening();
      onNotice(hasTranscript ? "Review your question, then press Send." : "No speech was returned. Check microphone permissions or try the site in Chrome or Edge.");
    }, 2000);
  }
  function startListening({ locale, prefix = "" }) {
    stopAll();
    hasTranscript = false;
    if (!Recognition) {
      onNotice("Speech input is unavailable in this browser. You can still type your question.");
      return;
    }
    let heard = false;
    let failed = false;
    try {
      const current = new Recognition();
      recognizer = current;
      current.lang = locale;
      current.continuous = false;
      current.interimResults = true;
      current.maxAlternatives = 1;
      current.onstart = () => {
        if (recognizer !== current) return;
        clearTimeout(captureTimer);
        captureTimer = setTimeout(finishListening, 25000);
        onNotice("Listening… tap the microphone to finish.");
      };
      current.onresult = event => {
        if (recognizer !== current) return;
        const text = Array.from(event.results).map(result => result[0].transcript).join(" ").trim();
        if (text) {
          heard = true;
          hasTranscript = true;
          onDraft([prefix.trim(), text].filter(Boolean).join(" ").slice(0, 1200));
        }
      };
      current.onerror = event => {
        if (recognizer !== current) return;
        failed = true;
        cancelListening();
        onNotice(recognitionErrors[event.error] || "Speech input stopped. Review your text or try again.");
      };
      current.onend = () => {
        if (recognizer !== current) return;
        recognizer = null;
        clearTimers();
        update({ listening: false });
        if (!failed) onNotice(heard ? "Review your question, then press Send." : "No speech was detected. Try again or type a question.");
      };
      update({ listening: true });
      onNotice("Allow microphone access when your browser asks.");
      captureTimer = setTimeout(() => {
        if (recognizer !== current) return;
        cancelListening();
        onNotice("Browser speech did not start. Check microphone permissions, or open the site in Chrome or Edge. Cloud voice is not connected yet.");
      }, startTimeoutMs);
      current.start();
    } catch {
      cancelListening();
      onNotice("The microphone could not start. Check browser permissions, or type your question.");
    }
  }
  function speak({ id, text, locale, name }) {
    stopAll();
    const voice = matchingVoice(synthesis?.getVoices() || [], locale);
    if (!synthesis || !Utterance || !voice) {
      onNotice(`No ${name} reading voice is available on this device. The written answer is still available.`);
      return;
    }
    const chunks = speechChunks(speechText(text));
    if (!chunks.length) return;
    const token = outputToken;
    update({ speakingId: id });
    onNotice(`Reading in ${name}.`);
    let index = 0;
    function next() {
      if (token !== outputToken) return;
      if (index >= chunks.length) {
        utterance = null;
        update({ speakingId: null });
        onNotice("");
        return;
      }
      utterance = new Utterance(chunks[index++]);
      utterance.voice = voice;
      utterance.lang = locale;
      utterance.rate = 0.95;
      utterance.onend = next;
      utterance.onerror = () => {
        if (token !== outputToken) return;
        stopSpeaking();
        onNotice("Audio could not start. Tap Read aloud to retry, or check your device’s voice settings.");
      };
      try { synthesis.speak(utterance); } catch { utterance.onerror(); }
    }
    next();
  }
  return { startListening, finishListening, cancelListening, speak, stopSpeaking, stopAll, dispose: stopAll };
}

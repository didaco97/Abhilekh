// Short ambient noises do not count as a question. A sustained signal followed
// by a pause finishes a turn; silence pauses the session without uploading it.
export function createBoundaryDetector({ threshold = 0.015, silenceMs = 1500, idleMs = 10000 } = {}) {
  let start, lastLoud, loudFrames = 0, heard = false, done = false;
  return (rms, now) => {
    if (done) return null;
    start ??= now;
    if (rms >= threshold) {
      loudFrames++;
      lastLoud = now;
      if (loudFrames >= 3) heard = true;
    } else if (!heard) loudFrames = 0;
    if (heard && now - lastLoud >= silenceMs) { done = true; return "finished"; }
    if (!heard && now - start >= idleMs) { done = true; return "empty"; }
    return null;
  };
}

export function monitorSpeechBoundary(stream, { onFinish, onEmpty, onUnavailable }, Context = globalThis.AudioContext || globalThis.webkitAudioContext) {
  if (!Context) { onUnavailable(); return () => {}; }
  let context, source, timer, stopped = false;
  const stop = () => {
    stopped = true; clearInterval(timer);
    try { source?.disconnect(); } catch { /* Already detached. */ }
    context?.close().catch(() => {});
  };
  try {
    context = new Context();
    source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser); // No speaker connection: never monitor the mic aloud.
    const samples = new Float32Array(analyser.fftSize);
    const detect = createBoundaryDetector();
    context.resume().then(() => {
      if (stopped) return;
      timer = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        const result = detect(rms, performance.now());
        if (result) { stop(); result === "finished" ? onFinish() : onEmpty(); }
      }, 100);
    }).catch(() => { if (!stopped) { stop(); onUnavailable(); } });
  } catch { stop(); onUnavailable(); }
  return stop;
}

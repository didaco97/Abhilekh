const neutral = Object.freeze({});
export function expressionAt(motion, seconds) {
  if (!motion || !Number.isFinite(seconds) || seconds < 0 || seconds >= motion.duration) return neutral;
  const position = seconds * motion.fps;
  const index = Math.min(Math.floor(position), motion.frames.length - 1);
  const next = Math.min(index + 1, motion.frames.length - 1);
  const fraction = position - Math.floor(position);
  return Object.fromEntries(motion.names.map((name, channel) => [name,
    motion.frames[index][channel] * (1 - fraction) + motion.frames[next][channel] * fraction]));
}

export function createLamController({ fetchImpl = fetch } = {}) {
  let audio = null, motion = null;
  const cache = new WeakMap();
  return {
    frame() { return audio && !audio.paused && !audio.ended ? expressionAt(motion, audio.currentTime) : neutral; },
    stop() { audio = null; motion = null; },
    speechOptions: {
      async preparePlayback({ blob, signal }) {
        if (cache.has(blob)) return cache.get(blob);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 8192)
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
        const response = await fetchImpl('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: btoa(binary), mimeType: 'audio/wav' }),
          signal: AbortSignal.any([signal, AbortSignal.timeout(50000)]) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'The avatar could not prepare a reply. Try voice conversation.');
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        if (data.fps !== 30 || !Number.isFinite(data.duration) || data.duration <= 0 || data.duration > 40 ||
            !Array.isArray(data.names) || data.names.length !== 52 || !data.names.every(name => /^[A-Za-z]+$/.test(name)) ||
            !Array.isArray(data.frames) || !data.frames.length || data.frames.length > 1201 ||
            data.frames.some(frame => !Array.isArray(frame) || frame.length !== 52 || frame.some(n => !Number.isFinite(n) || n < 0 || n > 1)))
          throw new Error('The avatar returned invalid motion. Try voice conversation.');
        cache.set(blob, data);
        return data;
      },
      onAudioStart(value) { audio = value.audio; motion = value.prepared; },
      onAudioStop() { audio = null; motion = null; },
    },
  };
}

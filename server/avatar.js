export const AVATAR_REQUEST_LIMIT = 5500000;
const reply = (status, data) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export function createAvatarService({ serviceUrl = '', token = '', assetUrl = '', name = 'Siddharth', fetchImpl = fetch } = {}) {
  const base = serviceUrl.replace(/\/$/, '');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return {
    async handle(request) {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return reply(403, { message: 'This request is not permitted.' });
      if (request.method === 'GET') {
        let workerReady = false;
        if (base) {
          try {
            const result = await fetchImpl(`${base}/health`, { headers, signal: AbortSignal.timeout(3500) });
            workerReady = result.ok && (await result.json()).ready === true;
          } catch { /* Optional worker may be offline. Existing voice remains available. */ }
        }
        return reply(200, { ready: workerReady && Boolean(assetUrl), workerReady, assetReady: Boolean(assetUrl),
          assetUrl: assetUrl || null, name, engine: 'LAM + Audio2Expression' });
      }
      if (request.method !== 'POST') return reply(405, { message: 'Use POST for avatar audio.' });
      if (!base) return reply(503, { message: 'Interactive avatar is not connected. Voice conversation is available.' });
      if (!(request.headers.get('content-type') || '').startsWith('application/json')) return reply(415, { message: 'Send JSON audio.' });
      if (Number(request.headers.get('content-length')) > AVATAR_REQUEST_LIMIT) return reply(413, { message: 'Please use a shorter spoken passage.' });
      try {
        const raw = await request.text();
        if (Buffer.byteLength(raw) > AVATAR_REQUEST_LIMIT) return reply(413, { message: 'Please use a shorter spoken passage.' });
        let input;
        try { input = JSON.parse(raw); } catch { return reply(400, { message: 'The audio request could not be read.' }); }
        if (input?.mimeType !== 'audio/wav' || typeof input.audio !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio))
          return reply(400, { message: 'Send WAV audio for facial animation.' });
        const audio = Buffer.from(input.audio, 'base64');
        if (audio.length < 44 || audio.length > 4000000 || audio.subarray(0, 4).toString() !== 'RIFF' || audio.subarray(8, 12).toString() !== 'WAVE')
          return reply(400, { message: 'The audio must be a short WAV passage.' });
        const result = await fetchImpl(`${base}/expressions`, { method: 'POST', headers: { ...headers, 'Content-Type': 'audio/wav' },
          body: audio, signal: AbortSignal.any([request.signal, AbortSignal.timeout(45000)]) });
        if (!result.ok) return reply(result.status === 429 ? 429 : 502, { message: 'The avatar could not prepare this reply. Please retry or use voice conversation.' });
        const data = await result.json();
        if (data.fps !== 30 || !Number.isFinite(data.duration) || data.duration <= 0 || data.duration > 40 ||
            !Array.isArray(data.names) || data.names.length !== 52 || !data.names.every(name => typeof name === 'string' && /^[A-Za-z]+$/.test(name)) ||
            !Array.isArray(data.frames) || !data.frames.length || data.frames.length > 1201 ||
            data.frames.some(frame => !Array.isArray(frame) || frame.length !== 52 || frame.some(n => !Number.isFinite(n) || n < 0 || n > 1)))
          return reply(502, { message: 'The avatar returned invalid motion data.' });
        return reply(200, { fps: data.fps, names: data.names, frames: data.frames, duration: data.duration });
      } catch {
        return reply(504, { message: 'The avatar took too long. Please retry or use voice conversation.' });
      }
    },
  };
}

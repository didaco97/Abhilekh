import test from 'node:test';
import assert from 'node:assert/strict';
import { createAvatarService, AVATAR_REQUEST_LIMIT } from '../server/avatar.js';
import { expressionAt, createLamController } from '../src/lam-controller.js';

const names = Array.from({ length: 52 }, (_, i) => `channel${String.fromCharCode(65 + i % 26)}`);
const motion = { fps: 30, names, duration: 1, frames: [Array(52).fill(0), Array(52).fill(1)] };
const wav = Buffer.alloc(100); wav.write('RIFF'); wav.write('WAVE', 8);
const input = { audio: wav.toString('base64'), mimeType: 'audio/wav' };
const request = (data = input, origin = 'https://archive.test') => new Request('https://archive.test/api/avatar', {
  method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(data),
});

test('avatar readiness distinguishes a running worker from the missing portrait', async () => {
  const service = createAvatarService({ serviceUrl: 'http://localhost:8765', token: 'secret', fetchImpl: async () => Response.json({ ready: true }) });
  const response = await service.handle(new Request('https://archive.test/api/avatar'));
  const status = await response.json();
  assert.equal(status.workerReady, true);
  assert.equal(status.assetReady, false);
  assert.equal(status.ready, false);
  assert.ok(!JSON.stringify(status).includes('secret'));
  assert.ok(!JSON.stringify(status).includes('localhost'));
});

test('avatar proxy bounds and validates audio before contacting the worker', async () => {
  let calls = 0;
  const service = createAvatarService({ serviceUrl: 'http://localhost:8765', fetchImpl: async () => { calls++; return Response.json(motion); } });
  assert.equal((await service.handle(request(input, 'https://other.test'))).status, 403);
  assert.equal((await service.handle(request({ ...input, mimeType: 'audio/mp3' }))).status, 400);
  assert.equal((await service.handle(request({ ...input, audio: 'A'.repeat(AVATAR_REQUEST_LIMIT) }))).status, 413);
  assert.equal(calls, 0);
});

test('avatar proxy sends only WAV bytes and its own worker credential', async () => {
  const service = createAvatarService({ serviceUrl: 'http://localhost:8765', token: 'private', fetchImpl: async (url, options) => {
    assert.equal(url, 'http://localhost:8765/expressions');
    assert.equal(options.headers.Authorization, 'Bearer private');
    assert.deepEqual(options.body, wav);
    return Response.json(motion);
  } });
  const response = await service.handle(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).frames.length, 2);
});

test('avatar proxy rejects malformed motion without exposing upstream details', async () => {
  for (const invalid of [{ frames: [[null]] }, { duration: 41 }, { duration: null }, { names: Array(52).fill({}) }]) {
    const service = createAvatarService({ serviceUrl: 'http://localhost:8765', fetchImpl: async () => Response.json({ ...motion, ...invalid, private: 'secret' }) });
    const response = await service.handle(request());
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes('secret'));
  }
});

test('expression timing follows the audio clock with interpolation and neutral endpoints', () => {
  assert.deepEqual(expressionAt(motion, -1), {});
  assert.equal(expressionAt(motion, 1 / 60).channelA, 0.5);
  assert.equal(expressionAt(motion, 0.5).channelA, 1);
  assert.deepEqual(expressionAt(motion, 1), {});
});

test('avatar preparation caches the same audio and returns to neutral when playback stops', async () => {
  let calls = 0;
  const controller = createLamController({ fetchImpl: async () => { calls++; return Response.json(motion); } });
  const blob = new Blob([wav], { type: 'audio/wav' });
  const signal = new AbortController().signal;
  const prepared = await controller.speechOptions.preparePlayback({ blob, signal });
  await controller.speechOptions.preparePlayback({ blob, signal });
  assert.equal(calls, 1);
  controller.speechOptions.onAudioStart({ audio: { currentTime: 1 / 60, paused: false, ended: false }, prepared });
  assert.equal(controller.frame().channelA, 0.5);
  controller.speechOptions.onAudioStop();
  assert.deepEqual(controller.frame(), {});
});

"""Local LAM Audio2Expression ONNX worker; no research or speech-provider keys needed."""
import argparse
import hmac
import io
import json
import math
import os
import threading
import time
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np
import onnxruntime as ort
from scipy.signal import resample_poly

NAMES = ['browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight',
         'cheekPuff','cheekSquintLeft','cheekSquintRight','eyeBlinkLeft','eyeBlinkRight',
         'eyeLookDownLeft','eyeLookDownRight','eyeLookInLeft','eyeLookInRight','eyeLookOutLeft',
         'eyeLookOutRight','eyeLookUpLeft','eyeLookUpRight','eyeSquintLeft','eyeSquintRight',
         'eyeWideLeft','eyeWideRight','jawForward','jawLeft','jawOpen','jawRight','mouthClose',
         'mouthDimpleLeft','mouthDimpleRight','mouthFrownLeft','mouthFrownRight','mouthFunnel',
         'mouthLeft','mouthLowerDownLeft','mouthLowerDownRight','mouthPressLeft','mouthPressRight',
         'mouthPucker','mouthRight','mouthRollLower','mouthRollUpper','mouthShrugLower',
         'mouthShrugUpper','mouthSmileLeft','mouthSmileRight','mouthStretchLeft','mouthStretchRight',
         'mouthUpperUpLeft','mouthUpperUpRight','noseSneerLeft','noseSneerRight','tongueOut']
MAX_AUDIO_BYTES = 4000000
MAX_SECONDS = 40


def decode_wav(data):
    if len(data) > MAX_AUDIO_BYTES:
        raise ValueError('Audio is too large.')
    with wave.open(io.BytesIO(data), 'rb') as wav:
        channels, rate, width, count = wav.getnchannels(), wav.getframerate(), wav.getsampwidth(), wav.getnframes()
        if channels not in (1, 2) or rate not in (16000, 22050, 24000, 44100, 48000) or width != 2:
            raise ValueError('Send a mono or stereo PCM16 WAV at a supported sample rate.')
        if not 0.05 <= count / rate <= MAX_SECONDS:
            raise ValueError('Audio must be between 0.05 and 40 seconds.')
        raw = wav.readframes(count)
        if len(raw) != count * channels * width:
            raise ValueError('The WAV file is incomplete.')
        audio = np.frombuffer(raw, dtype='<i2').astype(np.float32).reshape(-1, channels).mean(axis=1) / 32768.0
    if rate != 16000:
        factor = math.gcd(rate, 16000)
        audio = resample_poly(audio, 16000 // factor, rate // factor).astype(np.float32)
    return audio, count / rate


class ExpressionModel:
    def __init__(self, path, threads=4):
        options = ort.SessionOptions()
        options.intra_op_num_threads = threads
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(str(path), options, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        self.run(np.zeros(16000, dtype=np.float32))

    def run(self, audio):
        result = self.session.run([self.output_name], {self.input_name: audio[np.newaxis].astype(np.float32)})[0][0]
        if result.ndim != 2 or result.shape[1] != 52 or not np.isfinite(result).all():
            raise ValueError('The expression model returned invalid frames.')
        return np.clip(result, 0, 1)

    def expressions(self, audio):
        # Bounded context windows avoid quadratic memory growth on a long TTS reply.
        frames = []
        for offset in range(0, len(audio), 16000):
            count = min(16000, len(audio) - offset)
            start, end = max(0, offset - 3200), min(len(audio), offset + count + 3200)
            window = audio[start:end]
            if len(window) < 16000:
                window = np.pad(window, (0, 16000 - len(window)))
            result = self.run(window)
            first = round((offset - start) * 30 / 16000)
            wanted = math.ceil(count * 30 / 16000)
            part = result[first:first + wanted]
            if len(part) < wanted:
                part = np.concatenate([part, np.repeat(result[-1:], wanted - len(part), axis=0)])
            # Close the mouth during silence; coefficients still come from the model for speech.
            for index in range(len(part)):
                section = audio[offset + int(index * 16000 / 30):offset + int((index + 1) * 16000 / 30)]
                if len(section) and np.sqrt(np.mean(section * section)) < 0.002:
                    part[index, 22:49] = 0
            frames.extend(np.round(part, 5).tolist())
        return frames


def serve(model, host='127.0.0.1', port=8765, token=''):
    if host not in ('127.0.0.1', 'localhost', '::1') and len(token) < 24:
        raise ValueError('Set AVATAR_SERVICE_TOKEN (24+ characters) before binding beyond localhost.')
    busy = threading.BoundedSemaphore(1)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Do not retain audio, transcripts, credentials or request logs.

        def send_json(self, status, payload):
            body = json.dumps(payload, separators=(',', ':')).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def authorized(self):
            return not token or hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + token)

        def do_GET(self):
            if not self.authorized():
                return self.send_json(401, {'message': 'Unauthorized.'})
            if self.path != '/health':
                return self.send_json(404, {'message': 'Not found.'})
            self.send_json(200, {'ready': True, 'engine': 'lam-a2e-onnx', 'device': 'cpu', 'fps': 30})

        def do_POST(self):
            if not self.authorized():
                return self.send_json(401, {'message': 'Unauthorized.'})
            if self.path != '/expressions':
                return self.send_json(404, {'message': 'Not found.'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
            except ValueError:
                return self.send_json(400, {'message': 'Invalid content length.'})
            if not 1 <= length <= MAX_AUDIO_BYTES:
                return self.send_json(413, {'message': 'Send a shorter audio passage.'})
            if self.headers.get('Content-Type', '').split(';')[0] != 'audio/wav':
                return self.send_json(415, {'message': 'Send PCM16 WAV audio.'})
            if not busy.acquire(blocking=False):
                return self.send_json(429, {'message': 'The avatar is busy. Please retry.'})
            try:
                self.connection.settimeout(10)
                audio, duration = decode_wav(self.rfile.read(length))
                started = time.perf_counter()
                frames = model.expressions(audio)
                self.send_json(200, {'fps': 30, 'names': NAMES, 'frames': frames, 'duration': duration,
                                     'inferenceMs': round((time.perf_counter() - started) * 1000)})
            except (ValueError, wave.Error, EOFError):
                self.send_json(400, {'message': 'The audio could not be read.'})
            except Exception:
                self.send_json(502, {'message': 'Expression generation failed.'})
            finally:
                busy.release()

    server = ThreadingHTTPServer((host, port), Handler)
    print(json.dumps({'ready': True, 'url': f'http://{host}:{port}', 'engine': 'lam-a2e-onnx'}), flush=True)
    server.serve_forever()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default=str(Path(__file__).resolve().parents[2] / 'tmp/lam/models/wav2arkit_cpu.onnx'))
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--threads', type=int, default=4)
    args = parser.parse_args()
    serve(ExpressionModel(args.model, args.threads), args.host, args.port, os.environ.get('AVATAR_SERVICE_TOKEN', ''))

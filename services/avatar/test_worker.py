import io
import unittest
import wave
import numpy as np
from worker import decode_wav, ExpressionModel


class AvatarAudioTests(unittest.TestCase):
    def make_wav(self, seconds=1, channels=1):
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav:
            wav.setnchannels(channels)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            wav.writeframes(np.zeros(round(seconds * 24000) * channels, dtype='<i2').tobytes())
        return buffer.getvalue()

    def test_stereo_wav_resamples_to_mono_16khz(self):
        audio, duration = decode_wav(self.make_wav(channels=2))
        self.assertEqual(audio.shape, (16000,))
        self.assertEqual(duration, 1)

    def test_overlong_audio_rejected_before_inference(self):
        with self.assertRaises(ValueError):
            decode_wav(self.make_wav(41))

    def test_incomplete_wav_rejected(self):
        with self.assertRaises(ValueError):
            decode_wav(self.make_wav()[:-20])

    def test_context_windows_cover_partial_final_second(self):
        model = object.__new__(ExpressionModel)
        windows = []
        def run(audio):
            windows.append(len(audio))
            return np.ones((round(len(audio) / 16000 * 30), 52), dtype=np.float32)
        model.run = run
        frames = model.expressions(np.ones(40000, dtype=np.float32) * 0.1)
        self.assertEqual(len(frames), 75)
        self.assertTrue(all(size <= 22400 for size in windows))
        self.assertTrue(all(len(frame) == 52 for frame in frames))


if __name__ == '__main__':
    unittest.main()

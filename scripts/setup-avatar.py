"""Download the pinned CPU model to the ignored local cache, verifying SHA-256."""
import hashlib
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REVISION = '48b7d27a147d4dfcce4c8225b11209ce4cd76e05'
FILES = {
    'wav2arkit_cpu.onnx': 'cdecbfad3915dd20b2f0718942d0b8894b2ee11edcc5a9a9da45d29a46af2ed9',
    'wav2arkit_cpu.onnx.data': 'c0f0364673c6e50be126b193e2b56809c16ac6bee4805aea9b8251ce53429bf8',
}

if __name__ == '__main__':
    destination = ROOT / 'tmp/lam/models'
    destination.mkdir(parents=True, exist_ok=True)
    for name, digest in FILES.items():
        path = destination / name
        if not path.exists():
            print(f'Downloading {name}...', flush=True)
            partial = path.with_suffix(path.suffix + '.part')
            with urllib.request.urlopen(f'https://huggingface.co/myned-ai/wav2arkit_cpu/resolve/{REVISION}/{name}', timeout=60) as response, partial.open('wb') as out:
                while block := response.read(1024 * 1024):
                    out.write(block)
            partial.replace(path)
        with path.open('rb') as source:
            if hashlib.file_digest(source, 'sha256').hexdigest() != digest:
                raise RuntimeError(f'Checksum mismatch: {name}. Do not load this file.')
        print(f'Verified {name}: {path.stat().st_size:,} bytes', flush=True)
    print('Ready. Start with npm run avatar:worker.', flush=True)

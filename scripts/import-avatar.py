"""Validate a LAM chat-avatar ZIP and connect it locally as Siddharth."""
import argparse
from pathlib import Path, PurePosixPath
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path)
    args = parser.parse_args()
    source = args.archive.resolve(strict=True)
    if source.stat().st_size > 30000000:
        raise ValueError('Avatar ZIP exceeds the 30 MB prototype limit.')
    with zipfile.ZipFile(source) as archive:
        entries = archive.infolist()
        if sum(entry.file_size for entry in entries) > 256000000:
            raise ValueError('Avatar ZIP expands beyond the prototype limit.')
        for entry in entries:
            path = PurePosixPath(entry.filename.replace('\\', '/'))
            if path.is_absolute() or '..' in path.parts:
                raise ValueError('Unsafe ZIP path.')
        files = {PurePosixPath(entry.filename).name for entry in entries}
        required = {'skin.glb', 'offset.ply', 'vertex_order.json'}
        if not required.issubset(files):
            raise ValueError('Export a Chatting Avatar ZIP, not a rendered video or checkpoint.')
    target = ROOT / 'public/avatars/siddharth.zip'
    target.parent.mkdir(parents=True, exist_ok=True)
    if source != target.resolve():
        if target.exists():
            raise ValueError('A Siddharth avatar already exists. Preserve or rename it before importing another.')
        shutil.copy2(source, target)
    settings = {'AVATAR_SERVICE_URL': 'http://127.0.0.1:8765', 'AVATAR_ASSET_URL': '/avatars/siddharth.zip', 'AVATAR_NAME': 'Siddharth'}
    env = ROOT / '.env.local'
    lines = env.read_text(encoding='utf-8').splitlines() if env.exists() else []
    present = set()
    for index, line in enumerate(lines):
        name = line.split('=', 1)[0].strip()
        if name in settings:
            lines[index] = f'{name}={settings[name]}'
            present.add(name)
    lines.extend(f'{name}={value}' for name, value in settings.items() if name not in present)
    env.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('Siddharth imported. Restart the development server and start the avatar worker.')

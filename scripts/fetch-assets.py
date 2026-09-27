from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request, re, html

root = Path(__file__).resolve().parents[1]
assets = root / 'public' / 'images'
assets.mkdir(parents=True, exist_ok=True)

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Abhilekh-Educational-Prototype/0.1'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def image_job(name, url):
    try:
        if 'commons.wikimedia.org/wiki/' in url:
            page = fetch(url).decode()
            match = re.search(r'<div class="fullImageLink"[^>]*>\s*<a href="([^"]+)"', page)
            if not match:
                raise ValueError('Original image link not found')
            url = html.unescape(match.group(1))
        data = fetch(url)
        (assets / name).write_bytes(data)
        return f'{name}: {len(data)} bytes'
    except Exception as e:
        return f'{name}: {type(e).__name__}: {e}'

jobs = [
    ('ambedkar-portrait.jpg', 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Dr._Bhimrao_Ambedkar.jpg'),
    ('drafting-committee.jpg', 'https://upload.wikimedia.org/wikipedia/commons/8/88/Drafting_Committee_for_the_Constitution_of_India._Dr._B._R._Ambedkar_in_the_center.jpg'),
    ('ambedkar-student.jpg', 'https://commons.wikimedia.org/wiki/File:Dr._Babasaheb_Ambedkar_in_Columbia_University.jpg'),
]
with ThreadPoolExecutor(max_workers=3) as pool:
    for result in pool.map(lambda args: image_job(*args), jobs):
        print(result, flush=True)

try:
    path = root / 'research'
    path.mkdir(exist_ok=True)
    data = fetch('https://eparlib.sansad.in/bitstream/123456789/782459/1/Golden_Jubilee_Republic_of_India.pdf')
    if not data.startswith(b'%PDF'):
        raise ValueError('Response is not a PDF')
    (path / 'parliament-proceedings.pdf').write_bytes(data)
    print(f'Parliament PDF: {len(data)} bytes', flush=True)
except Exception as e:
    print(f'Parliament PDF: {type(e).__name__}: {e}', flush=True)

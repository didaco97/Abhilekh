from pathlib import Path
import urllib.request
from concurrent.futures import ThreadPoolExecutor

root = Path(__file__).resolve().parents[1] / 'research'
root.mkdir(exist_ok=True)
jobs = [
  ('practice-procedure.pdf', 'https://sansad.in/uploads/Practice_and_Procedure_Hindi_87d58a6109.pdf?updated_at=2022-09-13T06%3A19%3A47.033Z'),
  ('selected-works.pdf', 'https://judicialacademy.nic.in/sites/default/files/1458100182_selected%20work%20of%20Dr%20B%20Rambedkar.pdf'),
]
def download(job):
    name, url = job
    try:
        request = urllib.request.Request(url, headers={'User-Agent':'AbhilekhPrototype/0.1'})
        with urllib.request.urlopen(request, timeout=20) as response:
            data = response.read(50000000)
        if not data.startswith(b'%PDF'):
            raise ValueError('Not a PDF response')
        (root/name).write_bytes(data)
        return f'{name}: {len(data)} bytes'
    except Exception as exc:
        return f'{name}: {type(exc).__name__}: {exc}'
with ThreadPoolExecutor(max_workers=2) as pool:
    for result in pool.map(download,jobs): print(result,flush=True)

from pathlib import Path
from pypdf import PdfReader
import sys
sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[1]
for file in (root/'research').glob('*.pdf'):
    reader = PdfReader(file)
    print(file.name, 'pages:', len(reader.pages))
    hits=0
    selected = reader.pages[:8] if file.name=='practice-procedure.pdf' else reader.pages
    for i,page in enumerate(selected):
        text=page.extract_text() or ''
        normalized=' '.join(text.split())
        if 'political democracy' in normalized.lower() or 'working of a constitution' in normalized.lower():
            print('PDF PAGE',i+1,normalized[:2200])
            hits+=1
            if hits==3: break
try:
    import fitz
    print('PyMuPDF available')
except ImportError:
    print('PyMuPDF unavailable')

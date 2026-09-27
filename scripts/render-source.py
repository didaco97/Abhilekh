from pathlib import Path
import sys
import json
import pypdfium2 as pdfium
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[1]
doc=pdfium.PdfDocument(root/'research'/'selected-works.pdf')
print('Selected works pages:',len(doc),flush=True)
hits=[]
for i in range(len(doc)):
    page=doc[i]
    textpage=page.get_textpage()
    text=textpage.get_text_range()
    flat=' '.join(text.split())
    if 'political democracy cannot last' in flat.lower() or 'social democracy as well' in flat.lower():
        hits.append({'pdfPage':i+1,'text':flat})
        print('HIT',i+1,flat[:2600],flush=True)
        image=page.render(scale=1.8).to_pil()
        image.convert('RGB').save(root/'public'/'images'/f'selected-works-page-{i+1}.jpg',quality=88)
    textpage.close()
    page.close()
    if len(hits)==3: break
(root/'research'/'source-pages.json').write_text(json.dumps(hits,indent=2,ensure_ascii=False),encoding='utf-8')
print('done',flush=True)

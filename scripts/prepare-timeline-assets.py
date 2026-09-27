"""Prepare generated decorative miniatures and an unchanged archival portrait cutout."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root=Path(__file__).resolve().parents[1]
target=root/'public/images/timeline'
target.mkdir(parents=True,exist_ok=True)
atlas=Image.open(root/'output/imagegen/timeline-dioramas-alpha-v1.png').convert('RGBA')
w,h=atlas.size
names=['beginnings','columbia','london','mahad','republic','legacy']
for i,name in enumerate(names):
    row,col=divmod(i,3)
    tile=atlas.crop((round(col*w/3),round(row*h/2),round((col+1)*w/3),round((row+1)*h/2)))
    box=tile.getchannel('A').point(lambda x:255 if x>35 else 0).getbbox()
    tile=tile.crop(box)
    tile.thumbnail((620,620),Image.Resampling.LANCZOS)
    # Equal, bottom-aligned canvases keep objects resting on their CSS plinths.
    canvas=Image.new('RGBA',(660,640),(0,0,0,0))
    canvas.alpha_composite(tile,((660-tile.width)//2,640-tile.height-8))
    canvas.save(target/f'{name}.png',optimize=True)
    canvas.save(target/f'{name}.webp',quality=86,method=6)

portrait=Image.open(root/'public/images/ambedkar-portrait.jpg').convert('RGBA')
mask=Image.new('L',portrait.size,0)
# This matte follows the original photograph. It does not regenerate the face.
outline=[(0,1208),(94,1172),(190,1138),(258,1094),(272,1050),(279,1005),
 (270,960),(249,905),(233,852),(207,832),(172,791),(158,750),(151,689),
 (146,636),(145,601),(139,570),(147,532),(154,474),(154,402),(157,350),
 (174,303),(207,249),(245,208),(290,162),(348,126),(409,94),(475,67),
 (538,47),(586,40),(645,53),(704,76),(759,101),(805,135),(843,180),
 (868,231),(885,287),(908,341),(935,388),(960,423),(978,461),(986,502),
 (1000,538),(1029,558),(1027,575),(1006,584),(997,636),(979,678),
 (974,722),(956,761),(947,809),(938,851),(934,892),(930,935),(918,980),
 (908,1020),(901,1057),(904,1080),(1002,1106),(1095,1133),(1229,1169),
 (1229,1600),(0,1600)]
ImageDraw.Draw(mask).polygon(outline,fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(1.2))
portrait.putalpha(mask)
portrait.thumbnail((900,1100),Image.Resampling.LANCZOS)
portrait.save(target/'ambedkar-cutout.png',optimize=True)
portrait.save(target/'ambedkar-cutout.webp',quality=89,method=6)
print('Prepared six transparent decorative PNGs and the archival portrait cutout.')

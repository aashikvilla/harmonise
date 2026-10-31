from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[3]
C=ROOT/'demo-iterations/v39/capture'; S=C/'source'; G=C/'generated'; G.mkdir(parents=True,exist_ok=True)
W,H=1920,1080; CREAM='#f4f3ee'; INK='#173f3b'; SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font36=ImageFont.truetype(BOLD,36); font34=ImageFont.truetype(BOLD,34)
APP=(160,90,1600,875)
def load(n): return Image.open(S/n).convert('RGB')
def crop(im,box): return im.crop(box)
def contain(im,box):
 x,y,w,h=box; scale=min(w/im.width,h/im.height); sz=(round(im.width*scale),round(im.height*scale)); im=im.resize(sz,Image.Resampling.LANCZOS); return im,(x+(w-sz[0])//2,y+(h-sz[1])//2)
def wrap_draw(draw,text,y,font=font36,max_width=1740,leading=44):
 words=text.split(); lines=[]; line=''
 for word in words:
  candidate=(line+' '+word).strip()
  if draw.textbbox((0,0),candidate,font=font)[2] <= max_width: line=candidate
  else:
   if line: lines.append(line)
   line=word
 if line: lines.append(line)
 for line in lines: draw.text(((W-draw.textbbox((0,0),line,font=font)[2])//2,y),line,font=font,fill=INK); y+=leading
 return y

def scene(name,src,disclosure=None,cropbox=None,area=APP):
 im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im)
 if disclosure: wrap_draw(d,disclosure,18)
 source=load(src)
 if cropbox: source=crop(source,cropbox)
 source,pos=contain(source,area); im.paste(source,pos); im.save(G/name,optimize=True)
# Opening: crop is solely actual app, retaining the true fictional Arjun label and dilemma.
scene('01-opening.png','entry-screen.png',None,(286,8,1635,520),(190,190,1540,540))
# Actual local reflection state. Promise and model-role disclosures sit in blank top margin.
scene('02-private-reflection.png','source-updated-reflection-viewport.png',None,(360,275,1300,780),(160,90,1600,875))
im=Image.open(G/'02-private-reflection.png').convert('RGB'); d=ImageDraw.Draw(im)
for text,y in [('Private reflection you can correct before exploring peer experiences.',0),('Planned Muse Spark · not connected · Prepared local text',40)]:
 box=d.textbbox((0,0),text,font=font36); d.text(((W-(box[2]-box[0]))//2,y),text,font=font36,fill=INK)
im.save(G/'02-private-reflection.png',optimize=True)
# Actual prepared community element captures at device scale 2.
scene('03-peer-perspective.png','peer-day4-posts-768-dpr2.png','Fictional community · prepared example · no live members')
scene('04-host-boundary.png','host-boundary-768-dpr2.png','Fictional community · prepared example · no live members')
# Adjacent crops from the exact same actual local preview state; no state change is synthesized.
scene('05-share-audience.png','share-preview-panel-768-dpr2.png','Prepared preview · no message service connected',(0,0,1168,550))
scene('06-share-draft.png','share-preview-panel-768-dpr2.png','Fictional group · QuietRiver alias · exact local draft',(0,250,1168,650))
scene('07-share-consent.png','share-preview-panel-768-dpr2.png','Private conversation and context are excluded',(0,490,1168,1028))
scene('08-share-unsent.png','share-preview-panel-768-dpr2.png','Nothing is sent from this preview · no service connected',(0,490,1168,1028))
scene('09-provider.png','provider-unavailable-768-dpr2.png','No provider is verified or bookable here')
scene('10-maybe-later-selected.png','maybe-later-selected-768-dpr2.png','Fictional scenario · private reflection stays private · draft not sent')
# An overlay only in the reserved blank margin above the continuous actual app recording.
header=Image.new('RGBA',(W,H),(0,0,0,0)); hd=ImageDraw.Draw(header); wrap_draw(hd,'Fictional scenario · prepared local text · no model connected',18,font36)
header.save(G/'correction-disclosure.png')
# Save a contact sheet of prepared source frames for edit planning.
files=sorted(p for p in G.glob('*.png') if p.name!='correction-disclosure.png')
thumbs=[]
for p in files:
 im=Image.open(p).convert('RGB'); im.thumbnail((480,270)); thumbs.append((p.name,im.copy()))
sheet=Image.new('RGB',(1000,((len(thumbs)+1)//2)*300),CREAM); sd=ImageDraw.Draw(sheet); label=ImageFont.truetype(BOLD,18)
for i,(n,im) in enumerate(thumbs):
 x=(i%2)*500; y=(i//2)*300; sheet.paste(im,(x,y+26)); sd.text((x+8,y+3),n,font=label,fill=INK)
sheet.save(C/'generated-contact-sheet.jpg',quality=90)

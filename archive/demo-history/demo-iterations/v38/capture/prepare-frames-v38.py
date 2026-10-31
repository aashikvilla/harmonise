from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[3]; CAP=ROOT/'demo-iterations/v38/capture'; SRC=CAP/'source'; GEN=CAP/'generated'; GEN.mkdir(exist_ok=True)
W,H=1920,1080; CREAM='#f4f3ee'; INK='#173f3b'; MUTED='#52605b'; WHITE='#ffffff'; BORDER='#b8c8bf'; SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; SERIF='/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
def f(size,b=False,serif=False): return ImageFont.truetype(SERIF if serif else (BOLD if b else SANS),size)
def txt(d,s,xy,size=24,color=INK,b=False,serif=False): d.text(xy,s,font=f(size,b,serif),fill=color)
def save(im,n): im.save(GEN/n,optimize=True)
def fit(im,src,box):
 s=Image.open(src).convert('RGB'); x,y,w,h=box; r=min(w/s.width,h/s.height); s=s.resize((round(s.width*r),round(s.height*r)),Image.Resampling.LANCZOS); im.paste(s,(x+(w-s.width)//2,y+(h-s.height)//2))
def frame(name,heading,src,copyline='',bodybox=(155,210,1610,600)):
 im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK); txt(d,heading,(120,65),25,INK,True); d.rounded_rectangle((100,125,1820,870),16,WHITE,BORDER,2); fit(im,src,bodybox)
 if copyline: txt(d,copyline,(120,905),24,MUTED)
 save(im,name)
# True entry screen, close crop of the real dilemma, with requested audience/promise copy.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK)
entry=Image.open(SRC/'entry-screen.png').convert('RGB').crop((320,95,1510,500)); entry=entry.resize((1540,524),Image.Resampling.LANCZOS); im.paste(entry,(190,70))
d.rounded_rectangle((180,640,1740,940),18,'#e6eee8',INK,3)
txt(d,'Harmonise',(240,680),45,INK,True); txt(d,'For adults facing family pressure.',(240,745),34,INK,True); txt(d,'Think it through privately, correct the reflection, then choose whether to share.',(240,810),27,INK)
txt(d,'Fictional scenario · Arjun',(240,845),23,MUTED,True)
save(im,'01-entry-hook.png')
# Reflection promise and distinct, stable model disclosure strip.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,145),fill=INK); txt(d,'Planned · Muse Spark role',(80,22),38,WHITE,True); txt(d,'Local prototype · no model connected',(80,78),38,WHITE,True); txt(d,'PRIVATE REFLECTION YOU CAN CORRECT',(120,168),36,INK,True); d.rounded_rectangle((100,215,1820,900),16,WHITE,BORDER,2); reflection=Image.open(SRC/'source-proposed-reflection.png').convert('RGB').crop((300,350,1400,835)); reflection=reflection.resize((1610,680),Image.Resampling.LANCZOS); im.paste(reflection,(155,220)); save(im,'02-private-reflection.png')
# One compact prepared peer card, exact requested wording.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK); txt(d,'ONE PREPARED PEER PERSPECTIVE',(125,70),26,INK,True)
d.rounded_rectangle((175,185,1745,755),24,WHITE,BORDER,3); txt(d,'“One member wanted time to choose.”',(250,320),54,INK,False,True); txt(d,'Prepared fictional example · no live members or moderator',(250,565),27,MUTED,True); save(im,'03-peer-perspective.png')
frame('04-host-boundary.png','A BOUNDARY FROM THE PREPARED EXAMPLE',SRC/'peer-two-day9-host.png','Prepared fictional example · no live members or moderator',(190,175,1540,650))
# Two focus states from the same real current frontend share preview, retaining exact consent status.
for name,source,heading in [('05-share-audience.png','share-preview-panel.png','GROUP AUDIENCE · ALIAS · EXACT DRAFT'),('06-share-draft.png','share-preview-draft-focus.png','PRIVATE CONVERSATION AND CONTEXT ARE EXCLUDED'),('07-share-consent.png','share-preview-consent-focus.png','CONSENT UNCHECKED · CONTINUE DISABLED')]:
 im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK); txt(d,heading,(72,34),36,INK,True); txt(d,'Prepared local preview · no message service connected',(72,82),36,INK,True); panel=Image.open(SRC/source).convert('RGB').resize((1760,768),Image.Resampling.LANCZOS); im.paste(panel,(80,145)); save(im,name)
# Provider notice kept as one brief card.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK); d.rounded_rectangle((180,250,1740,750),24,WHITE,BORDER,3); txt(d,'No provider is verified or bookable here.',(245,420),44,INK,True); save(im,'08-provider-caveat.png')
# End on actual private selected Maybe later state; same screen holds all way to last frame.
frame('09-maybe-later-selected.png','MAYBE LATER · PRIVATE REFLECTION · DRAFT NOT SHARED',SRC/'maybe-later-selected.png','Private reflection · draft not shared',(140,150,1640,710))

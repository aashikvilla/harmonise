#!/usr/bin/env python3
"""Build v37 editorial cards around current-app captures; all UI crops come from the local frontend."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[3]
CAP=ROOT/'demo-iterations/v37/capture'; SRC=CAP/'source'; GEN=CAP/'generated'
GEN.mkdir(parents=True,exist_ok=True)
W,H=1920,1080
CREAM='#f4f3ee'; WHITE='#ffffff'; INK='#173f3b'; MINT='#e6eee8'; MUTED='#52605b'; BORDER='#b8c8bf'; GOLD='#a8854f'
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; SERIF='/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(path,size): return ImageFont.truetype(path,size)
def label(draw,text,x,y,size=24,color=INK,ft=BOLD): draw.text((x,y),text,font=font(ft,size),fill=color)
def rounded(draw,box,radius,fill,outline=None,width=1): draw.rounded_rectangle(box,radius,fill=fill,outline=outline,width=width)
def save(img,name): img.save(GEN/name,optimize=True)
def paste_fit(canvas,source,box,pad=0,upscale=True):
    im=Image.open(source).convert('RGB')
    x,y,bw,bh=box
    ratio=min(bw/im.width,bh/im.height)
    if not upscale: ratio=min(1.0,ratio)
    sz=(int(im.width*ratio),int(im.height*ratio)); im=im.resize(sz,Image.Resampling.LANCZOS)
    px=x+(bw-sz[0])//2; py=y+(bh-sz[1])//2
    canvas.paste(im,(px,py)); return (px,py,*sz)
# Opening: fictional first-person line, no depicted or implied real person.
im=Image.new('RGB',(W,H),INK); d=ImageDraw.Draw(im)
d.rectangle((0,0,W,10),fill='#c6a578')
label(d,'FICTIONAL SCENARIO  ·  ARJUN',150,120,25,'#dce7df')
d.line((150,195,355,195),fill='#88a79b',width=4)
for i,t in enumerate(['I can’t tell my family what I want','without feeling ungrateful.']):
    d.text((145,280+i*104),t,font=font(SERIF,74),fill=WHITE)
d.text((150,555),'A moment before a difficult family conversation.',font=font(SANS,28),fill='#cdd9d2')
d.text((150,890),'HARMONISE',font=font(BOLD,20),fill='#dce7df')
save(im,'01-opening-fictional-quote.png')
# Product promise: crop the exact first-use screen from the current frontend.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im)
d.rectangle((0,0,W,12),fill=INK)
screen=Image.open(SRC/'entry-screen.png').convert('RGB').crop((230,0,1690,540))
screen=screen.resize((1600,592),Image.Resampling.LANCZOS)
rounded(d,(130,145,1790,790),12,WHITE,BORDER,2); im.paste(screen,(160,170))
label(d,'LOCAL PROTOTYPE  ·  NO MODEL CONNECTED',150,840,24,INK)
d.text((150,882),'Prepared examples only.',font=font(SANS,23),fill=MUTED)
save(im,'02-product-promise.png')
# Two expressly prepared fictional perspective cards; no names, avatars, or implied real testimonials.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK)
label(d,'PREPARED FICTIONAL PERSPECTIVES  ·  NO LIVE MEMBERS OR MODERATOR',125,82,23,INK)
rounded(d,(120,150,930,780),18,WHITE,BORDER,2); rounded(d,(990,150,1800,780),18,WHITE,BORDER,2)
label(d,'ONE PERSON’S PATH',175,205,22,MUTED)
d.text((175,280),'“I chose to talk with my',font=font(SERIF,42),fill=INK)
d.text((175,345),'parents early; that helped me.”',font=font(SERIF,42),fill=INK)
d.line((175,445,845,445),fill=BORDER,width=2)
d.text((175,475),'Prepared perspective · fictional',font=font(SANS,23),fill=MUTED)
label(d,'ANOTHER PATH',1045,205,22,MUTED)
d.text((1045,280),'“Asking for a pause helped me',font=font(SERIF,37),fill=INK)
d.text((1045,338),'finish a thought. It didn’t settle',font=font(SERIF,37),fill=INK)
d.text((1045,396),'the bigger question.”',font=font(SERIF,37),fill=INK)
d.line((1045,470,1715,470),fill=BORDER,width=2)
d.text((1045,500),'Prepared perspective · fictional',font=font(SANS,23),fill=MUTED)
rounded(d,(120,820,1800,902),14,MINT,None,1)
d.text((155,843),'These perspectives may not fit Arjun. They are possibilities, not advice.',font=font(SANS,25),fill=INK)
save(im,'03-peer-perspectives.png')
def screen_frame(name,label_text,source,max_width,max_height,top=170):
    im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK)
    label(d,label_text,125,92,25,INK)
    rounded(d,(120,top-24,1800,top+max_height+32),16,WHITE,BORDER,2)
    paste_fit(im,source,(155,top,1610,max_height),upscale=True)
    d.text((125,900),'Prepared fictional content  ·  No live members or moderator',font=font(SANS,21),fill=MUTED)
    save(im,name)
# The moderator boundary itself is captured from the current frontend; only its crop is framed.
screen_frame('04-moderator-boundary.png','A HUMAN ROLE, SHOWN AS PREPARED FICTION',SRC/'peer-two-day9-host.png',1550,500,270)
# Share preview. Different focus frames are genuine screenshots of the same local UI panel.
def share_frame(name, source, kicker):
    im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK)
    label(d,kicker,120,78,23,INK)
    rounded(d,(105,145,1815,920),16,WHITE,BORDER,2)
    paste_fit(im,source,(140,175,1640,700),upscale=True)
    d.text((120,926),'EXACT LOCAL PREVIEW  ·  CONSENT UNCHECKED  ·  NOTHING SENT',font=font(BOLD,20),fill=INK)
    save(im,name)
share_frame('05-share-audience.png',SRC/'share-preview-panel.png','REVIEW THE GROUP AND THE EXACT DRAFT')
share_frame('06-share-draft-focus.png',SRC/'share-preview-draft-focus.png','PRIVATE CONVERSATION EXCLUDED')
share_frame('07-share-consent-focus.png',SRC/'share-preview-consent-focus.png','CONSENT STAYS UNCHECKED')
# Compact provider boundary from current UI.
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK)
label(d,'SUPPORT AVAILABILITY',125,100,25,INK)
provider=Image.open(SRC/'provider-no-verified.png').convert('RGB').crop((250,100,1670,670))
provider=provider.resize((1515,608),Image.Resampling.LANCZOS)
rounded(d,(190,165,1730,830),16,WHITE,BORDER,2); im.paste(provider,(202,172))
d.text((125,875),'No provider directory or credential checks are connected.',font=font(SANS,21),fill=MUTED)
save(im,'08-no-verified-provider.png')
# The actual Maybe later selection and actual final unconsented, private+draft summary.
screen_frame('09-maybe-later-selected.png','MAYBE LATER · THE PRIVATE REFLECTION STAYS PRIVATE',SRC/'maybe-later-selected.png',1500,500,260)
im=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(im); d.rectangle((0,0,W,12),fill=INK)
label(d,'FICTIONAL LOCAL PREVIEW  ·  PRIVATE TAKEAWAY + UNSENT DRAFT',105,62,22,INK)
rounded(d,(90,120,1830,710),16,WHITE,BORDER,2)
paste_fit(im,SRC/'final-private-and-unsent.png',(125,145,1670,490),upscale=True)
d.text((105,760),'Your words. Your timing. Nothing sent.',font=font(SERIF,48),fill=INK)
d.text((105,835),'Fictional scenario · local prototype · no model or service connected',font=font(SANS,23),fill=MUTED)
save(im,'10-final-private-unsent.png')
print(f'Created editorial frames in {GEN}')

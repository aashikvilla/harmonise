#!/usr/bin/env python3
"""Render v29 from the recorded v27 frontend session plus clearly editorial cards."""
from pathlib import Path
import json, subprocess, hashlib
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
ITER = ROOT / 'demo-iterations' / 'v29'
CAP = ITER / 'capture'
REL = ITER / 'verification' / 'release'
CAP.mkdir(parents=True, exist_ok=True); REL.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'demo-iterations' / 'v27' / 'capture' / 'video' / 'v27-real-product-session.webm'
OUT = ITER / 'demo.mp4'
JOINED = CAP / 'joined-picture.mp4'
FPS = 25

def run(args): subprocess.run(args, check=True)
def font(size, serif=False):
    p = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf' if serif else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    return ImageFont.truetype(p, size)

def editorial_card(path, eyebrow, left_head, left_text, right_head, right_text, foot):
    im=Image.new('RGB',(1600,900),'#f4f2ec'); d=ImageDraw.Draw(im)
    d.text((88,62),'EDITORIAL COMPARISON · COPIED FROM RECORDED UI',font=font(25),fill='#285b55')
    d.text((88,118),eyebrow,font=font(48,True),fill='#1c2927')
    cards=[(78,250,772,740),(828,250,1522,740)]
    for box,fill in zip(cards,['#eaf3ee','#f1efe6']):
        d.rounded_rectangle(box,18,fill=fill,outline='#bac9c1',width=3)
    d.text((115,292),left_head.upper(),font=font(24),fill='#386b61')
    def wrap(text, fn, max_width):
        words=text.split(); lines=[]; line=''
        for word in words:
            nxt=(line+' '+word).strip()
            if d.textbbox((0,0),nxt,font=fn)[2] > max_width and line:
                lines.append(line); line=word
            else: line=nxt
        if line: lines.append(line)
        return lines
    y=350
    for line in wrap(left_text,font(34,True),600):
        d.text((115,y),line,font=font(34,True),fill='#202b29'); y+=51
    d.text((865,292),right_head.upper(),font=font(24),fill='#386b61')
    # Wrap editorial copy to a readable, measured card width.
    y=350
    for line in wrap(right_text,font(36),600):
        d.text((865,y),line,font=font(36),fill='#202b29'); y+=53
    d.line((772,495,828,495),fill='#386b61',width=5)
    d.polygon([(828,495),(810,484),(810,506)],fill='#386b61')
    d.text((88,790),foot,font=font(23),fill='#56625d')
    im.save(path)

def ending_card(path):
    im=Image.new('RGB',(1600,900),'#f4f2ec'); d=ImageDraw.Draw(im)
    d.rounded_rectangle((120,105,1480,795),30,fill='#eaf3ee',outline='#c7d4cd',width=3)
    d.text((190,172),'A PRIVATE CHOICE · FICTIONAL PREPARED DEMO',font=font(26),fill='#386b61')
    d.text((190,280),'“I can ask for time before deciding.”',font=font(61,True),fill='#1c2927')
    d.line((190,420,1410,420),fill='#becdc4',width=3)
    d.text((190,480),'Maybe later selected · Kept privately for this preview',font=font(34),fill='#253a35')
    d.text((190,560),'Private reflection stays private. Nothing is sent.',font=font(31),fill='#253a35')
    d.text((190,700),'Harmonise · Muse Spark planned, not connected · No live community',font=font(24),fill='#56625d')
    im.save(path)

def consent_proof_card(path):
    im=Image.new('RGB',(1600,900),'#f4f2ec'); d=ImageDraw.Draw(im)
    d.rounded_rectangle((90,55,1510,845),28,fill='#eaf3ee',outline='#c7d4cd',width=3)
    d.text((140,88),'EDITORIAL PROOF · EXACT TEXT COPIED FROM CAPTURED CONSENT PREVIEW',font=font(23),fill='#386b61')
    d.text((140,160),'AUDIENCE',font=font(22),fill='#386b61')
    d.text((140,198),'Family Expectations group · Ravi may reply in group',font=font(34),fill='#202b29')
    d.text((140,270),'ALIAS',font=font(22),fill='#386b61')
    d.text((140,308),'QuietRiver',font=font(34),fill='#202b29')
    d.text((140,380),'QUESTION',font=font(22),fill='#386b61')
    d.text((140,418),'Could I take time to decide before answering?',font=font(38,True),fill='#202b29')
    d.line((140,500,1460,500),fill='#becdc4',width=3)
    d.text((140,530),'EXCLUDED',font=font(22),fill='#386b61')
    d.text((140,568),'Your private conversation and journey are not included.',font=font(30),fill='#202b29')
    d.text((140,610),'No direct message is sent.',font=font(30),fill='#202b29')
    d.rounded_rectangle((140,672,1460,790),14,fill='#f8faf7',outline='#91a99c',width=2)
    d.text((172,695),'□  I reviewed this exact alias, audience and question.',font=font(27),fill='#202b29')
    d.text((210,740),'Nothing is sent in this preview.',font=font(27),fill='#202b29')
    im.save(path)

before_after=CAP/'editorial-before-after.png'
relevance=CAP/'editorial-relevance.png'
ending=CAP/'private-choice-ending.png'
consent_card=CAP/'editorial-consent-proof.png'
editorial_card(before_after,'A thought changes when he corrects it',
    'FIRST READING','Family expectations and making your own choices',
    "ARJUN'S WORDS",'I want time to decide what I want, without someone choosing stay or leave for me.',
    'Source: the actual prepared reading and Arjun correction visible in the recorded interaction. Editorial card; no generated response.')
editorial_card(relevance,'Why this example is relevant',
    'BROAD TOPIC RESULT','Separation paperwork and settlement basics',
    'CONFIRMED CONTEXT','Family Expectations & Personal Choices',
    'Prepared comparison · not a live recommendation. Source: captured community comparison and its “Not for me” explanation.')
ending_card(ending)
consent_proof_card(consent_card)

# Source footage intervals are actual consecutive sections of the same recorded session.
# Detail shots are crops of captured frames; cards are explicitly marked editorial.
shots=[
 ('source',0.000,8.000,None,'hook'),
 ('source',12.006,14.006,None,'reflection-wide'),
 ('source',14.006,21.006,(100,80,1400,790),'reflection-detail'),
 ('source',18.008,25.011,(80,45,1440,810),'planned-role'),
 ('source',25.011,29.013,(100,120,1400,760),'possible-reading'),
 ('source',29.013,31.013,(200,180,1200,675),'not-quite-control'),
 ('source',31.013,36.014,(80,90,1440,810),'correction-entry'),
 ('card',4.000,before_after,None,'before-after-card'),
 ('source',40.014,48.517,(0,40,1500,844),'corrected-reflection'),
 ('source',54.500,57.000,None,'relevance-full'),
 ('card',4.000,relevance,None,'relevance-comparison-card'),
 ('source',61.000,63.500,(0,45,1500,844),'community-rationale'),
 ('source',77.537,79.537,None,'peer-context'),
 ('source',79.537,87.537,(80,80,1440,810),'peer-example'),
 ('source',87.537,93.037,(80,0,1440,810),'peer-difference'),
 ('source',109.500,113.000,None,'consent-full'),
 ('card',4.500,consent_card,None,'consent-proof-card'),
 ('source',117.500,122.500,(100,80,1400,788),'maybe-later-action'),
 ('source',122.500,127.500,(0,45,1500,844),'unsent-return'),
 ('source',129.562,133.362,(0,0,1600,900),'private-takeaway'),
 ('still',1.200,CAP/'private-takeaway-freeze.png',None,'private-takeaway-hold'),
 ('card',5.000,ending,None,'authored-private-choice')
]
# Duration is exactly 100 seconds; correction remains the full 23.5-second v28 beat.
total=sum((b-a if kind=='source' else a) for kind,a,b,_,_ in shots)
if abs(total-100)>0.01: raise SystemExit(f'Unexpected picture runtime {total}')

parts=[]; edit=[]; cursor=0.0
for i,(kind,a,b,crop,name) in enumerate(shots,1):
    p=CAP/f'picture-{i:02}.mp4'; dur=(b-a if kind=='source' else a)
    if not p.exists() and kind=='source':
        filt=''
        if crop:
            x,y,w,h=crop; filt=f'crop={w}:{h}:{x}:{y},'
        if name=='hook':
            filt += 'scale=1600:900:flags=lanczos,zoompan=z=\'min(1.03,1+0.00014*on)\':x=\'(iw-iw/zoom)/2\':y=\'(ih-ih/zoom)/2\':d=1:s=1600x900:fps=25,pad=1920:1080:160:90:color=0xf4f2ec,setsar=1,format=yuv420p'
        elif name in ('planned-role','peer-context','peer-example','peer-difference'):
            filt += 'scale=1458:820:flags=lanczos,pad=1920:1080:231:160:color=0xf4f2ec'
            if name in ('peer-example','peer-difference'): filt += ",zoompan=z='min(1.025,1+0.00018*on)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1920x1080:fps=25"
            filt += ',setsar=1,fps=25,format=yuv420p'
        else:
            filt += 'scale=1600:900:flags=lanczos,pad=1920:1080:160:90:color=0xf4f2ec,setsar=1,fps=25,format=yuv420p'
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{a:.3f}','-i',str(SOURCE),'-t',f'{dur:.3f}','-vf',filt,'-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(p)])
    elif not p.exists():
        image_path=b
        if name=='consent-proof-card':
            filt="scale=1600:900,zoompan=z='min(1.015,1+0.00013*on)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1600x900:fps=25,pad=1920:1080:160:90:color=0xf4f2ec,setsar=1,format=yuv420p"
        else:
            filt='scale=1600:900,pad=1920:1080:160:90:color=0xf4f2ec,setsar=1,fps=25,format=yuv420p'
        if kind=='still' and not image_path.exists():
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','133.300','-i',str(SOURCE),'-frames:v','1',str(image_path)])
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','25','-i',str(image_path),'-t',f'{dur:.3f}','-vf',filt,'-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(p)])
    parts.append(p); edit.append({'name':name,'type':kind,'duration':dur,'outStart':cursor,'sourceStart':a if kind=='source' else None,'sourceEnd':b if kind=='source' else None,'crop':crop,'asset':str((SOURCE if kind=='source' else b).relative_to(ROOT))})
    cursor+=dur
lst=CAP/'picture-list.txt'; lst.write_text(''.join(f"file '{p.name}'\n" for p in parts),encoding='utf-8')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart',str(JOINED)])

# Exact dialogue from the brief. Burned captions mirror narration word for word.
narration=[
 (0.20,5.80,"I can’t tell my family what I want without feeling ungrateful."),
 (8.15,12.15,'Arjun puts the family pressure into his own words.'),
 (12.25,16.60,'No one else sees this reflection.'),
 (17.10,20.55,"Muse Spark's planned role is organizing themes."),
 (20.60,24.00,'Prepared example; no model is connected.'),
 (24.15,28.15,'A possible reading is offered for him to check.'),
 (28.20,31.20,'He says, “Not quite.”'),
 (31.30,36.10,'He needs time to decide for himself.'),
 (36.20,43.80,'The reflection changes to hold his correction.'),
 (47.70,52.00,'His corrected theme keeps family context in view.'),
 (52.05,56.20,'Broader legal results are set aside.'),
 (56.65,60.00,'One prepared fictional perspective appears.'),
 (60.00,64.00,'Ravi says a trusted friend helped him speak with family.'),
 (64.10,68.20,'They share family pressure; their circumstances differ.'),
 (68.25,71.80,'Arjun has not said he has someone he trusts.'),
 (72.20,76.00,'If he asks, it is for the group under an alias.'),
 (76.10,79.00,'His private reflection is excluded.'),
 (80.20,83.90,'Consent remains unchecked.'),
 (84.05,86.80,'He cancels and keeps the draft.'),
 (87.00,89.50,'Nothing is sent.'),
 (90.20,94.40,'For now, his words stay private.'),
 (94.50,99.00,'He can ask for time before deciding.'),
]

def stamp(t):
    ms=round(t*1000); h,rem=divmod(ms,3600000); m,rem=divmod(rem,60000); sec,ms=divmod(rem,1000)
    return f'{h:02}:{m:02}:{sec:02},{ms:03}'
def esc(p): return str(p).replace(':',r'\:').replace("'",r"\'")
draw=["drawbox=x=0:y=18:w=1920:h=52:color=0x163a36@0.98:t=fill",
      "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='FICTIONAL PREPARED DEMO  ·  NO MODEL CONNECTED  ·  NO LIVE COMMUNITY':fontcolor=white:fontsize=27:x=190:y=31:fix_bounds=1"]
for y,label,enable in [
    (73,'PLANNED ROLE · Muse Spark could organize themes for Arjun to review.','between(t\\,17.000\\,24.003)'),
    (105,'PREPARED EXAMPLE · no model is connected.','between(t\\,17.000\\,24.003)'),
    (73,'FICTIONAL · PREPARED EXAMPLE','between(t\\,56.506\\,72.006)'),
    (105,'NO LIVE ACTIVITY','between(t\\,56.506\\,72.006)'),
]:
    draw.append(f"drawbox=x=231:y={y}:w=1458:h=28:color=0x163a36@0.98:t=fill:enable='{enable}'")
    draw.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='{label}':fontcolor=white:fontsize=20:x=244:y={y+5}:fix_bounds=1:enable='{enable}'")
for i,(a,b,txt) in enumerate(narration,1):
    cp=CAP/f'caption-{i:02}.txt'; cp.write_text(txt,encoding='utf-8')
    draw.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{esc(cp)}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=1003:box=1:boxcolor=0x163a36@0.98:boxborderw=12:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
vf=','.join(draw)
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(JOINED),'-vf',vf,'-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-t','100',str(CAP/'captioned-picture.mp4')])
(CAP/'captions.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{txt}' for i,(a,b,txt) in enumerate(narration,1))+'\n',encoding='utf-8')
(CAP/'narration.txt').write_text('\n'.join(txt for _,_,txt in narration)+'\n',encoding='utf-8')

# Flite speech is synthetic narration; each line is generated from the exact script above.
audio_args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(CAP/'captioned-picture.mp4')]
for i,(_,_,txt) in enumerate(narration,1):
    tf=CAP/f'narration-{i:02}.txt'; wav=CAP/f'narration-{i:02}.wav'; tf.write_text(txt,encoding='utf-8')
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile='{esc(tf)}':voice=rms",'-ac','1','-ar','48000',str(wav)])
    audio_args+=['-i',str(wav)]
filters=[]
for i,(a,b,_) in enumerate(narration,1):
    delay=round(a*1000); filters.append(f'[{i}:a]adelay={delay}|{delay},volume=1[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(1,len(narration)+1))+f'amix=inputs={len(narration)}:duration=longest:normalize=0,alimiter=limit=0.95,apad,atrim=duration=100,loudnorm=I=-18:TP=-2:LRA=7[aout]')
audio_args += ['-filter_complex',';'.join(filters),'-map','0:v','-map','[aout]','-vf','fps=25,tpad=stop_mode=clone:stop_duration=1,trim=end_frame=2500,setpts=PTS-STARTPTS','-t','100','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(audio_args)

edit={'iteration':'v29','durationSeconds':100,'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceRevision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'shots':edit,'narrationCount':len(narration),'narration': [{'start':a,'end':b,'text':t,'caption':t} for a,b,t in narration],'discrepancies':['The brief proposes the corrected reflection as the consent question. Recorded consent UI instead contains “Could I take time to decide before answering?” v29 preserves this actual captured question.','The brief says the on-screen consent action is “Maybe later”; the captured consent screen action is “Cancel · keep my draft.” “Maybe later selected” is visible in the later captured private takeaway. Narration identifies the recorded action as cancel, while the ending preserves the later private choice.']}
(CAP/'edit-map.json').write_text(json.dumps(edit,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'candidate':str(OUT.relative_to(ROOT)),'duration':100,'shots':len(shots),'narrationCues':len(narration)},indent=2))

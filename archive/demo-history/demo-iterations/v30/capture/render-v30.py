#!/usr/bin/env python3
"""Render v30 from the existing recorded v27 frontend session."""
from pathlib import Path
import subprocess, json, hashlib, math
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v30'; CAP=ITER/'capture'; REL=ITER/'verification/release'; FRAMES=REL/'frames'
for d in (CAP,REL,FRAMES): d.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'demo-iterations/v27/capture/video/v27-real-product-session.webm'
OUT=ITER/'demo.mp4'; JOINED=CAP/'joined-picture.mp4'; FPS=25

def run(args): subprocess.run(args,check=True)
def font(size,serif=False): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/'+('DejaVuSerif.ttf' if serif else 'DejaVuSans.ttf'),size)
def ending_card(path):
    im=Image.new('RGB',(1600,900),'#f4f2ec'); d=ImageDraw.Draw(im)
    d.rounded_rectangle((120,105,1480,795),30,fill='#eaf3ee',outline='#c7d4cd',width=3)
    d.text((190,172),'EDITORIAL RECAP · FICTIONAL PREPARED DEMO',font=font(26),fill='#386b61')
    d.text((190,280),'“I can ask for time before deciding.”',font=font(61,True),fill='#1c2927')
    d.line((190,420,1410,420),fill='#becdc4',width=3)
    d.text((190,480),'Kept privately for this preview',font=font(34),fill='#253a35')
    d.text((190,555),'Nothing is sent.',font=font(34),fill='#253a35')
    d.text((190,700),'Muse Spark planned, not connected · No live community',font=font(24),fill='#56625d')
    im.save(path)
ENDING=CAP/'ending-editorial-card.png'; ending_card(ENDING)

# Source timeline and output timeline. Opening beats are contiguous and non-overlapping:
# 10.006–18.008 is the user's entry; 18.008–25.011 is the prepared role/response.
# The correction itself is one uninterrupted source interval, 25.011–48.517.
shots=[
 ('source',0.000,9.000,'opening'),
 ('source',10.006,18.008,'user-entry'),
 ('source',18.008,25.011,'planned-role'),
 ('source',25.011,48.517,'continuous-correction'),
 ('source',48.517,54.521,'confirmation'),
 ('source',60.524,67.529,'context-choice'),
 ('source',77.537,85.537,'prepared-ravi-account'),
 ('source',87.537,93.037,'difference'),
 ('source',103.558,110.059,'question-edit'),
 ('source',110.559,117.559,'consent-preview'),
 ('still',2.500,116.500,'consent-hold'),
 ('source',117.559,122.561,'cancel'),
 ('source',129.562,135.565,'private-takeaway'),
 ('card',3.979,ENDING,'ending'),
]
parts=[]; mapshots=[]; cursor=0.0
for i,item in enumerate(shots,1):
    kind,a,b,name=item; p=CAP/f'picture-{i:02}.mp4'
    if kind=='source':
        dur=b-a
        if not p.exists():
            filt='scale=1920:1080:flags=lanczos,setsar=1,fps=25,format=yuv420p'
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{a:.3f}','-i',str(SOURCE),'-t',f'{dur:.3f}','-vf',filt,'-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(p)])
        src_a,src_b=a,b; asset=str(SOURCE.relative_to(ROOT))
    elif kind=='still':
        dur=a; src_a,src_b=116.5,116.5; asset=str(SOURCE.relative_to(ROOT))
        still=CAP/'consent-preview-source-frame.png'
        if not still.exists(): run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{b:.3f}','-i',str(SOURCE),'-frames:v','1',str(still)])
        if not p.exists(): run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','25','-i',str(still),'-t',f'{dur:.3f}','-vf','scale=1920:1080:flags=lanczos,setsar=1,fps=25,format=yuv420p','-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(p)])
    else:
        dur=a; src_a=src_b=None; asset=str(ENDING.relative_to(ROOT))
        if not p.exists(): run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','25','-i',str(ENDING),'-t',f'{dur:.3f}','-vf','scale=1920:1080:flags=lanczos,pad=1920:1080:0:0:color=0xf4f2ec,setsar=1,fps=25,format=yuv420p','-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(p)])
    parts.append(p); mapshots.append({'name':name,'type':kind,'duration':dur,'outputStart':round(cursor,3),'outputEnd':round(cursor+dur,3),'sourceStart':src_a,'sourceEnd':src_b,'asset':asset}); cursor+=dur
# Exact source intervals sum to 105.021s because frame-accurate source ends include small fractions.
assert abs(cursor-105.021)<.02, cursor
lst=CAP/'picture-list.txt'; lst.write_text(''.join(f"file '{p.name}'\n" for p in parts),encoding='utf-8')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart',str(JOINED)])

# Timed narration and ordinary subtitles. Consent requirements are three separate readable beats,
# with all corresponding state kept together in the unchanged recorded UI underneath.
narration=[
 (0.20,5.90,'I can’t tell my family what I want without feeling ungrateful.'),
 (9.20,16.80,'For adults navigating family pressure: clarify privately, correct the reflection, then decide whether to share.'),
 (17.20,23.60,'Muse Spark is planned, not connected; it could organize themes for Arjun to review. This is prepared example content.'),
 (24.20,28.90,'A prepared possible reading is offered for him to check.'),
 (29.20,33.20,'He chooses “Not quite.”'),
 (34.00,40.80,'Arjun enters: “I want time to decide what I want, without someone choosing stay or leave for me.”'),
 (41.10,47.20,'The editable reflection changes: “You want time to decide what you want, without someone choosing stay or leave for you.”'),
 (47.80,53.20,'He accepts the corrected theme himself. The product does not decide what is true.'),
 (53.75,60.30,'He sets aside broader legal results; family context stays in view.'),
 (60.80,67.90,'A prepared fictional account: Ravi says a trusted friend helped him speak with family.'),
 (68.70,73.80,'Their circumstances differ. Ravi had a trusted friend; Arjun has not said he does.'),
 (74.30,79.90,'He edits the question: “Could I take time to decide before answering?”'),
 (80.60,82.90,'Audience: Family Expectations group. Alias: QuietRiver.'),
 (83.00,87.20,'Question: “Could I take time to decide before answering?” Private reflection excluded.'),
 (87.25,89.85,'Consent unchecked. Control: “Cancel · keep my draft.”'),
 (90.25,94.50,'He chooses “Cancel · keep my draft.” Nothing is sent.'),
 (95.30,100.50,'He keeps one takeaway privately for this preview session.'),
 (101.30,104.70,'For this preview only: “I can ask for time before deciding.” Kept privately; nothing is sent.'),
]

def stamp(t):
    ms=round(t*1000); h,rem=divmod(ms,3600000); m,rem=divmod(rem,60000); sec,ms=divmod(rem,1000); return f'{h:02}:{m:02}:{sec:02},{ms:03}'
def esc(p): return str(p).replace(':',r'\:').replace("'",r"\'")
def wrap_caption(text, width=68):
    words=text.split(); lines=[]; line=''
    for word in words:
        candidate=(line+' '+word).strip()
        if len(candidate)>width and line:
            lines.append(line); line=word
        else: line=candidate
    if line: lines.append(line)
    return '\n'.join(lines)
draw=["drawbox=x=0:y=18:w=1920:h=52:color=0x163a36@0.98:t=fill",
      "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='FICTIONAL PREPARED DEMO  ·  NO MODEL CONNECTED  ·  NO LIVE COMMUNITY':fontcolor=white:fontsize=27:x=190:y=31:fix_bounds=1"]
# Source-prepared and Muse planned labels stay adjacent through the actual response.
for y,label in [(73,'PLANNED ROLE · Muse Spark could organize themes for Arjun to review.'),(105,'PREPARED EXAMPLE · no model is connected.')]:
    draw.append(f"drawbox=x=231:y={y}:w=1458:h=28:color=0x163a36@0.98:t=fill:enable='between(t\\,17.000\\,24.000)'")
    draw.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='{label}':fontcolor=white:fontsize=20:x=244:y={y+5}:fix_bounds=1:enable='between(t\\,17.000\\,24.000)'")
for i,(a,b,txt) in enumerate(narration,1):
    rendered=txt+'\nFictional · prepared scenario.' if i==1 else txt
    cp=CAP/f'caption-{i:02}.txt'; cp.write_text(wrap_caption(rendered),encoding='utf-8')
    draw.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{esc(cp)}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=940:box=1:boxcolor=0x163a36@0.98:boxborderw=12:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
vf=','.join(draw)
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(JOINED),'-vf',vf,'-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-t','105.021',str(CAP/'captioned-picture.mp4')])
(CAP/'captions.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{(txt+chr(10)+"Fictional · prepared scenario.") if i==1 else txt}' for i,(a,b,txt) in enumerate(narration,1))+'\n',encoding='utf-8')
(CAP/'narration.txt').write_text('\n'.join(txt for _,_,txt in narration)+'\n',encoding='utf-8')

# Flite narration matches the subtitle transcript exactly.
audio_args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(CAP/'captioned-picture.mp4')]
for i,(_,_,txt) in enumerate(narration,1):
    tf=CAP/f'narration-{i:02}.txt'; wav=CAP/f'narration-{i:02}.wav'; tf.write_text(txt,encoding='utf-8')
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile='{esc(tf)}':voice=rms",'-ac','1','-ar','48000',str(wav)])
    audio_args+=['-i',str(wav)]
filters=[]
for i,(a,b,_) in enumerate(narration,1):
    delay=round(a*1000); filters.append(f'[{i}:a]adelay={delay}|{delay},volume=1[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(1,len(narration)+1))+f'amix=inputs={len(narration)}:duration=longest:normalize=0,alimiter=limit=0.95,apad,atrim=duration=105.021,loudnorm=I=-18:TP=-2:LRA=7[aout]')
audio_args+=['-filter_complex',';'.join(filters),'-map','0:v','-map','[aout]','-vf','fps=25,tpad=stop_mode=clone:stop_duration=1,trim=end_frame=2626,setpts=PTS-STARTPTS','-t','105.021','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(audio_args)
edit={'iteration':'v30','targetRuntimeSeconds':105,'actualRuntimeSeconds':105.021,'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceRevision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'shots':mapshots,'continuousCorrectionSourceInterval':[25.011,48.517],'consentPreviewSeconds':9.5,'narrationCount':len(narration),'narration':[{'start':a,'end':b,'text':t,'caption':(t+'\nFictional · prepared scenario.' if i==1 else t)} for i,(a,b,t) in enumerate(narration,1)],'truthBoundary':{'fictionalPreparedDemo':True,'modelConnected':False,'liveCommunity':False,'museSpark':'planned, not connected','peerContent':'prepared/fictional','messageSent':False},'sourceMismatches':['The actual recorded consent question is “Could I take time to decide before answering?”','The actual recorded consent action is “Cancel · keep my draft.”']}
(CAP/'edit-map.json').write_text(json.dumps(edit,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'candidate':str(OUT.relative_to(ROOT)),'runtime':cursor,'shots':len(shots),'narrationCues':len(narration)},indent=2))

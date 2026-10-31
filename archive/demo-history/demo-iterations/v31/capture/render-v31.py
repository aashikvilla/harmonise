#!/usr/bin/env python3
"""Render v31 from actual v27 Playwright capture with editorial framing only."""
from pathlib import Path
import subprocess, json, hashlib, shutil
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v31'; CAP=ITER/'capture'; REL=ITER/'verification/release'
SOURCE=ROOT/'demo-iterations/v27/capture/video/v27-real-product-session.webm'
OUT=ITER/'demo.mp4'; FPS=25; W,H=1920,1080
CAP.mkdir(parents=True,exist_ok=True); REL.mkdir(parents=True,exist_ok=True)

def run(args): subprocess.run(args,check=True)
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def font(size,bold=False):
 p='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
 return ImageFont.truetype(p,size)
def ts(t):
 ms=round(t*1000); h,rem=divmod(ms,3600000); m,rem=divmod(rem,60000); s,ms=divmod(rem,1000); return f'{h:02}:{m:02}:{s:02},{ms:03}'
def esc(p): return str(p).replace(':',r'\\:').replace("'",r"\\'")

# A single strictly increasing source map. The correction occupies the complete
# continuous 25.011–48.517 interval; source 48.517 is only used once.
shots=[
 ('hook',0.000,8.000,None),
 ('reflection',12.006,18.008,(70,45,1460,820)),
 ('planned-role',18.008,25.011,(55,40,1490,838)),
 ('continuous-correction',25.011,48.517,None),
 ('corrected-context',48.517,58.517,None),
 ('community-context',58.517,68.517,None),
 ('peer-example',79.537,90.537,None),
 ('peer-followthrough',90.537,101.537,None),
 ('consent-preview',109.500,117.559,None),
 ('cancel-action',117.559,124.561,None),
 ('private-takeaway',129.562,135.990,None),
]
# Cue text is the exact brief narration; captions below preserve it verbatim.
narration=[
 (0.20,5.80,'I can’t tell my family what I want without feeling ungrateful.'),
 (8.25,13.60,'Arjun can put the pressure into his own words, privately.'),
 (14.40,25.30,'Muse Spark is planned, not connected; it could organize themes for Arjun to review. This response is prepared.'),
 (25.60,29.70,'A prepared reading is offered for him to check.'),
 (29.85,32.10,'He chooses “Not quite.”'),
 (32.20,41.00,'Arjun enters: “I want time to decide what I want, without someone choosing stay or leave for me.”'),
 (41.10,47.90,'The reflection changes to hold his correction. He decides what fits.'),
 (48.80,56.50,'He keeps family context in view and sets broader legal results aside.'),
 (64.70,70.00,'A prepared fictional account says Ravi had a trusted friend.'),
 (70.10,76.10,'Their circumstances differ; Arjun has not said he has someone he trusts.'),
 (87.00,90.45,'The preview names the Family Expectations group and the alias QuietRiver.'),
 (90.50,93.35,'It shows the question, “Could I take time to decide before answering?”'),
 (93.40,95.20,'Private reflection is excluded.'),
 (95.25,99.20,'Consent is unchecked; he can cancel and keep the draft.'),
 (99.30,101.40,'He cancels and keeps the draft. Nothing is sent.'),
 (102.00,107.60,'For this prepared preview, Arjun keeps one line privately: “I can ask for time before deciding.”'),
]
assert abs(sum(b-a for _,a,b,_ in shots)-108.0)<0.001

# Build modest visual crops only where they follow actual screen actions. Full
# source context stays in the picture area; no interface pixels are replaced.
parts=[]; edit=[]; outpos=0.0
for i,(name,a,b,crop) in enumerate(shots,1):
 p=CAP/f'picture-{i:02}.mp4'; dur=b-a
 vf=[]
 if crop:
  x,y,w,h=crop; vf.append(f'crop={w}:{h}:{x}:{y}')
 # At 1920x1080, the recorded 1600x900 UI is fitted into its own central
 # picture window, leaving separate editorial header and caption bands.
 if name=='continuous-correction':
  vf.append("zoompan=z='if(lte(on,150),1.04+0.00053*on,if(lte(on,375),1.12,1.12-0.000187*(on-375)))':x='(iw-iw/zoom)/2+70*min(1,on/150)-70*max(0,min(1,(on-375)/213))':y='(ih-ih/zoom)/2+60*min(1,on/150)-80*max(0,min(1,(on-375)/213))':d=1:s=1600x900:fps=25")
 if name=='private-takeaway':
  vf.append("zoompan=z='min(1.07,1+0.00044*on)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1600x900:fps=25")
 vf += ['scale=1530:860:force_original_aspect_ratio=decrease:flags=lanczos',
        'pad=1530:860:(ow-iw)/2:(oh-ih)/2:color=0xf4f2ec',
        'pad=1920:1080:195:105:color=0xf4f2ec',
        'setsar=1,fps=25,format=yuv420p']
 run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{a:.3f}','-i',str(SOURCE),'-t',f'{dur:.3f}','-vf',','.join(vf),'-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(p)])
 parts.append(p); edit.append({'name':name,'sourceStart':a,'sourceEnd':b,'duration':dur,'outputStart':outpos,'outputEnd':outpos+dur,'crop':crop,'asset':str(SOURCE.relative_to(ROOT))})
 outpos+=dur
(CAP/'picture-list.txt').write_text('\n'.join("file '"+str(p)+"'" for p in parts)+'\n')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(CAP/'picture-list.txt'),'-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',str(CAP/'joined-picture.mp4')])

# Source-derived consent inset: this is a crop of the real recorded frame at
# 116.5s. Its label explicitly identifies it as an editorial detail view.
consent_frame=CAP/'consent-preview-source-frame.png'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','116.500','-i',str(SOURCE),'-frames:v','1',str(consent_frame)])
im=Image.open(consent_frame).convert('RGB')
# Include recipient, alias, exact question, exclusion, unchecked checkbox and
# Cancel action in one crop. It remains a labeled editorial inset.
inset_img=im.crop((130,190,1450,785)).resize((1584,714),Image.Resampling.LANCZOS)
inset_path=CAP/'consent-inset.png'
inset_img.save(inset_path)

# Overlays occupy reserved editorial bands, visually distinct from the app.
# Audience and promise appear by output 4 seconds. Truth labels persist.
pre=[
"drawbox=x=0:y=0:w=1920:h=98:color=0x163a36@0.98:t=fill",
"drawbox=x=0:y=968:w=1920:h=112:color=0x163a36@0.98:t=fill",
"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='FICTIONAL · PREPARED SCENARIO · NO MODEL CONNECTED · NO LIVE COMMUNITY':fontcolor=white:fontsize=21:x=30:y=9",
"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='For adults navigating family pressure':fontcolor=white:fontsize=24:x=658:y=38:enable='between(t\\,0\\,8)'",
"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='Reflect privately · correct it · choose whether to share':fontcolor=white:fontsize=20:x=658:y=66:enable='between(t\\,0\\,8)'"]
for label,a,b in [
 ('MUSE SPARK · PLANNED, NOT CONNECTED · PREPARED EXAMPLE',14.0,25.011),
 ('PREPARED POSSIBLE READING · NO MODEL CONNECTED',25.011,48.517),
 ('RAVI’S ACCOUNT IS FICTIONAL AND PREPARED · NO LIVE COMMUNITY',64.511,86.511),
 ('RECORDED PREVIEW · PREPARED EXAMPLE',86.511,101.572),
 ('FOR THIS PREPARED PREVIEW · KEPT PRIVATELY · NOTHING IS SENT',102.0,108.0)]:
 pre.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='{label}':fontcolor=white:fontsize=22:x=30:y=48:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
for i,(a,b,txt) in enumerate(narration,1):
 cp=CAP/f'caption-{i:02}.txt'; cp.write_text(txt,encoding='utf-8')
 pre.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{esc(cp)}':fontcolor=white:fontsize=29:x=(w-text_w)/2:y=1005:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
(CAP/'captions.srt').write_text('\n\n'.join(f'{i}\n{ts(a)} --> {ts(b)}\n{txt}' for i,(a,b,txt) in enumerate(narration,1))+'\n',encoding='utf-8')
(CAP/'narration.txt').write_text('\n'.join(t for _,_,t in narration)+'\n',encoding='utf-8')
for i,(_,_,txt) in enumerate(narration,1): (CAP/f'narration-{i:02}.txt').write_text(txt+'\n',encoding='utf-8')
# Consent inset is a labeled, unaltered crop from the actual source frame.
# It includes recipient, alias, exact question, exclusions, unchecked consent,
# and the recorded Cancel action in one view.
base=CAP/'joined-picture.mp4'
flt=f"[0:v]{','.join(pre)}[base];[1:v]scale=1584:714,format=rgba[ins];[base][ins]overlay=168:184:enable='between(t\\,86.511\\,94.570)'[v]"
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(base),'-loop','1','-framerate','25','-i',str(inset_path),'-filter_complex',flt,'-map','[v]','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-t','108',str(CAP/'captioned-picture.mp4')])
# Flite synthetic read is only a timing guide; exact words equal the burned captions.
audio_args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(CAP/'captioned-picture.mp4')]
for i,(_,_,txt) in enumerate(narration,1):
 wav=CAP/f'narration-{i:02}.wav'
 run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile='{esc(CAP/f'narration-{i:02}.txt')}':voice=rms",'-ac','1','-ar','48000',str(wav)])
 audio_args+=['-i',str(wav)]
filt=[]
for i,(a,b,_) in enumerate(narration,1):
 filt.append(f'[{i}:a]adelay={round(a*1000)}|{round(a*1000)},volume=1[a{i}]')
filt.append(''.join(f'[a{i}]' for i in range(1,len(narration)+1))+f'amix=inputs={len(narration)}:duration=longest:normalize=0,alimiter=limit=0.95,apad,atrim=duration=108,loudnorm=I=-18:TP=-2:LRA=7[aout]')
audio_args += ['-filter_complex',';'.join(filt),'-map','0:v','-map','[aout]','-t','108','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(audio_args)
edit={'iteration':'v31','durationSeconds':108,'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':sha(SOURCE),'shots':edit,'narration': [{'start':a,'end':b,'text':t,'caption':t} for a,b,t in narration], 'sourceNotes':['The brief overlaps source 48.517–51.017 between correction and context; v31 uses source 25.011–48.517, then continues once at 48.517.','No UI text or activity was synthesized. The consent inset is a labeled crop from the actual source frame at 116.500s.','Muse Spark is identified as planned and not connected; fictional/prepared/no-live/no-send boundaries remain editorial overlays.']}
(CAP/'edit-map.json').write_text(json.dumps(edit,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'candidate':str(OUT.relative_to(ROOT)),'duration':108,'sourceSha256':edit['sourceSha256'],'shots':len(shots),'narrationCues':len(narration)},indent=2))

#!/usr/bin/env python3
"""Surgical v32 picture revision composited over the v29 master."""
from pathlib import Path
import subprocess, json, hashlib
ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v32'; CAP=ITER/'capture'; REL=ITER/'verification/release'
MASTER=ROOT/'demo-iterations/v29/demo.mp4'
SOURCE=ROOT/'demo-iterations/v27/capture/video/v27-real-product-session.webm'
OUT=ITER/'demo.mp4'; FPS=25
CORR=(24.003,47.509); CONS=(72.009,80.009)

def run(args): subprocess.run(args,check=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def source_clip(start,dur,out,vf):
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{start:.3f}','-i',str(SOURCE),'-t',f'{dur:.3f}','-vf',vf,'-an','-r','25','-c:v','libx264','-preset','ultrafast','-crf','12','-pix_fmt','yuv420p',str(out)])

# One uninterrupted recorded correction. A slow, moderate enlargement keeps the
# click, typing, and changed reflection in a continuous picture.
corr=CAP/'continuous-correction.mp4'
source_clip(25.011,23.506,corr,"scale=1600:900,zoompan=z='1.035+0.055*on/588':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1600x900:fps=25,trim=end_frame=588,setpts=PTS-STARTPTS,format=yuv420p")
# Consent: one second in captured page context, then seven seconds from one
# captured screen crop containing the exact preview fields, checkbox, and Cancel.
ctx=CAP/'consent-context.mp4'; detail=CAP/'consent-detail.mp4'
source_clip(109.500,1.0,ctx,'scale=1600:900,fps=25,trim=end_frame=25,setpts=PTS-STARTPTS,format=yuv420p')
label="drawbox=x=12:y=8:w=560:h=36:color=0x163a36@0.95:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Recorded preview · prepared example':fontcolor=white:fontsize=19:x=24:y=15"
source_clip(110.500,7.0,detail,f"crop=1330:690:90:90,scale=1600:830:flags=lanczos,pad=1600:900:0:35:color=0xf4f2ec,{label},fps=25,trim=end_frame=175,setpts=PTS-STARTPTS,format=yuv420p")
(CAP/'consent-label.txt').write_text('Recorded preview · prepared example\nEditorial overlay over a crop of captured pixels.\n',encoding='utf-8')
# Join consent segments at their native frame cadence.
conslist=CAP/'consent-list.txt'; conslist.write_text("file 'consent-context.mp4'\nfile 'consent-detail.mp4'\n",encoding='utf-8')
cons=CAP/'consent-replacement.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(conslist),'-an','-r','25','-c:v','libx264','-preset','ultrafast','-crf','12','-pix_fmt','yuv420p',str(cons)])
# Overlay each replacement only in the picture area, retaining v29's master
# banner, caption band, and all pixels outside the requested windows.
flt=("[1:v]setpts=PTS-STARTPTS+24/TB[c];[2:v]setpts=PTS-STARTPTS+72/TB[s];"
     "[0:v][c]overlay=x=160:y=90:enable='between(t,24,47.509)'[v1];"
     "[v1][s]overlay=x=160:y=90:enable='between(t,72,80)'[vbase];"
     f"[vbase]drawbox=x=0:y=985:w=1920:h=95:color=0xf4f2ec@1:t=fill:enable='between(t\\,36.2\\,47.4)'[vclear];"
     f"[vclear]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile={CAP / 'caption-09.txt'}:fontcolor=white:fontsize=38:x=(w-text_w)/2:y=1003:box=1:boxcolor=0x163a36@0.98:boxborderw=12:fix_bounds=1:enable='between(t\\,44.75\\,47.4)'[v];"
     "[0:a]volume='if(between(t,36.2,47.5),0,1)'[base];"
     "[3:a]atempo=1.18,adelay=44750|44750[newcue];[base][newcue]amix=inputs=2:duration=first:normalize=0[a]")
cue_wav=ROOT/'demo-iterations/v29/capture/narration-09.wav'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(MASTER),'-i',str(corr),'-i',str(cons),'-i',str(cue_wav),'-filter_complex',flt,'-map','[v]','-map','[a]','-t','100','-c:v','libx264','-preset','medium','-qp','0','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)])
print(json.dumps({'candidate':str(OUT.relative_to(ROOT)),'sha256':sha(OUT),'duration_seconds':100,'master_sha256':sha(MASTER)},indent=2))

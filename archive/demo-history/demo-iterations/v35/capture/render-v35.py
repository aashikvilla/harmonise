#!/usr/bin/env python3
"""Render Harmonise v35 from the exact v13 master and the approved v35 map."""
from pathlib import Path
import subprocess, json, hashlib, re
ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v35'; CAP=ITER/'capture'; VER=ITER/'verification'
MASTER=ROOT/'demo-iterations/v13/demo.mp4'; SOURCE=ROOT/'demo-iterations/v13'
OUT=ITER/'demo.mp4'; CAP.mkdir(exist_ok=True); VER.mkdir(exist_ok=True)
WINDOWS=[(0.0,45.425),(46.5,62.8),(70.59,98.395),(104.343,178.767)]
FPS=30

def run(a): subprocess.run(a,check=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ts(n):
    h=int(n//3600); m=int((n%3600)//60); s=n%60
    return f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.',',')
# Capture the original source transcript; no narration replacement was supported/needed.
(CAP/'narration.txt').write_bytes((SOURCE/'narration.txt').read_bytes())
# v13 captions are burned into picture. Ripple the matching sidecar cue times across cuts.
cues=[]
raw=(SOURCE/'captions.srt').read_text()
for block in re.split(r'\n\s*\n',raw.strip()):
    lines=block.splitlines()
    if len(lines)<3: continue
    ma=re.match(r'(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)',lines[1])
    if not ma: continue
    v=list(map(int,ma.groups()))
    st=v[0]*3600+v[1]*60+v[2]+v[3]/1000; en=v[4]*3600+v[5]*60+v[6]+v[7]/1000
    offset=0
    for a,b in WINDOWS:
        lo=max(st,a); hi=min(en,b)
        if hi>lo: cues.append((lo-a+offset,hi-a+offset,'\n'.join(lines[2:])))
        offset+=b-a
with (CAP/'captions.srt').open('w') as f:
    for i,(a,b,t) in enumerate(cues,1): f.write(f'{i}\n{ts(a)} --> {ts(b)}\n{t}\n\n')
# Build a frame-accurate concat graph. Opening treatment reproduces v34's 3.8–10.7s crop.
parts=[]; labels=[]
crop_ranges=[(3.8,10.7,'opening'),(18.702,30.095,'focus'),
             (46.5,62.8,'focus'),(70.59,98.395,'focus'),(147.272,178.767,'focus')]
for i,(a,b) in enumerate(WINDOWS):
    cuts=[]; points={a,b}
    for x,y,_ in crop_ranges:
        if a<x<b: points.add(x)
        if a<y<b: points.add(y)
    points=sorted(points)
    for x,y in zip(points,points[1:]):
        kind=next((k for l,r,k in crop_ranges if x>=l-1e-6 and y<=r+1e-6),'plain')
        cuts.append((x,y,kind))
    for j,(x,y,kind) in enumerate(cuts):
        idx=len(parts); parts.append((x,y,kind)); labels.append(f'v{idx}')
        if kind!='plain':
            cw,ch,cx=(1744,980,88) if kind=='opening' else (1600,900,160)
            graph=(f'[0:v]trim=start={x}:end={y},setpts=PTS-STARTPTS,split=4[zsrc{idx}][hs{idx}][cs{idx}][base{idx}];'
              f'[zsrc{idx}]crop={cw}:{ch}:{cx}:0,scale=1920:1080:flags=lanczos,setsar=1[zoom{idx}];'
              f'[hs{idx}]crop=1920:100:0:0[head{idx}];[cs{idx}]crop=1920:180:0:900[cap{idx}];'
              f'[base{idx}][zoom{idx}]overlay=0:0[fr{idx}];[fr{idx}][head{idx}]overlay=0:0[fh{idx}];'
              f'[fh{idx}][cap{idx}]overlay=0:900,setsar=1,fps=30[{labels[-1]}]')
            graph+=';';
        else: graph=f'[0:v]trim=start={x}:end={y},setpts=PTS-STARTPTS,fps=30[{labels[-1]}];'
        graph_audio=f'[0:a]atrim=start={x}:end={y},asetpts=PTS-STARTPTS[a{idx}];'
        parts[-1]=(*parts[-1],graph,graph_audio)
filters=''.join(p[3]+p[4] for p in parts)
filters+=''.join(f'[{l}]' for l in labels)+f'concat=n={len(labels)}:v=1:a=0[vout];'
filters+=''.join(f'[a{i}]' for i in range(len(parts)))+f'concat=n={len(parts)}:v=0:a=1[aout]'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(MASTER),'-filter_complex',filters,
     '-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',
     '-c:a','aac','-b:a','192k','-movflags','+faststart',str(OUT)])
# Edit map records exact retained windows and crop source/effect.
editmap={'iteration':'v35','master':'demo-iterations/v13/demo.mp4','masterSha256':sha(MASTER),
 'candidate':'demo-iterations/v35/demo.mp4','candidateSha256':sha(OUT),
 'retainedSourceRangesSeconds':[{'in':a,'out':b} for a,b in WINDOWS],
 'targetRuntimeSeconds':162.882,'runtimeByRangesSeconds':sum(b-a for a,b in WINDOWS),
 'openingCrop':{'sourceIn':3.8,'sourceOut':10.7,'pixels':[88,0,1744,980],
  'scaledTo':[1920,1080],'headerAndDisclosureRestored':True,'captionBandRestored':True},
 'readabilityCrops':[{'sourceIn':a,'sourceOut':b,'pixels':[160,0,1600,900],
   'scaledTo':[1920,1080],'headerAndDisclosureRestored':True,'captionBandRestored':True}
   for a,b in [(18.702,30.095),(46.5,62.8),(70.59,98.395),(147.272,178.767)]],
 'audio':'Original v13 narration AAC source ranges are rippled with the picture.',
 'captionSidecar':'Original v13 cue wording is rippled; cues intersecting an edit boundary are time-clipped to the retained picture/audio window.',
 'conditionalNoSend':'Retained approved source copy because the exact capture shows unchecked/disabled preview, a Maybe later exit, and return to the fictional group.',
 'truthBoundary':'Only v13 captured pixels, narration, captions, prepared fictional disclosures, and the v34 opening crop are used.'}
(CAP/'edit-map.json').write_text(json.dumps(editmap,indent=2)+'\n')
# v13 manifest source copy plus measured v35 stream details.
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUT)],text=True))
v=next(s for s in probe['streams'] if s['codec_type']=='video'); au=next(s for s in probe['streams'] if s['codec_type']=='audio')
manifest={'iteration':'v35','status':'candidate rendered from exact v13 master','master':editmap['master'],'masterSha256':sha(MASTER),
 'candidate':'demo-iterations/v35/demo.mp4','candidateSha256':sha(OUT),'runtimeSeconds':float(probe['format']['duration']),
 'video':{'codec':v['codec_name'],'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'frames':v.get('nb_frames'),'durationSeconds':float(v['duration'])},
 'audio':{'codec':au['codec_name'],'sampleRate':au['sample_rate'],'channels':au['channels'],'durationSeconds':float(au['duration'])},
 'renderScript':'demo-iterations/v35/capture/render-v35.py','editMap':'demo-iterations/v35/capture/edit-map.json',
 'captions':'demo-iterations/v35/capture/captions.srt','narration':'demo-iterations/v35/capture/narration.txt',
 'checksPending':['full decode','frame count and runtime','audio/caption sync','critical state readability at 1920 and 960']}
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'candidate':str(OUT),'sha256':sha(OUT),'runtime':probe['format']['duration'],'frames':v.get('nb_frames'),'audio':au['duration']},indent=2))

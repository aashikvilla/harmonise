#!/usr/bin/env python3
"""Render v36 from the immutable v13 master with frame-counted source windows."""
from pathlib import Path
import subprocess, json, hashlib, re, os

ROOT = Path(__file__).resolve().parents[3]
ITER = ROOT / 'demo-iterations/v36'
CAP = ITER / 'capture'
VER = ITER / 'verification'
MASTER = ROOT / 'demo-iterations/v13/demo.mp4'
SOURCE = ROOT / 'demo-iterations/v13'
OUT = ITER / 'demo.mp4'
OUT_TMP = ITER / 'demo.rendering.mp4'
FPS = 30
WINDOWS = [
    (0, 1073, 'video', None),
    (0, 214, 'still', '07-day-4-peer-perspective.png'),
    (0, 142, 'still', '08-day-9-host-boundary.png'),
    (0, 162, 'still', '10-day-16-dev-unanswered.png'),
    (2397, 3130, 'video', None),
    (3130, 3270, 'video', None),
    (0, 135, 'still', '14-selected-private-takeaway.png'),
    (3642, 3945, 'video', None),
    (4215, 4755, 'video', None),
    (5025, 5363, 'video', None),
]
VIDEO_AUDIO = {0:(0.000,35.766667), 4:(79.900,104.333), 5:(104.333,109.000),
               7:(121.400,131.500), 8:(140.500,158.500), 9:(167.500,178.767)}
STILL_CUES = [
    [(42.000,45.425,'Day four: one member wants time to choose.'),
     (46.500,50.200,'Another member sees a different part of the situation.')],
    [(50.500,54.800,'Day nine. The host says, I can listen; I can’t decide for you.')],
    [(59.200,62.800,'Day sixteen: Dev’s question still has no replies.')],
    [(118.000,121.360,'Arjun chooses one bounded thing that helped.')],
]

def run(args): subprocess.run(args, check=True)
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def sec(frame): return frame / FPS

inputs = ['-i', str(MASTER)]
for a,b,kind,name in WINDOWS:
    if kind == 'still': inputs += ['-loop','1','-framerate',str(FPS),'-i',str(SOURCE/'capture'/name)]
parts=[]; vlabels=[]; alabels=[]; image_index=1; still_i=0
for i,(a,b,kind,name) in enumerate(WINDOWS):
    n=b-a; dur=sec(n); v=f'v{i}'; au=f'a{i}'
    if kind == 'video':
        # Frame-based picture trims preserve the requested CFR boundaries.
        parts.append(f'[0:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS,setsar=1[{v}]')
        # Explicit millisecond bounds keep every retained SRT/audio cue whole.
        audio_in,audio_out=VIDEO_AUDIO[i]
        parts.append(f'[0:a]atrim=start={audio_in:.6f}:end={audio_out:.6f},asetpts=PTS-STARTPTS,aresample=48000[{au}]')
    else:
        # The full captured screen is fitted above a dedicated caption strip.
        # UI pixels remain intact; captions and original narration are aligned.
        draw=[]; audio_labels=[]; t=0.0
        for cue_i,(audio_in,audio_out,caption) in enumerate(STILL_CUES[still_i]):
            cue_dur=audio_out-audio_in
            escaped=caption.replace('\\','\\\\').replace(':','\\:').replace("'", "\\'")
            draw.append(f'drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text=\'{escaped}\':fontcolor=white:fontsize=31:x=(w-text_w)/2:y=1008:box=0:enable=between(t\\,{t:.6f}\\,{t+cue_dur:.6f})')
            lab=f's{still_i}a{cue_i}'; audio_labels.append(f'[{lab}]')
            parts.append(f'[0:a]atrim=start={audio_in:.3f}:end={audio_out:.3f},asetpts=PTS-STARTPTS,aresample=48000[{lab}]')
            t += cue_dur
        parts.insert(-len(audio_labels),
            f'[{image_index}:v]scale=1728:972:flags=lanczos,pad=1920:1080:96:0:color=0xF4F4F0,'
            f'drawbox=x=0:y=972:w=1920:h=108:color=0x173F3B:t=fill,setsar=1,'+','.join(draw)+
            f',trim=end_frame={n},setpts=PTS-STARTPTS[{v}]')
        if len(audio_labels)==1:
            parts.append(f'{audio_labels[0]}apad,atrim=duration={dur:.9f},aresample=48000[{au}]')
        else:
            raw=f's{still_i}raw'
            parts.append(''.join(audio_labels)+f'concat=n={len(audio_labels)}:v=0:a=1[{raw}]')
            parts.append(f'[{raw}]apad,atrim=duration={dur:.9f},aresample=48000[{au}]')
        image_index += 1; still_i += 1
    vlabels.append(f'[{v}]'); alabels.append(f'[{au}]')
parts.append(''.join(vlabels)+f'concat=n={len(WINDOWS)}:v=1:a=0[vout]')
parts.append(''.join(alabels)+f'concat=n={len(WINDOWS)}:v=0:a=1[aout]')
graph=';'.join(parts)
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*inputs,'-filter_complex',graph,
     '-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17',
     '-pix_fmt','yuv420p','-r',str(FPS),'-c:a','aac','-b:a','192k','-ar','48000',
     '-movflags','+faststart',str(OUT_TMP)])
os.replace(OUT_TMP, OUT)

def parse_srt(path):
    cues=[]
    for block in re.split(r'\n\s*\n',path.read_text().strip()):
        lines=block.splitlines()
        if len(lines)<3: continue
        m=re.match(r'(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)',lines[1])
        if not m: continue
        z=list(map(int,m.groups())); st=z[0]*3600+z[1]*60+z[2]+z[3]/1000; en=z[4]*3600+z[5]*60+z[6]+z[7]/1000
        cues.append((st,en,'\n'.join(lines[2:])))
    return cues
def stamp(t):
    ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

# Sidecar documents full retained original cues and the re-rendered still cues.
cues=[]; offset=0.0; still_i=0
for wi,(fa,fb,kind,name) in enumerate(WINDOWS):
    a,b=VIDEO_AUDIO.get(wi,(0,0)) if kind=='video' else (0,0)
    if kind=='still':
        t=0.0
        for audio_in,audio_out,txt in STILL_CUES[still_i]:
            d=audio_out-audio_in; cues.append((offset+t,offset+t+d,txt)); t+=d
        still_i+=1
    else:
        for st,en,txt in parse_srt(SOURCE/'captions.srt'):
            lo=max(st,a); hi=min(en,b)
            if lo==st and hi==en: cues.append((offset+lo-a,offset+hi-a,txt))
    offset += sec(fb-fa)
with (CAP/'captions.srt').open('w') as f:
    for i,(a,b,t) in enumerate(cues,1): f.write(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t}\n\n')
(CAP/'narration.txt').write_text((SOURCE/'narration.txt').read_text()+
    '\nEditorial note: complete original narration cues from 00:42.000–00:45.425 and 00:46.500–00:50.200 were placed over the captured Day 4 screen; 00:50.500–00:54.800 over Day 9; 00:59.200–01:02.800 over Day 16; and 01:58.000–02:01.360 over the captured private-takeaway screen. No new narration was recorded.\n')

probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUT)],text=True))
v=next(s for s in probe['streams'] if s['codec_type']=='video'); au=next(s for s in probe['streams'] if s['codec_type']=='audio')
master_hash=sha(MASTER); candidate_hash=sha(OUT)
still_caption_index=0
range_records=[]
for wi,(a,b,kind,name) in enumerate(WINDOWS):
    rec={'inFrame':a,'outFrameExclusive':b,'durationSeconds':sec(b-a),'treatment':kind}
    if kind=='still':
        rec.update({'capturedStill':'demo-iterations/v13/capture/'+name,
            'audioCues':[{'sourceInSeconds':x,'sourceOutSeconds':y,'caption':c} for x,y,c in STILL_CUES[still_caption_index]],
            'audioTreatment':'original matching narration clips concatenated without unrelated source audio; padded with silence only for remaining still duration'})
        still_caption_index+=1
    else:
        rec.update({'sourceInSeconds':VIDEO_AUDIO[wi][0],'sourceOutSeconds':VIDEO_AUDIO[wi][1],
                    'audio':'original v13 AAC segment; complete original cues retained'})
    range_records.append(rec)
edit={'iteration':'v36','master':'demo-iterations/v13/demo.mp4','masterSha256':master_hash,
 'candidate':'demo-iterations/v36/demo.mp4','candidateSha256':candidate_hash,
 'retainedSourceRanges':range_records,
 'rangeSumSeconds':sum(b-a for a,b,_,_ in WINDOWS)/FPS,
 'targetSeconds':126.0,'renderedFrames':int(v.get('nb_frames',0)),'renderedSeconds':float(v['duration']),
 'stillCaptionTreatment':{'canvas':[1920,1080],'screenFit':[1728,972],'screenPosition':[96,0],
   'captionBand':[0,972,1920,108],'method':'clean editorial inset; exact captured still remains one image plane'},
 'imageTreatment':'No crop/reframe applied to retained video. Consent and post screens use original intact source frames.',
 'truthBoundary':'Only v13 captured pixels, complete v13 narration/caption cues, and visible prepared UI; no new activity, replies, users, outcomes, provider availability, or model claims.'}
(CAP/'edit-map.json').write_text(json.dumps(edit,indent=2)+'\n')
manifest={'iteration':'v36','status':'candidate rendered from exact v13 master and captured stills',
 'candidate':'demo-iterations/v36/demo.mp4','candidateSha256':candidate_hash,'masterSha256':master_hash,
 'durationSeconds':float(probe['format']['duration']),
 'video':{'codec':v['codec_name'],'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'frames':v.get('nb_frames'),'durationSeconds':float(v['duration'])},
 'audio':{'codec':au['codec_name'],'sampleRate':au['sample_rate'],'channels':au['channels'],'durationSeconds':float(au['duration'])},
 'renderScript':'demo-iterations/v36/capture/render-v36.py','editMap':'demo-iterations/v36/capture/edit-map.json',
 'captions':'demo-iterations/v36/capture/captions.srt','narration':'demo-iterations/v36/capture/narration.txt',
 'verification':'demo-iterations/v36/verification/report.md'}
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'candidate':str(OUT),'sha256':candidate_hash,'duration':probe['format']['duration'],'frames':v.get('nb_frames'),'audio':au['duration']},indent=2))

#!/usr/bin/env python3
"""Render v28 from selected intervals of the real v27 Playwright product capture."""
from pathlib import Path
import hashlib, json, subprocess

ROOT = Path(__file__).resolve().parents[3]
ITER = ROOT / 'demo-iterations' / 'v28'
CAP = ITER / 'capture'
REL = ITER / 'verification' / 'release'
REL.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'demo-iterations' / 'v27' / 'capture' / 'video' / 'v27-real-product-session.webm'
OUT = ITER / 'demo.mp4'
PICTURE = CAP / 'captioned-picture.mp4'
FPS = 25
W, H = 1920, 1080

# These are authentic consecutive intervals from the single real interactive session.
# The correction (25.011–48.517) is kept intact as one continuous dramatic beat.
segments = [
    {'name':'hook-and-promise','start':0.000,'end':7.004,'narration':[('01',0.000),('02',3.502)]},
    {'name':'arjun-own-words','start':12.006,'end':18.008,'narration':[('04',12.006)]},
    {'name':'planned-muse-role','start':18.008,'end':25.011,'narration':[('05',18.008)]},
    {'name':'not-quite-correction','start':25.011,'end':48.517,'narration':[('06',25.011),('07',31.013),('08',36.014),('09',43.015)]},
    {'name':'family-context-relevance','start':60.524,'end':67.529,'narration':[('12',60.524)]},
    {'name':'one-fictional-peer-perspective','start':77.537,'end':97.554,'narration':[('15',77.537),('16',84.542),('17',90.552)]},
    {'name':'question-and-decline','start':103.558,'end':122.561,'narration':[('19',103.558),('20',110.559),('21',117.559)]},
    {'name':'private-takeaway','start':129.562,'end':133.362,'narration':[('28',129.562)]},
]
clock = 0.0
for s in segments:
    s['duration'] = s['end'] - s['start']
    s['outStart'] = clock
    clock += s['duration']
DURATION = clock

captions = [
    (0.10,3.48,'“I can’t tell my family what I want without feeling ungrateful.”\nFictional · prepared scenario.'),
    (3.52,6.95,'For adults facing family pressure: clarify privately,\ncorrect the reflection, choose whether to share.'),
    (7.05,13.90,'Arjun puts the family pressure into his own words.'),
    (14.10,20.85,'Muse Spark is planned to help organize themes for review.\nThis text is prepared; no model is connected.'),
    (21.05,27.05,'Prepared local example · no model connected.\nA possible reading for Arjun to check.'),
    (27.15,32.10,'“Not quite.” The first reading misses what he needs.'),
    (32.20,39.10,'He says he needs time to decide for himself.'),
    (39.20,44.95,'The editable reflection changes to hold his correction.'),
    (45.05,52.05,'His corrected theme keeps family context in view;\nbroader legal results are set aside.'),
    (52.15,59.15,'One prepared fictional perspective appears.\nNo live community is connected.'),
    (59.25,65.25,'Ravi says a trusted friend helped him speak with family.'),
    (65.35,72.20,'Their circumstances differ: Arjun has not said\nhe has someone he trusts.'),
    (72.30,79.30,'The exact question is for the Family Expectations group,\nunder the alias QuietRiver.'),
    (79.40,86.40,'Private conversation is excluded.\nConsent remains unchecked.'),
    (86.50,91.00,'Arjun chooses Maybe later. Nothing is sent.'),
    (91.10,93.29,'“I can ask for time before deciding.”\nKept privately for this preview.'),
]

def stamp(t):
    ms=round(t*1000); h,rem=divmod(ms,3600000); m,rem=divmod(rem,60000); sec,ms=divmod(rem,1000)
    return f'{h:02d}:{m:02d}:{sec:02d},{ms:03d}'

def run(args): subprocess.run(args, check=True)
def q(path): return str(path).replace(':', r'\:').replace("'", r"\'")

# Actual captions are stored separately and burned in with 38px type (19px at 960x540).
cue_parts=[]
for idx,(a,b,txt) in enumerate(captions,1):
    p=CAP/f'caption-{idx:02}.txt'; p.write_text(txt,encoding='utf-8')
    cue_parts.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{q(p)}':fontcolor=white:fontsize=38:line_spacing=4:x=(w-text_w)/2:y=964:box=1:boxcolor=0x163a36@0.98:boxborderw=12:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
# Persistent provenance line appears on the full 93s film; lower captions carry specific details.
cue_parts += [
    "drawbox=x=0:y=0:w=iw:h=56:color=0x163a36@0.94:t=fill",
    "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='FICTIONAL PREPARED DEMO  ·  NO MODEL CONNECTED  ·  NO LIVE COMMUNITY':fontcolor=white:fontsize=28:x=32:y=14:fix_bounds=1",
]
video_filters=[]
for i,s in enumerate(segments):
    video_filters.append(f"[0:v]trim=start={s['start']:.3f}:end={s['end']:.3f},setpts=PTS-STARTPTS[v{i}]")
video_filters.append(''.join(f'[v{i}]' for i in range(len(segments)))+f"concat=n={len(segments)}:v=1:a=0,trim=duration={DURATION:.3f},setpts=PTS-STARTPTS,fps={FPS},crop=1600:792:0:0,zoompan=z='1.015+0.000015*on':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1600x792:fps={FPS},scale=1920:950:flags=lanczos,pad=1920:1080:0:0:color=0xF4F2EC,setsar=1,format=yuv420p,"+','.join(cue_parts)+'[vout]')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(SOURCE),'-filter_complex',';'.join(video_filters),'-map','[vout]','-an','-t',f'{DURATION:.3f}','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(PICTURE)])
# Captions sidecar matches the burned caption timings and disclosure content.
(CAP/'captions.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{txt}' for i,(a,b,txt) in enumerate(captions,1))+'\n',encoding='utf-8')
# Reuse truthful v27 narration WAVs wherever the cut retains that scene. The custom final line
# replaces a longer sentence so the private takeaway cannot become a long static closing hold.
(CAP/'narration-28.txt').write_text('For now, his words stay private.\n',encoding='utf-8')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',"flite=textfile='"+q(CAP/'narration-28.txt')+"':voice=rms",'-ac','1','-ar','48000',str(CAP/'narration-28.wav')])
# Place speech clips at the matching source scene in the assembled timeline.
args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(PICTURE)]
entries=[]
for s in segments:
    for n,source_at in s['narration']:
        wav=CAP/f'narration-{n}.wav'
        if not wav.exists(): raise SystemExit(f'Missing retained narration source: {wav}')
        args += ['-i',str(wav)]
        entries.append((len(entries)+1, s['outStart'] + source_at - s['start'], wav, n))
filters=[]
for k,(input_idx,start,wav,n) in enumerate(entries,1):
    delay=round(start*1000)
    filters.append(f'[{input_idx}:a]adelay={delay}|{delay},volume=1[a{k}]')
filters.append(''.join(f'[a{k}]' for k in range(1,len(entries)+1))+f'amix=inputs={len(entries)}:duration=longest:normalize=0,alimiter=limit=0.95,apad,atrim=duration={DURATION:.3f},loudnorm=I=-18:TP=-2:LRA=7[aout]')
args += ['-filter_complex',';'.join(filters),'-map','0:v','-map','[aout]','-t',f'{DURATION:.3f}','-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(args)
(CAP/'narration.txt').write_text('\n'.join((CAP/f'narration-{n}.txt').read_text(encoding='utf-8').strip() for s in segments for n,_ in s['narration'] if n != '28') + '\n' + (CAP/'narration-28.txt').read_text(encoding='utf-8'), encoding='utf-8')
(CAP/'edit-map.json').write_text(json.dumps({'source':str(SOURCE.relative_to(ROOT)),'segments':segments,'durationSeconds':DURATION,'narrationSource':'Truthful selected v27 Flite narration clips; custom 3-word-equivalent closing line for the short final shot.','captions':len(captions)},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'durationSeconds':DURATION,'captionedPicture':str(PICTURE.relative_to(ROOT)),'candidate':str(OUT.relative_to(ROOT)),'segments':len(segments),'captionCues':len(captions),'narrationCues':len(entries)},indent=2))

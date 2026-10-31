#!/usr/bin/env python3
"""Render the v33 clarity and pacing pass from captured v29/v32 footage."""
from pathlib import Path
import subprocess, json, hashlib, shutil

ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v33'; CAP=ITER/'capture'; VER=ITER/'verification'
V29=ROOT/'demo-iterations/v29'; V32=ROOT/'demo-iterations/v32'
SOURCE=ROOT/'demo-iterations/v27/capture/video/v27-real-product-session.webm'
FPS=25
OUT=ITER/'demo.mp4'

def run(args): subprocess.run(args,check=True)
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def stamp(t):
    ms=round(t*1000); h,rem=divmod(ms,3600000); m,rem=divmod(rem,60000); sec,ms=divmod(rem,1000)
    return f'{h:02}:{m:02}:{sec:02},{ms:03}'
def esc(p): return str(p).replace(':',r'\:').replace("'",r"\'")
def ffprobe(path):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],text=True))

# Immutable picture cuts: use v29's rendered source segments, plus v32's exact
# continuous correction and captured consent replacement.
for name, src in [('continuous-correction.mp4', V32/'capture/continuous-correction.mp4'),
                  ('consent-replacement.mp4', V32/'capture/consent-replacement.mp4')]:
    shutil.copy2(src,CAP/name)

# Keep frame-accurate edit lengths at 25 fps. 102 frames = 4.08s for the
# requested ~4.10s peer-difference trim; total picture is 2190 frames = 87.60s.
segments=[
 ('hook',V29/'capture/picture-01.mp4',200,'source',0,8),
 ('reflection-wide',V29/'capture/picture-02.mp4',50,'source',12.006,14.006),
 ('reflection-detail',V29/'capture/picture-03.mp4',175,'source',14.006,21.006),
 ('planned-role',V29/'capture/picture-04.mp4',175,'source',18.008,25.011),
 ('continuous-correction',CAP/'continuous-correction.mp4',588,'source',25.011,48.517),
 ('peer-example',V29/'capture/picture-14.mp4',200,'source',79.537,87.537),
 ('peer-difference',V29/'capture/picture-15.mp4',102,'source',87.537,91.617),
 ('consent-preview',CAP/'consent-replacement.mp4',200,'source',109.5,117.5),
 ('maybe-later-action',V29/'capture/picture-18.mp4',125,'source',117.5,122.5),
 ('unsent-return',V29/'capture/picture-19.mp4',125,'source',122.5,127.5),
 ('private-takeaway',V29/'capture/picture-20.mp4',95,'source',129.562,133.362),
 ('private-takeaway-hold',V29/'capture/picture-21.mp4',30,'still',None,None),
 ('authored-private-choice',V29/'capture/picture-22.mp4',125,'card',None,None),
]
# Re-encode each asset to one common stream shape and normalize the replacement
# canvases, then join without rescaling captions or source UI pixels.
parts=[]; edit=[]; cursor=0.0
for i,(name,src,frames,kind,sstart,send) in enumerate(segments,1):
    dst=CAP/f'v33-picture-{i:02}.mp4'; duration=frames/FPS
    vf='fps=25,setsar=1,format=yuv420p'
    if name in ('continuous-correction','consent-preview'):
        vf='scale=1600:900:flags=lanczos,pad=1920:1080:160:90:color=0xf4f2ec,fps=25,setsar=1,format=yuv420p'
    # Several v29 source files report one fewer decoded frame than their nominal
    # timeline duration. Clone only the final frame where needed to honor exact
    # 25 fps boundaries from the edit map.
    vf+=f',tpad=stop_mode=clone:stop_duration=1,trim=end_frame={frames},setpts=PTS-STARTPTS'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-t',f'{duration:.3f}','-vf',vf,'-an','-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p','-frames:v',str(frames),str(dst)])
    parts.append(dst)
    edit.append({'name':name,'type':kind,'outputStart':round(cursor,3),'outputEnd':round(cursor+duration,3),'duration':round(duration,3),'frames':frames,
                 'sourceStart':sstart,'sourceEnd':send,'asset':str(src.relative_to(ROOT))})
    cursor+=duration
assert sum(x[2] for x in segments)==2190 and abs(cursor-87.6)<1e-9
lst=CAP/'picture-list.txt'; lst.write_text(''.join(f"file '{p.name}'\n" for p in parts),encoding='utf-8')
joined=CAP/'joined-picture.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(lst),'-an','-c','copy','-movflags','+faststart',str(joined)])

# Narration and burned captions are identical text, with the exact brief timing.
narration=[
 (0.20,6.60,"I’m Arjun. I can’t tell my family what I want without feeling ungrateful."),
 (8.15,12.15,'Arjun puts the family pressure into his own words.'),
 (12.25,16.60,'No one else sees this reflection.'),
 (17.10,20.55,"Muse Spark's planned role is organizing themes."),
 (20.60,24.00,'Prepared example; no model is connected.'),
 (24.15,28.15,'A possible reading is offered for him to check.'),
 (28.20,31.20,'He says, “Not quite.”'),
 (31.30,36.10,'He needs time to decide for himself.'),
 (44.75,47.40,'The reflection changes to hold his correction.'),
 (47.70,51.05,'One prepared fictional perspective appears.'),
 (51.05,55.05,'Ravi says a trusted friend helped him speak with family.'),
 (55.52,59.62,'They share family pressure; their circumstances differ.'),
 (59.81,63.61,'If he asks, it is for the group under an alias.'),
 (63.71,66.61,'His private reflection is excluded.'),
 (67.81,71.51,'Consent remains unchecked.'),
 (71.66,74.41,'He cancels and keeps the draft.'),
 (74.61,77.11,'Nothing is sent.'),
 (77.81,82.01,'For now, his words stay private.'),
 (82.11,86.61,'He can ask for time before deciding.'),
]
for i,(a,b,txt) in enumerate(narration,1):
    (CAP/f'narration-{i:02}.txt').write_text(txt+'\n',encoding='utf-8')
    (CAP/f'caption-{i:02}.txt').write_text(txt+'\n',encoding='utf-8')
(CAP/'narration.txt').write_text('\n'.join(t for _,_,t in narration)+'\n',encoding='utf-8')
(CAP/'captions.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{txt}' for i,(a,b,txt) in enumerate(narration,1))+'\n',encoding='utf-8')

# Overlay persistent truth labels, the early editorial audience identifier,
# and captions. Existing captured pixels carry the recorded consent fields.
filters=[
 "drawbox=x=0:y=18:w=1920:h=52:color=0x163a36@0.98:t=fill",
 "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='FICTIONAL PREPARED DEMO  ·  NO MODEL CONNECTED  ·  NO LIVE COMMUNITY':fontcolor=white:fontsize=27:x=190:y=31:fix_bounds=1",
 "drawbox=x=231:y=74:w=1458:h=36:color=0x163a36@0.98:t=fill:enable='between(t\\,0\\,4)'",
 "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='Arjun · adult facing family pressure':fontcolor=white:fontsize=22:x=248:y=80:fix_bounds=1:enable='between(t\\,0\\,4)'",
]
for y,label,enable in [
    (73,'PLANNED ROLE · Muse Spark could organize themes for Arjun to review.','between(t\\,17.000\\,24.000)'),
    (105,'PREPARED EXAMPLE · no model is connected.','between(t\\,17.000\\,24.000)'),
    (73,'FICTIONAL · PREPARED EXAMPLE','between(t\\,47.520\\,59.600)'),
    (105,'NO LIVE ACTIVITY','between(t\\,47.520\\,59.600)'),
]:
    filters.append(f"drawbox=x=231:y={y}:w=1458:h=28:color=0x163a36@0.98:t=fill:enable='{enable}'")
    filters.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='{label}':fontcolor=white:fontsize=20:x=244:y={y+5}:fix_bounds=1:enable='{enable}'")
for i,(a,b,_) in enumerate(narration,1):
    p=CAP/f'caption-{i:02}.txt'
    filters.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{esc(p)}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=1003:box=1:boxcolor=0x163a36@0.98:boxborderw=12:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
captioned=CAP/'captioned-picture.mp4'
# The concat demuxer retains each short source file's last-packet timestamp,
# which undercounts its nominal duration. Rebuild a continuous 25 fps clock
# from the concatenated frame order before captions and overlays are applied.
filters.insert(0,'setpts=N/(25*TB)')
filters.insert(1,'fps=25')
filters.insert(2,'tpad=stop_mode=clone:stop_duration=1')
filters.insert(3,'trim=end_frame=2190')
filters.insert(4,'setpts=PTS-STARTPTS')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(joined),'-vf',','.join(filters),'-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-frames:v','2190',str(captioned)])

# Flite matches the established v29 narration method. Cue 9 is gently sped up,
# as in v32, so its final words land before the correction shot ends.
audio_args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(captioned)]
for i,(_,_,txt) in enumerate(narration,1):
    tf=CAP/f'narration-{i:02}.txt'; wav=CAP/f'narration-{i:02}.wav'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile='{esc(tf)}':voice=rms",'-ac','1','-ar','48000',str(wav)])
    audio_args+=['-i',str(wav)]
filters=[]
for i,(a,b,_) in enumerate(narration,1):
    delay=round(a*1000)
    tempo='atempo=1.24,' if i==9 else ''
    filters.append(f'[{i}:a]{tempo}adelay={delay}|{delay},volume=1[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(1,len(narration)+1))+f'amix=inputs={len(narration)}:duration=longest:normalize=0,alimiter=limit=0.95,apad,atrim=duration=87.61,loudnorm=I=-18:TP=-2:LRA=7[aout]')
audio_args += ['-filter_complex',';'.join(filters),'-map','0:v','-map','[aout]','-t','87.61','-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(audio_args)

# Human-readable edit map and exact generated artifact facts.
editmap={'iteration':'v33','runtimeSeconds':87.61,'pictureFrames':2190,'frameRate':25,'shots':edit,
         'narrationCount':len(narration),'narration':[{'start':a,'end':b,'text':t,'caption':t} for a,b,t in narration],
         'openingIdentifier':{'start':0,'end':4,'text':'Arjun · adult facing family pressure','kind':'editorial label'},
         'truthBoundary':{'fictionalPreparedDemo':True,'modelConnected':False,'liveCommunity':False,'museSpark':'planned organizing role, not connected','messageSent':False},
         'sourceNotes':['Continuous correction copied from v32 capture, uninterrupted 588 frames.','Consent replacement copied from v32 and retains the actual captured fields and action.','Peer-difference trim is 102 frames (4.08s) to preserve a frame-accurate 25 fps cut, approximating the 4.10s brief.','Picture runtime is 87.60s at 25 fps; audio/container runtime is 87.61s.']}
(CAP/'edit-map.json').write_text(json.dumps(editmap,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
info=ffprobe(OUT)
video=next(s for s in info['streams'] if s['codec_type']=='video'); audio=next(s for s in info['streams'] if s['codec_type']=='audio')
manifest={'iteration':'v33','status':'first candidate rendered; not scored or committed','candidate':'demo-iterations/v33/demo.mp4','candidateSha256':sha(OUT),
          'durationSeconds':float(info['format']['duration']),'video':{'codec':video['codec_name'],'width':video['width'],'height':video['height'],'frameRate':video['r_frame_rate'],'frames':video.get('nb_frames')},
          'audio':{'codec':audio['codec_name'],'sampleRate':audio['sample_rate'],'channels':audio['channels']},
          'renderScript':'demo-iterations/v33/capture/render-v33.py','editMap':'demo-iterations/v33/capture/edit-map.json',
          'narrationAndCaptions':'demo-iterations/v33/capture/narration.txt; captions.srt','sourceCapture':'demo-iterations/v27/capture/video/v27-real-product-session.webm',
          'sourceSha256':sha(SOURCE),'v32MasterSha256':sha(V32/'demo.mp4'),'v29MasterSha256':sha(V29/'demo.mp4'),
          'checksPending':['full decode','960x540 frame extraction']}
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'candidate':str(OUT),'sha256':sha(OUT),'runtime':info['format']['duration'],'pictureFrames':2190,'videoSize':[video['width'],video['height']]},indent=2))

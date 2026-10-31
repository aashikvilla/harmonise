#!/usr/bin/env python3
"""Render Harmonise v37 from the local UI capture and selected, verbatim v13 VO cues."""
from pathlib import Path
import subprocess, json, hashlib, re, os
ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v37'; CAP=ITER/'capture'; SRC=CAP/'source'; GEN=CAP/'generated'; VER=ITER/'verification'
MASTER=ROOT/'demo-iterations/v13/demo.mp4'; OUT=ITER/'demo.mp4'; TMP=ITER/'demo.rendering.mp4'; PIC=CAP/'picture-no-captions.mp4'
FPS=30; RATE=48000; DURATION=90.0
PRIOR={
 'demo-iterations/v13/demo.mp4':'dd21e18a055cf80bca4ee60b0f62620d6e82025b10639985bfb64a722d691d47',
 'demo-iterations/v35/demo.mp4':'27c4fc952bd8fb876afe533f374e3f4bc4c60e2e5ab5d95e00c382d0f56e79d5',
 'demo-iterations/v36/demo.mp4':'808f3d3bf00dbc03f500870401d4671c06d3e842c746bef472e6bab7c4ff4b1c'}

def run(args): subprocess.run(args,check=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ts(t):
    ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
def probe(p): return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)],text=True))
# Guard the protected masters before and after render.
for rel,expected in PRIOR.items():
    if sha(ROOT/rel)!=expected: raise RuntimeError(f'Protected prior asset changed: {rel}')
# Scene and cue timeline. Spoken clips are exact source intervals from v13 audio.
scenes=[
 {'name':'opening','source':'01-opening-fictional-quote.png','start':0.0,'duration':6.0,'treatment':'designed fictional quote card'},
 {'name':'product','source':'02-product-promise.png','start':6.0,'duration':8.0,'treatment':'current frontend entry screen crop'},
 {'name':'correction','source':'continuous-correction-raw.webm','start':14.0,'duration':19.8666667,'treatment':'continuous 1920x1080 UI screen recording; loaded state begins at source 0.50s and retains the full correction sequence'},
 {'name':'perspectives','source':'03-peer-perspectives.png','start':33.8666667,'duration':8.9,'treatment':'two explicitly prepared fictional perspective cards'},
 {'name':'moderator','source':'04-moderator-boundary.png','start':42.7666667,'duration':5.1,'treatment':'current frontend moderator-boundary capture'},
 {'name':'share-audience','source':'05-share-audience.png','start':47.8666667,'duration':5.0,'treatment':'exact current frontend preview; consent unchecked'},
 {'name':'share-draft-focus','source':'06-share-draft-focus.png','start':52.8666667,'duration':4.2,'treatment':'current frontend share-preview textbox focus screenshot'},
 {'name':'share-consent-focus','source':'07-share-consent-focus.png','start':57.0666667,'duration':4.0,'treatment':'current frontend share-preview checkbox focus screenshot; not selected'},
 {'name':'share-unsent','source':'05-share-audience.png','start':61.0666667,'duration':2.8,'treatment':'exact current frontend preview; nothing sent'},
 {'name':'provider','source':'08-no-verified-provider.png','start':63.8666667,'duration':7.0,'treatment':'current frontend support availability screen'},
 {'name':'maybe-later','source':'09-maybe-later-selected.png','start':70.8666667,'duration':8.0,'treatment':'current frontend Maybe later selection; private reflection retained'},
 {'name':'ending','source':'10-final-private-unsent.png','start':78.8666667,'duration':11.1333333,'treatment':'current frontend private takeaway and unsent draft summary'}]
# Captions reproduce exact wording from v13/captions.srt and are re-timed to the new picture.
cues=[
 (0.000,4.000,'I can’t tell my family what I want without feeling\nungrateful.'),
 (6.000,10.800,'Private reflection you can correct before exploring peer\nexperiences.'),
 (11.500,13.800,'Prepared preview. No model.'),
 (14.000,18.100,'A local example offers a possibility, not an answer.'),
 (18.300,20.700,'Arjun says, Not quite.'),
 (20.900,25.105,'He changes the words: it is his parents, and he wants time.'),
 (25.500,28.900,'Now the editable reflection changes with what he said.'),
 (29.100,33.250,'He wants time to decide, without advice to stay or leave.'),
 (34.000,37.425,'Day four: one member wants time to choose.'),
 (37.425,41.125,'Another member sees a different part of the situation.'),
 (41.133,45.433,'Day nine. The host says, I can listen; I can’t decide for you.'),
 (53.033,56.693,'Private conversation and context are excluded.'),
 (57.133,61.133,'Consent is unchecked. Continue stays disabled.'),
 (61.333,64.033,'Nothing is sent from this preview.'),
 (65.133,68.243,'No provider is verified or bookable here.'),
 (71.500,74.390,'He keeps time to decide privately.'),
 (75.300,78.350,'He could leave without sharing anything.'),
 (79.700,83.035,'The prepared example shows no real people or outcome.'),
 (84.200,88.180,'Nothing is sent without consent. Arjun can leave it here.')]
with (CAP/'captions.srt').open('w') as f:
    for n,(a,b,t) in enumerate(cues,1): f.write(f'{n}\n{ts(a)} --> {ts(b)}\n{t}\n\n')
# Picture-only intermediate from real screenshots, prepared cards and the continuous browser recording.
inputs=[]; idx={};
for s in scenes:
    p=SRC/s['source'] if s['source'].endswith('.webm') else GEN/s['source']
    idx[s['name']]=len(idx)
    if s['source'].endswith('.webm'):
        inputs += ['-i',str(p)]
    else:
        inputs += ['-loop','1','-framerate',str(FPS),'-t',f"{s['duration']:.6f}",'-i',str(p)]
parts=[]; vlabels=[]
cream='0xF4F3EE'; ink='0x173F3B'; font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
for i,s in enumerate(scenes):
    inp=idx[s['name']]; label=f'v{i}'; frames=round(s['duration']*FPS)
    if s['source'].endswith('.webm'):
        # Keep the browser take uncut internally: crop only its final static hold to the exact 20-second beat.
        filt=(f'[{inp}:v]trim=start=0.500:end=20.360,setpts=PTS-STARTPTS,'
              f'fps={FPS},trim=end_frame={frames},'
              f'scale=1653:930:flags=lanczos,pad=1920:1080:(ow-iw)/2:0:color={cream},'
              f'drawbox=x=0:y=930:w=1920:h=150:color={ink}:t=fill,'
              f"drawbox=x=12:y=18:w=355:h=40:color={ink}@0.96:t=fill,drawtext=fontfile={font}:text='Prepared interaction · no model connected':fontcolor=white:fontsize=13:x=22:y=30,setsar=1/1[{label}]")
    else:
        filt=(f'[{inp}:v]fps={FPS},trim=end_frame={frames},setpts=PTS-STARTPTS,'
              f'crop=1920:930:0:0,pad=1920:1080:0:0:color={cream},'
              f'drawbox=x=0:y=930:w=1920:h=150:color={ink}:t=fill,setsar=1/1[{label}]')
    parts.append(filt); vlabels.append(f'[{label}]')
parts.append(''.join(vlabels)+f'concat=n={len(scenes)}:v=1:a=0[vout]')
filtergraph=';'.join(parts)
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*inputs,'-filter_complex',filtergraph,
     '-map','[vout]','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',
     '-r',str(FPS),'-frames:v',str(round(DURATION*FPS)),'-movflags','+faststart',str(PIC)])
# Extract source audio as PCM for audit and build the film track only from captioned v13 narration windows.
AUDIO_SOURCE=SRC/'v13-narration-source.wav'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(MASTER),'-vn','-ac','1','-ar',str(RATE),'-c:a','pcm_s16le',str(AUDIO_SOURCE)])
# outputStart, sourceIn, sourceOut; each set contains only the same spoken caption words above.
audio_segments=[
 (0.000,0.000,4.000),(6.000,4.200,9.000),(11.500,14.000,16.300),
 (14.000,16.500,35.750),(34.000,35.767,47.200),(53.033,53.033,64.033),
 (65.133,65.133,68.243),(71.500,73.133,76.023),(75.300,77.634,80.684),
 (79.700,112.733,116.068),(84.200,120.833,124.813)]
filters=[]; audios=[]
for i,(dst,a,b) in enumerate(audio_segments):
    filters.append(f'[1:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,aresample={RATE},adelay=delays={round(dst*1000)}:all=1[a{i}]')
    audios.append(f'[a{i}]')
filters.append(f'anullsrc=r={RATE}:cl=mono:d={DURATION}[base]')
filters.append('[base]'+''.join(audios)+f'amix=inputs={len(audio_segments)+1}:duration=first:normalize=0,atrim=duration={DURATION},aresample={RATE}[aout]')
# Burn matching SRT into a dedicated 150 px band; no fabricated speech is added.
sub=CAP/'captions.srt'
filters.insert(0,f"[0:v]subtitles='{sub.as_posix()}':force_style='FontName=DejaVu Sans,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&HAA000000,BorderStyle=3,Outline=0,Shadow=0,Alignment=2,MarginL=96,MarginR=96,MarginV=28'[vout]")
graph=';'.join(filters)
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(PIC),'-i',str(MASTER),'-filter_complex',graph,
     '-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',
     '-r',str(FPS),'-frames:v',str(round(DURATION*FPS)),'-c:a','aac','-b:a','192k','-ar',str(RATE),'-ac','1',
     '-movflags','+faststart',str(TMP)])
os.replace(TMP,OUT)
# Capture full source and candidate hashes plus exact timing/edit facts.
master_hash=sha(MASTER); candidate_hash=sha(OUT); raw=probe(OUT)
v=next(x for x in raw['streams'] if x['codec_type']=='video'); au=next(x for x in raw['streams'] if x['codec_type']=='audio')
edit={'iteration':'v37','candidate':'demo-iterations/v37/demo.mp4','candidateSha256':candidate_hash,
 'durationSeconds':DURATION,'fps':FPS,'frameCount':round(DURATION*FPS),'canvas':[1920,1080],
 'sourceUIInteraction':'demo-iterations/v37/capture/source/continuous-correction-raw.webm',
 'sourceUIInteractionSha256':sha(SRC/'continuous-correction-raw.webm'),
 'sourceUIInteractionDimensions':[1920,1080],'sourceTakeSeconds':float(probe(SRC/'continuous-correction-raw.webm')['format']['duration']),
 'cutInteractionSeconds':[0.5,20.36],'cutInteractionFrames':596,'continuity':'One uninterrupted Playwright-recorded take after the page is loaded. It includes the initial typed words and Send, then real click Not quite, correction typing, Send, editable reflection changed by typed input, and Yes, that’s closer confirmation. No post-generated cursor, text, or UI transition.',
 'scenes':scenes,'audioSource':'demo-iterations/v13/demo.mp4 audio stream, extracted to capture/source/v13-narration-source.wav',
 'audioSourceSha256':sha(AUDIO_SOURCE),'audioSegments':[{'outputStart':x,'sourceIn':y,'sourceOut':z,'source':'v13 existing narration audio'} for x,y,z in audio_segments],
 'captions':'capture/captions.srt; each speech line is a verbatim v13 caption cue with only output timing changed; no new speech was authored.',
 'captionCueCount':len(cues),'captionBurn':'Caption master uses a dedicated dark band. No caption covers the interaction UI.',
 'narrationStatus':'Reused selected v13 narration cues. No new VO recorded; no human/voice actor claim. Local TTS unavailable.',
 'fictionality':'Scenario, peer cards, and local UI examples are prepared fiction; no model, live member/moderator, provider directory, messaging service, or send is connected.',
 'priorMasterSha256':{k:v for k,v in PRIOR.items()}}
(CAP/'edit-map.json').write_text(json.dumps(edit,indent=2)+'\n')
# Exact spoken lines; on-screen editorial copy is not described as narration.
script='''HARMONISE v37 — NARRATION SCRIPT / AUDIO CUE LIST\n\nNarration source: selected existing voice cues from demo-iterations/v13/demo.mp4. No new voice performance or TTS was made for v37. The same cue wording is reproduced verbatim in capture/captions.srt and burned into the film. Speaker identity or professional human VO is not claimed.\n\n00:00–00:04  I can’t tell my family what I want without feeling ungrateful.\n00:06–00:10.8  Private reflection you can correct before exploring peer experiences.\n00:11.5–00:13.8  Prepared preview. No model.\n00:14–00:18.1  A local example offers a possibility, not an answer.\n00:18.3–00:20.7  Arjun says, Not quite.\n00:20.9–00:25.105  He changes the words: it is his parents, and he wants time.\n00:25.5–00:28.9  Now the editable reflection changes with what he said.\n00:29.1–00:33.25  He wants time to decide, without advice to stay or leave.\n00:34–00:37.425  Day four: one member wants time to choose.\n00:37.425–00:41.125  Another member sees a different part of the situation.\n00:41.133–00:45.433  Day nine. The host says, I can listen; I can’t decide for you.\n00:53.033–00:56.693  Private conversation and context are excluded.\n00:57.133–01:01.133  Consent is unchecked. Continue stays disabled.\n01:01.333–01:04.033  Nothing is sent from this preview.\n01:05.133–01:08.243  No provider is verified or bookable here.\n01:11.5–01:14.39  He keeps time to decide privately.\n01:15.3–01:18.35  He could leave without sharing anything.\n01:19.7–01:23.035  The prepared example shows no real people or outcome.\n01:24.2–01:28.18  Nothing is sent without consent. Arjun can leave it here.\n\nThe opening card, promise line, disclosure labels, two fictional peer cards, and end card are on-screen text, not new spoken lines.\n'''
(CAP/'narration.txt').write_text(script)
# Manifest is finalized again by verify-v37.py after decode/cue audit/screenshots.
manifest={'iteration':'v37','status':'candidate rendered; audience release gates remain unreviewed',
 'candidate':'demo-iterations/v37/demo.mp4','candidateSha256':candidate_hash,
 'durationSeconds':float(raw['format']['duration']),'video':{'codec':v['codec_name'],'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'frames':v.get('nb_frames'),'durationSeconds':float(v['duration'])},
 'audio':{'codec':au['codec_name'],'sampleRate':au['sample_rate'],'channels':au['channels'],'durationSeconds':float(au['duration'])},
 'renderScript':'demo-iterations/v37/capture/render-v37.py','frameScript':'demo-iterations/v37/capture/prepare-frames-v37.py',
 'captureScripts':['demo-iterations/v37/capture/capture-interaction.mjs','demo-iterations/v37/capture/capture-film-stills.mjs'],
 'sourceCapture':'demo-iterations/v37/capture/source/continuous-correction-raw.webm','editMap':'demo-iterations/v37/capture/edit-map.json',
 'captions':'demo-iterations/v37/capture/captions.srt','narration':'demo-iterations/v37/capture/narration.txt',
 'verification':'demo-iterations/v37/verification/report.md','priorMastersProtected':True,
 'narrationDisclosure':'Existing selected v13 VO only; no new VO/TTS or professional voice claim.'}
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'candidate':str(OUT),'sha256':candidate_hash,'duration':raw['format']['duration'],'frames':v.get('nb_frames'),'audioSeconds':au['duration']},indent=2))

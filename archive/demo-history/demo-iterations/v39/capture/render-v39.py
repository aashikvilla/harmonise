from pathlib import Path
import subprocess, hashlib, json
ROOT=Path(__file__).resolve().parents[3]; I=ROOT/'demo-iterations/v39'; C=I/'capture'; S=C/'source'; G=C/'generated'; V=I/'verification'
V.mkdir(exist_ok=True); OUT=I/'candidate.mp4'; PIC=C/'picture-no-captions.mp4'; MASTER=ROOT/'demo-iterations/v13/demo.mp4'; FPS=30; DUR=94; RATE=48000
PRIOR={'demo-iterations/v13/demo.mp4':'dd21e18a055cf80bca4ee60b0f62620d6e82025b10639985bfb64a722d691d47','demo-iterations/v35/demo.mp4':'27c4fc952bd8fb876afe533f374e3f4bc4c60e2e5ab5d95e00c382d0f56e79d5','demo-iterations/v36/demo.mp4':'808f3d3bf00dbc03f500870401d4671c06d3e842c746bef472e6bab7c4ff4b1c','demo-iterations/v37/demo.mp4':'9281740447ec8ddd8df5ecd943c423a6a3a2de164e49416d78541a91c3c73f05'}
def run(args): subprocess.run(args,check=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ts(t):
 ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000); return f'{h:02}:{m:02}:{s:02},{ms:03}'
for rel,h in PRIOR.items():
 if sha(ROOT/rel)!=h: raise RuntimeError('Protected video changed: '+rel)
# Retimed exact v13 source windows; no speech was newly recorded.
cues=[
(0.0,4.0,'I can’t tell my family what I want without feeling ungrateful.',0.0,4.0),
(6.0,10.8,'Private reflection you can correct before exploring peer experiences.',4.2,9.0),
(10.8,16.1,'Planned Muse Spark may organize themes to review, never decide what is true.',36.3,41.795),
(16.2,20.3,'A local example offers a possibility, not an answer.',16.5,20.6),
(20.4,22.8,'Arjun says, Not quite.',20.8,23.2),
(23.0,27.2,'He changes the words: it is his parents, and he wants time.',23.4,27.605),
(27.5,31.0,'Now the editable reflection changes with what he said.',28.0,31.4),
(31.2,35.4,'He wants time to decide, without advice to stay or leave.',31.6,35.75),
(38.0,41.425,'Day four: one member wants time to choose.',42.0,45.425),
(43.0,47.3,'Day nine. The host says, I can listen; I can’t decide for you.',50.5,54.8),
(47.5,51.5,'Fictional historical examples, prepared and not live.',55.0,59.0),
(51.5,55.65,'Arjun edits one question; the exact preview changes.',71.5,75.65),
(55.7,58.89,'The alias and group audience stay visible.',76.2,79.39),
(58.9,62.56,'Private conversation and context are excluded.',79.9,83.56),
(62.6,66.6,'Consent is unchecked. Continue stays disabled.',84.0,88.0),
(66.7,69.4,'Nothing is sent from this preview.',88.2,90.9),
(69.7,72.81,'No provider is verified or bookable here.',92.0,95.11),
(73.5,76.39,'He keeps time to decide privately.',96.0,98.89),
(77.0,80.05,'He could leave without sharing anything.',100.8,103.85),
(81.0,84.11,'Maybe later keeps that choice open.',109.0,112.11),
(86.6,89.98,'Nothing is sent without consent. Arjun can leave it here.',173.6,176.98),
]
with (C/'captions.srt').open('w',encoding='utf-8') as f:
 for n,(a,b,text,_,_) in enumerate(cues,1): f.write(f'{n}\n{ts(a)} --> {ts(b)}\n{text}\n\n')
# Each screen is an exact current local frontend screenshot. Separate scene crops follow the same captured share preview state.
scenes=[
('opening','01-opening.png',6.0),('private-reflection','02-private-reflection.png',10.0),('interaction','continuous-correction-raw.webm',22.0),('peer','03-peer-perspective.png',5.0),('host','04-host-boundary.png',8.5),('share-audience','05-share-audience.png',4.0),('share-draft','06-share-draft.png',3.3),('share-consent','07-share-consent.png',4.2),('share-unsent','08-share-unsent.png',6.5),('provider','09-provider.png',4.0),('maybe-later','10-maybe-later-selected.png',20.5)]
args=[]; static_indices=[]; raw_index=None; header_index=None; input_index=0
for name,src,dur in scenes:
 if src.endswith('.webm'):
  raw_index=input_index; args += ['-i',str(S/src)]; input_index+=1
  header_index=input_index; args += ['-loop','1','-framerate','30','-i',str(G/'correction-disclosure.png')]; input_index+=1
 else:
  ix=input_index; input_index+=1; static_indices.append((name,dur,ix)); args += ['-loop','1','-framerate','30','-t',str(dur),'-i',str(G/src)]
filters=[]; labels=[]
for name,dur,ix in static_indices:
 n=round(dur*FPS); filters.append(f'[{ix}:v]fps=30,trim=end_frame={n},setpts=PTS-STARTPTS,setsar=1/1,format=yuv420p[v{ix}]'); labels.append(f'[v{ix}]')
# Keep the v37 frontend correction take continuous and at normal speed. The captured final state is held for 64 frames to fit the edit.
filters.append(f'[{raw_index}:v]trim=start=0.5:end=20.36,setpts=PTS-STARTPTS,fps=30,trim=end_frame=596,crop=960:570:300:220,scale=1474:875:flags=lanczos,pad=1920:1080:223:90:color=0xf4f3ee,setsar=1/1,format=rgba[interaction_base]')
filters.append(f'[{header_index}:v]format=rgba[header]')
filters.append('[interaction_base][header]overlay=0:0:shortest=1,trim=end_frame=596,tpad=stop_mode=clone:stop_duration=2.133333,trim=end_frame=660,setsar=1/1,format=yuv420p[v_interaction]')
# Reorder labels to match the intended cut.
scene_labels=[]
for name,src,dur in scenes:
 if src.endswith('.webm'): scene_labels.append('[v_interaction]')
 else:
  ix=next(i for n,d,i in static_indices if n==name); scene_labels.append(f'[v{ix}]')
filters.append(''.join(scene_labels)+f'concat=n={len(scenes)}:v=1:a=0[vout]')
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args,'-filter_complex',';'.join(filters),'-map','[vout]','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',str(DUR*FPS),str(PIC)])
# Mix only exact v13 cue windows. Four seconds of silence remain at the end after the final speech cue.
afilters=[]; alabels=[]
for i,(dst,end,text,src_in,src_out) in enumerate(cues):
 afilters.append(f'[1:a]atrim=start={src_in:.3f}:end={src_out:.3f},asetpts=PTS-STARTPTS,aresample=48000,adelay=delays={round(dst*1000)}:all=1[a{i}]'); alabels.append(f'[a{i}]')
afilters += [f'anullsrc=r=48000:cl=mono:d={DUR}[silence]', '[silence]'+''.join(alabels)+f'amix=inputs={len(cues)+1}:duration=first:normalize=0,atrim=duration={DUR},aresample=48000[aout]']
subpath=(C/'captions.srt').as_posix()
afilters.append(f"[0:v]subtitles='{subpath}':force_style='FontName=DejaVu Sans,FontSize=10,PrimaryColour=&H003B3F17,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginL=100,MarginR=100,MarginV=4'[vout]")
tmp=I/'rendering.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(PIC),'-i',str(MASTER),'-filter_complex',';'.join(afilters),'-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',str(DUR*FPS),'-c:a','aac','-b:a','192k','-ar','48000','-ac','1','-movflags','+faststart',str(tmp)])
tmp.replace(OUT)
# Extract encoded narration for duration/tail audit.
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(OUT),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(C/'narration-v39.wav')])
print(json.dumps({'candidate':str(OUT.relative_to(ROOT)),'sha256':sha(OUT),'durationSeconds':DUR,'sourceCorrectionSha256':sha(S/'continuous-correction-raw.webm'),'clickCaptureSha256':sha(S/'maybe-later-click-raw.webm'),'protectedVideoHashes':{k:sha(ROOT/k) for k in PRIOR}},indent=2))

from pathlib import Path
import subprocess,json,hashlib,os
ROOT=Path(__file__).resolve().parents[3]; I=ROOT/'demo-iterations/v38'; C=I/'capture'; S=C/'source'; G=C/'generated'; V=I/'verification'; V.mkdir(exist_ok=True)
MASTER=ROOT/'demo-iterations/v13/demo.mp4'; OUT=I/'demo.mp4'; PIC=C/'picture-no-captions.mp4'; TMP=I/'rendering.mp4'; FPS=30; DUR=99; RATE=48000
prior={'demo-iterations/v13/demo.mp4':'dd21e18a055cf80bca4ee60b0f62620d6e82025b10639985bfb64a722d691d47','demo-iterations/v35/demo.mp4':'27c4fc952bd8fb876afe533f374e3f4bc4c60e2e5ab5d95e00c382d0f56e79d5','demo-iterations/v36/demo.mp4':'808f3d3bf00dbc03f500870401d4671c06d3e842c746bef472e6bab7c4ff4b1c'}
def run(a): subprocess.run(a,check=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ts(t):
 m=round(t*1000); h,m=divmod(m,3600000); mm,m=divmod(m,60000); ss,m=divmod(m,1000); return f'{h:02}:{mm:02}:{ss:02},{m:03}'
for rel,h in prior.items():
 if sha(ROOT/rel)!=h: raise RuntimeError('Protected original changed: '+rel)
scenes=[('opening','01-entry-hook.png',0,6),('promise','02-private-reflection.png',6,10.2),('interaction','continuous-correction-raw.webm',16.2,19.8),('peer','03-peer-perspective.png',36,7),('host','04-host-boundary.png',43,10),('share1','05-share-audience.png',53,5),('share2','06-share-draft.png',58,6),('share3','07-share-consent.png',64,8),('provider','08-provider-caveat.png',72,5),('ending','09-maybe-later-selected.png',77,22)]
# Exact existing v13 speech cues only. Text corresponds to captions.srt verbatim.
cues=[(0,4,'I can’t tell my family what I want without feeling\nungrateful.',0,4),(6,10.8,'Private reflection you can correct before exploring peer\nexperiences.',4.2,9),(10.8,16.1,'Planned Muse Spark may organize themes to review, never\ndecide what is true.',36.3,41.795),(16.2,20.3,'A local example offers a possibility, not an answer.',16.5,20.6),(20.4,22.8,'Arjun says, Not quite.',20.8,23.2),(23.0,27.2,'He changes the words: it is his parents, and he wants time.',23.4,27.605),(27.5,31.0,'Now the editable reflection changes with what he said.',28,31.4),(31.2,35.4,'He wants time to decide, without advice to stay or leave.',31.6,35.75),(36,39.425,'Day four: one member wants time to choose.',42,45.425),(43,47.3,'Day nine. The host says, I can listen; I can’t decide for\nyou.',50.5,54.8),(49,53,'Fictional historical examples, prepared and not live.',55,59),(53,57.15,'Arjun edits one question; the exact preview changes.',71.5,75.65),(58,61.19,'The alias and group audience stay visible.',76.2,79.39),(61,64.66,'Private conversation and context are excluded.',79.9,83.56),(65,69,'Consent is unchecked. Continue stays disabled.',84,88),(69.2,71.9,'Nothing is sent from this preview.',88.2,90.9),(72,75.11,'No provider is verified or bookable here.',92,95.11),(77,79.89,'He keeps time to decide privately.',96,98.89),(80,83.05,'He could leave without sharing anything.',100.8,103.85),(84,87.98,'Nothing is sent without consent. Arjun can leave it here.',163.6,167.58)]
with (C/'captions.srt').open('w') as f:
 for n,(a,b,t,_,_) in enumerate(cues,1): f.write(f'{n}\n{ts(a)} --> {ts(b)}\n{t}\n\n')
args=[]
for _,src,start,dur in scenes:
 p=S/src if src.endswith('.webm') else G/src
 if src.endswith('.webm'): args += ['-i',str(p)]
 else: args += ['-loop','1','-framerate',str(FPS),'-t',str(dur),'-i',str(p)]
parts=[]; labels=[]
for i,(name,src,start,dur) in enumerate(scenes):
 if src.endswith('.webm'):
  filt=f'[{i}:v]trim=start=0.5:end=20.36,setpts=PTS-STARTPTS,fps=30,trim=end_frame=600,crop=1280:720:320:150,scale=1920:1080:flags=lanczos,drawbox=x=0:y=0:w=1920:h=90:color=0x173F3B@0.96:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text=\'Prepared local text · real interaction · no model connected\':fontcolor=white:fontsize=30:x=72:y=29,drawbox=x=0:y=930:w=1920:h=150:color=0x173F3B:t=fill,setsar=1/1[v{i}]'
 else: filt=f'[{i}:v]fps=30,trim=end_frame={dur*30},setpts=PTS-STARTPTS,drawbox=x=0:y=930:w=1920:h=150:color=0x173F3B:t=fill,setsar=1/1[v{i}]'
 parts.append(filt); labels.append(f'[v{i}]')
parts.append(''.join(labels)+f'concat=n={len(scenes)}:v=1:a=0[vout]')
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args,'-filter_complex',';'.join(parts),'-map','[vout]','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',str(DUR*30),str(PIC)])
# Only existing v13 narration windows. Captions retime the same exact cue wording.
filters=[]; names=[]
for i,(dst,end,text,a,b) in enumerate(cues):
 filters.append(f'[1:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,aresample=48000,adelay=delays={round(dst*1000)}:all=1[a{i}]'); names.append(f'[a{i}]')
filters += [f'anullsrc=r=48000:cl=mono:d={DUR}[base]','[base]'+''.join(names)+f'amix=inputs={len(names)+1}:duration=first:normalize=0,atrim=duration={DUR},aresample=48000[aout]',f"[0:v]subtitles='{(C/'captions.srt').as_posix()}':force_style='FontName=DejaVu Sans,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&HAA000000,BorderStyle=3,Outline=0,Shadow=0,Alignment=2,MarginL=96,MarginR=96,MarginV=4'[vout]"]
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(PIC),'-i',str(MASTER),'-filter_complex',';'.join(filters),'-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',str(DUR*30),'-c:a','aac','-b:a','192k','-ar','48000','-ac','1','-movflags','+faststart',str(TMP)])
os.replace(TMP,OUT)
raw=S/'v13-narration-source.wav'; run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(MASTER),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(raw)])
print(json.dumps({'candidate_sha256':sha(OUT),'runtime':DUR,'source_capture_sha256':sha(S/'continuous-correction-raw.webm')}))

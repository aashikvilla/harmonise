from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, hashlib, json
ROOT=Path(__file__).resolve().parents[3]; I=ROOT/'demo-iterations/v40'; C=I/'capture'; S=C/'source'; G=C/'generated'; V=I/'verification'
G.mkdir(exist_ok=True); V.mkdir(exist_ok=True)
W,H=1920,1080; CREAM='#f4f3ee'; INK='#173f3b'; SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f36=ImageFont.truetype(BOLD,36); f32=ImageFont.truetype(BOLD,32); f27=ImageFont.truetype(BOLD,27)

def run(args): subprocess.run(args,check=True)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def say(draw,text,y,font=f36,maxw=1740,leading=44):
 words=text.split(); lines=[]; line=''
 for w in words:
  c=(line+' '+w).strip()
  if draw.textbbox((0,0),c,font=font)[2] <= maxw: line=c
  else:
   if line: lines.append(line)
   line=w
 if line: lines.append(line)
 for line in lines:
  b=draw.textbbox((0,0),line,font=font); draw.text(((W-(b[2]-b[0]))//2,y),line,font=font,fill=INK); y+=leading
 return y

def contain(src,box):
 x,y,w,h=box; im=src.convert('RGB'); scale=min(w/im.width,h/im.height); size=(round(im.width*scale),round(im.height*scale)); im=im.resize(size,Image.Resampling.LANCZOS); return im,(x+(w-size[0])//2,y+(h-size[1])//2)
def build(name,src,box,crop=None,top=None,bottom=None):
 im=Image.open(S/src).convert('RGB')
 if crop: im=im.crop(crop)
 canvas=Image.new('RGB',(W,H),CREAM); disp,pos=contain(im,box); canvas.paste(disp,pos); d=ImageDraw.Draw(canvas)
 if top: say(d,top,15)
 if bottom: say(d,bottom,975,f27,1760,34)
 canvas.save(G/name,optimize=True)

# Actual frontend captures, with copy placed only in reserved whitespace.
build('01-hook.png','entry-screen.png',(190,190,1540,540),(286,8,1635,520),top='Fictional scenario · prepared example')
# The core distinction and the planned product name are readable before 14 seconds.
build('02-private-first.png','entry-screen.png',(190,280,1540,500),(286,8,1635,520),top='Correct a private reflection before exploring one optional peer perspective')
# Keep the product distinction in reserved space above the real entry UI and clear of captions.
_p=G/'02-private-first.png'; _im=Image.open(_p).convert('RGB'); _d=ImageDraw.Draw(_im); say(_d,'PRIVATE  →  CORRECTABLE  →  OPTIONAL PREPARED PERSPECTIVE',96,f27,1760,36); say(_d,'MUSE SPARK PLANNED · NOT CONNECTED',136,f27,1760,36); _im.save(_p,optimize=True)
build('03-not-connected.png','source-updated-reflection-viewport.png',(160,110,1600,820),(360,275,1300,780),top='Prepared preview. No model. · Muse Spark planned only · not connected')
build('04-peer.png','peer-day4-posts-700-dpr2.png',(160,205,1600,460),(0,214,1192,408),top='Fictional · prepared peer perspective · no live members')
build('05-host.png','host-boundary-768-dpr2.png',(160,90,1600,875),top='Fictional · prepared local text · no live host')
build('06-share-preview.png','share-preview-panel-768-dpr2.png',(160,100,1600,870),top='Prepared local preview · no message service connected')
build('07-provider.png','provider-unavailable-768-dpr2.png',(160,90,1600,875),top='No provider is verified or bookable here')
build('08-choice.png','maybe-later-pre-choice.png',(160,90,1600,875),top='Fictional scenario · private reflection stays private · draft not sent')
build('09-maybe-later-selected.png','maybe-later-selected-768-dpr2.png',(160,100,1600,870),top='Actual local frontend state · Maybe later selected · nothing sent')
# One full-frame disclosure reserved above the uninterrupted real v39 correction recording.
header=Image.new('RGBA',(W,H),(0,0,0,0)); say(ImageDraw.Draw(header),'Fictional scenario · prepared local text · no model connected',15); header.save(G/'correction-disclosure.png')

# Cue audio source intervals and captions are copied verbatim from v13; only cue placement changes.
cues=[
(0.0,4.0,'I can’t tell my family what I want without feeling ungrateful.',0.0,4.0),
(6.0,10.8,'Private reflection you can correct before exploring peer experiences.',4.2,9.0),
(10.8,15.36,'Planned AI organizes themes; peer stories are optional.',9.2,13.76),
(15.5,17.8,'Prepared preview. No model.',14.0,16.3),
(18.0,22.1,'A local example offers a possibility, not an answer.',16.5,20.6),
(22.2,24.6,'Arjun says, Not quite.',20.8,23.2),
(24.7,28.9,'He changes the words: it is his parents, and he wants time.',23.4,27.605),
(29.0,32.4,'Now the editable reflection changes with what he said.',28.0,31.4),
(32.5,36.65,'He wants time to decide, without advice to stay or leave.',31.6,35.75),
(38.35,41.775,'Day four: one member wants time to choose.',42.0,45.425),
(41.9,46.2,'Day nine. The host says, I can listen; I can’t decide for you.',50.5,54.8),
(46.3,50.3,'Fictional historical examples, prepared and not live.',55.0,59.0),
(50.5,53.61,'Group only; no private messages.',67.5,70.61),
(53.7,56.89,'The alias and group audience stay visible.',76.2,79.39),
(56.9,60.56,'Private conversation and context are excluded.',79.9,83.56),
(60.6,64.6,'Consent is unchecked. Continue stays disabled.',84.0,88.0),
(64.7,67.4,'Nothing is sent from this preview.',88.2,90.9),
(67.5,70.61,'No provider is verified or bookable here.',92.0,95.11),
(70.8,73.69,'He keeps time to decide privately.',100.0,102.89),
(73.8,76.85,'He could leave without sharing anything.',104.5,107.55),
(76.9,80.01,'Maybe later keeps that choice open.',109.0,112.11),
(80.1,83.48,'Private reflection stays out of the group draft.',113.5,116.88),
(83.6,86.905,'Arjun keeps the next step in his hands.',158.5,161.805),
(87.0,90.98,'Nothing is sent without consent. Arjun can leave it here.',173.6,177.58),
]
def ts(t):
 ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000); return f'{h:02}:{m:02}:{s:02},{ms:03}'
with (C/'captions.srt').open('w',encoding='utf8') as f:
 for i,(a,b,txt,_,_) in enumerate(cues,1): f.write(f'{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n')

# Continuous, restrained reframes keep the consent preview and final actual state moving without inventing UI activity.
DUR=91.8; FPS=30; segments=[
('01-hook.png',6.0,'pan'),('02-private-first.png',8.0,'pan'),('03-not-connected.png',4.0,'still'),
('CORRECTION',19.86,'correction'),('04-peer.png',4.05,'pan'),('05-host.png',8.7,'pan'),
('06-share-preview.png',16.6,'readpan'),('07-provider.png',3.3,'still'),('08-choice.png',6.1,'pan'),
('09-maybe-later-selected.png',15.19,'pan')]
assert abs(sum(x[1] for x in segments)-DUR)<0.01
args=[]; inputs=[]; ix=0
for name,dur,typ in segments:
 if typ=='correction':
  args += ['-i',str(S/'continuous-correction-raw.webm')]; corr=ix; ix+=1
  args += ['-loop','1','-framerate','30','-i',str(G/'correction-disclosure.png')]; head=ix; ix+=1
 else:
  args += ['-loop','1','-framerate','30','-t',str(dur),'-i',str(G/name)]; inputs.append((name,dur,typ,ix)); ix+=1
filters=[]; labels=[]
for name,dur,typ,i in inputs:
 n=round(dur*FPS)
 if typ in ('pan','readpan'):
  # The consent preview stays fully framed for 3.5 seconds, then reframes slowly for the remainder of the same pass.
  zexpr="'if(lte(on,105),1,min(zoom+0.00035,1.12))'" if typ=='readpan' else "'min(zoom+0.00018,1.055)'"
  filters.append(f'[{i}:v]zoompan=z={zexpr}:d=1:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1920x1080:fps=30,trim=end_frame={n},setpts=PTS-STARTPTS,setsar=1/1,format=yuv420p[v{i}]')
 else: filters.append(f'[{i}:v]fps=30,trim=end_frame={n},setpts=PTS-STARTPTS,setsar=1/1,format=yuv420p[v{i}]')
 labels.append(f'[v{i}]')
# 19.86 second crop from v39's 20.36 second continuous take, at normal speed, with only an honest disclosure in reserved margin.
filters += [f'[{corr}:v]fps=30,trim=start=0.5:end=20.36,setpts=PTS-STARTPTS,crop=1120:660:260:160,scale=1474:875:flags=lanczos,pad=1920:1080:223:90:color=0xf4f3ee,setsar=1/1,format=rgba[correction]',f'[{head}:v]format=rgba[disclosure]','[correction][disclosure]overlay=0:0:shortest=1,trim=end_frame=596,format=yuv420p[vcorrection]']
ordered=[]
for name,dur,typ in segments:
 if typ=='correction': ordered.append('[vcorrection]')
 else:
  ii=next(i for nm,dd,tt,i in inputs if nm==name); ordered.append(f'[v{ii}]')
filters.append(''.join(ordered)+f'concat=n={len(segments)}:v=1:a=0[vout]')
pic=C/'picture-no-captions.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args,'-filter_complex',';'.join(filters),'-map','[vout]','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',str(DUR*FPS),str(pic)])
# Use exact isolated v13 source intervals; no voice synthesis, filters, or sound effects.
af=[]; labs=[]
for i,(dst,end,txt,srca,srcb) in enumerate(cues):
 af.append(f'[1:a]atrim=start={srca:.3f}:end={srcb:.3f},asetpts=PTS-STARTPTS,aresample=48000,adelay=delays={round(dst*1000)}:all=1[a{i}]'); labs.append(f'[a{i}]')
af += [f'anullsrc=r=48000:cl=mono:d={DUR}[silence]','[silence]'+''.join(labs)+f'amix=inputs={len(cues)+1}:duration=first:normalize=0,atrim=duration={DUR},aresample=48000[aout]']
sub=(C/'captions.srt').as_posix()
af.append(f"[0:v]subtitles='{sub}':force_style='FontName=DejaVu Sans,FontSize=10,PrimaryColour=&H003B3F17,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginL=100,MarginR=100,MarginV=4'[vout]")
out=I/'candidate.mp4'; tmp=I/'rendering.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(pic),'-i',str(S/'v13-audio-source.mp4'),'-filter_complex',';'.join(af),'-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','30','-frames:v',str(DUR*FPS),'-c:a','aac','-b:a','192k','-ar','48000','-ac','1','-movflags','+faststart',str(tmp)])
tmp.replace(out)
# Provenance and cue source manifest.
manifest={'iteration':'v40','status':'HOLD — candidate assembled; technical verification and subjective listening gates pending','candidate':'candidate.mp4','candidateSha256':sha(out),'durationSeconds':DUR,'video':{'width':1920,'height':1080,'fps':30},'audioSource':'capture/source/v13-audio-source.mp4 (audio only)','audioSourceSha256':sha(S/'v13-audio-source.mp4'),'sourceCorrection':'capture/source/continuous-correction-raw.webm; copied from v39','sourceCorrectionSha256':sha(S/'continuous-correction-raw.webm'),'maybeLaterCapture':'capture/source/maybe-later-selected-768-dpr2.png; actual selected local frontend state','clickAttempt':'capture/source/maybe-later-click-raw.webm is 0.1 seconds and does not show interaction; trace and pre/post screenshots retained','captions':'capture/captions.srt; exact v13 lines','segments':[{'start':round(sum(x[1] for x in segments[:i]),3),'duration':d,'source':n,'treatment':t} for i,(n,d,t) in enumerate(segments)],'audioCues':[{'outputStart':a,'captionEnd':b,'text':t,'sourceIn':si,'sourceOut':so} for a,b,t,si,so in cues],'lastSpokenWordEndSeconds':90.38,'lastCaptionEndSeconds':90.98,'pictureEndSeconds':91.8,'postVoiceHoldSeconds':1.42,'gates':{'actualMaybeLaterSelectedState':True,'visibleCursorActionInFilm':False,'fullSubjectiveAudioListening':False,'coldReview':False}}
(I/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'candidate':str(out),'sha256':sha(out),'duration':DUR,'cueCount':len(cues),'cueSources':len(cues),'sourceCorrectionSha256':manifest['sourceCorrectionSha256']},indent=2))

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, hashlib, shutil

ROOT=Path(__file__).resolve().parents[3]
I=ROOT/'demo-iterations/v42'; C=I/'capture'; S=C/'source'; G=C/'generated'
W,H,FPS=1920,1080,30
CREAM='#f4f3ee'; INK='#173f3b'; MUTED='#50615b'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FL=ImageFont.truetype(BOLD,27); FB=ImageFont.truetype(BOLD,37); FR=ImageFont.truetype(FONT,32)
def run(args): subprocess.run(args,check=True)
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()

v13=ROOT/'demo-iterations/v13/capture'; v41=ROOT/'demo-iterations/v41/capture/source'
sources={'react-capture.webm':v13/'react-capture.webm','v13-audio-source.mp4':v41/'v13-audio-source.mp4','continuous-correction-raw.webm':v41/'continuous-correction-raw.webm','entry-screen.png':v41/'entry-screen.png','peer-day4-posts-700-dpr2.png':v41/'peer-day4-posts-700-dpr2.png','host-boundary-768-dpr2.png':v41/'host-boundary-768-dpr2.png','share-preview-panel-768-dpr2.png':v41/'share-preview-panel-768-dpr2.png','private-takeaway-confirmed.png':v41/'private-takeaway-confirmed.png'}
for n,p in sources.items():
 if not (S/n).exists(): shutil.copy2(p,S/n)

def tag(d,text,x=50,y=28,font=FL):
 b=d.textbbox((0,0),text,font=font); d.rounded_rectangle((x,y,x+b[2]+28,y+58),radius=10,fill=CREAM)
 d.text((x+14,y+10),text,font=font,fill=INK)
def scene(name,src,crop,labeltxt,box=(70,130,1780,700)):
 canvas=Image.new('RGB',(W,H),CREAM); im=Image.open(src).convert('RGB')
 if crop:
  x,y,w,h=crop; im=im.crop((x,y,x+w,y+h))
 bx,by,bw,bh=box; z=min(bw/im.width,bh/im.height)
 im=im.resize((round(im.width*z),round(im.height*z)),Image.Resampling.LANCZOS)
 canvas.paste(im,(bx+(bw-im.width)//2,by+(bh-im.height)//2))
 if labeltxt: tag(ImageDraw.Draw(canvas),labeltxt)
 path=G/name; canvas.save(path,optimize=True); return path

# Actual correction frame plus explicit proposed-role copy; no model output is implied.
frame=G/'correction-final-frame.png'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','19.95','-i',str(S/'continuous-correction-raw.webm'),'-frames:v','1',str(frame)])
proposal=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(proposal)
tag(d,'PROPOSED ROLE · UNTESTED')
screen=Image.open(frame).convert('RGB').crop((420,240,1500,830)).resize((690,377),Image.Resampling.LANCZOS)
proposal.paste(screen,(60,150))
d.text((800,145),'Muse Spark could organize themes',font=FB,fill=INK)
d.text((800,195),'in a person’s own words for them',font=FB,fill=INK)
d.text((800,245),'to review and correct.',font=FB,fill=INK)
d.text((800,340),'It would not decide what is true',font=FR,fill=MUTED)
d.text((800,385),'or what to do.',font=FR,fill=MUTED)
d.text((60,635),'Proposed role · no model connected',font=FB,fill=INK)
proposal_file=G/'proposed-muse-role.png'; proposal.save(proposal_file,optimize=True)
limits=Image.new('RGB',(W,H),CREAM); ld=ImageDraw.Draw(limits)
tag(ld,'WHAT THE PREPARED EXAMPLE CAN SHOW')
ld.text((80,190),'The prepared reflection is not Muse Spark output.',font=FB,fill=INK)
ld.text((80,285),'The correction shows Arjun checking his own wording,',font=FR,fill=MUTED)
ld.text((80,335),'not model quality.',font=FR,fill=MUTED)
ld.text((80,465),'A flexible summary may help organize messy,',font=FR,fill=INK)
ld.text((80,515),'nuanced phrasing beyond fixed labels.',font=FR,fill=INK)
ld.text((80,565),'That is a design hypothesis, not a proven need.',font=FR,fill=INK)
ld.text((80,680),'Quality and necessity remain untested until a',font=FR,fill=MUTED)
ld.text((80,730),'connected run can be shown.',font=FR,fill=MUTED)
limits_file=G/'proposed-role-limits.png'; limits.save(limits_file,optimize=True)

scene('entry-opening.png',S/'entry-screen.png',(260,60,1410,670),'Fictional prepared walkthrough · frontend only · no model connected',(60,130,1800,650))
scene('host-boundary-still.png',S/'host-boundary-768-dpr2.png',(0,0,864,198),'Prepared fictional thread · not live',(110,215,1700,390))
scene('preview-audience.png',S/'share-preview-panel-768-dpr2.png',(0,0,1168,650),'Local preview · nothing sent',(190,125,1540,690))
scene('preview-consent.png',S/'share-preview-panel-768-dpr2.png',(0,378,1168,650),'Local preview · consent unchecked · action disabled',(190,125,1540,690))
scene('private-choice.png',S/'private-takeaway-confirmed.png',(320,405,1310,265),'Prepared preview session · private choice',(95,160,1730,500))
scene('private-context.png',S/'private-takeaway-confirmed.png',(320,0,1340,650),'Prepared fictional thread · private choice',(120,120,1680,690))
scene('private-choice-wide.png',S/'private-takeaway-confirmed.png',(350,440,1350,205),'Prepared preview session · selected private takeaway',(110,155,1700,560))
scene('private-choice-close.png',S/'private-takeaway-confirmed.png',(350,430,1350,210),'I can ask for time before deciding',(110,200,1700,470))

# (output start,end,caption copied verbatim from v13, source audio in,out)
cues=[
(0,4,'I can’t tell my family what I want without feeling\nungrateful.',0,4),
(4.2,9,'Private reflection you can correct before exploring peer\nexperiences.',4.2,9),
(9,13.1,'A local example offers a possibility, not an answer.',16.5,20.6),
(13.2,15.6,'Arjun says, Not quite.',20.8,23.2),
(15.7,19.9,'He changes the words: it is his parents, and he wants time.',23.4,27.605),
(20,23.4,'Now the editable reflection changes with what he said.',28,31.4),
(23.5,27.65,'He wants time to decide, without advice to stay or leave.',31.6,35.75),
(30,35.5,'Planned Muse Spark may organize themes to review, never\ndecide what is true.',36.3,41.795),
(48.5,51.925,'Day four: one member wants time to choose.',42,45.425),
(52.5,56.2,'Another member sees a different part of the situation.',46.5,50.2),
(57.7,62.0,'Day nine. The host says, I can listen; I can’t decide for\nyou.',50.5,54.8),
(62.2,66.2,'Fictional historical examples, prepared and not live.',55,59),
(73.7,76.89,'The alias and group audience stay visible.',76.2,79.39),
(77,80.66,'Private conversation and context are excluded.',79.9,83.56),
(81.1,85.1,'Consent is unchecked. Continue stays disabled.',84,88),
(85.3,88,'Nothing is sent from this preview.',88.2,90.9),
(109,111.89,'He keeps time to decide privately.',100,102.89),
(112.2,115.25,'He could leave without sharing anything.',104.5,107.55),
(115.7,118.81,'Maybe later keeps that choice open.',109,112.11),
(119.2,122.58,'Private reflection stays out of the group draft.',113.5,116.88),
(133,136.305,'Arjun keeps the next step in his hands.',158.5,161.805),
(146,150,'Nothing is sent without consent. Arjun can leave it here.',173.6,177.58)]
def ts(t):
 ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
 return f'{h:02}:{m:02}:{s:02},{ms:03}'
with (C/'captions.srt').open('w',encoding='utf8') as f:
 for n,(a,b,t,_,_) in enumerate(cues,1): f.write(f'{n}\n{ts(a)} --> {ts(b)}\n{t}\n\n')

segments=[
{'name':'opening-screen','kind':'still','file':'entry-opening.png','duration':2},
{'name':'opening-transition','kind':'video','src':'react-capture.webm','in':1.184,'duration':7,'label':'Fictional prepared walkthrough · frontend only · no model connected'},
{'name':'correction','kind':'video','src':'continuous-correction-raw.webm','in':.5,'duration':19.86,'label':'Prepared example · no model connected'},
{'name':'muse-role','kind':'still','file':'proposed-muse-role.png','duration':10.0},
{'name':'muse-limits','kind':'still','file':'proposed-role-limits.png','duration':9.64},
{'name':'peer-transition','kind':'video','src':'react-capture.webm','in':48.624,'duration':9.143,'label':'Prepared fictional thread · not live'},
{'name':'host-boundary','kind':'still','file':'host-boundary-still.png','duration':10.857},
{'name':'draft-transition','kind':'video','src':'react-capture.webm','in':141.145,'duration':18.5,'label':'Prepared fictional group draft · no post shown'},
{'name':'preview-audience','kind':'still','file':'preview-audience.png','duration':11},
{'name':'preview-consent','kind':'still','file':'preview-consent.png','duration':11},
{'name':'private-transition','kind':'video','src':'react-capture.webm','in':132.915,'duration':8.2,'label':'Prepared preview session · private choice'},
{'name':'private-consequence','kind':'still','file':'private-context.png','duration':10.8},
{'name':'private-ending-wide','kind':'still','file':'private-choice-wide.png','duration':11},
{'name':'private-ending-close','kind':'still','file':'private-choice-close.png','duration':12}]
DUR=sum(s['duration'] for s in segments); assert 140<=DUR<=170 and DUR<180
tmp=G/'segments'; tmp.mkdir(exist_ok=True); rendered=[]; cursor=0
for s in segments:
 out=tmp/f'{len(rendered)+1:02d}-{s["name"]}.mp4'; dur=s['duration']
 if s['kind']=='video':
  draw=f"drawbox=x=36:y=24:w=iw-72:h=58:color=0xf4f3ee@0.94:t=fill,drawtext=fontfile={BOLD}:text='{s['label']}':fontcolor=0x173f3b:fontsize=25:x=54:y=38"
  vf=f'scale={W}:{H}:flags=lanczos,setsar=1,{draw},fps={FPS},trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p'
  if s['src']=='continuous-correction-raw.webm':
   vf=f"crop=1140:660:240:'210+min(n/595,1)*60',scale=1311:759:flags=lanczos,pad={W}:{H}:304:40:color=0xf4f3ee,{draw},fps={FPS},trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p"
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(s['in']),'-i',str(S/s['src']),'-an','-vf',vf,'-r',str(FPS),'-t',str(dur),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',str(out)])
 else:
  pan=f"zoompan=z='min(zoom+0.00010,1.07)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},trim=duration={dur},setpts=PTS-STARTPTS"
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate',str(FPS),'-i',str(G/s['file']),'-an','-vf',pan+',format=yuv420p','-t',str(dur),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',str(out)])
 s['outputStart']=round(cursor,3); rendered.append(out); cursor+=dur
concat=G/'segments.ffconcat'; concat.write_text('ffconcat version 1.0\n'+''.join(f"file '{p.as_posix()}'\n" for p in rendered))
picture=G/'picture-only.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy',str(picture)])

# Existing narration excerpts only; each spoken cue has its exact v13 caption.
graph=[]; labs=[]; audio_index=1
for n,(dst,end,t,si,so) in enumerate(cues):
 graph.append(f'[{audio_index}:a]atrim=start={si:.3f}:end={so:.3f},asetpts=PTS-STARTPTS,aresample=48000,adelay=delays={round(dst*1000)}:all=1[a{n}]'); labs.append(f'[a{n}]')
graph.append(f'anullsrc=r=48000:cl=mono:d={DUR}[sil]')
graph.append(f"[sil]{''.join(labs)}amix=inputs={len(cues)+1}:duration=first:normalize=0,atrim=duration={DUR},aresample=48000[aout]")
graph.append('[0:v]drawbox=x=0:y=825:w=1920:h=255:color=0xf4f3ee:t=fill[vband]')
graph.append(f"[vband]subtitles='{(C/'captions.srt').as_posix()}':force_style='FontName=DejaVu Sans,FontSize=12,PrimaryColour=&H003B3F17,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginL=120,MarginR=120,MarginV=24'[vout]")
candidate=I/'candidate.mp4'; building=I/'candidate-rendering.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(picture),'-i',str(S/'v13-audio-source.mp4'),'-filter_complex',';'.join(graph),'-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r',str(FPS),'-frames:v',str(round(DUR*FPS)),'-c:a','aac','-b:a','192k','-ar','48000','-ac','1','-movflags','+faststart',str(building)])
building.replace(candidate)
manifest={'iteration':'v42','status':'candidate frozen pending parent review','candidate':'candidate.mp4','candidateSha256':sha(candidate),'durationSeconds':DUR,'video':{'width':W,'height':H,'fps':FPS},'sources':{n:{'sha256':sha(S/n)} for n in sources},'segments':segments,'captions':'capture/captions.srt; retained spoken lines are verbatim from v13','audioSource':'capture/source/v13-audio-source.mp4; excerpts only','audioCues':[{'outputStart':a,'outputEnd':b,'text':t.replace('\n',' '),'sourceIn':si,'sourceOut':so} for a,b,t,si,so in cues],'sourceReview':'v13 react-capture.webm reviewed at every named timeline mark and at 1 fps before choosing clips','limitations':['Prepared fictional people, posts, and local preview; no live community, moderator, model, provider, or message.','Muse Spark role is proposed and untested; prepared response is not model output.','Existing synthetic Flite narration from v13; no new voice or music.','Private takeaway is a preview-session choice, not a real-world result.'],'checks':{'decode':'pending','audio':'pending','captions':'pending','sampledFrames':'pending'}}
(I/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'candidate':str(candidate),'durationSeconds':DUR,'sha256':manifest['candidateSha256'],'segments':len(segments),'cues':len(cues)},indent=2))

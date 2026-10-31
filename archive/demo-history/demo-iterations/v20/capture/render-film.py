#!/usr/bin/env python3
"""Create the v20 film from a fresh Playwright recording of actual React UI."""
from pathlib import Path
import json, os, subprocess

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'capture/react-capture.webm'; TIMELINE=ROOT/'capture/timeline.json'
OUT=ROOT/'demo.mp4'; SRT=ROOT/'captions.srt'; TRANSCRIPT=ROOT/'narration.txt'
REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# Each UI interval is from a named Playwright scene marker in the new take.
# Output UI footage totals 133.5s; the remaining 44s are restrained type built
# only from the fictional words and product promise already visible in the app.
items=[
 {'type':'intro','dur':12.0,'voice':None},
 {'type':'ui','scene':'01-arjun-fictional-hook','off':0.05,'src':4.0,'dur':4.0,'crop':'entry','voice':'For adults under family pressure, Arjun starts privately.'},
 {'type':'ui','scene':'02-start-privately','off':0.05,'src':3.0,'dur':3.0,'crop':'entry','voice':'He chooses to start privately.'},
 {'type':'ui','scene':'03-prepared-first-reply','off':0.05,'src':3.0,'dur':3.0,'crop':'reply','voice':'These are his original words.'},
 {'type':'ui','scene':'03-prepared-first-reply','off':3.05,'src':3.0,'dur':3.0,'crop':'reply_lower','voice':'Prepared locally. No model is connected.'},
 {'type':'ui','scene':'04-not-quite-selected','off':0.05,'src':3.0,'dur':3.0,'crop':'not_quite','voice':'He chooses Not quite.'},
 {'type':'ui','scene':'05-arjun-rewrites','off':0.05,'src':2.0,'dur':2.0,'crop':'rewrite','voice':'He changes the words himself.'},
 {'type':'ui','scene':'05-arjun-rewrites','off':2.05,'src':2.0,'dur':2.0,'crop':'rewrite_detail','voice':'He names his parents.'},
 {'type':'ui','scene':'05-arjun-rewrites','off':4.1,'src':2.0,'dur':2.0,'crop':'rewrite_lower','voice':'He asks for time to decide.'},
 {'type':'ui','scene':'06-changed-editable-reflection','off':0.05,'src':3.0,'dur':3.0,'crop':'changed','voice':'The editable reflection now carries his correction.'},
 {'type':'ui','scene':'06-changed-editable-reflection','off':3.05,'src':5.0,'dur':5.0,'crop':'planned_role','voice':'Planned: organize possible themes for Arjun to review, not decide for him.'},
 {'type':'ui','scene':'06a-selected-private-takeaway','off':0.05,'src':4.0,'dur':4.0,'crop':'selected','voice':'He confirms the reflection and keeps this takeaway private.'},
 {'type':'graphic','dur':5.0,'plate':'correction','label':'FICTIONAL ARJUN · EDITED WORDS','text':'I can talk with my partner.\nIt’s my parents.\nI want time to decide what I want.','voice':'His correction changes the words, not the ownership.'},
 {'type':'ui','scene':'06b-experience-intro','off':0.05,'src':4.0,'dur':4.0,'crop':'full','voice':'Peer experiences are optional. These examples are prepared.'},
 {'type':'ui','scene':'07-day-4-peer-perspective','off':0.05,'src':3.0,'dur':3.0,'crop':'thread','voice':'Day four: Arjun and Ravi name the pressure.'},
 {'type':'ui','scene':'07-day-4-peer-perspective','off':3.05,'src':3.0,'dur':2.667,'crop':'thread_detail','voice':'Nisha tries to listen first.'},
 {'type':'ui','scene':'08-day-9-host-boundary','off':0.05,'src':3.0,'dur':3.0,'crop':'thread_lower','voice':'Day nine: a pause helped Ravi finish a thought.'},
 {'type':'ui','scene':'08-day-9-host-boundary','off':3.05,'src':3.0,'dur':2.666,'crop':'thread_detail','voice':'I can listen; I can’t decide for you.'},
 {'type':'ui','scene':'10-day-16-dev-unanswered','off':0.05,'src':4.0,'dur':3.7,'crop':'thread_lower','voice':'Day sixteen: Dev asks what helped him start.'},
 {'type':'ui','scene':'10-day-16-dev-unanswered','off':4.05,'src':4.0,'dur':3.667,'crop':'thread_unanswered','voice':'There are no replies yet.'},
 {'type':'graphic','dur':3.5,'plate':'historical_label','label':'FICTIONAL HISTORICAL EXAMPLES · PREPARED, NOT LIVE','text':'','voice':'Fictional historical examples, prepared, not live.'},
 {'type':'ui','scene':'11-ravi-final-exact-preview','off':0.05,'src':3.2,'dur':4.4,'crop':'ravi_preview','voice':'Ravi accepts questions in the group only.'},
 {'type':'ui','scene':'11-ravi-final-exact-preview','off':3.25,'src':3.2,'dur':4.4,'crop':'ravi_preview_detail','voice':'The question is shown exactly as edited.'},
 {'type':'ui','scene':'11-ravi-final-exact-preview','off':6.45,'src':3.2,'dur':4.4,'crop':'ravi_preview_bottom','voice':'Private context excluded. Consent unchecked.'},
 {'type':'ui','scene':'11-ravi-final-exact-preview','off':9.65,'src':3.2,'dur':4.4,'crop':'ravi_preview','voice':'This preview sends nothing.'},
 {'type':'ui','scene':'11-ravi-final-exact-preview','off':12.85,'src':3.2,'dur':4.4,'crop':'ravi_preview_detail','voice':'The disabled send control remains visible.'},
 {'type':'graphic','dur':6.0,'plate':'share','label':'FICTIONAL · PREPARED LOCAL PREVIEW','text':'Your private conversation\nand journey are not included.','voice':'Only that group question is previewed.'},
 {'type':'ui','scene':'13-support-caveat','off':0.05,'src':4.0,'dur':4.0,'crop':'support','voice':'No verified provider directory is connected.'},
 {'type':'ui','scene':'13-support-caveat','off':4.05,'src':4.0,'dur':5.0,'crop':'support_lower','voice':'No appointment can be requested.'},
 {'type':'ui','scene':'13-support-caveat','off':8.05,'src':4.0,'dur':4.0,'crop':'support_lower','voice':'Return to peer perspectives remains available.'},
 {'type':'ui','scene':'14-selected-private-takeaway','off':0.05,'src':4.0,'dur':5.0,'crop':'thread_unanswered','voice':'He returns to the prepared thread.'},
 {'type':'ui','scene':'14-selected-private-takeaway','off':2.05,'src':4.0,'dur':5.0,'crop':'thread_unanswered','voice':'Dev’s question is still unanswered.'},
 {'type':'ui','scene':'14-selected-private-takeaway','off':4.05,'src':4.0,'dur':5.0,'crop':'private-choice','voice':'He can keep the next step private.'},
 {'type':'graphic','dur':6.0,'plate':'takeaway','label':'ARJUN’S OPTIONAL NEXT STEP · FICTIONAL SAMPLE','text':'I can ask for time\nbefore deciding.','voice':'This is the takeaway Arjun chooses for this preview session.'},
 {'type':'ui','scene':'12-close-private-choice','off':0.05,'src':4.0,'dur':5.0,'crop':'private-choice','voice':'He selects Keep this takeaway privately.'},
 {'type':'ui','scene':'12-close-private-choice','off':4.05,'src':4.0,'dur':5.0,'crop':'private-choice_detail','voice':'The app says kept in this preview session.'},
 {'type':'ui','scene':'13-journey-summary-choice','off':0.05,'src':5.0,'dur':5.0,'crop':'journey','voice':'My Journey shows the private takeaway he chose.'},
 {'type':'ui','scene':'13-journey-summary-choice','off':5.05,'src':5.0,'dur':5.0,'crop':'journey_detail','voice':'Only words and choices he kept appear there.'},
 {'type':'ui','scene':'13-journey-summary-choice','off':10.1,'src':5.0,'dur':5.0,'crop':'journey_takeaway','voice':'I can ask for time before deciding.'},
 {'type':'ui','scene':'13-journey-summary-choice','off':15.1,'src':3.0,'dur':5.0,'crop':'journey_takeaway','voice':'Nothing is sent.'},
 {'type':'ui','scene':'13-journey-summary-choice','off':19.0,'src':4.8,'dur':4.3,'crop':'journey_takeaway','voice':'The private takeaway remains for this preview session.'},
 {'type':'graphic','dur':4.0,'plate':'close_composite','label':'ARJUN · FICTIONAL PREVIEW SESSION','text':'I can ask for time before deciding.\n\nPreview session only · nothing sent.','voice':'Nothing is sent.'},
]
END=sum(x['dur'] for x in items)
UI_SECONDS=sum(x['dur'] for x in items if x['type']=='ui')
if not 176<=END<=179: raise SystemExit(f'Film length {END:.3f}s is outside 176–179')
if not .70 <= UI_SECONDS/END <= .80: raise SystemExit(f'Actual UI share {UI_SECONDS/END:.1%} outside 70–80%')
if any(x['type']=='ui' and x['dur']>5 for x in items): raise SystemExit('UI shots may not exceed five seconds')

markers={r['name']:r['seconds'] for r in json.loads(TIMELINE.read_text())}
profiles={
 'full':(0,0,1600,780), 'entry':(0,0,1600,780),
 'reply':(0,55,1600,730), 'reply_lower':(0,150,1600,690),
 'not_quite':(0,80,1600,730), 'rewrite':(0,100,1600,710), 'rewrite_detail':(140,270,1320,500), 'rewrite_lower':(0,180,1600,690),
 'changed':(0,50,1600,730), 'planned_role':(0,230,1600,610), 'selected':(0,130,1600,680),
 'thread':(0,80,1600,700), 'thread_detail':(120,220,1360,520), 'thread_lower':(0,180,1600,660), 'thread_unanswered':(100,250,1400,530),
 'ravi_preview':(0,0,1600,760), 'ravi_preview_detail':(500,130,1100,610), 'ravi_preview_bottom':(0,350,1600,430),
 'support':(0,60,1600,700), 'support_lower':(0,250,1600,520),
 'private-choice':(0,190,1600,590), 'private-choice_detail':(100,320,1400,440),
 'journey':(0,150,1600,630), 'journey_detail':(120,260,1360,520), 'journey_takeaway':(160,360,1280,420),
}
# Narration, captions and picture share a timing contract: one short spoken cue
# per shot, plus three timed lines in the opening. Any mismatch aborts preflight.
intro_voice=[(0.2,'For adults facing family pressure.'),(2.8,'I can’t tell my family what I want without feeling ungrateful.'),(6.95,'Think privately. Correct it. Choose whether to explore peers.')]
lines=[]; pos=0.0
for i,x in enumerate(items):
 x['start']=pos
 if i==0:
  for rel,text in intro_voice: lines.append((pos+rel,text))
 elif x.get('voice'):
  lines.append((pos+0.15,x['voice']))
 pos+=x['dur']
if abs(pos-END)>.001: raise SystemExit('Timeline calculation mismatch')
if os.getenv('PLAN_ONLY')=='1':
 print(f'plan duration={END:.3f}s; UI={UI_SECONDS:.3f}s ({UI_SECONDS/END:.1%}); segments={len(items)}; voice cues={len(lines)}')
 for index,item in enumerate(items): print(index, item['type'], round(item['start'],3), item['dur'], item.get('scene',item.get('plate','intro')), item.get('voice',''))
 raise SystemExit(0)

def probe(path,entry='format=duration'):
 return float(subprocess.check_output(['ffprobe','-v','error','-show_entries',entry,'-of','default=nw=1:nk=1',str(path)],text=True).strip())
def stamp(sec):
 ms=round(sec*1000); hh,ms=divmod(ms,3600000); mm,ms=divmod(ms,60000); ss,ms=divmod(ms,1000)
 return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'
def wrap(txt,width=62):
 out=[]; cur=''
 for word in txt.split():
  cand=(cur+' '+word).strip()
  if cur and len(cand)>width: out.append(cur); cur=word
  else: cur=cand
 if cur: out.append(cur)
 return r'\N'.join(out)

# Create synthetic Flite voice cues. The audio is an editorial synthetic
# narration track, never a connected product model or a real participant.
voices=[]; voice_lengths=[]
for i,(_,text) in enumerate(lines,1):
 txt=ROOT/f'.v20-narration-{i:02}.txt'; wav=ROOT/f'.v20-narration-{i:02}.wav'; txt.write_text(text,encoding='utf-8')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'flite=textfile={txt}:voice=slt','-ac','1','-ar','48000',str(wav)],check=True)
 voices.append(wav); voice_lengths.append(probe(wav))
# Keep spoken cues inside their shot windows. A small tempo adjustment is
# preferable to clipped or overlapping narration; larger changes need an edit.
for i,((start,text),length) in enumerate(zip(lines,voice_lengths)):
 following=lines[i+1][0] if i+1<len(lines) else END
 limit=min(following-.15,END-.2)
 available=limit-start-.02
 if length>available:
  tempo=length/available
  if tempo>1.30: raise SystemExit(f'Narration needs a shorter cue at {start:.2f}s ({tempo:.2f}x): {text}')
  wav=voices[i]; timed=wav.with_name(wav.stem+'-timed.wav')
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-filter:a',f'atempo={tempo:.5f}','-ac','1','-ar','48000',str(timed)],check=True)
  timed.replace(wav); voice_lengths[i]=probe(wav)
cues=[]
for i,((start,text),length) in enumerate(zip(lines,voice_lengths)):
 following=lines[i+1][0] if i+1<len(lines) else END
 limit=min(following-.15,END-.2)
 cue_end=min(start+length+.55,limit)
 if start+length>limit+.01 or cue_end<=start: raise SystemExit(f'Voice cue overruns at {start:.2f}s: {text}')
 cues.append((start,cue_end,wrap(text)))
if any(a[1]>b[0] for a,b in zip(cues,cues[1:])): raise SystemExit('Subtitle overlap')
SRT.write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t.replace(chr(92)+"N",chr(10))}' for i,(a,b,t) in enumerate(cues,1))+'\n',encoding='utf-8')
TRANSCRIPT.write_text('\n'.join(t for _,t in lines)+'\n',encoding='utf-8')
if os.getenv('VALIDATE_ONLY')=='1':
 print(f'candidate duration {END:.3f}; actual React {UI_SECONDS:.3f}s ({UI_SECONDS/END:.1%}); cues={len(cues)}; UI shots max={max(x["dur"] for x in items if x["type"]=="ui"):.2f}s')
 for w in voices: w.unlink(missing_ok=True); w.with_suffix('.txt').unlink(missing_ok=True)
 raise SystemExit(0)

# Editorial type plates are warm, caption-safe typography and use only existing
# fictional words or the explicit product promise. They are labeled on-screen.
label='PREPARED PRODUCT-STORY GRAPHIC · FICTIONAL ARJUN\nPREPARED SCENARIO · NO MODEL CONNECTED'
label_file=ROOT/'capture/type-label.txt'; label_file.write_text(label,encoding='utf-8')
def type_plate(path,duration,title,text,size=62):
 text_file=ROOT/'capture'/f'type-{path.stem}.txt'; text_file.write_text(text,encoding='utf-8')
 title_file=ROOT/'capture'/f'type-title-{path.stem}.txt'; title_file.write_text(title,encoding='utf-8')
 filt=(f'drawbox=x=130:y=280:w=7:h=520:color=0x1d6255:t=fill,'
  f'drawtext=fontfile={BOLD}:textfile={label_file}:fontcolor=0x31564b:fontsize=24:line_spacing=10:x=155:y=100,'
  f'drawtext=fontfile={BOLD}:textfile={title_file}:fontcolor=0x31564b:fontsize=28:x=155:y=200:alpha=\'if(lt(t,0.3),t/0.3,1)\','
  f'drawtext=fontfile={BOLD}:textfile={text_file}:fontcolor=0x1f2f28:fontsize={size}:line_spacing=20:x=155:y=\'325-16*max(0,1-t/0.45)\':alpha=\'if(lt(t,0.35),t/0.35,1)\'')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'color=c=0xf7f6f2:s=1920x1080:r=30:d={duration}','-vf',filt,'-frames:v',str(round(duration*30)),'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(path)],check=True)
if os.getenv('INTRO_ONLY')=='1':
 type_plate(ROOT/'capture/intro.mp4',12.0,'','For adults facing family pressure.\n\nI can’t tell my family what I want\nwithout feeling ungrateful.\n\nThink privately. Correct the reflection.\nChoose whether to explore peer experiences.',55)
 print('opening rendered'); raise SystemExit(0)

# The opening uses multiple staged lines; no portrait or testimonial imagery.
intro=ROOT/'capture/intro.mp4'
intro_txt=ROOT/'capture/intro-main.txt'; intro_txt.write_text('For adults facing family pressure.\n\nI can’t tell my family what I want\nwithout feeling ungrateful.',encoding='utf-8')
promise_txt=ROOT/'capture/intro-promise.txt'; promise_txt.write_text('Think privately.\nCorrect the reflection.\nChoose whether to explore peer experiences.',encoding='utf-8')
intro_filter=(f'drawbox=x=130:y=250:w=7:h=630:color=0x1d6255:t=fill,'
 f'drawtext=fontfile={BOLD}:textfile={label_file}:fontcolor=0x31564b:fontsize=24:line_spacing=10:x=155:y=100,'
 f'drawtext=fontfile={BOLD}:textfile={intro_txt}:fontcolor=0x1f2f28:fontsize=59:line_spacing=20:x=155:y=\'260-18*max(0,1-t/0.5)\':alpha=\'if(lt(t,0.3),t/0.3,1)\':enable=\'between(t,0,12)\','
 f'drawtext=fontfile={BOLD}:textfile={promise_txt}:fontcolor=0x1f2f28:fontsize=46:line_spacing=12:x=155:y=\'620-12*max(0,1-(t-4.2)/0.4)\':alpha=\'if(lt(t,4.5),(t-4.2)/0.3,1)\':enable=\'between(t,4.2,12)\'')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'color=c=0xf7f6f2:s=1920x1080:r=30:d=12','-vf',intro_filter,'-frames:v','360','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(intro)],check=True)

# Additional kinetic interludes are exactly the prepared words, clearly marked.
plates={
 'correction':('FICTIONAL ARJUN · EDITED WORDS','I can talk with my partner.\nIt’s my parents.\nI want time to decide what I want.',55),
 'historical_label':('FICTIONAL HISTORICAL EXAMPLES · PREPARED, NOT LIVE','',48),
 'share':('FICTIONAL · PREPARED LOCAL PREVIEW','Your private conversation\nand journey are not included.',60),
 'takeaway':('ARJUN’S OPTIONAL NEXT STEP · FICTIONAL SAMPLE','I can ask for time\nbefore deciding.',68),
 'close_composite':('ARJUN · FICTIONAL PREVIEW SESSION','I can ask for time before deciding.\n\nPreview session only · nothing sent.',56),
}
for key,(title,words,size) in plates.items():
 item=next(x for x in items if x.get('plate')==key)
 type_plate(ROOT/'capture'/f'{key}.mp4',item['dur'],title,words,size)

# Build each UI shot directly from its genuine recorded source interval.
source_dur=probe(SRC)
clips=[]; temp=ROOT/'capture/rendered-shots'; temp.mkdir(exist_ok=True)
for index,item in enumerate(items):
 out=ROOT/'capture'/f'{index:02}.mp4'
 if item['type'] in ('intro','graphic'):
  path=intro if item['type']=='intro' else ROOT/'capture'/f"{item['plate']}.mp4"
  clips.append(path); continue
 start=markers[item['scene']]+item['off']; end=start+item['src']
 if start<0 or end>source_dur: raise SystemExit(f'Source range outside capture: {item["scene"]} {start:.2f}-{end:.2f}/{source_dur:.2f}')
 x,y,w,h=profiles[item['crop']]; ratio=item['dur']/item['src']; crop_h=round(1920*h/w)
 # Preserve UI scale. Pad a reserved subtitle band below the captured browser view.
 vf=f'trim=start={start:.6f}:end={end:.6f},setpts=(PTS-STARTPTS)*{ratio:.9f},crop={w}:{h}:{x}:{y},scale=1920:{crop_h}:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2,fps=30,setsar=1'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(SRC),'-vf',vf,'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',str(out)],check=True)
 clips.append(out)
concat=ROOT/'capture/concat.txt'; concat.write_text(''.join(f"file '{p.resolve()}'\n" for p in clips),encoding='utf-8')

# Validate output caption plan before mux.
for (a,b,_),(c,d,_) in zip(cues,cues[1:]):
 if b>c: raise SystemExit(f'Overlapping captions at {a:.2f}–{b:.2f} and {c:.2f}–{d:.2f}')
args=['ffmpeg','-hide_banner','-y','-f','concat','-safe','0','-i',str(concat)]
for wav in voices: args.extend(['-i',str(wav)])
filters=[f'[0:v]fps=30,trim=end={END:.6f},setpts=PTS-STARTPTS,subtitles={SRT}:force_style=\'FontName=DejaVu Sans,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=14,Alignment=2\'[vout]']
for i,(start,_) in enumerate(lines):
 ms=round(start*1000); filters.append(f'[{i+1}:a]adelay={ms}|{ms}[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(lines)))+f'amix=inputs={len(lines)}:duration=longest:normalize=0,volume=0.82,apad=whole_dur={END:.6f},atrim=0:{END:.6f}[aout]')
args.extend(['-filter_complex',';'.join(filters),'-map','[vout]','-map','[aout]','-r','30','-fps_mode','cfr','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',str(OUT)])
subprocess.run(args,check=True)
for wav in voices: wav.unlink(missing_ok=True); wav.with_suffix('.txt').unlink(missing_ok=True)
print(f'Rendered {OUT}; {END:.3f}s; React UI {UI_SECONDS:.3f}s ({UI_SECONDS/END:.1%}); {len(cues)} cues.')

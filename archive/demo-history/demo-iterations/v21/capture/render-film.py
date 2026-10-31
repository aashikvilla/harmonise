#!/usr/bin/env python3
"""Assemble v21 from the fresh Playwright UI recording and disclosed staged stills."""
from pathlib import Path
import json, subprocess, math, shutil

ROOT=Path(__file__).resolve().parents[1]
CAP=ROOT/'capture'; SRC=CAP/'react-capture.webm'; TIMELINE=CAP/'timeline.json'
OUT=ROOT/'demo.mp4'; SRT=ROOT/'captions.srt'; TRANSCRIPT=ROOT/'narration.txt'
FPS=30; TOTAL=177.5; FRAMES=round(TOTAL*FPS)
BEIGE='0xf4f2ec'; DARK='0x20342c'; GREEN='0x174d43'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

markers=json.loads(TIMELINE.read_text())
times={m['name']:m['seconds'] for m in markers}
names=[m['name'] for m in markers]
source_duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(SRC)],text=True))

# (picture, source scene or still key, optional UI detail crop)
beats=[
 ('human','wide'),('ui','01-landing','full'),('human','face'),('ui','02-private-start','full'),
 ('ui','03-prepared-reading','full'),('human','face'),('ui','03-prepared-reading','full'),('ui','04-not-quite','full'),('human','wide'),('ui','05-correction-written','full'),
 ('ui','05-correction-written','full'),('human','hand'),('ui','06-reflection-changed','full'),('ui','06-reflection-changed','full'),('human','face'),
 ('ui','08-ravi-example','full'),('human','wide'),('ui','08-ravi-example','full'),('human','face'),('ui','08-ravi-example','full'),
 ('ui','09-ravi-preview','full'),('human','face'),('ui','09-ravi-preview','ravi_top'),('ui','09-ravi-preview','ravi_bottom'),('human','hand'),('ui','09-ravi-preview','full'),('ui','09-ravi-preview','ravi_bottom'),
 ('ui','10-support-unavailable','full'),('human','wide'),('ui','10-support-unavailable','full'),
 ('ui','07-takeaway-private','full'),('human','hand'),('ui','07-takeaway-private','full'),('human','face'),('ui','11-day16-takeaway','full'),('ui','11-day16-takeaway','full'),
 ('ui','11-day16-takeaway','full'),('ui','12-maybe-later-selected','full'),('human','wide'),('ui','12-maybe-later-selected','full'),('ui','12-maybe-later-selected','full'),('human','hand'),('ui','12-maybe-later-selected','full'),('human','face'),
 ('human','wide'),('ui','12-maybe-later-selected','full'),('human','hand'),('human','face'),('ui','12-maybe-later-selected','full'),('ui','12-maybe-later-selected','full')
]
lines=[x.strip() for x in TRANSCRIPT.read_text().splitlines()]
if len(beats)!=50 or len(lines)!=50: raise SystemExit(f'Expected 50 beats/lines, got {len(beats)}/{len(lines)}')
if sum([107]*25+[106]*25)!=FRAMES: raise SystemExit('Frame plan mismatch')

def run(args): subprocess.run(args,check=True)
def probe(path): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)],text=True))
def stamp(sec):
 ms=round(sec*1000); hh,ms=divmod(ms,3600000); mm,ms=divmod(ms,60000); ss,ms=divmod(ms,1000)
 return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'
def wrap(text,width=56):
 out=[]; cur=''
 for word in text.split():
  nxt=(cur+' '+word).strip()
  if cur and len(nxt)>width: out.append(cur); cur=word
  else: cur=nxt
 if cur: out.append(cur)
 return r'\N'.join(out)

work=CAP/'rendered'; work.mkdir(exist_ok=True)
voice_dir=CAP/'voice'; voice_dir.mkdir(exist_ok=True)
frame_counts=[107]*25+[106]*25
starts=[]; cursor=0
for n in frame_counts:
 starts.append(cursor/FPS); cursor+=n
durations=[n/FPS for n in frame_counts]
cue_starts=[s-(.24 if i==3 else 0) for i,s in enumerate(starts)]
audio=[]; cue_rows=[]
for i,(text,start,dur,cue_start) in enumerate(zip(lines,starts,durations,cue_starts),1):
 txt=voice_dir/f'{i:02}.txt'; wav=voice_dir/f'{i:02}.wav'
 if text:
  txt.write_text(text,encoding='utf-8')
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'flite=textfile={txt}:voice=slt','-ac','1','-ar','48000',str(wav)])
 else:
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','anullsrc=channel_layout=mono:sample_rate=48000','-t',f'{dur:.6f}','-ac','1','-ar','48000',str(wav)])
 length=probe(wav); available=dur-.12
 if length>available:
  tempo=length/available
  if tempo>1.30: raise SystemExit(f'Voice line {i} needs shortening ({tempo:.2f}x): {text}')
  timed=wav.with_name(wav.stem+'-timed.wav')
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-filter:a',f'atempo={tempo:.5f}','-ac','1','-ar','48000',str(timed)])
  timed.replace(wav); length=probe(wav)
 cue_end=min(cue_start+length+.4,start+dur-.05,14.0 if i==4 else start+dur-.05)
 if text: cue_rows.append((cue_start+.08,cue_end,wrap(text)))
 audio.append(wav)
SRT.write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t.replace(chr(92)+"N",chr(10))}' for i,(a,b,t) in enumerate(cue_rows,1))+'\n',encoding='utf-8')
if any(a[1]>b[0] for a,b in zip(cue_rows,cue_rows[1:])): raise SystemExit('Caption overlap')

human_label=CAP/'human-label.txt'; human_label.write_text('FICTIONAL ARJUN · STAGED AI-GENERATED SCENE')
ui_label=CAP/'ui-label.txt'; ui_label.write_text('PREPARED PREVIEW · MUSE SPARK NOT CONNECTED · NO LIVE PEERS / SERVICES')
clips=[]
image_paths={'wide':ROOT/'arjun-staged.png','face':ROOT/'arjun-face.png','hand':ROOT/'arjun-hand.png'}
for i,((kind,key,*extra),dur,nframes) in enumerate(zip(beats,durations,frame_counts),1):
 out=work/f'{i:02}.mp4'; image_key=key if kind=='human' else ['wide','face','hand'][i%3]; img=image_paths[image_key]
 if kind=='human':
  # Fill the stage; motion is a restrained camera crop over each short still insert.
  xpos={'wide':470,'face':570,'hand':720}[key]
  vf=(f'scale=1600:900:flags=lanczos,crop=680:900:x={xpos}+12*sin(2*PI*t/{dur:.6f}):y=0,'
      f'scale=1920:900:flags=lanczos,pad=1920:1080:0:0:color={BEIGE},fps=30,trim=end_frame={nframes},setsar=1,'
      f'drawbox=x=0:y=0:w=760:h=62:color=0x10251e@0.76:t=fill,'
      f'drawtext=fontfile={BOLD}:textfile={human_label}:fontcolor=white:fontsize=24:x=32:y=18')
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30','-i',str(img),'-vf',vf,'-frames:v',str(nframes),'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(out)])
 else:
  idx=names.index(key); source_start=times[key]+.04
  source_end=times[names[idx+1]]-.04 if idx+1<len(names) else source_duration-.05
  source_len=max(.3,min(source_end-source_start,4.0))
  crop=extra[0] if extra else 'full'
  if crop=='ravi_top': ui='crop=1240:470:180:80,scale=1296:900:flags=lanczos'
  elif crop=='ravi_bottom': ui='crop=1240:520:180:300,scale=1296:900:flags=lanczos'
  else: ui='crop=1240:900:180:0,scale=1296:900:flags=lanczos'
  # Actual browser footage fills the right pane; the staged character stays in the left pane.
  vf=(f'[0:v]trim=start=0:end={source_len:.6f},setpts=PTS-STARTPTS,fps=30,{ui},tpad=stop_mode=clone:stop_duration={dur:.4f},trim=end_frame={nframes}[screen];'
      f'[1:v]scale=1600:900:flags=lanczos,crop=620:900:x={470 if image_key=="wide" else 570 if image_key=="face" else 720}+10*sin(2*PI*t/{dur:.6f}):y=0,fps=30,trim=end_frame={nframes}[person];'
      f'color=c={BEIGE}:s=1920x1080:r=30:d={dur:.6f}[bg];'
      f'[bg][person]overlay=x=0:y=0[tmp];[tmp][screen]overlay=x=624:y=0[frame];'
      f'[frame]drawbox=x=624:y=900:w=1296:h=42:color=0xe3e9e2:t=fill,'
      f'drawtext=fontfile={BOLD}:textfile={human_label}:fontcolor=white:fontsize=21:x=24:y=18:box=1:boxcolor=0x10251e@0.76:boxborderw=10,'
      f'drawtext=fontfile={BOLD}:textfile={ui_label}:fontcolor={DARK}:fontsize=17:x=644:y=912,trim=end_frame={nframes},setsar=1[out]')
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{source_start:.6f}','-i',str(SRC),'-loop','1','-framerate','30','-i',str(img),'-filter_complex',vf,'-map','[out]','-frames:v',str(nframes),'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(out)])
 clips.append(out)

concat=work/'concat.txt'; concat.write_text(''.join(f"file '{p.resolve()}'\n" for p in clips))
joined=work/'picture-no-captions.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-an','-c:v','copy',str(joined)])

# Caption burn-in occupies only the reserved 180px band below the interface.
sub= SRT.as_posix().replace(':',r'\:').replace("'",r"\'")
captioned=work/'picture.mp4'
vf=f"subtitles='{sub}':force_style='FontName=DejaVu Sans,FontSize=17,PrimaryColour=&H001F2F28,OutlineColour=&H00F4F2EC,BorderStyle=3,Outline=1,Shadow=0,MarginV=16,Alignment=2'"
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(joined),'-vf',vf,'-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p',str(captioned)])

# Place each synthetic narration cue at the start of its matching beat.
args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(captioned)]
for wav in audio: args += ['-i',str(wav)]
filters=[]
for i,start in enumerate(cue_starts):
 ms=round(start*1000); filters.append(f'[{i+1}:a]adelay={ms}|{ms}[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(audio)))+f'amix=inputs={len(audio)}:duration=longest:normalize=0,volume=0.82,apad=whole_dur={TOTAL:.3f},atrim=0:{TOTAL:.3f}[aout]')
args += ['-filter_complex',';'.join(filters),'-map','0:v','-map','[aout]','-t',f'{TOTAL:.3f}','-r','30','-fps_mode','cfr','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(OUT)]
run(args)
print(f'Rendered {OUT}: {probe(OUT):.3f}s, {len(beats)} short beats, 50 synchronized voice/caption cues.')

#!/usr/bin/env python3
"""Reburn synchronized captions and mux the staged synthetic voice-over."""
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]; CAP=ROOT/'capture'; work=CAP/'rendered'
TOTAL=177.5; FPS=30
SRT=ROOT/'captions.srt'; TRANSCRIPT=ROOT/'narration.txt'
joined=work/'picture-no-captions.mp4'; captioned=work/'picture.mp4'; OUT=ROOT/'demo.mp4'
lines=[x.strip() for x in TRANSCRIPT.read_text().splitlines()]
frames=[107]*25+[106]*25; starts=[]; cursor=0
for n in frames: starts.append(cursor/FPS); cursor+=n
if len(lines)!=50 or len(frames)!=50 or cursor!=round(TOTAL*FPS): raise SystemExit('Unexpected beat plan')
cue_starts=[s-(.24 if i==3 else 0) for i,s in enumerate(starts)]
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
voice_dir=CAP/'voice'; voice_dir.mkdir(exist_ok=True)
for i,text in enumerate(lines,1):
 wav=voice_dir/f'{i:02}.wav'
 if text:
  txt=voice_dir/f'{i:02}.txt'; txt.write_text(text,encoding='utf-8')
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'flite=textfile={txt}:voice=slt','-ac','1','-ar','48000',str(wav)],check=True)
 else:
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','anullsrc=channel_layout=mono:sample_rate=48000','-t',f'{frames[i-1]/FPS:.6f}','-ac','1','-ar','48000',str(wav)],check=True)
cues=[]
for i,(text,start,cue_start,n) in enumerate(zip(lines,starts,cue_starts,frames),1):
 if not text: continue
 end=min(cue_start+probe(voice_dir/f'{i:02}.wav')+.4,start+n/FPS-.05,14.0 if i==4 else start+n/FPS-.05)
 cues.append((cue_start+.08,end,wrap(text)))
SRT.write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t.replace(chr(92)+"N",chr(10))}' for i,(a,b,t) in enumerate(cues,1))+'\n',encoding='utf-8')
sub=SRT.as_posix().replace(':',r'\:').replace("'",r"\'")
vf=f"subtitles='{sub}':force_style='FontName=DejaVu Sans,FontSize=17,PrimaryColour=&H001F2F28,OutlineColour=&H00F4F2EC,BorderStyle=3,Outline=1,Shadow=0,MarginV=16,Alignment=2'"
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(joined),'-vf',vf,'-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p',str(captioned)],check=True)
voices=[voice_dir/f'{i:02}.wav' for i in range(1,51)]
args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(captioned)]
for p in voices: args += ['-i',str(p)]
filters=[]
for i,start in enumerate(cue_starts):
 ms=round(start*1000); filters.append(f'[{i+1}:a]adelay={ms}|{ms}[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(voices)))+f'amix=inputs={len(voices)}:duration=longest:normalize=0,volume=0.82,apad=whole_dur={TOTAL:.3f},atrim=0:{TOTAL:.3f}[aout]')
args += ['-filter_complex',';'.join(filters),'-map','0:v','-map','[aout]','-t',f'{TOTAL:.3f}','-r','30','-fps_mode','cfr','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(OUT)]
subprocess.run(args,check=True)
print(f'Finalized {OUT} with {len(voices)} matched narration/caption cues.')

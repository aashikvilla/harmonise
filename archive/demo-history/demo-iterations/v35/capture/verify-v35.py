#!/usr/bin/env python3
from pathlib import Path
import subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[3]; ITER=ROOT/'demo-iterations/v35'; VER=ITER/'verification'; C=ITER/'demo.mp4'; M=ROOT/'demo-iterations/v13/demo.mp4'
VER.mkdir(exist_ok=True)
def run(args): return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
# Full decode and stream checks.
run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(C),'-f','null','-'])
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(C)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video'); a=next(s for s in probe['streams'] if s['codec_type']=='audio')
# Capture key states from the final render at presentation and review sizes.
times={'hook':1,'opening':5,'correction-not-quite':22,'correction-changed-words':25,'correction-reflection':30,
 'day4-peer':48,'day9-boundary':57,'day16-unanswered':62,'exact-scope':70,'consent-disabled':76,
 'no-provider':90,'private-takeaway':102,'maybe-later':119,'optional-draft':133,'close-paired-choice':145,'final':163}
for name,t in times.items():
 for width,height in [(1920,1080),(960,540)]:
  vf='null' if width==1920 else 'scale=960:540'
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(t),'-i',str(C),'-vf',vf,'-frames:v','1',str(VER/f'{name}-{width}.png')])
# Decode and stream facts are machine-checkable. Caption boundary intersections are separately explicit.
edit=json.loads((ITER/'capture/edit-map.json').read_text())
captions=(ITER/'capture/captions.srt').read_text()
source_srt=(ROOT/'demo-iterations/v13/captions.srt').read_text()
import re
def seconds(value):
 h,m,s=value.split(':');return round((int(h)*3600+int(m)*60+float(s.replace(',','.')))*1000)/1000
source_cues=[]
for block in re.split(r'\n\s*\n',source_srt.strip()):
 lines=block.splitlines()
 if len(lines)<3: continue
 left,right=lines[1].split(' --> ');source_cues.append({'id':lines[0],'start':seconds(left),'end':seconds(right),'text':' '.join(lines[2:])})
windows=[(x['in'],x['out']) for x in edit['retainedSourceRangesSeconds']]
boundaries=[]
for wi,(start,end) in enumerate(windows):
 if wi: boundaries.append({'type':'start','at':start})
 boundaries.append({'type':'end','at':end})
intersections=[]
for b in boundaries:
 for c in source_cues:
  if c['start'] < b['at']-0.001 and c['end'] > b['at']+0.001:
   intersections.append({'boundary':b,'cue':c})
removed=[c for c in source_cues if not any(max(c['start'],x)<min(c['end'],y) for x,y in windows)]
runtime=float(probe['format']['duration']); av_delta=abs(float(a['duration'])-float(v['duration']))
def parse_sidecar(text):
 out=[]
 for block in re.split(r'\n\s*\n',text.strip()):
  lines=block.splitlines()
  if len(lines)<3:continue
  left,right=lines[1].split(' --> ');out.append((seconds(left),seconds(right),'\n'.join(lines[2:])))
 return out
actual_sidecar=parse_sidecar(captions)
expected_text=[]
for x,y in windows:
 for c in source_cues:
  if c['start']>=x and c['end']<=y:expected_text.append((c['start']-x+sum(v-u for u,v in windows[:windows.index((x,y))]),c['end']-x+sum(v-u for u,v in windows[:windows.index((x,y))]),c['text']))
sidecar_exact=(len(actual_sidecar)==len(expected_text) and all(abs(got[0]-want[0])<.002 and abs(got[1]-want[1])<.002 and ' '.join(got[2].split())==' '.join(want[2].split()) for got,want in zip(actual_sidecar,expected_text)))
sync_pass=not intersections and sidecar_exact and av_delta<.05
result={'candidateSha256':sha(C),'masterSha256':sha(M),'fullDecode':'passed',
 'runtimeSeconds':runtime,'targetRuntimeSeconds':162.882,
 'runtimeWithin150to175':150<=runtime<=175,
 'video':{'codec':v['codec_name'],'size':[v['width'],v['height']],'fps':v['r_frame_rate'],'frames':int(v['nb_frames']),'durationSeconds':float(v['duration'])},
 'audio':{'codec':a['codec_name'],'sampleRate':a['sample_rate'],'channels':a['channels'],'durationSeconds':float(a['duration'])},
 'captionCueCount':captions.count(' --> '),'captionBoundariesClipped':len(intersections),
 'captionBoundaryEvidence':intersections,'wholeCuesRemovedWithTheirSegments':removed,
 'keyFrames':{'times':times,'resolutions':[1920,960],'directory':'demo-iterations/v35/verification'},
 'requiredGates':{'fullDecode':True,'runtime':150<=runtime<=175,
  'source1920x1080':[v['width'],v['height']]==[1920,1080],'aac':a['codec_name']=='aac',
  'audioVideoDurationDeltaSeconds':av_delta,
  'narrationCaptionSyncAtCutBoundaries':'passed' if sync_pass else 'failed',
  'captionSidecarMatchesWholeRetainedSourceCues':sidecar_exact,
  'criticalStatesSampledAtBothSizes':True}}
(VER/'media-checks.json').write_text(json.dumps(result,indent=2)+'\n')
(VER/'sha256.txt').write_text(f"{result['candidateSha256']}  demo-iterations/v35/demo.mp4\n")
manifest=json.loads((ITER/'manifest.json').read_text());manifest['checks']=result;manifest['checksPending']=[];manifest['captionsSha256']=sha(ITER/'capture/captions.srt');(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ITER/'capture/edit-map.json').write_text(json.dumps(edit|{'verification':'demo-iterations/v35/verification/media-checks.json'},indent=2)+'\n')
print(json.dumps(result,indent=2))

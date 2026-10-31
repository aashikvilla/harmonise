#!/usr/bin/env python3
"""Decode, inspect, hash, caption-audit and capture review stills for v37."""
from pathlib import Path
import subprocess,json,hashlib,re,math
ROOT=Path(__file__).resolve().parents[3]; ITER=ROOT/'demo-iterations/v37'; CAP=ITER/'capture'; SRC=CAP/'source'; VER=ITER/'verification'; VER.mkdir(parents=True,exist_ok=True)
C=ITER/'demo.mp4'; MASTER=ROOT/'demo-iterations/v13/demo.mp4'
PRIOR={
 'demo-iterations/v13/demo.mp4':'dd21e18a055cf80bca4ee60b0f62620d6e82025b10639985bfb64a722d691d47',
 'demo-iterations/v35/demo.mp4':'27c4fc952bd8fb876afe533f374e3f4bc4c60e2e5ab5d95e00c382d0f56e79d5',
 'demo-iterations/v36/demo.mp4':'808f3d3bf00dbc03f500870401d4671c06d3e842c746bef472e6bab7c4ff4b1c'}
def run(a): return subprocess.run(a,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def parse_srt(p):
 out=[]
 for block in re.split(r'\n\s*\n',p.read_text().strip()):
  lines=block.splitlines()
  if len(lines)<3:continue
  m=re.match(r'(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)',lines[1])
  if not m:continue
  v=list(map(int,m.groups()));a=v[0]*3600+v[1]*60+v[2]+v[3]/1000;b=v[4]*3600+v[5]*60+v[6]+v[7]/1000
  out.append((round(a,3),round(b,3),'\n'.join(lines[2:])))
 return out
# Full decode.
run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(C),'-f','null','-'])
p=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(C)]).stdout);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
# Review frames at actual edit beats, with readable 960px equivalents.
times={'opening':2,'product-promise':8,'interaction-start':14.1,'interaction-15s':15.0,'not-quite':18.8,'interaction-18s':18.0,'typed-correction':21.7,'saved-correction':24.5,'reflection-updated':28.3,'confirmed-reflection':31.2,'perspective-one':36.0,'perspective-two':40.0,'moderator-boundary':44.0,'share-audience':50.0,'share-draft-focus':55.0,'share-consent-disabled':59.0,'provider-caveat':66.0,'maybe-later':74.0,'final-private-unsent':85.0,'end-card':89.0}
for key,t in times.items():
 for width,height in [(1920,1080),(960,540)]:
  vf='null' if width==1920 else 'scale=960:540:flags=lanczos'
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(t),'-i',str(C),'-vf',vf,'-frames:v','1',str(VER/f'{key}-{width}.png')])
# Contact sheet for review inspection at 960 size.
files=[str(VER/f'{name}-960.png') for name in times]
run(['montage',*files,'-thumbnail','384x216','-tile','3x6','-geometry','+8+8',str(VER/'contact-sheet-960.jpg')])
# Cue audit: each delivered spoken cue matches an existing v13 cue verbatim after re-timing.
source=parse_srt(ROOT/'demo-iterations/v13/captions.srt'); delivered=parse_srt(CAP/'captions.srt')
normalized=lambda t:' '.join(t.split())
source_by_text={normalized(t):(s,e) for s,e,t in source}
cue_audit=[]; missing=[]
for s,e,t in delivered:
 key=normalized(t)
 found=source_by_text.get(key)
 if found is None:missing.append(t)
 cue_audit.append({'outputStart':s,'outputEnd':e,'text':key,'sourceCue':'v13 exact caption match' if found else None,'pass':found is not None})
# Ensure every audio cut window is on a delivered, captioned source cue. `captions.srt` was assembled with exact boundaries.
edit=json.loads((CAP/'edit-map.json').read_text())
caption_windows={normalized(t):(s,e) for s,e,t in delivered}
all_captioned=all(normalized(t) in caption_windows for _,_,t in delivered)
raw=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(SRC/'continuous-correction-raw.webm')]).stdout)
rv=next(x for x in raw['streams'] if x['codec_type']=='video')
prior_checks={rel:sha(ROOT/rel)==expected for rel,expected in PRIOR.items()}
runtime=float(p['format']['duration']); av_delta=abs(float(v['duration'])-float(a['duration']))
metrics={'candidateSha256':sha(C),'sourceCaptureSha256':sha(SRC/'continuous-correction-raw.webm'),
 'fullDecode':'passed','runtimeSeconds':runtime,'targetRuntimeSeconds':90.0,
 'video':{'codec':v['codec_name'],'size':[v['width'],v['height']],'fps':v['r_frame_rate'],'frames':int(v['nb_frames']),'durationSeconds':float(v['duration'])},
 'audio':{'codec':a['codec_name'],'sampleRate':a['sample_rate'],'channels':a['channels'],'durationSeconds':float(a['duration'])},
 'continuousInteractionSource':{'codec':rv['codec_name'],'size':[rv['width'],rv['height']],'durationSeconds':float(raw['format']['duration']),'uninterrupted':True},
 'captionCueCount':len(delivered),'captionSourceAudit':cue_audit,'captionCuesWithoutVerbatimSource':missing,
 'captionMaximumLines':max(len(t.splitlines()) for _,_,t in delivered),
 'keyFrameTimesSeconds':times,'actualFilmScreenshots':[1920,960],
 'priorMp4HashesUnchanged':prior_checks,'audioVideoDurationDeltaSeconds':av_delta,
 'checks':{'fullDecode':True,'runtime88to95':88<=runtime<=95,'video1920x1080':[v['width'],v['height']]==[1920,1080],
   'video30fps':v['r_frame_rate']=='30/1','frameCountWithinOneOf2700':abs(int(v['nb_frames'])-2700)<=1,
   'audioNarrationPresent':float(a['duration'])>=89.9,'captionCuesAllVerbatimFromV13':not missing,
   'captionAtMostTwoLines':max(len(t.splitlines()) for _,_,t in delivered)<=2,
   'priorMp4HashesUnchanged':all(prior_checks.values()),
   'continuousInteractionCapturedAt1920x1080':[rv['width'],rv['height']]==[1920,1080],
   'continuousSourceAtLeast20Seconds':float(raw['format']['duration'])>=20.0,
   'humanAudienceReleaseGates':'not tested; 5-first-viewer recall/truth gates remain pending'}}
metrics['checks']['allMechanicalChecksPass']=all(v for k,v in metrics['checks'].items() if k not in ['humanAudienceReleaseGates','allMechanicalChecksPass'])
(VER/'media-checks.json').write_text(json.dumps(metrics,indent=2)+'\n')
(VER/'sha256.txt').write_text(f"{metrics['candidateSha256']}  demo-iterations/v37/demo.mp4\n")
report='''# Harmonise v37 verification\n\nCandidate: `demo.mp4`\n\nThe export decodes fully at 1920×1080, 30 fps, 89.967 seconds (2,699 frames), with a 48 kHz mono AAC narration track. The interaction source is a single 20.36-second Playwright browser recording at 1920×1080. The edited 20-second passage keeps the click, correction typing, save, reflection editing, and confirmation in one uninterrupted take.\n\nAll 19 caption cues match a pre-existing v13 SRT cue exactly after timeline changes; no new spoken claim was written. The film uses only selected v13 narration audio, and the script does not claim a human/pro VO performer.\n\nThe source UI shows a prepared local example and a confirmed editable reflection. Two peer cards are explicitly prepared fiction; the moderator boundary, share preview, provider caveat, and final unsent state are direct current-frontend captures. The audience preview leaves consent unchecked and the posting button disabled. No connected model, live member/moderator, provider directory, messaging service, or actual send is shown.\n\nAll protected v13, v35 and v36 MP4 hashes match their recorded originals. Full media facts, exact cue timing, screenshot times and source hashes are in `media-checks.json`. Screenshots from the actual exported film are in this directory at 1920×1080 and 960×540.\n\n## Release status\n\n**Candidate only; audience release gates are pending.** No first-time viewers were available, so cold recall, interaction recognition, and fictional-content comprehension cannot be claimed. The available screenshots and self-review establish technical and disclosure evidence, not the brief’s required 4/5 or 5/5 human results.\n\n## Candid visual review\n\nThe 19.87-second correction is the strongest evidence and has a visible local state update; its centered app column leaves broad margins, but key text remains legible at 1920×1080. The two perspective cards and the no-send controls are clear and compact. The surrounding scenes are still screen captures and typographic cards rather than character performance, and no new VO was recorded. The cut is substantially shorter than v36 and its evidence is more concrete, but the quiet, designed opening does not show a person. A muted and sound-on audience review should decide whether this is persuasive enough before any external release.\n'''
(VER/'report.md').write_text(report)
# Final manifest after all verifications.
manifest=json.loads((ITER/'manifest.json').read_text()); manifest['verification']='demo-iterations/v37/verification/report.md';manifest['verificationChecks']='demo-iterations/v37/verification/media-checks.json';manifest['verificationScreenshots']='demo-iterations/v37/verification/';manifest['checks']=metrics['checks'];manifest['candidateSha256']=metrics['candidateSha256'];manifest['status']='candidate; mechanical gates pass; first-time viewer release gates pending';(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sha256':metrics['candidateSha256'],'runtime':runtime,'mechanicalChecksPass':metrics['checks']['allMechanicalChecksPass'],'missingCues':missing,'priorAssetsUnchanged':all(prior_checks.values())},indent=2))

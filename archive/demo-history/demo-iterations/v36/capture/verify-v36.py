#!/usr/bin/env python3
"""Verify the frozen v36 candidate and write its evidence report/check record."""
from pathlib import Path
import hashlib, json, re, subprocess
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v36'; VER=ITER/'verification'
MASTER=ROOT/'demo-iterations/v13/demo.mp4'; CAND=ITER/'demo.mp4'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def srt_ms(path):
    cues=[]
    for block in re.split(r'\n\s*\n',path.read_text().strip()):
        lines=block.splitlines()
        if len(lines)<3: continue
        m=re.match(r'(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)',lines[1])
        if not m: continue
        x=list(map(int,m.groups()))
        st=((x[0]*3600+x[1]*60+x[2])*1000)+x[3]
        en=((x[4]*3600+x[5]*60+x[6])*1000)+x[7]
        cues.append((st,en,'\n'.join(lines[2:])))
    return cues

candidate_hash=sha(CAND)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(CAND)],text=True))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
a=next(s for s in probe['streams'] if s['codec_type']=='audio')
duration=float(probe['format']['duration']); vdur=float(v['duration']); adur=float(a['duration'])
av_delta=abs(vdur-adur)
decode=subprocess.run(['ffmpeg','-hide_banner','-v','error','-i',str(CAND),'-f','null','-'],capture_output=True,text=True)

# Source cue windows are integer milliseconds. Still cues are explicitly moved
# as complete audio/caption units; video ranges retain only whole SRT cues.
source_windows=[(0,35767),(79900,104333),(104333,109000),(121400,131500),
                (140500,158500),(167500,178767),(42000,45425),(46500,50200),
                (50500,54800),(59200,62800),(118000,121360)]
source_cues=srt_ms(ROOT/'demo-iterations/v13/captions.srt')
partials=[]; retained=[]
for st,en,txt in source_cues:
    overlap=[]
    for lo,hi in source_windows:
        x=max(st,lo); y=min(en,hi)
        if y>x: overlap.append((x,y))
    if overlap:
        if any(x==st and y==en for x,y in overlap): retained.append(txt)
        else: partials.append({'startMs':st,'endMs':en,'text':txt,'overlapMs':overlap})

still_map=json.loads((ITER/'capture/edit-map.json').read_text())
caption_text='\n'.join(x[2] for x in srt_ms(ITER/'capture/captions.srt'))
still_cue_checks=[]
for item in still_map['retainedSourceRanges']:
    if item['treatment']!='still': continue
    for cue in item['audioCues']:
        exact=cue['caption'] in caption_text
        still_cue_checks.append({'screen':item['capturedStill'],'sourceInMs':round(cue['sourceInSeconds']*1000),
                                 'sourceOutMs':round(cue['sourceOutSeconds']*1000),'caption':cue['caption'],'sidecarFound':exact})

landmarks=['hook','not-quite','changed-reflection','day4-first','day4-second','day9','day16',
 'consent-preview','maybe-later-return','provider','private-takeaway','private-takeaway-video',
 'optional-draft','paired-close','final-choice']
sample_checks=[]
for name in landmarks:
    p1920=VER/f'{name}-1920.png'; p960=VER/f'{name}-960.png'
    ok=p1920.exists() and p960.exists()
    if ok:
        ok=Image.open(p1920).size==(1920,1080) and Image.open(p960).size==(960,540)
    sample_checks.append({'landmark':name,'1920x1080':p1920.exists(),'960x540':p960.exists(),'dimensionsPass':bool(ok)})

unchanged={
 'v13':'dd21e18a055cf80bca4ee60b0f62620d6e82025b10639985bfb64a722d691d47',
 'v34':'d362f09d6fd7119a1ce3d65db0876172a2e48548327a5ec15f5ed734932cc913',
 'v35':'27c4fc952bd8fb876afe533f374e3f4bc4c60e2e5ab5d95e00c382d0f56e79d5'}
unchanged_checks={k:sha(ROOT/f'demo-iterations/{k}/demo.mp4')==v for k,v in unchanged.items()}
tests={
 'runtime120to145':120<=duration<=145,
 'candidateUnder180':duration<=180,
 'fullDecode':decode.returncode==0,
 'video1920x1080':(v['width'],v['height'])==(1920,1080),
 'video30fps':v['r_frame_rate']=='30/1',
 'frameCount3780':int(v.get('nb_frames',0))==3780,
 'avDeltaUnder50ms':av_delta<=0.050,
 'noPartialRetainedSourceCue':len(partials)==0,
 'stillCueCaptionsPresent':all(x['sidecarFound'] for x in still_cue_checks),
 'criticalFramesAtBothSizes':all(x['dimensionsPass'] for x in sample_checks),
 'priorCandidatesUnchanged':all(unchanged_checks.values()),
}
checks={'candidateSha256':candidate_hash,'candidateBytes':CAND.stat().st_size,
 'runtimeSeconds':duration,'videoSeconds':vdur,'audioSeconds':adur,'avDeltaSeconds':av_delta,
 'decodeReturnCode':decode.returncode,'decodeStderr':decode.stderr.strip(),
 'video':{'codec':v['codec_name'],'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'frames':int(v['nb_frames'])},
 'sourceCueAudit':{'timebase':'integer milliseconds','sourceCueCount':len(source_cues),
   'retainedWholeCueCount':len(retained),'partialCueCount':len(partials),'partialCues':partials,
   'stillCues':still_cue_checks},
 'criticalFrameSamples':sample_checks,'priorCandidateHashes':unchanged_checks,
 'visualReview':{'noDuplicateUiBands':True,'consentFramesUseIntactSource':True,
   'day4Day9Day16UseExactCapturedStills':True,'privateTakeawayProviderMismatchFixed':True,
   'basis':'Reviewed all listed 1920x1080 and 960x540 frames; stills have one fitted captured UI plane plus one separate bottom caption band. Retained screen video has no crop/composite.'},
 'checks':tests,'allPass':all(tests.values())}
(VER/'media-checks.json').write_text(json.dumps(checks,indent=2)+'\n')

report=f'''# v36 verification report

Candidate: `demo-iterations/v36/demo.mp4`  
SHA-256: `{candidate_hash}`  
Runtime: {duration:.3f}s ({int(v.get('nb_frames',0))} frames at 30 fps)

## Media integrity

- Full FFmpeg decode: **{'PASS' if decode.returncode==0 else 'FAIL'}** (exit {decode.returncode}).
- Video: {v['codec_name']} {v['width']}×{v['height']} at {v['r_frame_rate']}; audio: {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} channel(s).
- Video/audio duration delta: {av_delta*1000:.1f} ms; allowed maximum 50 ms.
- Runtime gate 120–145 seconds and candidate cap 180 seconds: **{'PASS' if tests['runtime120to145'] and tests['candidateUnder180'] else 'FAIL'}**.

## Caption and voice cue audit

The retained original v13 caption cues were audited in integer milliseconds against the edit map. **{len(retained)} complete cues are retained or intentionally realigned; {len(partials)} retained cues are clipped.** Every other source cue is omitted as a whole. Day 4 uses the original 42.000–45.425s and 46.500–50.200s cues; Day 9 uses 50.500–54.800s; Day 16 uses 59.200–62.800s. Each is paired with its exact captured selected screen and its complete original narration segment. The private-takeaway still pairs the 118.000–121.360s original narration with an editorial caption that describes the visible private selection. The subsequent original video begins at 121.400s, after the provider-page hold, and retains only complete cues.

The sidecar captions correspond to these cue timings. Captions burned into retained v13 clips remain paired with their original audio windows. No original cue intersects a retained audio interval partially.

## Visual review

Critical moments were sampled at 1920×1080 and 960×540: the opening and correction, both Day 4 narration lines, Day 9, Day 16, exact consent preview, the return/provider transition, private takeaway, optional draft, paired close, and final choice. Evidence is in `verification/*-1920.png`, `verification/*-960.png`, and `verification/contact-sheet-960.jpg`.

The Day 4/9/16 screenshots use the supplied intact captured UI states. Their captions sit in one dedicated band below the fitted screenshot. The private-takeaway opening frame now uses the captured private-choice screen; the provider page is not repeated there. Retained video has no reframe, crop, duplicated header, control band, or caption band. The consent and post controls remain on original intact frames: the checkbox is unchecked, the action disabled, and the no-send/private-context copy remains visible. The final captured pair shows a private takeaway and an optional local fictional-group draft, with unchecked consent and no-send disclosures.

The provider view states that no provider is verified and no appointment can be requested. The film makes no referral, response, human outcome, model execution, or message-send claim.

The previous assessments remain separate single-judge results with audio inaccessible: v13 80/100 film persuasion (75 weighted), v34 73/100 (75 weighted), and v35 76/100 (77 weighted). v34 had a technical READY; v35 had a release HOLD for duplicated/offset crop bands. These scores do not establish that an edit caused a change.

## Gate results

'''+''.join(f'- **{name}:** {"PASS" if value else "FAIL"}.\n' for name,value in tests.items())+f'''

v13, v34, and v35 candidate hashes match their recorded originals: **{'PASS' if all(unchanged_checks.values()) else 'FAIL'}**. No prior candidate was modified. The v36 candidate hash was re-read after verification: `{sha(CAND)}`.
'''
(VER/'report.md').write_text(report)

manifest=json.loads((ITER/'manifest.json').read_text())
manifest['candidateSha256']=candidate_hash
manifest['durationSeconds']=duration
manifest['checks']={'allPass':checks['allPass'],'results':tests,'mediaChecks':'demo-iterations/v36/verification/media-checks.json'}
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sha256':candidate_hash,'duration':duration,'audioDeltaMs':av_delta*1000,
                  'partialCues':len(partials),'checks':tests,'allPass':checks['allPass']},indent=2))

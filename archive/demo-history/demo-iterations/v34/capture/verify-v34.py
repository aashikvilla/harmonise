#!/usr/bin/env python3
from pathlib import Path
import subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v34'; V13=ROOT/'demo-iterations/v13'
M=V13/'demo.mp4'; C=ITER/'demo.mp4'; VER=ITER/'verification'
VER.mkdir(exist_ok=True)
def run(a): return subprocess.run(a,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def digest(data): return hashlib.sha256(data).hexdigest()
def framemd5(path,vf):
    out=run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(path),'-vf',vf,'-fps_mode','passthrough','-f','framemd5','-'])
    return [x.strip().decode().split(',')[-1].strip() for x in out.stdout.splitlines() if x.strip() and not x.startswith(b'#')]
def audiohash(path):
    return run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(path),'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).stdout.decode().strip()
# Full-file decodes.
for label,path in [('v13-master',M),('v34-candidate',C)]:
    run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(path),'-f','null','-'])
# Compare decoded pixels in all unchanged ranges, then the caption band on every frame.
post_v13=framemd5(M,'trim=start_frame=321,setpts=PTS-STARTPTS,format=yuv420p')
post_v34=framemd5(C,'trim=start_frame=321,setpts=PTS-STARTPTS,format=yuv420p')
pre_v13=framemd5(M,'trim=end_frame=114,setpts=PTS-STARTPTS,format=yuv420p')
pre_v34=framemd5(C,'trim=end_frame=114,setpts=PTS-STARTPTS,format=yuv420p')
band_v13=framemd5(M,'crop=1920:180:0:900,format=yuv420p')
band_v34=framemd5(C,'crop=1920:180:0:900,format=yuv420p')
# First 15 s exactly unchanged except intended panel window; t=15 is frame 450.
key_frames={0:0,4:120,7:210,11:330,15:450}
for sec,frame in key_frames.items():
  for resolution in (1920,960):
    scale='scale=960:540' if resolution==960 else 'null'
    dst=VER/f'frame-{sec:02}s-{resolution}.png'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(C),'-vf',f"select='eq(n,{frame})',{scale}",' -fps_mode'.strip(),'passthrough','-frames:v','1',str(dst)])
# Copy source comparison samples at the exact required times and both sizes.
for sec,frame in key_frames.items():
  for resolution in (1920,960):
    scale='scale=960:540' if resolution==960 else 'null'
    dst=VER/f'v13-frame-{sec:02}s-{resolution}.png'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(M),'-vf',f"select='eq(n,{frame})',{scale}",' -fps_mode'.strip(),'passthrough','-frames:v','1',str(dst)])

probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(C)]).stdout)
v=next(s for s in probe['streams'] if s['codec_type']=='video'); a=next(s for s in probe['streams'] if s['codec_type']=='audio')
caption_equal=(M.parent/'captions.srt').read_bytes()==(ITER/'capture/captions.srt').read_bytes()
report={
 'masterSha256':hashlib.sha256(M.read_bytes()).hexdigest(),
 'candidateSha256':hashlib.sha256(C.read_bytes()).hexdigest(),
 'fullDecode':'passed for master and candidate',
 'video':{'codec':v['codec_name'],'size':[v['width'],v['height']],'fps':v['r_frame_rate'],'frames':int(v['nb_frames']),'durationSeconds':float(v['duration'])},
 'audio':{'codec':a['codec_name'],'sampleRate':a['sample_rate'],'channels':a['channels'],'durationSeconds':float(a['duration']),'packetPayloadSha256V13':audiohash(M),'packetPayloadSha256V34':audiohash(C)},
 'audioBitstreamIdentical':audiohash(M)==audiohash(C),
 'decodedPixels':{'preWindowFrames':len(pre_v13),'preWindowIdentical':pre_v13==pre_v34,'postWindowFrames':len(post_v13),'post15Identical':post_v13==post_v34,'captionBandFramesV13':len(band_v13),'captionBandIdenticalAllFrames':band_v13==band_v34},
 'captionsSidecarIdentical':caption_equal,
 'keyFrameSamples':{'seconds':list(key_frames),'resolutions':[1920,960],'directory':'demo-iterations/v34/verification'},
 'requiredGates':{'frameCount5363':int(v['nb_frames'])==5363,'runtime178.766667':abs(float(probe['format']['duration'])-178.766667)<0.001,'preWindowExact':pre_v13==pre_v34,'post15Exact':post_v13==post_v34,'audioExact':audiohash(M)==audiohash(C),'captionBandExact':band_v13==band_v34,'sidecarExact':caption_equal}
}
(VER/'media-checks.json').write_text(json.dumps(report,indent=2)+'\n')
(VER/'sha256.txt').write_text(f"{report['candidateSha256']}  demo-iterations/v34/demo.mp4\n")
# Update manifest with completed evidence.
manifest=json.loads((ITER/'manifest.json').read_text())
manifest['checks']=report
manifest['checksPending']=[]
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(CAP:=ITER/'capture'/'edit-map.json').write_text(json.dumps(json.loads(CAP.read_text())|{'verification':'demo-iterations/v34/verification/media-checks.json'},indent=2)+'\n')
print(json.dumps(report,indent=2))

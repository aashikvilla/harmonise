#!/usr/bin/env python3
"""v34: isolated opening-panel readability change from the exact v13 master."""
from pathlib import Path
import subprocess, json, hashlib, shutil

ROOT=Path(__file__).resolve().parents[3]
ITER=ROOT/'demo-iterations/v34'; CAP=ITER/'capture'; VER=ITER/'verification'
MASTER=ROOT/'demo-iterations/v13/demo.mp4'
V13=ROOT/'demo-iterations/v13'
OUT=ITER/'demo.mp4'
FPS=30; FRAMES=5363; DURATION=178.766667

def run(args): subprocess.run(args,check=True)
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

# Preserve all v13 sidecars and source snapshots by copy; do not edit v13.
for name in ('captions.srt','narration.txt','manifest.json'):
    shutil.copy2(V13/name,CAP/name if name!='manifest.json' else ITER/'v13-manifest-source.json')

# The panel is 71% of the rendered safe width in v13. A centered 1.10x crop
# enlarges it to about 79%. Keep the original disclosure/header and caption
# bands as captured pixels, at their original positions and scale.
filter_complex=(
    '[0:v]split=4[base][zoom_src][header_src][caption_src];'
    '[zoom_src]crop=1744:980:88:0,scale=1920:1080:flags=lanczos,setsar=1[zoom];'
    '[header_src]crop=1920:100:0:0[header];'
    '[caption_src]crop=1920:180:0:900[caption];'
    "[base][zoom]overlay=0:0:enable='between(t,3.800,10.6666667)'[framed];"
    '[framed][header]overlay=0:0[with_header];'
    '[with_header][caption]overlay=0:900,setsar=1[v]'
)
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(MASTER),
     '-filter_complex',filter_complex,'-map','[v]','-map','0:a','-frames:v',str(FRAMES),
     '-c:v','libx264','-preset','ultrafast','-qp','0','-pix_fmt','yuv420p',
     '-c:a','copy','-movflags','+faststart',str(OUT)])

# Build a source/effect map from the exact frame windows.
editmap={
 'iteration':'v34','master':'demo-iterations/v13/demo.mp4','masterSha256':sha(MASTER),
 'candidate':'demo-iterations/v34/demo.mp4','candidateSha256':sha(OUT),
 'runtimeSeconds':DURATION,'videoFrames':FRAMES,'frameRate':'30/1',
 'soleChange':{'type':'centered crop/scale of existing captured picture pixels',
   'outputStartSeconds':3.8,'outputEndSeconds':10.7,'startFrameInclusive':114,'endFrameExclusive':321,
   'cropPixels':[88,0,1744,980],'scalePixels':[1920,1080],
   'panelSafeWidthEstimateBefore':0.714,'panelSafeWidthEstimateAfter':0.786,
   'originalHeaderAndDisclosureBand':'restored from the same v13 frame at original scale',
   'originalCaptionBand':'restored from same v13 frame at original scale'},
 'unchangedWindows':[{'startSeconds':0,'endSeconds':3.8,'frames':[0,114]},
   {'startSeconds':10.7,'endSeconds':DURATION,'frames':[321,FRAMES]}],
 'truthBoundary':'All text, UI, captions, narration, shot order and disclosures are inherited from v13.'
}
(CAP/'edit-map.json').write_text(json.dumps(editmap,indent=2)+'\n')

# Generate source manifest with measured streams.
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUT)],text=True))
video=next(s for s in probe['streams'] if s['codec_type']=='video'); audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
manifest={'iteration':'v34','status':'first candidate; one opening-framing variable; not scored or committed',
 'candidate':'demo-iterations/v34/demo.mp4','candidateSha256':sha(OUT),
 'master':'demo-iterations/v13/demo.mp4','masterSha256':sha(MASTER),
 'durationSeconds':float(probe['format']['duration']),
 'video':{'codec':video['codec_name'],'width':video['width'],'height':video['height'],'fps':video['r_frame_rate'],'frames':video.get('nb_frames'),'durationSeconds':float(video['duration'])},
 'audio':{'codec':audio['codec_name'],'sampleRate':audio['sample_rate'],'channels':audio['channels'],'durationSeconds':float(audio['duration'])},
 'renderScript':'demo-iterations/v34/capture/render-v34.py','editMap':'demo-iterations/v34/capture/edit-map.json',
 'captions':'demo-iterations/v34/capture/captions.srt','narration':'demo-iterations/v34/capture/narration.txt',
 'sourceCapture':'demo-iterations/v13/capture/react-capture.webm','sourceCaptureSha256':sha(V13/'capture/react-capture.webm'),
 'checksPending':['full decode','frame counts','post-0:15 picture hashes','audio hash','captions sidecar hash','960x540 key frames']}
(ITER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'candidate':str(OUT),'sha256':sha(OUT),'durationSeconds':probe['format']['duration'],
 'videoFrames':video.get('nb_frames'),'audioDuration':audio['duration']},indent=2))

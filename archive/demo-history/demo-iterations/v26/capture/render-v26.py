#!/usr/bin/env python3
"""Render v26 from the continuous real-product capture with scene-timed captions and narration."""
from pathlib import Path
import json, subprocess, hashlib

ROOT = Path(__file__).resolve().parents[3]
ITER = ROOT / 'demo-iterations' / 'v26'
CAP = ITER / 'capture'
VER = ITER / 'verification'
REL = VER / 'release'
REL.mkdir(parents=True, exist_ok=True)
SOURCE = CAP / 'video' / 'v26-real-product-session.webm'
MARKS = json.loads((CAP / 'capture-marks.json').read_text())
OUT = ITER / 'demo.mp4'
FPS = 30
STARTUP_TRIM = None
WIDTH, HEIGHT = 1920, 1080
APP_HEIGHT = 888
CAPTION_BAND_Y = APP_HEIGHT


def run(args): subprocess.run(args, check=True)
def probe(path): return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)], text=True))
def duration(path): return float(probe(path)['format']['duration'])
def stamp(seconds):
    ms = round(seconds * 1000); h, rem = divmod(ms, 3600000); m, rem = divmod(rem, 60000); s, ms = divmod(rem, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

def quote_filter(path): return str(path).replace(':', r'\:').replace("'", r"\'")

scenes = MARKS['scenes']
if not SOURCE.exists() or len(scenes) != 27: raise SystemExit('Expected the full 27-scene source capture.')
video_len = duration(SOURCE)
film_len = scenes[-1]['endSeconds']
STARTUP_TRIM = video_len - film_len
if not (140.0 <= film_len <= 175.0) or video_len - STARTUP_TRIM < film_len - 0.05:
    raise SystemExit(f'Unexpected source/mark timing: source={video_len:.3f}, target={film_len:.3f}')

caption_rows = []
narration_rows = []
raw = []
for i, scene in enumerate(scenes, 1):
    a, b, text = scene['startSeconds'], scene['endSeconds'], scene['caption']
    if i == 1: a = 0.10
    a, b = max(0.10, a), min(film_len - 0.02, b - 0.08)
    if b <= a: raise SystemExit(f'Invalid cue timing for {scene["name"]}')
    caption_rows.append((a, b, text))
    plain = ' '.join(text.splitlines())
    narration = {1: 'This pressure makes him feel ungrateful.', 2: 'Reflect privately, correct it, choose whether to share.', 4: 'Arjun puts the family pressure into his own words. He starts privately.', 9: 'He corrects it. He needs time to decide. This time, he names what fits.', 15: 'Prepared, fictional, not a live community.', 26: 'He edits the exact contribution. Consent stays unchecked. The local draft remains unsent.'}.get(i, plain)
    narration_rows.append(narration)
    txt = CAP / f'narration-{i:02}.txt'; txt.write_text(narration + '\n', encoding='utf-8')
    wav = CAP / f'narration-{i:02}.wav'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile='{quote_filter(txt)}':voice=rms",'-ac','1','-ar','48000',str(wav)])
    wav_len = duration(wav)
    if wav_len > b-a-0.15: raise SystemExit(f'Narration {i} is longer than its cue ({wav_len:.2f}s/{b-a:.2f}s): {plain}')
    raw.append((wav, a, wav_len))

(CAP / 'captions.srt').write_text('\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{text}\n' for i,(a,b,text) in enumerate(caption_rows,1)), encoding='utf-8')
(CAP / 'narration.txt').write_text('\n'.join(narration_rows) + '\n', encoding='utf-8')

# The real page occupies a 1600x740 aperture; the reserved lower strip carries captions without covering controls or copy.
# A gentle, continuous 30-second crop drift adds breathing motion while keeping all content authentic.
caption_filter_parts = []
for i,(a,b,_) in enumerate(caption_rows,1):
    path = CAP / f'caption-text-{i:02}.txt'; path.write_text(caption_rows[i-1][2], encoding='utf-8')
    safe = quote_filter(path)
    caption_filter_parts.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{safe}':fontcolor=white:fontsize=44:line_spacing=7:x=(w-text_w)/2:y={CAPTION_BAND_Y + 28}:box=1:boxcolor=0x163a36@0.98:boxborderw=15:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
filters = [
    'trim=start=1.30', 'setpts=PTS-STARTPTS', f'fps={FPS}',
    'crop=1600:740:0:0',
    "zoompan=z='1.008+0.012*sin(on/90)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1600x740:fps=30",
    'scale=1920:888:flags=lanczos', 'pad=1920:1080:0:0:color=0xF4F2EC',
    'setsar=1','format=yuv420p', *caption_filter_parts,
]
video = CAP / 'captioned-picture.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(SOURCE),'-vf',','.join(filters),'-an','-t',f'{film_len:.3f}','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(video)])
# Use the encoded picture duration as the master clock; the final cue and narration end with it.
film_len = duration(video)
last_a,last_b,last_text = caption_rows[-1]
caption_rows[-1] = (last_a, min(last_b, film_len - 0.02), last_text)
(CAP / 'captions.srt').write_text('\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{text}\n' for i,(a,b,text) in enumerate(caption_rows,1)), encoding='utf-8')

args = ['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video)]
complex_parts=[]
for i,(wav,a,_) in enumerate(raw,1):
    args += ['-i',str(wav)]
    delay=round(a*1000)
    complex_parts.append(f'[{i}:a]adelay={delay}|{delay},volume=1.0[a{i}]')
complex_parts.append(''.join(f'[a{i}]' for i in range(1,len(raw)+1))+f'amix=inputs={len(raw)}:duration=longest:normalize=0,alimiter=limit=0.95,apad,atrim=duration={film_len:.3f},loudnorm=I=-18:TP=-2:LRA=7[aout]')
args += ['-filter_complex',';'.join(complex_parts),'-map','0:v','-map','[aout]','-t',f'{film_len:.3f}','-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(args)

summary = {
  'iteration':'v26','source':'demo-iterations/v26/capture/video/v26-real-product-session.webm',
  'sourceSeconds':video_len,'startupTrimSeconds':STARTUP_TRIM,'durationSeconds':duration(OUT),
  'resolution':'1920x1080','fps':FPS,'sceneCount':len(scenes),'captionCueCount':len(caption_rows),
  'captionSafeArea':'Reserved 192px lower strip; product view is cropped to 1600x740 then scaled without covering UI.',
  'picture':'Real React product session captured through Playwright; gentle crop drift; no fabricated states.',
  'narration':'FFmpeg Flite rms synthetic voice; fictional example narration.',
}
(REL/'media-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))

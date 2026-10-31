#!/usr/bin/env python3
"""Layer matching synthetic narration and captions over one continuous browser take."""
from pathlib import Path
import json, subprocess

ROOT = Path(__file__).resolve().parents[3]
ITER = ROOT / 'demo-iterations' / 'v24'
CAP = ITER / 'capture'
VER = ITER / 'verification'
VER.mkdir(exist_ok=True)
SOURCE = CAP / 'video' / 'v24-full-session.webm'
OUT = ITER / 'demo.mp4'
FPS = 30

# Each spoken line is also the exact two-line burned-in caption for its beat.
lines = [
    'I feel ungrateful when I tell\nmy family what I want.',
    'Private reflection first.\nArjun can correct it.',
    'He starts unsure\nwhat he needs.',
    'No model is connected;\nreply is prepared.',
    'His words stay separate\nfrom a possible meaning.',
    'He rejects that possibility.',
    'He names what was missed,\nin his own words.',
    'The local reflection changes\nto fit his correction.',
    'Muse Spark could suggest a theme\nfor Arjun to correct.',
    'Confirmed themes could guide\nprepared story searches.',
    'Fixed browser rules;\nno live model search.',
    'Broad results dropped;\nfamily pressure stays.',
    'He chooses the family community.',
    'Ravi is fictional;\nprepared story.',
    'Their shared point is\nfamily pressure.',
    'Ravi had a trusted friend;\nArjun has not said that.',
    'Group question;\nno DMs.',
    'He asks for time to decide\nbefore answering.',
    'Group and alias shown;\nno DM.',
    'Consent unchecked.\nCancel sends nothing.',
    'Maybe later;\nreflection stays private.',
    'He keeps one note,\nonly for this session.',
]

def run(args):
    subprocess.run(args, check=True)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)], text=True))

def duration(path):
    return float(probe(path)['format']['duration'])

def stamp(seconds):
    ms = round(seconds * 1000)
    h, rem = divmod(ms, 3600000); m, rem = divmod(rem, 60000); s, ms = divmod(rem, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

if not SOURCE.exists():
    raise SystemExit(f'Missing capture source: {SOURCE}')
meta = probe(SOURCE)
video_duration = float(meta['format']['duration'])
# The first 0.5 seconds are browser recorder startup; trim it and its trailing flush.
startup_trim = 0.5
picture_duration = min(video_duration - startup_trim, 87.5)
if picture_duration < 87.4:
    raise SystemExit(f'Capture ended early at {picture_duration:.3f}s')

# Build exact beat-aligned sidecar captions and Flite speech segments.
cues = []
for i, text in enumerate(lines):
    cues.append((max(0.10, i * 4 + 0.10 - startup_trim), min((i + 1) * 4 - 0.02 - startup_trim, picture_duration - 0.02), text))
CAP.joinpath('captions.srt').write_text('\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{t}\n' for i, (a, b, t) in enumerate(cues, 1)), encoding='utf-8')
CAP.joinpath('narration.txt').write_text('\n'.join(t.replace('\n', ' ') for t in lines) + '\n', encoding='utf-8')

caption_text_dir = CAP / 'caption-text'; caption_text_dir.mkdir(exist_ok=True)
filters = [f'trim=start={startup_trim}', 'setpts=PTS-STARTPTS', f'fps={FPS}', 'scale=1920:1080:flags=lanczos', 'setsar=1', 'format=yuv420p']
for i, (start, end, text) in enumerate(cues, 1):
    path = caption_text_dir / f'{i:02}.txt'
    path.write_text(text, encoding='utf-8')
    safe = str(path).replace(':', r'\:').replace("'", r"\'")
    filters.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{safe}':fontcolor=white:fontsize=43:line_spacing=5:x=(w-text_w)/2:y=22:box=1:boxcolor=0x20342c@0.96:boxborderw=12:fix_bounds=1:enable='between(t\\,{start:.3f}\\,{end:.3f})'")
captioned = CAP / 'captioned-picture.mp4'
run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(SOURCE), '-vf', ','.join(filters), '-an', '-t', f'{picture_duration:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', str(captioned)])

wav_files = []
for i, (_, _, text) in enumerate(cues, 1):
    wav = CAP / f'narration-{i:02}.wav'
    text_path = CAP / f'narration-{i:02}.txt'
    text_path.write_text(text.replace('\n', ' '), encoding='utf-8')
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'flite=textfile={text_path}:voice=kal', '-ac', '2', '-ar', '48000', str(wav)])
    wav_len = duration(wav)
    if wav_len > 3.38:
        raise SystemExit(f'Narration cue {i} is too long for a 4s beat ({wav_len:.2f}s): {text}')
    wav_files.append(wav)

args = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(captioned)]
for wav in wav_files:
    args += ['-i', str(wav)]
complex_parts = []
for idx, ((start, _, _), wav) in enumerate(zip(cues, wav_files), 1):
    delay = round(start * 1000)
    complex_parts.append(f'[{idx}:a]adelay={delay}|{delay},volume=0.86[a{idx}]')
complex_parts.append(''.join(f'[a{i}]' for i in range(1, len(wav_files) + 1)) + f'amix=inputs={len(wav_files)}:duration=longest:normalize=0,apad=pad_dur=0.5,atrim=duration={picture_duration:.3f}[aout]')
args += ['-filter_complex', ';'.join(complex_parts), '-map', '0:v', '-map', '[aout]', '-t', f'{picture_duration:.3f}', '-r', str(FPS), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', str(OUT)]
run(args)

(VER / 'media-summary.json').write_text(json.dumps({'source': str(SOURCE.relative_to(ROOT)), 'videoDuration': video_duration, 'pictureDuration': duration(OUT), 'beatCount': len(cues), 'captionCount': len(cues), 'narration': 'FFmpeg Flite kal synthetic voice', 'resolution': '1920x1080', 'fps': FPS}, indent=2) + '\n')
print(json.dumps({'output': str(OUT), 'durationSeconds': duration(OUT), 'sourceSeconds': video_duration, 'beatCount': len(cues), 'narration': 'FFmpeg Flite kal; synthetic'}, indent=2))

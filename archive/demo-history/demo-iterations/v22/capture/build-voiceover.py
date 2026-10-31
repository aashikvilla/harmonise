#!/usr/bin/env python3
"""Synthesize v22 caption-matched narration with FFmpeg's local Flite voice."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CAP = ROOT / 'capture'
SRT = ROOT / 'captions.srt'
OUT = CAP / 'voiceover.wav'
SEGMENTS = CAP / 'voiceover-segments'
SEGMENTS.mkdir(exist_ok=True)

def seconds(stamp):
    hh, mm, rest = stamp.split(':')
    ss, ms = rest.split(',')
    return int(hh) * 3600 + int(mm) * 60 + int(ss) + int(ms) / 1000

def stamp(value):
    ms = round(value * 1000)
    hh, ms = divmod(ms, 3_600_000)
    mm, ms = divmod(ms, 60_000)
    ss, ms = divmod(ms, 1000)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'

raw = SRT.read_text(encoding='utf-8').strip()
blocks = [b for b in re.split(r'\n\s*\n', raw) if b]
records = []
for idx, block in enumerate(blocks, 1):
    rows = block.splitlines()
    start_text, end_text = rows[1].split(' --> ')
    start, end = seconds(start_text), seconds(end_text)
    spoken = ' '.join(line.strip() for line in rows[2:] if line.strip())
    text_path = SEGMENTS / f'{idx:02}.txt'
    wav_path = SEGMENTS / f'{idx:02}.wav'
    text_path.write_text(spoken + '\n', encoding='utf-8')
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', f'flite=textfile={text_path}:voice=kal',
        '-ar', '48000', '-ac', '1', '-af', 'loudnorm=I=-20:TP=-2:LRA=7',
        str(wav_path),
    ], check=True)
    duration = float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nw=1:nk=1', str(wav_path),
    ], text=True))
    caption_end = min(end, start + duration + 0.25)
    if caption_end <= start or duration > end - start + 0.05:
        raise SystemExit(f'Cue {idx} narration does not fit {start:.3f}–{end:.3f}s ({duration:.3f}s)')
    records.append((idx, start, caption_end, duration, wav_path))

# Keep captions close to speech and never let adjacent cues collide.
for i, rec in enumerate(records[:-1]):
    idx, start, caption_end, duration, path = rec
    next_start = records[i + 1][1]
    if caption_end > next_start:
        raise SystemExit(f'Cue {idx} caption overlaps cue {records[i + 1][0]}')
blocks_out = []
for block, rec in zip(blocks, records):
    rows = block.splitlines()
    idx, start, caption_end, duration, path = rec
    rows[1] = f'{stamp(start)} --> {stamp(caption_end)}'
    blocks_out.append('\n'.join(rows))
SRT.write_text('\n\n'.join(blocks_out) + '\n', encoding='utf-8')

args = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y']
for *_, path in records:
    args += ['-i', str(path)]
parts = []
for idx, start, caption_end, duration, _ in records:
    delay = round(start * 1000)
    parts.append(f'[{idx - 1}:a]adelay={delay}|{delay}[a{idx - 1}]')
labels = ''.join(f'[a{i}]' for i in range(len(records)))
parts.append(f'{labels}amix=inputs={len(records)}:duration=longest:normalize=0,apad=whole_dur=178,atrim=duration=178,alimiter=limit=0.90[aout]')
args += ['-filter_complex', ';'.join(parts), '-map', '[aout]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(OUT)]
subprocess.run(args, check=True)
print(f'Synthesized {len(records)} Flite narration cues; duration 178.000s; last speech ends at {max(s + d for _, s, _, d, _ in records):.3f}s')

#!/usr/bin/env python3
"""Assemble the v23 action capture, timed captions, and synthetic Flite narration."""
from pathlib import Path
import json, subprocess

ROOT = Path(__file__).resolve().parents[3]
ITER = ROOT / 'demo-iterations' / 'v23'
CAP = ITER / 'capture'
VER = ITER / 'verification'
VIDEO = CAP / 'video'
VER.mkdir(exist_ok=True)
OUT = ITER / 'demo.mp4'
FPS = 30

def run(args):
    subprocess.run(args, check=True)

def probe(path):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)], text=True))

marks = json.loads((CAP / 'capture-marks.json').read_text())['marks']
opening_start = marks['entry']
opener_duration = marks['private-start'] - opening_start
continuous_start = 10.0
continuous_duration = 39.2
post_start = marks['corrected']
post_end = marks['end']
post_speed = 1.0
post_duration = (post_end - post_start) * post_speed
duration = opener_duration + continuous_duration + post_duration
route_origin = opener_duration + continuous_duration
def route_time(mark_name, before=0.0):
    return route_origin + marks[mark_name] - marks['corrected'] - before

source = VIDEO / 'v23-full-route.mp4'
continuous = CAP / 'continuous-trimmed.mp4'
post = CAP / 'post-correction.mp4'
joined = CAP / 'joined.mp4'

run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{continuous_start:.3f}','-i',str(CAP/'continuous-take.mp4'),'-t',f'{continuous_duration:.3f}','-vf',f'fps={FPS},scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p','-an','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',str(continuous)])
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-vf',f"trim=start={post_start:.3f}:end={post_end:.3f},setpts=(PTS-STARTPTS)*{post_speed},fps={FPS},scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p",'-an','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',str(post)])

opener = CAP / 'opening.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{opening_start:.3f}','-i',str(source),'-t',f'{opener_duration:.3f}','-vf',f'fps={FPS},scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p','-an','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',str(opener)])
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(opener),'-i',str(continuous),'-i',str(post),'-filter_complex','[0:v]setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[2:v]setpts=PTS-STARTPTS[v2];[v0][v1][v2]concat=n=3:v=1:a=0[out]','-map','[out]','-an','-r',str(FPS),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(joined)])
actual_duration = probe(joined)

# Each caption is also the exact synthetic narration cue. Keep the text short and muted-first.
cues = [
    (0.10, opener_duration - 0.10, 'Synthetic narration · fictional scenario.'),
    (opener_duration + 3.7, opener_duration + 7.0, 'Prepared example. No model connected.'),
    (opener_duration + 10.3, opener_duration + 17.2, 'A possibility to check, not a verdict.'),
    (opener_duration + 17.4, opener_duration + 20.4, 'Arjun chooses “Not quite.”'),
    (opener_duration + 24.0, opener_duration + 31.3, 'He edits the reflection in his own words.'),
    (opener_duration + 34.0, opener_duration + continuous_duration - 0.15, 'The reflection changes. Muse Spark is future work, not connected.'),
    (route_time('takeaway-kept-inline', 2.0), route_time('takeaway-kept-inline', 2.0) + 3.8, 'He keeps a practical takeaway privately.'),
    (route_time('match-and-difference', 4.0), route_time('match-and-difference', 1.9), 'Prepared fictional story.'),
    (route_time('match-and-difference', 1.9), route_time('question-open', 2.0), 'Ravi had a friend; Arjun has not said he does.'),
    (route_time('question-edited', 2.0), route_time('support-limit', 2.0), 'Exact question only. Consent unchecked.'),
    (route_time('support-limit', 2.0), route_time('day-16', 2.5), 'No provider is verified or bookable here.'),
    (route_time('day-16', 0.0), route_time('private-takeaway-selected', 2.0), 'Maybe later. The reflection stays private.'),
    (route_time('private-takeaway-selected', 2.0), actual_duration - 0.1, 'Kept privately for this session.'),
]

def stamp(seconds):
    ms = round(seconds * 1000)
    h, rem = divmod(ms, 3600000); m, rem = divmod(rem, 60000); s, ms = divmod(rem, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

lines=[]
for i,(start,end,text) in enumerate(cues,1):
    lines.extend([str(i),f'{stamp(start)} --> {stamp(end)}',text,''])
CAP.joinpath('captions.srt').write_text('\n'.join(lines), encoding='utf-8')
(CAP/'narration.txt').write_text('\n'.join(text for _,_,text in cues)+'\n', encoding='utf-8')

caption_dir = CAP / 'caption-text'; caption_dir.mkdir(exist_ok=True)
filters=[]
for i,(start,end,text) in enumerate(cues,1):
    txt=caption_dir/f'{i:02}.txt'; txt.write_text(text,encoding='utf-8')
    safe=str(txt).replace(':',r'\:').replace("'",r"\'")
    filters.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{safe}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=18:box=1:boxcolor=0x20342c@0.94:boxborderw=12:line_spacing=4:fix_bounds=1:enable='between(t\\,{start:.3f}\\,{end:.3f})'")
filters.append(f"fade=t=out:st={max(0,actual_duration-0.7):.3f}:d=0.7")
captioned=CAP/'captioned-picture.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(joined),'-vf',','.join(filters),'-an','-r',str(FPS),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(captioned)])

# Use FFmpeg's local Flite voice. This is synthetic speech, never presented as a person.
wav_files=[]
for i,(_,_,text) in enumerate(cues,1):
    wav=CAP/f'narration-{i:02}.wav'; wav_files.append(wav)
    textfile=CAP/f'narration-{i:02}.txt'; textfile.write_text(text,encoding='utf-8')
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile={textfile}:voice=kal",'-ac','2','-ar','48000',str(wav)])

args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(captioned)]
for wav in wav_files: args += ['-i',str(wav)]
audio_filters=[]
for idx,(wav,(start,_,_)) in enumerate(zip(wav_files,cues),1):
    delay=round(start*1000)
    audio_filters.append(f'[{idx}:a]adelay={delay}|{delay},volume=0.70[a{idx}]')
audio_filters.append(''.join(f'[a{i}]' for i in range(1,len(wav_files)+1))+f'amix=inputs={len(wav_files)}:duration=longest:normalize=0,apad=pad_dur=1,atrim=duration={actual_duration:.3f}[aout]')
args += ['-filter_complex',';'.join(audio_filters),'-map','0:v','-map','[aout]','-t',f'{actual_duration:.3f}','-r',str(FPS),'-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT)]
run(args)

print(json.dumps({'durationSeconds':probe(OUT),'pictureDurationSeconds':actual_duration,'openingSeconds':opener_duration,'continuousCorrectionSeconds':continuous_duration,'postCorrectionRouteSeconds':post_duration,'captionCount':len(cues),'narrationSource':'FFmpeg Flite kal; synthetic narration'},indent=2))

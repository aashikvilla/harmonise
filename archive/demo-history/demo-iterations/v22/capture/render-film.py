#!/usr/bin/env python3
"""Render the v22 evidence film from one continuous browser capture and verified state inserts."""
from pathlib import Path
import subprocess, json
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
CAP=ROOT/'capture'; FRAMES=CAP/'frames'; OUT=ROOT/'demo.mp4'; VER=ROOT/'verification'; VER.mkdir(exist_ok=True)
FPS=30; TOTAL=178.0

def run(args): subprocess.run(args,check=True)
def probe(path):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)],text=True))

frame_count=len(list(FRAMES.glob('frame-*.jpg')))
marks=json.loads((CAP/'continuous-take.json').read_text())
continuous_duration=marks['durationSeconds']
if frame_count != marks['frameCount'] or not 55 <= continuous_duration <= 65:
    raise SystemExit(f'Continuous evidence take outside 55–65 seconds: {frame_count} frames / {continuous_duration:.3f}s')
rate=frame_count/continuous_duration
continuous=CAP/'continuous-take.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate',f'{rate:.8f}','-i',str(FRAMES/'frame-%05d.jpg'),'-vf','fps=30,scale=1920:1080:flags=lanczos,format=yuv420p','-t',f'{continuous_duration:.6f}','-an','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',str(continuous)])

# The input application screenshots stay at 1280x720 -> 1920x1080 for readable UI.
# Crops on the two later UI states preserve the question/consent or takeaway state.
assets=CAP/'render-assets'; assets.mkdir(exist_ok=True)
fontdir=Path('/usr/share/fonts/truetype/dejavu')
def font(name,size): return ImageFont.truetype(str(fontdir/name),size)
def card_base(): return Image.new('RGB',(1920,1080),'#f4f2ec')
def peer_card():
    im=card_base(); d=ImageDraw.Draw(im)
    d.text((120,155),'ONE PREPARED FICTIONAL PEER EXAMPLE',font=font('DejaVuSans-Bold.ttf',34),fill='#174d43')
    d.text((120,245),'Ravi',font=font('DejaVuSerif.ttf',68),fill='#20342c')
    d.rounded_rectangle((120,340,930,860),radius=28,fill='#e6eee8',outline='#174d43',width=3)
    d.rounded_rectangle((990,340,1800,860),radius=28,fill='#fffefa',outline='#b3c4b7',width=3)
    d.text((180,405),'MATCH',font=font('DejaVuSans-Bold.ttf',34),fill='#174d43')
    d.multiline_text((180,505),'Both faced pressure to\nanswer before they were\nready, and wanted room\nto think.',font=font('DejaVuSans.ttf',48),fill='#20342c',spacing=18)
    d.text((1050,405),'DIFFERENCE',font=font('DejaVuSans-Bold.ttf',34),fill='#174d43')
    d.multiline_text((1050,505),'Ravi asked a trusted friend\nto listen. Arjun has not\nsaid he has that support.',font=font('DejaVuSans.ttf',48),fill='#20342c',spacing=18)
    d.text((120,950),'Prepared fictional example · not a real account · not live',font=font('DejaVuSans.ttf',30),fill='#374b41')
    d.text((120,1008),'A comparison for reflection, not a promise that the same approach will help.',font=font('DejaVuSans.ttf',26),fill='#526158')
    im.save(assets/'peer-comparison.png')
def support_card():
    im=card_base(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((170,220,1750,860),radius=30,fill='#fffefa',outline='#b3c4b7',width=3)
    d.text((260,310),'SUPPORT AVAILABILITY · PREVIEW',font=font('DejaVuSans-Bold.ttf',34),fill='#174d43')
    d.multiline_text((260,440),'No provider credentials are verified\nand no appointment is available here.',font=font('DejaVuSerif.ttf',62),fill='#20342c',spacing=24)
    d.text((260,730),'This preview does not verify providers or offer an appointment.',font=font('DejaVuSans.ttf',30),fill='#526158')
    im.save(assets/'support-status.png')
peer_card(); support_card()
run(['convert',str(CAP/'09-ravi-preview.png'),'-crop','1280x720+0+90','+repage',str(assets/'ravi-preview.png')])
run(['convert',str(CAP/'07-takeaway-private.png'),'-crop','1280x720+0+90','+repage',str(assets/'takeaway-private.png')])
run(['convert',str(CAP/'11-maybe-later-selected.png'),'-crop','1280x720+0+0','+repage',str(assets/'maybe-later-selected.png')])

# One continuous interaction through 01:02.345, held on its actual changed result to 01:12.
# Then the four beats follow the brief's two evidence inserts and bounded UI/result states.
main_hold=72.0-continuous_duration
if main_hold < 0: raise SystemExit('Continuous take exceeds the 72-second center beat')
clips=[(continuous,72.0)]
for name,path,duration in [
    ('peer',assets/'peer-comparison.png',17.0),
    ('ravi',assets/'ravi-preview.png',18.0),
    ('support',assets/'support-status.png',15.0),
    ('takeaway',assets/'takeaway-private.png',33.0),
    ('maybe-later',assets/'maybe-later-selected.png',23.0),
]:
    clip=CAP/f'{name}-insert.mp4'
    # UI inserts are cropped to the live panel. Padding at the top is reserved for captions.
    if name in ('ravi','takeaway','maybe-later'):
        vf='scale=1920:900:flags=lanczos,pad=1920:1080:0:180:color=0xf4f2ec,fps=30,format=yuv420p'
    else:
        vf='scale=1920:1080:flags=lanczos,fps=30,format=yuv420p'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30','-i',str(path),'-vf',vf,'-t',f'{duration:.3f}','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(clip)])
    clips.append((clip,duration))

# Concatenate the dynamic take, a brief hold, and one full-screen evidence state at a time.
join=CAP/'joined-no-captions.mp4'; args=['ffmpeg','-hide_banner','-loglevel','error','-y']
for path,_ in clips: args += ['-i',str(path)]
filters=[]
filters.append(f'[0:v]scale=1706:960:flags=lanczos,pad=1920:1080:107:120:color=0xf4f2ec,setsar=1,tpad=stop_mode=clone:stop_duration={main_hold:.6f},trim=duration=72,setpts=PTS-STARTPTS[v0]')
for i,(_,duration) in enumerate(clips[1:],1): filters.append(f'[{i}:v]trim=duration={duration:.3f},setpts=PTS-STARTPTS[v{i}]')
filters.append(''.join(f'[v{i}]' for i in range(len(clips)))+f'concat=n={len(clips)}:v=1:a=0[vout]')
args += ['-filter_complex',';'.join(filters),'-map','[vout]','-an','-r','30','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(join)]
run(args)
joined_duration=probe(join)
if abs(joined_duration-TOTAL) > .12: raise SystemExit(f'Unexpected assembled duration {joined_duration:.3f}s')

# Draw one caption at a time in a safe top band. The font is 44 px at 1920x1080
# (22 px in the required half-size view); app controls remain unobstructed.
run(['python3',str(CAP/'build-voiceover.py')])
caption_dir=CAP/'caption-text'; caption_dir.mkdir(exist_ok=True)
raw=(ROOT/'captions.srt').read_text(encoding='utf-8').strip().split('\n\n')
caption_filters=[]
for index,block in enumerate(raw,1):
    rows=block.splitlines()
    if len(rows)<3: raise SystemExit(f'Malformed caption cue: {block}')
    start,end=rows[1].split(' --> ')
    def seconds(stamp):
        hh,mm,rest=stamp.split(':'); ss,ms=rest.split(',')
        return int(hh)*3600+int(mm)*60+int(ss)+int(ms)/1000
    text='\n'.join(line.strip() for line in rows[2:] if line.strip())
    txt=caption_dir/f'{index:02}.txt'; txt.write_text(text,encoding='utf-8')
    path=str(txt).replace(':',r'\:').replace("'",r"\'")
    a=seconds(start); b=seconds(end)
    caption_filters.append(f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile='{path}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=0:box=1:boxcolor=0x20342c@0.94:boxborderw=12:line_spacing=4:fix_bounds=1:enable='between(t\\,{a:.3f}\\,{b:.3f})'")
vf=','.join(caption_filters+["drawbox=x=0:y=118:w='1920*t/178':h=6:color=0x176151:t=fill",'fade=t=out:st=176:d=2'])
captioned=CAP/'captioned-picture.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(join),'-vf',vf,'-an','-r','30','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',str(captioned)])
# The soundtrack is clearly synthetic local Flite narration, aligned to these captions.
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(captioned),'-i',str(CAP/'voiceover.wav'),'-map','0:v','-map','1:a','-t',f'{TOTAL:.3f}','-r','30','-c:v','copy','-c:a','aac','-b:a','128k','-movflags','+faststart',str(OUT)])
print(json.dumps({'continuousDuration':continuous_duration,'continuousFrameCount':frame_count,'videoDuration':probe(OUT),'sizeBytes':OUT.stat().st_size,'insertDurations':[d for _,d in clips]},indent=2))

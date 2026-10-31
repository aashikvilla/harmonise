from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, hashlib, shutil

ROOT = Path(__file__).resolve().parents[3]
I = ROOT / 'demo-iterations/v41'
C = I / 'capture'
S = C / 'source'
G = C / 'generated'
V = I / 'verification'
V.mkdir(parents=True, exist_ok=True)
G.mkdir(parents=True, exist_ok=True)

# Frozen, retained v40 source inputs. The source files are copied for a self-contained edit.
SRC = ROOT / 'demo-iterations/v40/capture/source'
source_names = [
    'entry-screen.png', 'continuous-correction-raw.webm', 'v13-audio-source.mp4',
    'peer-day4-posts-700-dpr2.png', 'host-boundary-768-dpr2.png',
    'share-preview-panel-768-dpr2.png', 'private-takeaway-confirmed.png',
]
for name in source_names:
    shutil.copy2(SRC / name, S / name)

W, H, FPS = 1920, 1080, 30
CREAM = '#f4f3ee'
INK = '#173f3b'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F_LABEL = ImageFont.truetype(BOLD, 24)

def run(args):
    subprocess.run(args, check=True)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def label(draw, text, x=64, y=28):
    b = draw.textbbox((0, 0), text, font=F_LABEL)
    draw.rounded_rectangle((x-18, y-10, x+b[2]+20, y+39), radius=10, fill='#f4f3ee')
    draw.text((x, y), text, font=F_LABEL, fill=INK)

def fit_crop(path, crop, dest=(80, 130, 1760, 790), name=''):
    raw = Image.open(path).convert('RGBA')
    backdrop = Image.new('RGBA', raw.size, CREAM)
    cx, cy, cw, ch = crop
    # Crop tuples are x/y/width/height; clamp to the real capture dimensions.
    x1, y1 = max(0, cx), max(0, cy)
    x2, y2 = min(raw.width, cx+cw), min(raw.height, cy+ch)
    source = Image.alpha_composite(backdrop, raw).convert('RGB').crop((x1, y1, x2, y2))
    x, y, w, h = dest
    # Contain each real crop so no word or control is cut off at frame edges.
    scale = min(w/source.width, h/source.height)
    size = (round(source.width*scale), round(source.height*scale))
    source = source.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (W, H), CREAM)
    canvas.paste(source, (x+(w-source.width)//2, y+(h-source.height)//2))
    if name:
        canvas.save(G/name, optimize=True)
    return canvas

entry = S/'entry-screen.png'
# The opening and promise are editorial crops from the same actual entry capture.
im = fit_crop(entry, (280, 90, 1370, 520), (0, 110, 1920, 780), '01-family-pressure.png')
label(ImageDraw.Draw(im), 'Fictional scenario · prepared local example')
im.save(G/'01-family-pressure.png', optimize=True)
im = fit_crop(entry, (330, 205, 1155, 285), (120, 190, 1680, 710), '02-product-promise.png')
label(ImageDraw.Draw(im), 'Prepared local example')
im.save(G/'02-product-promise.png', optimize=True)

# One uninterrupted crop of the real correction recording; the only overlay is provenance.
font_disclosure = ImageFont.truetype(BOLD, 30)
disclosure = Image.new('RGBA', (W, H), (0, 0, 0, 0))
dd = ImageDraw.Draw(disclosure)
txt = 'Prepared local example · no model connected'
b = dd.textbbox((0,0), txt, font=font_disclosure)
dd.rounded_rectangle((42, 28, b[2]+82, 83), radius=10, fill=(244,243,238,242))
dd.text((62, 35), txt, font=font_disclosure, fill=INK)
disclosure.save(G/'correction-provenance.png')

# The two peer beats are actual local frontend captures, kept as separate, purposeful images.
im = fit_crop(S/'peer-day4-posts-700-dpr2.png', (0, 214, 1192, 368),
              (90, 115, 1740, 770), '03-peer-perspective.png')
label(ImageDraw.Draw(im), 'Prepared fictional peer example · not live')
im.save(G/'03-peer-perspective.png', optimize=True)
im = fit_crop(S/'host-boundary-768-dpr2.png', (0, 0, 864, 198),
              (90, 160, 1740, 700), '04-host-boundary.png')
label(ImageDraw.Draw(im), 'Prepared fictional peer example · not live')
im.save(G/'04-host-boundary.png', optimize=True)

# Consent preview is the complete real screenshot, scaled to the frame and continuously
# reframed from the audience/text at top through consent, disabled continuation, and no-send.
privacy_src = Image.open(S/'share-preview-panel-768-dpr2.png').convert('RGB')
privacy_scaled = privacy_src.resize((1920, round(1920*privacy_src.height/privacy_src.width)), Image.Resampling.LANCZOS)
# Save the scaled source separately so the render can pan across the whole real capture.
privacy_scaled.save(G/'privacy-preview-scaled.png', optimize=True)
privacy_tag = Image.new('RGBA', (W, H), (0, 0, 0, 0))
pd = ImageDraw.Draw(privacy_tag)
ptxt = 'Prepared local preview · no message service connected'
pb = pd.textbbox((0,0), ptxt, font=F_LABEL)
pd.rounded_rectangle((42, 22, pb[2]+82, 70), radius=10, fill=(244,243,238,242))
pd.text((62, 29), ptxt, font=F_LABEL, fill=INK)
privacy_tag.save(G/'privacy-provenance.png')

# The final state is the actual prepared private-takeaway capture. The crop leaves the
# preview-session confirmation and private choice visible through the ending.
im = fit_crop(S/'private-takeaway-confirmed.png', (350, 410, 1110, 270),
              (100, 130, 1720, 650), '05-private-takeaway.png')
label(ImageDraw.Draw(im), 'Prepared preview session · private choice')
im.save(G/'05-private-takeaway.png', optimize=True)

# Each caption string is verbatim from v13. Source in/out points are the retained v40 cue map.
# Output starts are retimed around the shorter character-led picture.
cues = [
    (0.00, 4.00, 'I can’t tell my family what I want without feeling ungrateful.', 0.00, 4.00),
    (4.20, 9.00, 'Private reflection you can correct before exploring peer experiences.', 4.20, 9.00),
    (9.00, 13.10, 'A local example offers a possibility, not an answer.', 16.50, 20.60),
    (13.20, 15.60, 'Arjun says, Not quite.', 20.80, 23.20),
    (15.70, 19.90, 'He changes the words: it is his parents, and he wants time.', 23.40, 27.605),
    (20.00, 23.40, 'Now the editable reflection changes with what he said.', 28.00, 31.40),
    (23.50, 27.65, 'He wants time to decide, without advice to stay or leave.', 31.60, 35.75),
    (28.96, 32.385, 'Day four: one member wants time to choose.', 42.00, 45.425),
    (33.16, 37.46, 'Day nine. The host says, I can listen; I can’t decide for you.', 50.50, 54.80),
    (37.56, 41.56, 'Fictional historical examples, prepared and not live.', 55.00, 59.00),
    (41.86, 44.97, 'Group only; no private messages.', 67.50, 70.61),
    (45.07, 48.26, 'The alias and group audience stay visible.', 76.20, 79.39),
    (48.36, 52.02, 'Private conversation and context are excluded.', 79.90, 83.56),
    (52.12, 56.12, 'Consent is unchecked. Continue stays disabled.', 84.00, 88.00),
    (56.22, 58.92, 'Nothing is sent from this preview.', 88.20, 90.90),
    (59.10, 62.00, 'He keeps time to decide privately.', 100.00, 102.89),
    (62.10, 65.15, 'He could leave without sharing anything.', 104.50, 107.55),
    (65.25, 68.36, 'Maybe later keeps that choice open.', 109.00, 112.11),
    (68.46, 71.84, 'Private reflection stays out of the group draft.', 113.50, 116.88),
    (72.00, 75.305, 'Arjun keeps the next step in his hands.', 158.50, 161.805),
    (75.40, 79.38, 'Nothing is sent without consent. Arjun can leave it here.', 173.60, 177.58),
]

def ts(t):
    ms = round(t*1000); h,ms = divmod(ms,3600000); m,ms = divmod(ms,60000); s,ms = divmod(ms,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'

with (C/'captions.srt').open('w', encoding='utf8') as f:
    for n,(a,b,text,_,_) in enumerate(cues,1):
        f.write(f'{n}\n{ts(a)} --> {ts(b)}\n{text}\n\n')

DUR = 80.6
segments = [
    ('01-family-pressure.png', 4.2, 'still'),
    ('02-product-promise.png', 4.8, 'still'),
    ('CORRECTION', 19.86, 'correction'),
    ('03-peer-perspective.png', 4.1, 'still'),
    ('04-host-boundary.png', 8.8, 'still'),
    ('PRIVACY', 17.2, 'privacy'),
    ('05-private-takeaway.png', 21.64, 'close'),
]
assert abs(sum(x[1] for x in segments)-DUR) < 0.001

args=[]; stills=[]; index=0
for name, seconds, kind in segments:
    if kind == 'correction':
        args += ['-i', str(S/'continuous-correction-raw.webm')]
        correction_i=index; index+=1
        args += ['-loop','1','-framerate',str(FPS),'-i',str(G/'correction-provenance.png')]
        correction_label_i=index; index+=1
    elif kind == 'privacy':
        args += ['-loop','1','-framerate',str(FPS),'-i',str(G/'privacy-preview-scaled.png')]
        privacy_i=index; index+=1
        args += ['-loop','1','-framerate',str(FPS),'-i',str(G/'privacy-provenance.png')]
        privacy_label_i=index; index+=1
    else:
        args += ['-loop','1','-framerate',str(FPS),'-t',str(seconds),'-i',str(G/name)]
        stills.append((name,seconds,kind,index)); index+=1

filters=[]; ordered=[]
for name,seconds,kind,i in stills:
    frames=round(seconds*FPS)
    if name == '05-private-takeaway.png':
        # A restrained, continuous move toward the exact takeaway; all source text is retained.
        vf=f"[{i}:v]zoompan=z='min(zoom+0.00025,1.16)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={FPS},trim=end_frame={frames},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[v{i}]"
    else:
        vf=f'[{i}:v]fps={FPS},trim=end_frame={frames},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[v{i}]'
    filters.append(vf); ordered.append((name, f'[v{i}]'))

cor_frames=round(19.86*FPS)
filters.append(
    f'[{correction_i}:v]fps={FPS},trim=start=0.5:end=20.36,setpts=PTS-STARTPTS,'
    "crop=1140:660:240:'210+min(n/595,1)*60',scale=1311:759:flags=lanczos,pad=1920:1080:304:40:color=0xf4f3ee,setsar=1,format=rgba[correction]"
)
filters.append(f'[{correction_label_i}:v]format=rgba[corlabel]')
filters.append(f'[correction][corlabel]overlay=0:0:shortest=1,trim=end_frame={cor_frames},format=yuv420p[vcorrection]')
ordered.append(('CORRECTION','[vcorrection]'))

privacy_frames=round(17.2*FPS)
privacy_height=round(1920*1028/1168)
filters.append(
    f'[{privacy_i}:v]fps={FPS},scale=1920:{privacy_height},'
    f"crop=1920:800:0:'min((n/{privacy_frames})*({privacy_height}-800),{privacy_height-800})',"
    'pad=1920:1080:0:100:color=0xf4f3ee,format=rgba[privacy]'
)
filters.append(f'[{privacy_label_i}:v]format=rgba[privlabel]')
filters.append(f'[privacy][privlabel]overlay=0:0:shortest=1,trim=end_frame={privacy_frames},format=yuv420p[vprivacy]')
ordered.append(('PRIVACY','[vprivacy]'))

segment_order=[]
for name,_,_ in segments:
    segment_order.append(dict(ordered)[name])
filters.append(''.join(segment_order)+f'concat=n={len(segments)}:v=1:a=0[vbase]')

audio_graph=[]; audio_labels=[]
audio_source_index = index
for n,(dst,caption_end,text,src_in,src_out) in enumerate(cues):
    audio_graph.append(
        f'[{audio_source_index}:a]atrim=start={src_in:.3f}:end={src_out:.3f},asetpts=PTS-STARTPTS,'
        f'aresample=48000,adelay=delays={round(dst*1000)}:all=1[a{n}]'
    )
    audio_labels.append(f'[a{n}]')
audio_graph.append(f'anullsrc=r=48000:cl=mono:d={DUR}[silence]')
audio_graph.append('[silence]'+''.join(audio_labels)+
                   f'amix=inputs={len(cues)+1}:duration=first:normalize=0,atrim=duration={DUR},aresample=48000[aout]')
sub = (C/'captions.srt').as_posix()
audio_graph.append(
    "[vbase]drawbox=x=0:y=800:w=1920:h=280:color=0xf4f3ee:t=fill[vcaptionbase]"
)
audio_graph.append(
    f"[vcaptionbase]subtitles='{sub}':force_style='FontName=DejaVu Sans,FontSize=10,PrimaryColour=&H003B3F17,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginL=110,MarginR=110,MarginV=18'[vout]"
)
output = I/'candidate.mp4'
tmp = I/'candidate-rendering.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args,
     '-i',str(S/'v13-audio-source.mp4'),
     '-filter_complex',';'.join(filters+audio_graph),
     '-map','[vout]','-map','[aout]','-c:v','libx264','-preset','medium','-crf','17',
     '-pix_fmt','yuv420p','-r',str(FPS),'-frames:v',str(round(DUR*FPS)),
     '-c:a','aac','-b:a','192k','-ar','48000','-ac','1','-movflags','+faststart',str(tmp)])
tmp.replace(output)

segments_json=[]; cursor=0.0
for name,seconds,treatment in segments:
    segments_json.append({'start':round(cursor,3),'duration':seconds,'source':name,'treatment':treatment})
    cursor += seconds

manifest = {
    'iteration':'v41', 'status':'FIRST COMPLETE CANDIDATE — frozen pending parent review',
    'title':'I need time to decide', 'candidate':'candidate.mp4', 'candidateSha256':sha(output),
    'durationSeconds':DUR, 'video':{'width':W,'height':H,'fps':FPS},
    'audioSource':'capture/source/v13-audio-source.mp4 (audio only)',
    'audioSourceSha256':sha(S/'v13-audio-source.mp4'),
    'correctionSource':'capture/source/continuous-correction-raw.webm',
    'correctionSourceSha256':sha(S/'continuous-correction-raw.webm'),
    'sourceStillHashes':{n:sha(S/n) for n in source_names if n.endswith('.png')},
    'segments':segments_json,
    'audioCues':[{'outputStart':a,'captionEnd':b,'text':text,'sourceIn':si,'sourceOut':so} for a,b,text,si,so in cues],
    'captions':'capture/captions.srt; all retained spoken lines match v13 verbatim',
    'timelineNotes':[
        'Opening family-pressure line and product promise use actual entry-screen crops.',
        'Correction is one continuous normal-speed crop from source 0.5–20.36 seconds.',
        'Peer and host are actual prepared local captures; provenance stays adjacent.',
        'Consent beat continuously reframes one exact local share-preview capture.',
        'Final image is the actual preview-session private-takeaway state; no click is shown.'
    ],
    'gates':{
        'openingPromiseByNineSeconds':True,
        'continuousCorrectionAtNormalSpeed':True,
        'cursorOrTypingAdded':False,
        'peerAndHostPreparedNotLiveLabels':True,
        'singleNoSendConsentBranch':True,
        'privatePreviewOnlyTakeaway':True,
        'syntheticNarrationOrPeople':False,
        'fullDecodeAndFrameReview':'pending'
    }
}
(I/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'candidate':str(output),'duration':DUR,'sha256':manifest['candidateSha256'],
                  'cueCount':len(cues),'segments':len(segments)},indent=2))

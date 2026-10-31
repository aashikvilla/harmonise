#!/usr/bin/env python3
"""Render v05 from actual React Playwright footage with synthetic Flite narration."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "capture" / "react-capture.webm"
ARCH_CARD = ROOT / "capture" / "15-planned-architecture-status.png"
OUTPUT = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = ROOT / "narration.txt"
END = 178.0
SPEED = 1.2
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Timings follow the captured React interactions in order. Narration describes
# only the fictional local preview, its visible controls, and proposed roles.
lines = [
    (0.0, "Arjun feels ungrateful asking for room to think."),
    (4.5, "He can talk, browse, or leave the question unanswered."),
    (12.0, "He chooses to talk and offers one short line. The reply is a prepared local example; no model is connected."),
    (28.0, "A possible reading appears. Arjun says not quite, edits the words himself, and sees his correction in the conversation."),
    (50.0, "He confirms that account, then chooses to look at family experiences. The next step follows his choice, not an automatic model revision."),
    (72.0, "Ravi's fictional account overlaps in one place and differs in others. His sample preference is group replies only, with no private message option."),
    (84.0, "Arjun reviews the exact audience, alias, and question. The checkbox is still clear; continuing shows a prepared sample, and nothing is sent."),
    (103.0, "The reply is an illustrative sample, not a live message. Later, Dev's fictional question leaves room for Arjun to share one bounded part of his experience."),
    (122.0, "He can include what went badly, keep private notes separate, preview the exact group text, and choose whether to post this local example."),
    (134.0, "Professional support is a separate path. This screen has no connected provider directory or credential checks, and no provider is verified or bookable here."),
    (144.0, "Planned Meta Muse Spark would support dialogue and structured, correctable context. Planned Muse Voice Transcribe would offer optional speech-to-text, reviewed before sending. Neither is connected in this preview."),
    (166.0, "He still has questions. One day, if he chooses, he can offer someone else one honest part of what he tried, and keep the rest private."),
]

captions = [
    (0, 4.5, "Arjun feels ungrateful asking for room to think."),
    (4.5, 11.8, "He can talk, browse, or leave the question unanswered."),
    (12, 27, "He chooses to talk and offers one short line.\nThis reply is a prepared local example; no model is connected."),
    (28, 42, "A possible reading appears. Arjun says “Not quite”\nand edits the words himself."),
    (42, 50, "His correction is visible in the conversation."),
    (50, 69, "He confirms that account, then chooses to look at family experiences.\nThe next step follows his choice, not an automatic model revision."),
    (72, 83, "Ravi's fictional account overlaps in one place\nand differs in others. Group replies only; no private message option."),
    (84, 97, "Arjun reviews the exact audience, alias, and question.\nThe checkbox is still clear; nothing is sent."),
    (97, 104, "A prepared illustrative sample,\nnot a live message."),
    (104, 121, "Dev's fictional question leaves room for a bounded story.\nArjun can share what he tried, including what went badly."),
    (121, 138, "He keeps private notes separate, previews the exact group text,\nand chooses whether to post this local example."),
    (134, 144, "Professional support is separate.\nNo provider is verified or bookable here."),
    (144, 165, "Planned Meta Muse Spark — dialogue and structured, correctable context.\nPlanned Muse Voice Transcribe — optional speech-to-text, reviewed before sending.\nNeither is connected in this preview."),
    (166, 177.8, "He still has questions. One day, if he chooses, he can offer\nsomeone else one honest part of what he tried—and keep the rest private."),
]

def stamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    whole, ms = divmod(ms, 1000)
    return f"{hours:02}:{minutes:02}:{whole:02},{ms:03}"

if not SOURCE.exists():
    raise SystemExit(f"Missing full React capture: {SOURCE}")
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")
CAPTIONS.write_text("\n\n".join(f"{n}\n{stamp(start)} --> {stamp(end)}\n{text}" for n, (start, end, text) in enumerate(captions, 1)) + "\n", encoding="utf-8")

voice_files = []
for index, (_, text) in enumerate(lines, 1):
    txt = ROOT / f".narration-{index:02}.txt"
    wav = ROOT / f".narration-{index:02}.wav"
    txt.write_text(text, encoding="utf-8")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"flite=textfile={txt}:voice=slt", "-ac", "1", "-ar", "48000", str(wav)], check=True)
    voice_files.append(wav)

video = (
    f"[0:v]trim=start=1.2,setpts=PTS-STARTPTS,setpts={SPEED}*PTS,tpad=start_duration=1.44:start_mode=clone,scale=1600:900:flags=lanczos,pad=1920:1080:160:0:color=0xf7f6f2,"
    "tpad=stop_mode=clone:stop_duration=7.12[base];"
    "[base]drawbox=x=160:y=918:w=1600:h=63:color=0xfffefa@0.96:t=fill:enable=between(t\\,0\\,14)[b1];"
    "[b1]drawbox=x=160:y=918:w=1600:h=63:color=0x315f52:t=2:enable=between(t\\,0\\,14)[b2];"
    "[b2]drawtext=fontfile=" + BOLD + ":text='Arjun feels ungrateful asking for room to think.'"
    ":fontcolor=0x202722:fontsize=28:x=190:y=934:enable=between(t\\,0\\,14)[titled];"
    "[titled]subtitles=" + str(CAPTIONS) + ":force_style='FontName=DejaVu Sans,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=18,Alignment=2'[vout]"
)
video = video.replace(
    "[base]drawbox=",
    "[1:v]drawbox=x=0:y=0:w=1600:h=60:color=0x202722:t=fill,drawtext=fontfile=" + BOLD + ":text='EDITORIAL STATUS CARD - NOT AN APP INTERACTION':fontcolor=white:fontsize=20:x=28:y=18,scale=1600:900[arch];[base][arch]overlay=160:0:enable=between(t\\,144\\,166)[cut];[cut]drawbox=",
)
filters = [video]
for index, (start, _) in enumerate(lines):
    delay = round(start * 1000)
    filters.append(f"[{index + 2}:a]adelay={delay}|{delay}[a{index}]")
mix = "".join(f"[a{index}]" for index in range(len(voice_files)))
filters.append(f"{mix}amix=inputs={len(voice_files)}:duration=longest:normalize=0,volume=0.8,apad=whole_dur={END},atrim=0:{END}[aout]")
args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE), "-loop", "1", "-framerate", "30", "-t", "22", "-i", str(ARCH_CARD)]
for wav in voice_files:
    args.extend(["-i", str(wav)])
args.extend([
    "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
    "-t", str(END), "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUTPUT),
])
subprocess.run(args, check=True)
for path in [*voice_files, *(p.with_suffix(".txt") for p in voice_files)]:
    path.unlink(missing_ok=True)
print(f"Rendered {OUTPUT} at {END}s from full React footage ({SOURCE.stat().st_size} bytes).")

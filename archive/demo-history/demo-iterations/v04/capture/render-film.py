#!/usr/bin/env python3
"""Edit v04 from committed v01 React footage; no UI, model, or trace generation."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "v01" / "capture" / "react-capture.webm"
OUTPUT = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = ROOT / "narration.txt"
VIDEO_END = 178.0
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

lines = [
    (0.0, "Arjun feels ungrateful asking his family for room to think."),
    (5.3, "Harmonise helps him work out what he needs before he decides what to do."),
    (13.1, "On day one, he leaves unresolved. Four days later, he corrects the story: his parents, not separating. A transcript is a draft, and he edits the words."),
    (39.6, "That correction changes the question. A legal result misses the need. Family experiences may fit because they describe pressure without prescribing an outcome."),
    (60.1, "On Day 9, he drafts what to say. A week later, he speaks with his father. They argue. The next step is listening, not calling it progress."),
    (75.6, "This group is history, not a live room: different accounts, an unanswered question, a named host. Reading remains a choice."),
    (96.5, "Ravi's account overlaps, but his family and support differ."),
    (100.5, "Ravi accepts questions in the group only; there is no private-message option."),
    (105.5, "Arjun reviews the exact group, alias and question. The checkbox stays unchecked; nothing is sent."),
    (114.5, "Ravi's prepared reply is a fictional sample, not a live message."),
    (122.0, "Six weeks later, Dev asks a question Arjun once asked. Arjun can share what he tried, including what went badly. He remains a seeker here; one story does not make him an expert."),
    (150.1, "This sample screen records a fictional decision in this browser. No report reaches staff, and access is not restricted here."),
    (162.6, "Planned Meta Muse Spark — dialogue and structured, correctable context."),
    (167.8, "Planned Muse Voice Transcribe — optional speech-to-text, reviewed before sending."),
    (172.2, "A place to think, connect, and someday help someone else."),
]

captions = [
    (0.0, 5.3, "Arjun feels ungrateful asking his family for room to think."),
    (5.3, 12.8, "Harmonise helps him work out what he needs\nbefore he decides what to do."),
    (13.1, 24.5, "On day one, he leaves unresolved. Four days later,\nhe corrects the story: his parents, not separating."),
    (24.5, 38.4, "A transcript is a draft,\nand he edits the words."),
    (39.6, 48.4, "That correction changes the question.\nA legal result misses the need."),
    (48.4, 58.8, "Family experiences may fit because they describe pressure\nwithout prescribing an outcome."),
    (60.1, 67.3, "On Day 9, he drafts what to say.\nA week later, he speaks with his father."),
    (67.3, 74.7, "They argue. The next step is listening,\nnot calling it progress."),
    (75.6, 84.4, "This group is history, not a live room:\ndifferent accounts, an unanswered question, a named host."),
    (84.4, 94.2, "Reading remains a choice."),
    (96.5, 100.5, "Ravi's account overlaps,\nbut his family and support differ."),
    (100.5, 105.5, "Ravi accepts questions in the group only;\nthere is no private-message option."),
    (105.5, 114.2, "Arjun reviews the exact group, alias and question.\nThe checkbox stays unchecked; nothing is sent."),
    (114.5, 121.5, "Ravi's prepared reply is a fictional sample,\nnot a live message."),
    (122.0, 136.0, "Six weeks later, Dev asks a question Arjun once asked.\nArjun can share what he tried, including what went badly."),
    (136.0, 149.5, "He remains a seeker here;\none story does not make him an expert."),
    (150.1, 162.0, "This sample screen records a fictional decision in this browser.\nNo report reaches staff, and access is not restricted here."),
    (162.6, 167.8, "Planned Meta Muse Spark — dialogue and structured, correctable context."),
    (167.8, 171.9, "Planned Muse Voice Transcribe — optional speech-to-text,\nreviewed before sending."),
    (172.2, 177.8, "A place to think, connect,\nand someday help someone else."),
]

def ts(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    seconds_int, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{seconds_int:02},{millis:03}"

if not SOURCE.exists():
    raise SystemExit(f"Missing unchanged React capture: {SOURCE}")
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")
CAPTIONS.write_text("\n\n".join(f"{i}\n{ts(start)} --> {ts(end)}\n{text}" for i, (start, end, text) in enumerate(captions, 1)) + "\n", encoding="utf-8")

voice_files = []
for index, (_, text) in enumerate(lines, 1):
    txt = ROOT / f".narration-{index:02}.txt"
    wav = ROOT / f".narration-{index:02}.wav"
    txt.write_text(text, encoding="utf-8")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"flite=textfile={txt}:voice=slt", "-ac", "1", "-ar", "48000", str(wav)], check=True)
    voice_files.append(wav)

labels = {
    "hook-line-1": "Arjun feels ungrateful asking his family for room to think.",
    "hook-line-2": "Harmonise helps him work out what he needs before he decides what to do.",
    "contrast-label": "ILLUSTRATIVE CONTRAST · FICTIONAL CASE",
    "contrast-advice": "Advice: decide now",
    "contrast-need": "What Arjun needs: room to explain what’s happening at home.",
    "spark-plan": "Planned Meta Muse Spark — dialogue and structured, correctable context",
    "voice-plan": "Planned Muse Voice Transcribe — optional speech-to-text, reviewed before sending.",
}
overlay_paths = {}
for key, text in labels.items():
    path = ROOT / f".overlay-{key}.txt"
    path.write_text(text, encoding="utf-8")
    overlay_paths[key] = path

args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE)]
for wav in voice_files:
    args.extend(["-i", str(wav)])
video = (
    "[0:v]trim=start=1.2,setpts=PTS-STARTPTS,setpts=0.96*PTS,split=2[full][zoom];"
    "[full]scale=1472:828:flags=lanczos,pad=1920:1080:224:0:color=0xf7f6f2[base];"
    "[zoom]crop=1240:697:180:0,scale=1700:956:flags=lanczos,pad=1920:1080:110:0:color=0xf7f6f2[zoomed];"
    "[base][zoomed]overlay=0:0:enable=between(t\\,104\\,114.5)[stage]"
)
opening = [
    "drawbox=x=224:y=828:w=1472:h=68:color=0xffffff:t=fill:enable=between(t\\,0\\,14)",
    "drawbox=x=224:y=828:w=1472:h=68:color=0x315f52:t=2:enable=between(t\\,0\\,14)",
    "drawtext=fontfile=" + BOLD + ":textfile=" + str(overlay_paths["hook-line-1"]) + ":fontcolor=0x202722:fontsize=28:x=244:y=836:enable=between(t\\,0\\,14)",
    "drawtext=fontfile=" + BOLD + ":textfile=" + str(overlay_paths["hook-line-2"]) + ":fontcolor=0x202722:fontsize=28:x=244:y=868:enable=between(t\\,0\\,14)",
    "drawtext=fontfile=" + BOLD + ":textfile=" + str(overlay_paths["contrast-label"]) + ":fontcolor=0x315f52:fontsize=12:x=224:y=899:enable=between(t\\,0\\,14)",
    "drawbox=x=224:y=916:w=704:h=34:color=0xf4efe5:t=fill:enable=between(t\\,0\\,14)",
    "drawbox=x=224:y=916:w=704:h=34:color=0x8e754b:t=1:enable=between(t\\,0\\,14)",
    "drawbox=x=944:y=916:w=752:h=34:color=0xeaf2ed:t=fill:enable=between(t\\,0\\,14)",
    "drawbox=x=944:y=916:w=752:h=34:color=0x315f52:t=1:enable=between(t\\,0\\,14)",
    "drawtext=fontfile=" + BOLD + ":textfile=" + str(overlay_paths["contrast-advice"]) + ":fontcolor=0x202722:fontsize=15:x=238:y=924:enable=between(t\\,0\\,14)",
    "drawtext=fontfile=" + REGULAR + ":textfile=" + str(overlay_paths["contrast-need"]) + ":fontcolor=0x202722:fontsize=14:x=958:y=924:enable=between(t\\,0\\,14)",
]
planned = [
    "drawbox=x=224:y=839:w=1472:h=42:color=0xffffff:t=fill:enable=between(t\\,162\\,174)",
    "drawbox=x=224:y=839:w=1472:h=42:color=0x315f52:t=2:enable=between(t\\,162\\,174)",
    "drawbox=x=224:y=884:w=1472:h=42:color=0xffffff:t=fill:enable=between(t\\,162\\,174)",
    "drawbox=x=224:y=884:w=1472:h=42:color=0x315f52:t=2:enable=between(t\\,162\\,174)",
    "drawtext=fontfile=" + BOLD + ":textfile=" + str(overlay_paths["spark-plan"]) + ":fontcolor=0x202722:fontsize=22:x=242:y=847:enable=between(t\\,162\\,174)",
    "drawtext=fontfile=" + BOLD + ":textfile=" + str(overlay_paths["voice-plan"]) + ":fontcolor=0x202722:fontsize=22:x=242:y=892:enable=between(t\\,162\\,174)",
]
video += ";" + opening[0] + ";" + opening[1]
# Use a labeled filter chain so draw filters stay ordered after the timed UI overlay.
# Rebuild from [stage], applying opening and architecture labels in order.
video = video.rsplit("[stage]", 1)[0] + "[stage];[stage]" + ",".join(opening + planned)
video += ",subtitles=" + str(CAPTIONS) + ":force_style='FontName=DejaVu Sans,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=18,Alignment=2'[vout]"
# Keep video base stages and audio mix in one filter_complex graph.
filters = [video]
for index, (start, _) in enumerate(lines):
    delay = round(start * 1000)
    filters.append(f"[{index + 1}:a]adelay={delay}|{delay}[a{index}]")
mix = "".join(f"[a{index}]" for index in range(len(voice_files)))
filters.append(f"{mix}amix=inputs={len(voice_files)}:duration=longest:normalize=0,volume=0.75,apad=whole_dur={VIDEO_END},atrim=0:{VIDEO_END}[aout]")
args.extend([
    "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
    "-t", str(VIDEO_END), "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUTPUT),
])
subprocess.run(args, check=True)
for path in [*voice_files, *(p.with_suffix(".txt") for p in voice_files), *overlay_paths.values()]:
    path.unlink(missing_ok=True)
print(f"Wrote {OUTPUT} from unchanged v01 capture with direct titles/crops.")

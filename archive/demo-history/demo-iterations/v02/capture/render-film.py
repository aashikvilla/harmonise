#!/usr/bin/env python3
"""Render v02 from the unchanged, recorded v01 React interaction capture."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "v01" / "capture" / "react-capture.webm"
OUTPUT = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = ROOT / "narration.txt"
VIDEO_END = 178.0

lines = [
    (0.0, "Arjun can't tell his family what he wants without feeling ungrateful. Advice came before he could explain."),
    (13.1, "On day one, he leaves unresolved. Four days later, he corrects the story: his parents, not separating. A transcript is a draft, and he edits the words."),
    (39.6, "That correction changes the question. A legal result misses the need. Family experiences may fit because they describe pressure without prescribing an outcome."),
    (60.1, "On Day 9, he drafts what to say. A week later, he speaks with his father. They argue. The next step is listening, not calling it progress."),
    (75.6, "This group is history, not a live room: different accounts, an unanswered question, a named host. Reading remains a choice."),
    (96.5, "Ravi's account overlaps, but his family and support differ. Arjun asks one narrow group question. He reviews the audience, alias and exact words; nothing is sent."),
    (120.6, "Six weeks later, Dev asks a question Arjun once asked. Arjun can share what he tried, including what went badly. He remains a seeker here; one story does not make him an expert."),
    (150.1, "This sample screen records a fictional decision in this browser. No report reaches staff, and access is not restricted here."),
    (162.6, "Muse Spark is a plan for dialogue and structured context. Muse Voice Transcribe offers optional speech-to-text, reviewed before sending. People decide moderation."),
    (172.2, "A place to think, connect, and someday help someone else."),
]

captions = [
    (0.0, 6.2, "Arjun can’t tell his family what he wants\nwithout feeling ungrateful."),
    (6.2, 12.7, "Advice came before he could explain."),
    (13.1, 24.5, "On day one, he leaves unresolved. Four days later,\nhe corrects the story: his parents, not separating."),
    (24.5, 38.4, "A transcript is a draft,\nand he edits the words."),
    (39.6, 48.4, "That correction changes the question.\nA legal result misses the need."),
    (48.4, 58.8, "Family experiences may fit because they describe pressure\nwithout prescribing an outcome."),
    (60.1, 67.3, "On Day 9, he drafts what to say.\nA week later, he speaks with his father."),
    (67.3, 74.7, "They argue. The next step is listening,\nnot calling it progress."),
    (75.6, 84.4, "This group is history, not a live room:\ndifferent accounts, an unanswered question, a named host."),
    (84.4, 94.2, "Reading remains a choice."),
    (96.5, 107.2, "Ravi's account overlaps, but his family and support differ.\nArjun asks one narrow group question."),
    (107.2, 119.0, "He reviews the audience, alias and exact words;\nnothing is sent."),
    (120.6, 134.0, "Six weeks later, Dev asks a question Arjun once asked.\nArjun can share what he tried, including what went badly."),
    (134.0, 149.5, "He remains a seeker here;\none story does not make him an expert."),
    (150.1, 162.0, "This sample screen records a fictional decision in this browser.\nNo report reaches staff, and access is not restricted here."),
    (162.6, 167.8, "Muse Spark is a plan for dialogue\nand structured context."),
    (167.8, 171.9, "Muse Voice Transcribe offers optional speech-to-text,\nreviewed before sending. People decide moderation."),
    (172.2, 177.8, "A place to think, connect,\nand someday help someone else."),
]


def ts(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    seconds_int, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{seconds_int:02},{millis:03}"

if not SOURCE.exists():
    raise SystemExit(f"Missing committed v01 React recording: {SOURCE}")
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")
CAPTIONS.write_text("\n\n".join(f"{i}\n{ts(start)} --> {ts(end)}\n{text}" for i, (start, end, text) in enumerate(captions, 1)) + "\n", encoding="utf-8")

voice_files = []
for index, (_, text) in enumerate(lines, 1):
    text_path = ROOT / f".narration-{index:02}.txt"
    audio_path = ROOT / f".narration-{index:02}.wav"
    text_path.write_text(text, encoding="utf-8")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"flite=textfile={text_path}:voice=slt", "-ac", "1", "-ar", "48000", str(audio_path)], check=True)
    voice_files.append(audio_path)

args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE)]
for voice in voice_files:
    args.extend(["-i", str(voice)])
filters = ["[0:v]trim=start=1.2,setpts=PTS-STARTPTS,setpts=0.96*PTS,scale=1650:928:flags=lanczos,pad=1920:1080:135:0:color=0xf7f6f2,subtitles=" + str(CAPTIONS) + ":force_style='FontName=DejaVu Sans,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=18,Alignment=2'[vout]"]
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
for path in [*voice_files, *(p.with_suffix(".txt") for p in voice_files)]:
    path.unlink(missing_ok=True)
print(f"Wrote {OUTPUT} from v01 Playwright footage with Flite narration and caption-safe framing.")

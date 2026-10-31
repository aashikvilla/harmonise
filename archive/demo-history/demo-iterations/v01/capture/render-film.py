#!/usr/bin/env python3
"""Build the v01 film from a Playwright React recording plus offline Flite narration."""

from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "capture"
SOURCE_VIDEO = CAPTURE / "react-capture.webm"
OUTPUT_VIDEO = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = CAPTURE / "narration.txt"

lines = [
    (0.5, "At home, everyone wanted an answer. Arjun could not say what he wanted without feeling ungrateful. Advice arrived before he could explain."),
    (14.5, "On day one, he leaves unresolved. Four days later, he corrects the story: his parents, not separating. A transcript is a draft, and he edits the words."),
    (41.0, "That correction changes the question. A legal result misses the need. Family experiences may fit because they describe pressure without prescribing an outcome."),
    (61.5, "On Day 9, he drafts what to say. A week later, he speaks with his father. They argue. The next step is listening, not calling it progress."),
    (77.0, "This group is history, not a live room: different accounts, an unanswered question, a named host. Reading remains a choice."),
    (98.0, "Ravi's account overlaps, but his family and support differ. Arjun asks one narrow group question. He reviews the audience, alias and exact words; nothing is sent."),
    (122.0, "Six weeks later, Dev asks a question Arjun once asked. Arjun can share what he tried, including what went badly. He remains a seeker here; one story does not make him an expert."),
    (151.5, "A report opens a restricted workflow. This preview records a sample moderator decision; no real post or person is involved."),
    (164.0, "Muse Spark is a plan for dialogue and structured context. Muse Voice Transcribe offers optional speech-to-text, reviewed before sending. People decide moderation."),
    (173.7, "A place to think, connect, and someday help someone else."),
]

captions = [
    (0.5, 5.4, "At home, everyone wanted an answer."),
    (5.4, 13.7, "Arjun could not say what he wanted without feeling ungrateful.\nAdvice arrived before he could explain."),
    (14.5, 25.5, "On day one, he leaves unresolved. Four days later, he corrects the story:\nhis parents, not separating."),
    (25.5, 39.6, "A transcript is a draft,\nand he edits the words."),
    (41.0, 49.8, "That correction changes the question.\nA legal result misses the need."),
    (49.8, 59.8, "Family experiences may fit because they describe pressure\nwithout prescribing an outcome."),
    (61.5, 69.1, "On Day 9, he drafts what to say.\nA week later, he speaks with his father."),
    (69.1, 76.7, "They argue. The next step is listening,\nnot calling it progress."),
    (77.0, 85.8, "This group is history, not a live room:\ndifferent accounts, an unanswered question, a named host."),
    (85.8, 95.8, "Reading remains a choice."),
    (98.0, 109.1, "Ravi's account overlaps, but his family and support differ.\nArjun asks one narrow group question."),
    (109.1, 120.8, "He reviews the audience, alias and exact words;\nnothing is sent."),
    (122.0, 136.0, "Six weeks later, Dev asks a question Arjun once asked.\nArjun can share what he tried, including what went badly."),
    (136.0, 150.8, "He remains a seeker here;\none story does not make him an expert."),
    (151.5, 157.5, "A report opens a restricted workflow."),
    (157.5, 163.4, "This preview records a sample moderator decision;\nno real post or person is involved."),
    (164.0, 169.0, "Muse Spark is a plan for dialogue\nand structured context."),
    (169.0, 173.5, "Muse Voice Transcribe offers optional speech-to-text,\nreviewed before sending. People decide moderation."),
    (173.7, 179.0, "A place to think, connect,\nand someday help someone else."),
]


def ts(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    seconds_int, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{seconds_int:02},{millis:03}"


CAPTURE.mkdir(parents=True, exist_ok=True)
if not SOURCE_VIDEO.exists():
    raise SystemExit(f"Missing Playwright footage: {SOURCE_VIDEO}")
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")
CAPTIONS.write_text("\n\n".join(f"{i}\n{ts(start)} --> {ts(end)}\n{text}" for i, (start, end, text) in enumerate(captions, 1)) + "\n", encoding="utf-8")

voice_files = []
for index, (_, text) in enumerate(lines):
    text_path = CAPTURE / f"narration-{index + 1:02}.txt"
    audio_path = CAPTURE / f"narration-{index + 1:02}.wav"
    text_path.write_text(text, encoding="utf-8")
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
        f"flite=textfile={text_path}:voice=slt", "-ac", "1", "-ar", "48000", str(audio_path),
    ], check=True)
    voice_files.append(audio_path)

args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE_VIDEO)]
for voice in voice_files:
    args.extend(["-i", str(voice)])
filters = []
for index, (start, _) in enumerate(lines):
    delay = round(start * 1000)
    filters.append(f"[{index + 1}:a]adelay={delay}|{delay}[v{index}]")
mix_inputs = "".join(f"[v{index}]" for index in range(len(voice_files)))
filters.append(f"{mix_inputs}amix=inputs={len(voice_files)}:duration=longest:normalize=0,volume=0.75,apad=whole_dur=179,atrim=0:179[aout]")
filter_graph = ";".join(filters)
subtitle_filter = f"subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=42,Alignment=2'"
args.extend([
    "-filter_complex", filter_graph,
    "-map", "0:v:0", "-map", "[aout]",
    "-vf", f"setpts=0.96*PTS,scale=1920:1080:flags=lanczos,{subtitle_filter}",
    "-t", "179", "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUTPUT_VIDEO),
])
subprocess.run(args, check=True)
print(f"Wrote {OUTPUT_VIDEO} with offline Flite synthetic narration and captions.")

#!/usr/bin/env python3
"""Render v06 from the corrected full Playwright capture."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "capture" / "react-capture.webm"
TIMELINE = ROOT / "capture" / "timeline.json"
OUTPUT = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = ROOT / "narration.txt"
TRIM_START = 0.96
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def duration(path: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)
    ], text=True)
    return float(out.strip())

raw_duration = duration(SOURCE)
END = raw_duration - TRIM_START
if not 176 <= END <= 179:
    raise SystemExit(f"Expected a 176–179 second film, got {END:.3f}s")
scene_rows = json.loads(TIMELINE.read_text(encoding="utf-8"))
scene = {row["name"]: float(row["seconds"]) for row in scene_rows}

def at(name: str) -> float:
    return scene[name] - TRIM_START

# Every sentence is synthetic offline narration. The opening line states the
# audience and promise. Later narration stays attached to the captured UI state.
lines = [
    (0.0, "When family expectations make it hard to know what you want, Harmonise gives you private room to think before you decide."),
    (at("02-talk-choice"), "You can talk, browse, or leave the question unanswered."),
    (at("03-one-line-local-response"), "He starts with one sentence. The reply is a prepared local example; no model is connected."),
    (at("04-tentative-context"), "A possible reading appears. It is a draft, not a verdict."),
    (at("05-not-quite") - 0.8, "He can choose Not quite, then Edit in my words."),
    (at("06-user-correction-draft"), "He replaces it with what he means: room to think before deciding what to say."),
    (at("07-correction-and-local-rule"), "His corrected words appear. He confirms what fits, then chooses to hear experiences."),
    (at("08-user-selected-family-result"), "The family path follows his choice; it is not an automatic model rewrite."),
    (at("09-ravi-group-only"), "Ravi's fictional story shares one pressure and shows where their lives differ."),
    (at("10-ravi-exact-consent"), "Ravi accepts replies in the group only, with no private-message option. Arjun reviews the exact audience, alias, and question; consent remains unchecked, and nothing is sent."),
    (at("11-prepared-ravi-sample"), "Ravi's response is a prepared illustrative sample, not a live message."),
    (at("12-dev-contribution-preview"), "Later, Dev asks a fictional question. Arjun can share one bounded part of what he tried, including what went badly."),
    (at("13-local-contribution-posted"), "The private conversation is excluded. This local example is not published or visible to other people."),
    (at("14-professional-support-caveat"), "Professional support is separate. No directory or credential checks are connected; no provider is verified or bookable here."),
    (at("15-planned-architecture-status"), "Planned Meta Muse Spark for dialogue and correction. Planned Muse Voice Transcribe for optional, reviewed speech-to-text. Both are disconnected here."),
    (at("16-final-bounded-choice"), "Arjun still has questions. If he chooses, one honest part of his experience might help someone else feel less alone."),
    (at("16-final-bounded-choice") + 8.5, "Consent stays unchecked. Nothing is sent unless he chooses. He can keep or discard this draft; the choice remains his."),
]

def stamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    whole, ms = divmod(ms, 1000)
    return f"{hours:02}:{minutes:02}:{whole:02},{ms:03}"

def wrap_caption(text: str, width: int = 66) -> str:
    lines_out = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and len(candidate) > width:
            lines_out.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines_out.append(current)
    return "\n".join(lines_out)

voice_files = []
voice_durations = []
for index, (_, text) in enumerate(lines, 1):
    txt = ROOT / f".narration-{index:02}.txt"
    wav = ROOT / f".narration-{index:02}.wav"
    txt.write_text(text, encoding="utf-8")
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
        f"flite=textfile={txt}:voice=slt", "-ac", "1", "-ar", "48000", str(wav)
    ], check=True)
    voice_files.append(wav)
    voice_durations.append(duration(wav))

# Sidecar cues use the full spoken line, are sequential, and leave a small gap.
cue_rows = []
for index, ((start, text), voice_duration) in enumerate(zip(lines, voice_durations)):
    end_limit = lines[index + 1][0] - 0.2 if index + 1 < len(lines) else END
    spoken_end = start + voice_duration + 0.7
    end = min(end_limit, spoken_end, END)
    if end <= start or start + voice_duration > end_limit + 0.15:
        raise SystemExit(f"Narration line {index + 1} overruns its next beat: {start:.2f}s + {voice_duration:.2f}s")
    cue_text = wrap_caption(text)
    cue_rows.append((start, end, cue_text))
for left, right in zip(cue_rows, cue_rows[1:]):
    if left[1] >= right[0]:
        raise SystemExit("Generated SRT cues overlap")
CAPTIONS.write_text(
    "\n\n".join(f"{n}\n{stamp(start)} --> {stamp(end)}\n{text}" for n, (start, end, text) in enumerate(cue_rows, 1)) + "\n",
    encoding="utf-8",
)
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")

consent_start = at("10-ravi-exact-consent")
consent_end = at("11-prepared-ravi-sample") - 0.8
choice_start = at("16-final-bounded-choice")
architecture_start = at("15-planned-architecture-status")
architecture_end = choice_start

overlay_paths = {}
for name, text in {
    "editorial": "EDITORIAL STATUS CARD - NOT AN APP INTERACTION",
}.items():
    path = ROOT / f".{name}.txt"
    path.write_text(text, encoding="utf-8")
    overlay_paths[name] = path

video = (
    f"[0:v]trim=start={TRIM_START},setpts=PTS-STARTPTS,split=3[full][cz][fz];"
    "[full]scale=1600:900:flags=lanczos,pad=1920:1080:160:0:color=0xf7f6f2[base];"
    "[cz]crop=1520:760:40:0,scale=1800:900:flags=lanczos,pad=1920:1080:60:0:color=0xf7f6f2[consent];"
    "[fz]crop=1520:760:40:0,scale=1800:900:flags=lanczos,pad=1920:1080:60:0:color=0xf7f6f2[final];"
    f"[base][consent]overlay=0:0:enable=between(t\\,{consent_start:.3f}\\,{consent_end:.3f})[c1];"
    f"[c1][final]overlay=0:0:enable=between(t\\,{choice_start:.3f}\\,{END:.3f})[c2];"
    f"[c2]drawbox=x=160:y=0:w=1600:h=56:color=0x202722:t=fill:enable=between(t\\,{architecture_start:.3f}\\,{architecture_end:.3f})[b4];"
    f"[b4]drawtext=fontfile={BOLD}:textfile={overlay_paths['editorial']}:fontcolor=white:fontsize=20:x=188:y=17:enable=between(t\\,{architecture_start:.3f}\\,{architecture_end:.3f})[b5];"
    f"[b5]subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=10,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=8,Alignment=2'[vout]"
)
filters = [video]
for index, (start, _) in enumerate(lines):
    delay = round(start * 1000)
    filters.append(f"[{index + 1}:a]adelay={delay}|{delay}[a{index}]")
mix = "".join(f"[a{index}]" for index in range(len(voice_files)))
filters.append(f"{mix}amix=inputs={len(voice_files)}:duration=longest:normalize=0,volume=0.8,apad=whole_dur={END:.3f},atrim=0:{END:.3f}[aout]")

args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE)]
for wav in voice_files:
    args.extend(["-i", str(wav)])
args.extend([
    "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
    "-t", f"{END:.3f}", "-r", "30", "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUTPUT),
])
subprocess.run(args, check=True)
for path in [*voice_files, *(p.with_suffix(".txt") for p in voice_files), *overlay_paths.values()]:
    path.unlink(missing_ok=True)
print(f"Rendered {OUTPUT}; raw={raw_duration:.3f}s, output={END:.3f}s, consent crop={consent_start:.3f}-{consent_end:.3f}s, final choice={choice_start:.3f}-{END:.3f}s.")

#!/usr/bin/env python3
"""Render v09 from the new actual React browser recording."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "capture" / "react-capture.webm"
TIMELINE = ROOT / "capture" / "timeline.json"
OUTPUT = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = ROOT / "narration.txt"
TRIM_START = 1.212  # discard the page-load white frame; first retained frame is the captured entry screen
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def probe(path: Path, fields: str, selector: str = "format") -> str:
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", f"{selector}={fields}", "-of", "default=nw=1:nk=1", str(path)], text=True)
    return out.strip()

raw_duration = float(probe(SOURCE, "duration"))
VIDEO_END = raw_duration - TRIM_START
END = min(179.0, VIDEO_END)
VIDEO_PAD = max(0.5, END - VIDEO_END)
if not 176 <= END <= 179:
    raise SystemExit(f"Expected a 176–179 second film, got {END:.3f}s")
scene_rows = json.loads(TIMELINE.read_text(encoding="utf-8"))
scene = {row["name"]: float(row["seconds"]) for row in scene_rows}
def at(name: str) -> float:
    return scene[name] - TRIM_START

lines = [
    (0.0, "Arjun cannot tell his family what he wants without feeling ungrateful."),
    (4.6, "Planned Muse Spark could organize a thought Arjun can correct."),
    (at("03-first-interaction-local-rule"), "This prepared reply uses local rules. No model is connected."),
    (at("04-user-correction-draft"), "The first thought misses his situation. Arjun corrects it in his own words."),
    (at("05-correction-and-planned-roles"), "The updated understanding stays editable; Arjun can change or set it aside."),
    (at("06-day-4-thread"), "Day four: one peer describes needing time while caring about family."),
    (at("07-day-9-thread"), "Day nine: another conversation ends in an argument. No one chooses for Arjun."),
    (at("07-day-9-thread") + 5.5, "The fictional host asks people to listen and speak from experience."),
    (at("08-prepared-moderator-triage"), "A prepared moderation example appears briefly. No report was sent."),
    (at("09-day-16-open-question"), "Day sixteen: Dev's side question has no replies. There is no promised resolution."),
    (at("10-ravi-original-question-preview"), "Ravi accepts group replies only. Arjun sees the audience, alias, and exact question."),
    (at("11-ravi-edited-exact-audience-preview"), "He edits the question. Private context stays excluded, consent off, sending disabled."),
    (at("12-professional-support-caveat"), "No professional provider is verified or bookable here."),
    (at("12-professional-support-caveat") + 5.0, "He returns to the prepared peer perspectives."),
    (at("13-selected-private-takeaway"), "He keeps one thought privately: wanting a conversation without someone deciding for him."),
    (at("14-final-bounded-choice"), "He chooses an optional group draft for Dev and edits the exact words."),
    (at("15-composed-agency-close"), "His private takeaway remains his own. The contribution is still optional."),
    (at("15-composed-agency-close") + 8.0, "Nothing is sent without consent. This fictional local draft cannot be sent here."),
    (at("15-composed-agency-close") + 17.4, "Arjun can leave the draft here. No publication or reply is shown."),
]

def stamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    whole, ms = divmod(ms, 1000)
    return f"{hours:02}:{minutes:02}:{whole:02},{ms:03}"

def wrap_caption(text: str, width: int = 66) -> str:
    out, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and len(candidate) > width:
            out.append(current)
            current = word
        else:
            current = candidate
    if current:
        out.append(current)
    return "\\N".join(out)

voices, voice_durations = [], []
for i, (_, text) in enumerate(lines, 1):
    t = ROOT / f".narration-{i:02}.txt"
    wav = ROOT / f".narration-{i:02}.wav"
    t.write_text(text, encoding="utf-8")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"flite=textfile={t}:voice=slt", "-ac", "1", "-ar", "48000", str(wav)], check=True)
    voices.append(wav)
    voice_durations.append(float(probe(wav, "duration")))

cues = []
for i, ((start, text), length) in enumerate(zip(lines, voice_durations)):
    limit = lines[i + 1][0] - 0.2 if i + 1 < len(lines) else END
    end = min(start + length + 0.55, limit, END)
    if start + length > limit + 0.1 or end <= start:
        raise SystemExit(f"Narration line {i + 1} overruns next beat ({start:.2f}s + {length:.2f}s; limit {limit:.2f}s)")
    cues.append((start, end, wrap_caption(text)))
if any(left[1] >= right[0] for left, right in zip(cues, cues[1:])):
    raise SystemExit("Generated caption timings overlap")
CAPTIONS.write_text("\n\n".join(f"{i}\n{stamp(start)} --> {stamp(end)}\n{text.replace(chr(92)+'N', chr(10))}" for i, (start, end, text) in enumerate(cues, 1)) + "\n", encoding="utf-8")
TRANSCRIPT.write_text("\n\n".join(t for _, t in lines) + "\n", encoding="utf-8")

# Focus the timeline and final choice; crop only existing React footage so the
# caption safe area does not cover day/role labels or sharing controls.
entry_end = at("02-start-privately")
draft_start = at("04-user-correction-draft")
corrected_start = at("05-correction-and-planned-roles")
thread_start = at("06-day-4-thread")
thread_end = at("10-ravi-original-question-preview")
ravi_start = at("10-ravi-original-question-preview")
ravi_end = at("12-professional-support-caveat")
final_start = at("14-final-bounded-choice")
close_start = at("15-composed-agency-close")
video = (
    f"[0:v]trim=start={TRIM_START},setpts=PTS-STARTPTS,split=8[base][entry][draft][corrected][thread][ravi][final][close];"
    "[base]scale=1920:1080:flags=lanczos[baseout];"
    "[entry]crop=1600:700:0:0,scale=1920:840:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[entryout];"
    "[draft]crop=1600:800:0:100,scale=1920:960:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[draftout];"
    "[corrected]crop=1600:700:0:0,scale=1920:840:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[correctedout];"
    "[thread]crop=1600:670:0:230,scale=1920:804:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[threadout];"
    "[ravi]crop=1600:790:0:0,scale=1920:948:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[raviout];"
    "[final]crop=1600:800:0:100,scale=1920:960:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[finalout];"
    "[close]crop=1600:760:0:100,scale=1920:912:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[closeout];"
    f"[baseout][entryout]overlay=0:0:enable='between(t,0,{entry_end:.3f})'[v1];"
    f"[v1][draftout]overlay=0:0:enable='between(t,{draft_start:.3f},{corrected_start:.3f})'[v2];"
    f"[v2][correctedout]overlay=0:0:enable='between(t,{corrected_start:.3f},{thread_start:.3f})'[v3];"
    f"[v3][threadout]overlay=0:0:enable='between(t,{thread_start:.3f},{thread_end:.3f})'[v4];"
    f"[v4][raviout]overlay=0:0:enable='between(t,{ravi_start:.3f},{ravi_end:.3f})'[v5];"
    f"[v5][finalout]overlay=0:0:enable='between(t,{final_start:.3f},{close_start:.3f})'[v6];"
    f"[v6][closeout]overlay=0:0:enable='between(t,{close_start:.3f},{END:.3f})'[v7];"
    f"[v7]setpts=PTS-STARTPTS,fps=30,subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=10,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=10,Alignment=2',tpad=stop_mode=clone:stop_duration=1,trim=end_frame={int(END*30)},setpts=N/(30*TB)[vout]"
)
filters = [video]
for i, (start, _) in enumerate(lines):
    ms = round(start * 1000)
    filters.append(f"[{i + 1}:a]adelay={ms}|{ms}[a{i}]")
filters.append("".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:duration=longest:normalize=0,volume=0.8,apad=whole_dur={END:.3f},atrim=0:{END:.3f}[aout]")
args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE)]
for wav in voices:
    args.extend(["-i", str(wav)])
args.extend(["-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]", "-t", f"{END:.3f}", "-r", "30", "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(OUTPUT)])
subprocess.run(args, check=True)
for path in voices:
    path.unlink(missing_ok=True)
    path.with_suffix(".txt").unlink(missing_ok=True)
print(f"Rendered {OUTPUT}; raw={raw_duration:.3f}s, output={END:.3f}s, cues={len(cues)}.")

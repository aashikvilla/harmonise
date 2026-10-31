#!/usr/bin/env python3
"""Edit a fresh Playwright React recording into the v12 film."""
from pathlib import Path
import json
import os
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "capture" / "react-capture.webm"
TIMELINE = ROOT / "capture" / "timeline.json"
OUTPUT = ROOT / "demo.mp4"
CAPTIONS = ROOT / "captions.srt"
TRANSCRIPT = ROOT / "narration.txt"
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Source intervals are seconds in the newly captured React WebM. Each output
# shot is <=4.3s; the edit moves attention through real UI states.
shots = [
    # Human opening: close line, pull back to the full private-first screen,
    # then show the real Start privately transition and prepared reply.
    ("hook", 1.247, 4.247, 3.0, "entry_close"),
    ("entry", 4.247, 7.404, 3.157, "entry_pullback"),
    ("start", 7.404, 10.651, 3.247, "conversation_full"),
    ("reply", 10.651, 13.4, 2.749, "reply_focus"),
    ("reply", 13.4, 16.247, 2.847, "reply_lower"),
    # Causal correction: local reply, explicit rejection, typed edit, changed reflection.
    ("correction", 16.247, 18.776, 2.529, "reply_focus"),
    ("not_quite", 18.776, 21.776, 3.0, "not_quite"),
    ("rewrite", 21.776, 25.5, 3.724, "rewrite"),
    ("rewrite", 25.5, 28.955, 3.455, "rewrite_lower"),
    ("changed", 28.955, 32.5, 3.545, "changed"),
    ("changed", 32.5, 36.5, 4.0, "changed_lower"),
    ("changed", 36.5, 40.5, 4.0, "changed"),
    ("changed", 40.5, 44.247, 3.747, "changed_lower"),
    # Same prepared historical thread: Day 4, Day 9/host, brief triage, Day 16 unanswered.
    ("day4", 48.7, 52.7, 4.0, "thread_upper"),
    ("day4", 52.7, 56.7, 4.0, "thread_lower"),
    ("day9", 57.875, 61.875, 4.0, "thread_upper"),
    ("host", 61.875, 65.875, 4.0, "thread_lower"),
    ("triage", 66.044, 68.8, 2.756, "thread_triage"),
    ("day16", 70.191, 74.341, 4.15, "thread_upper"),
    ("day16", 74.341, 78.491, 4.15, "thread_lower"),
    # Exact Ravi preview and its edited group-only text, then support and return.
    ("ravi", 78.491, 82.741, 4.25, "ravi_top"),
    ("ravi", 82.741, 86.991, 4.25, "ravi_form"),
    ("ravi", 86.991, 91.241, 4.25, "ravi_preview"),
    ("ravi", 91.241, 95.491, 4.25, "ravi_form"),
    ("ravi", 95.491, 99.741, 4.25, "ravi_preview"),
    ("ravi", 99.741, 104.007, 4.266, "ravi_form"),
    ("support", 104.007, 107.507, 3.5, "support_top"),
    ("support", 107.507, 111.007, 3.5, "support_full"),
    ("return", 114.343, 116.343, 2.0, "thread_upper"),
    # Private takeaway and optional path: gentle slowed close-ups keep this choice legible.
    ("takeaway", 116.343, 119.577, 4.2, "takeaway_upper"),
    ("takeaway", 119.577, 122.811, 4.2, "takeaway_lower"),
    ("takeaway", 122.811, 126.045, 4.2, "takeaway_upper"),
    ("takeaway", 126.045, 129.279, 4.2, "takeaway_lower"),
    ("takeaway", 129.279, 132.512, 4.2, "takeaway_upper"),
    ("maybe", 132.512, 136.512, 4.0, "takeaway_upper"),
    ("maybe", 136.512, 140.768, 4.256, "takeaway_lower"),
    ("offer", 140.768, 143.768, 3.0, "takeaway_upper"),
    ("offer", 143.768, 146.953, 3.185, "takeaway_lower"),
    ("draft", 146.953, 150.0, 4.25, "draft_upper"),
    ("draft", 150.0, 153.0, 4.25, "draft_lower"),
    ("draft", 153.0, 156.0, 4.25, "draft_upper"),
    ("draft", 156.0, 159.121, 4.25, "draft_lower"),
    # Close on the actual composed choice. The final five seconds retain all boundaries.
    ("close", 159.121, 162.7, 4.2, "close_upper"),
    ("close", 162.7, 166.3, 4.2, "close_lower"),
    ("close", 166.3, 169.9, 4.2, "close_upper"),
    ("close", 169.9, 173.5, 4.2, "close_lower"),
    ("close", 173.5, 177.16, 3.953667, "close_upper"),
]

# Reuse the same story structure while aligning source cuts to this fresh
# Playwright take's measured scene boundaries rather than relying on v11 timing.
REFERENCE_TIMELINE = json.loads((ROOT / ".." / "v11" / "capture" / "timeline.json").read_text())
CURRENT_TIMELINE = json.loads(TIMELINE.read_text())
reference_time = {row["name"]: row["seconds"] for row in REFERENCE_TIMELINE}
current_time = {row["name"]: row["seconds"] for row in CURRENT_TIMELINE}
anchor_for_group = {
    "hook": "01-arjun-fictional-hook", "entry": "01-arjun-fictional-hook",
    "start": "02-start-privately", "reply": "03-prepared-first-reply", "correction": "03-prepared-first-reply",
    "not_quite": "04-not-quite-selected", "rewrite": "05-arjun-rewrites", "changed": "06-changed-editable-reflection",
    "day4": "07-day-4-peer-perspective", "day9": "08-day-9-host-boundary", "host": "08-day-9-host-boundary",
    "triage": "09-prepared-no-report", "day16": "10-day-16-dev-unanswered", "ravi": "11-ravi-before-edit",
    "support": "13-support-caveat", "return": "14-selected-private-takeaway", "takeaway": "14-selected-private-takeaway",
    "maybe": "15-private-only-choice", "offer": "16-optional-offer-selected", "draft": "17-exact-unsent-dev-draft",
    "close": "18-composed-agency-close",
}
shots = [
    (group,
     start + current_time[anchor_for_group[group]] - reference_time[anchor_for_group[group]],
     end + current_time[anchor_for_group[group]] - reference_time[anchor_for_group[group]],
     output_duration, profile)
    for group, start, end, output_duration, profile in shots
]

# Focus windows are all crops of the captured browser viewport. The warm
# bottom pad is reserved for captions and never introduces new interface copy.
profiles = {
    "entry_close": (0, 0, 1600, 520),
    "entry_pullback": (0, 0, 1600, 760),
    "conversation_full": (0, 0, 1600, 900),
    "reply_focus": (0, 70, 1600, 760),
    "reply_lower": (0, 160, 1600, 740),
    "not_quite": (0, 80, 1600, 760),
    "rewrite": (0, 120, 1600, 760),
    "rewrite_lower": (0, 180, 1600, 720),
    "changed": (0, 65, 1600, 750),
    "changed_lower": (0, 140, 1600, 740),
    "thread_upper": (0, 110, 1600, 760),
    "thread_lower": (0, 180, 1600, 720),
    "thread_triage": (0, 150, 1600, 740),
    "ravi_top": (0, 0, 1600, 800),
    "ravi_form": (0, 40, 1600, 800),
    "ravi_preview": (0, 40, 1600, 800),
    "support_top": (0, 0, 1600, 800),
    "support_full": (0, 0, 1600, 900),
    "takeaway_upper": (0, 60, 1600, 760),
    "takeaway_lower": (0, 130, 1600, 740),
    "draft_upper": (0, 40, 1600, 800),
    "draft_lower": (0, 100, 1600, 760),
    "close_upper": (0, 30, 1600, 780),
    "close_lower": (0, 100, 1600, 760),
}

# Scene boundaries in output time are computed from shots, not hardcoded.
groups = {}
position = 0.0
for group, src_start, src_end, out_duration, profile in shots:
    groups.setdefault(group, position)
    position += out_duration
END = position
if not 176 <= END <= 179:
    raise SystemExit(f"Expected a 176–179 second film, got {END:.3f}s")
if any(row[3] > 5.0 for row in shots):
    raise SystemExit("No single shot may hold longer than five seconds")

lines = [
    (0.0, "I can’t tell my family what I want without feeling ungrateful."),
    (4.6, "Private reflection you can correct before exploring peer experiences."),
    (10.0, "What Arjun said; a possibility to check; then he can correct it."),
    (15.0, "Prepared local reply; no model."),
    (18.3, "Arjun chooses Not quite."),
    (21.2, "He edits the words to keep the focus on his parents and his own time."),
    (26.5, "Now the editable reflection changes: no one chooses stay or leave for him."),
    (32.7, "The reflection stays editable; Arjun decides."),
    (36.5, "Planned Muse Spark: organize possibilities for Arjun to review, not decide."),
    (43.0, "Day four: Ravi needs time to choose."),
    (47.2, "Another member sees it differently."),
    (50.0, "Day nine: the conversation stayed difficult."),
    (53.5, "Host: I can listen; I can’t decide for you."),
    (57.7, "Prepared; no report."),
    (60.5, "Day sixteen: Dev’s question still has no replies."),
    (64.4, "Fictional historical examples, prepared and not live."),
    (groups["ravi"], "Ravi accepts group replies only, not private messages."),
    (groups["ravi"] + 4.5, "Arjun edits the exact question; the group preview changes."),
    (groups["ravi"] + 9.0, "Alias and group audience visible; private context excluded."),
    (groups["ravi"] + 13.5, "Consent is unchecked; continue remains disabled."),
    (groups["ravi"] + 18.0, "This preview sends nothing."),
    (groups["support"], "No provider is verified or bookable here."),
    (groups["support"] + 4.0, "Arjun returns to peer perspectives."),
    (groups["takeaway"], "Arjun keeps time to decide for himself."),
    (groups["takeaway"] + 4.5, "He can keep the thought without sharing it."),
    (groups["takeaway"] + 9.0, "A contribution remains optional."),
    (groups["takeaway"] + 13.5, "Nothing about the future is decided for him."),
    (groups["maybe"], "Maybe later means no contribution is required."),
    (groups["maybe"] + 4.0, "The reflection can stay private."),
    (groups["offer"], "Arjun chooses one helpful thing he could offer Dev."),
    (groups["draft"], "He reviews the exact local draft for the fictional group."),
    (groups["draft"] + 4.25, "The alias stays visible; private context is excluded."),
    (groups["draft"] + 8.5, "Consent is unchecked; posting stays disabled."),
    (groups["draft"] + 12.75, "Nothing is sent."),
    (groups["close"], "Arjun keeps the takeaway he chose."),
    (groups["close"] + 4.2, "The Dev draft is optional and limited to one helpful thing."),
    (groups["close"] + 8.4, "Prepared local draft for a fictional group."),
    (groups["close"] + 12.6, "Nothing is sent without consent."),
    (groups["close"] + 18.2, "Arjun can leave it here."),
]


def probe(path: Path, fields: str, selector: str = "format") -> str:
    return subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", f"{selector}={fields}", "-of", "default=nw=1:nk=1", str(path)], text=True).strip()


def stamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    whole, ms = divmod(ms, 1000)
    return f"{hours:02}:{minutes:02}:{whole:02},{ms:03}"


def wrap_caption(text: str, width: int = 61) -> str:
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
    txt = ROOT / f".narration-{i:02}.txt"
    wav = ROOT / f".narration-{i:02}.wav"
    txt.write_text(text, encoding="utf-8")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"flite=textfile={txt}:voice=slt", "-ac", "1", "-ar", "48000", str(wav)], check=True)
    voices.append(wav)
    voice_durations.append(float(probe(wav, "duration")))

cues = []
for i, ((start, text), length) in enumerate(zip(lines, voice_durations)):
    limit = lines[i + 1][0] - 0.2 if i + 1 < len(lines) else END
    end = min(start + length + 0.45, limit, END)
    if start + length > limit + 0.05 or end <= start:
        raise SystemExit(f"Narration cue {i+1} overruns next beat ({start:.2f}s + {length:.2f}s; limit {limit:.2f}s)")
    cues.append((start, end, wrap_caption(text)))
if any(a[1] >= b[0] for a, b in zip(cues, cues[1:])):
    raise SystemExit("Generated SRT cue timings overlap")
CAPTIONS.write_text("\n\n".join(f"{i}\n{stamp(start)} --> {stamp(end)}\n{text.replace(chr(92)+'N', chr(10))}" for i, (start, end, text) in enumerate(cues, 1)) + "\n", encoding="utf-8")
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")
if os.environ.get("VALIDATE_ONLY") == "1":
    for (start, text), length, (cue_start, cue_end, _) in zip(lines, voice_durations, cues):
        print(f"{start:7.3f}–{cue_end:7.3f}  voice {length:4.2f}s  {text}")
    for path in voices:
        path.unlink(missing_ok=True)
        path.with_suffix(".txt").unlink(missing_ok=True)
    raise SystemExit(0)

# Render every real source interval as a separate shot. Subtle reframing between
# cuts supplies motion without changing or inventing any app state.
video_parts = []
raw_duration = float(probe(SOURCE, "duration"))
for i, (_, source_start, source_end, out_duration, profile) in enumerate(shots):
    source_end = min(source_end, raw_duration)
    x, y, width, height = profiles[profile]
    source_duration = source_end - source_start
    speed = out_duration / source_duration
    crop_h = round(1920 * height / width)
    frames = max(1, round(out_duration * 30))
    branch = f"src{i}"
    video_parts.append(
        f"[{branch}]trim=start={source_start:.6f}:end={source_end:.6f},setpts=(PTS-STARTPTS)*{speed:.9f},"
        f"crop={width}:{height}:{x}:{y},scale=1920:{crop_h}:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2,fps=30,"
        f"scale=1960:1102:flags=lanczos,crop=1920:1080:x='20*n/{frames}':y='11*n/{frames}',setsar=1[v{i}]"
    )
video_parts.append("".join(f"[v{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0,trim=end={END:.6f},setpts=PTS-STARTPTS,fps=30,subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=12,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=16,Alignment=2'[vout]")

# Feed the same captured video independently through each trim branch.
filters = ["[0:v]split=" + str(len(shots)) + "".join(f"[src{i}]" for i in range(len(shots))), *video_parts]
for i, (start, _) in enumerate(lines):
    ms = round(start * 1000)
    filters.append(f"[{i+1}:a]adelay={ms}|{ms}[a{i}]")
filters.append("".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:duration=longest:normalize=0,volume=0.8,apad=whole_dur={END:.6f},atrim=0:{END:.6f}[aout]")
args = ["ffmpeg", "-hide_banner", "-y", "-i", str(SOURCE)]
for wav in voices:
    args.extend(["-i", str(wav)])
args.extend(["-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]", "-r", "30", "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(OUTPUT)])
subprocess.run(args, check=True)
for path in voices:
    path.unlink(missing_ok=True)
    path.with_suffix(".txt").unlink(missing_ok=True)
print(f"Rendered {OUTPUT}; output={END:.3f}s, shots={len(shots)}, cues={len(cues)}.")

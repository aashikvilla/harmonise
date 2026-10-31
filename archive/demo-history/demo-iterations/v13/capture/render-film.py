#!/usr/bin/env python3
"""Edit a fresh Playwright React recording into the v13 film."""
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
    # Open on Arjun, then reveal the product promise, start path and real first message.
    ("hook", 1.247, 4.247, 3.8, "entry_close"),
    ("entry", 4.247, 7.404, 3.5, "entry_pullback"),
    ("start", 7.404, 10.651, 3.4, "conversation_full"),
    ("reply", 10.651, 14.2, 4.2, "reply_focus"),
    # The local prepared reply causes an actual correction and changed understanding.
    ("reply", 14.2, 16.247, 3.5, "reply_lower"),
    ("correction", 16.247, 18.776, 3.5, "reply_focus"),
    ("not_quite", 18.776, 21.776, 3.5, "not_quite"),
    ("rewrite", 21.776, 25.5, 3.8, "rewrite"),
    ("rewrite", 25.5, 28.955, 3.8, "rewrite_lower"),
    ("changed", 28.955, 32.5, 4.25, "changed"),
    ("changed", 32.5, 36.5, 4.25, "changed_lower"),
    ("changed", 36.5, 40.5, 4.25, "changed"),
    ("changed", 40.5, 44.247, 4.25, "changed_lower"),
    # One historical thread moves from Day 4 to Day 9 to Day 16.
    ("day4", 48.7, 52.7, 4.7, "thread_upper"),
    ("day4", 52.7, 56.7, 4.7, "thread_lower"),
    ("day9", 57.875, 61.875, 4.7, "thread_upper"),
    ("host", 61.875, 65.875, 4.7, "thread_lower"),
    ("day16", 70.191, 74.341, 4.7, "thread_upper"),
    ("day16", 74.341, 78.491, 4.7, "thread_lower"),
    # A single Ravi edit and the exact unsent group-only preview.
    ("ravi_before", 78.491, 82.741, 4.667, "ravi_form"),
    ("ravi_after", 84.061, 87.811, 4.667, "ravi_preview"),
    ("ravi_after", 87.811, 91.561, 4.667, "ravi_form"),
    ("ravi_after", 91.561, 95.311, 4.667, "ravi_preview"),
    ("ravi_after", 95.311, 99.061, 4.667, "ravi_form"),
    ("ravi_after", 99.061, 102.811, 4.667, "ravi_preview"),
    ("support", 104.007, 107.507, 5.0, "support_top"),
    ("support", 107.507, 111.007, 5.0, "support_full"),
    ("return", 114.343, 116.343, 4.5, "thread_upper"),
    # The final chapter is the choice itself, including the optional local draft.
    ("takeaway", 116.343, 119.577, 4.5, "takeaway_upper"),
    ("takeaway", 119.577, 122.811, 4.5, "takeaway_lower"),
    ("takeaway", 122.811, 126.045, 4.5, "takeaway_upper"),
    ("takeaway", 126.045, 129.279, 4.5, "takeaway_lower"),
    ("maybe", 132.512, 136.512, 5.0, "takeaway_upper"),
    ("maybe", 136.512, 140.768, 5.0, "takeaway_lower"),
    ("offer", 140.768, 143.768, 5.0, "takeaway_upper"),
    ("offer", 143.768, 146.953, 5.0, "takeaway_lower"),
    ("draft", 146.953, 150.0, 3.8, "draft_upper"),
    ("draft", 150.0, 153.0, 3.8, "draft_lower"),
    ("draft", 153.0, 156.0, 3.8, "draft_upper"),
    ("draft", 156.0, 159.121, 3.8, "draft_lower"),
    ("close", 159.654, 163.654, 5.0, "close_upper"),
]
# Reuse the same story structure while aligning source cuts to this fresh
# Playwright take's measured scene boundaries rather than relying on v11 timing.
REFERENCE_TIMELINE = json.loads((ROOT / ".." / "v12" / "capture" / "timeline.json").read_text())
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
    "ravi_before": "11-ravi-before-edit", "ravi_after": "12-ravi-changed-preview",
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
    (4.2, "Private reflection you can correct before exploring peer experiences."),
    (9.2, "Planned AI organizes themes; peer stories are optional."),
    (14.0, "Prepared preview. No model."),
    (16.5, "A local example offers a possibility, not an answer."),
    (20.8, "Arjun says, Not quite."),
    (23.4, "He changes the words: it is his parents, and he wants time."),
    (28.0, "Now the editable reflection changes with what he said."),
    (31.6, "He wants time to decide, without advice to stay or leave."),
    (36.3, "Planned Muse Spark may organize themes to review, never decide what is true."),
    (42.0, "Day four: one member wants time to choose."),
    (46.5, "Another member sees a different part of the situation."),
    (50.5, "Day nine. The host says, I can listen; I can’t decide for you."),
    (55.0, "Fictional historical examples, prepared and not live."),
    (59.2, "Day sixteen: Dev's question still has no replies."),
    (63.0, "No reply is promised. Arjun can keep exploring or stop here."),
    (67.5, "Group only; no private messages."),
    (71.5, "Arjun edits one question; the exact preview changes."),
    (76.2, "The alias and group audience stay visible."),
    (79.9, "Private conversation and context are excluded."),
    (84.0, "Consent is unchecked. Continue stays disabled."),
    (88.2, "Nothing is sent from this preview."),
    (92.0, "No provider is verified or bookable here."),
    (96.0, "Arjun returns to the peer thread."),
    (100.0, "He keeps time to decide privately."),
    (104.5, "He could leave without sharing anything."),
    (109.0, "Maybe later keeps that choice open."),
    (113.5, "Private reflection stays out of the group draft."),
    (118.0, "Arjun chooses one bounded thing that helped."),
    (122.5, "He writes about asking for time before replying."),
    (127.0, "This draft is only for the fictional group preview."),
    (131.5, "The alias is visible; private context is not included."),
    (136.0, "Consent remains unchecked, and posting stays disabled."),
    (140.5, "Nothing is sent."),
    (145.0, "His takeaway and optional draft sit side by side."),
    (149.5, "One helpful thing, if he chooses to share it later."),
    (154.0, "The prepared example shows no real people or outcome."),
    (158.5, "Arjun keeps the next step in his hands."),
    (163.0, "Private reflection is still private."),
    (167.5, "The Dev draft remains optional and unsent."),
    (173.6, "Nothing is sent without consent. Arjun can leave it here."),
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
video_parts.append("".join(f"[v{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0,trim=end={END:.6f},setpts=PTS-STARTPTS,fps=30,subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=16,Alignment=2'[vout]")

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

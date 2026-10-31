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
INTRO = ROOT / "capture" / "type-opening.mp4"
INTRO_DURATION = 12.0
REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Source intervals are seconds in the newly captured React WebM. Each output
# shot is <=4.3s; the edit moves attention through real UI states.
shots = [
    # Three purposeful correction beats on the real React UI.
    ("entry", 4.247, 7.404, 3.8, "entry_pullback"),
    ("start", 7.404, 10.651, 3.4, "conversation_full"),
    ("reply", 10.651, 14.2, 4.2, "reply_focus"),
    ("reply", 14.2, 16.247, 3.5, "reply_lower"),
    ("not_quite", 18.776, 21.776, 3.5, "not_quite"),
    ("rewrite", 21.776, 25.5, 3.8, "rewrite"),
    ("rewrite", 25.5, 28.955, 3.8, "rewrite_lower"),
    ("changed", 28.955, 32.5, 4.25, "changed"),
    ("changed", 32.5, 36.5, 4.25, "changed_lower"),
    ("selected", 0.1, 4.6, 4.5, "private_outcome"),
    ("experience_intro", 0.1, 4.1, 4.5, "conversation_full"),
    # One brief, chronological thread rhythm: Day 4, Day 9, Day 16.
    ("day4", 48.7, 52.7, 4.7, "thread_upper"),
    ("day9", 57.875, 61.875, 4.7, "thread_upper"),
    ("triage", 0.1, 3.1, 3.5, "thread_triage"),
    ("day16", 70.191, 74.341, 4.7, "thread_lower"),
    # One before/after Ravi form; one exact edited audience preview.
    ("ravi_before", 78.491, 82.741, 4.667, "ravi_form"),
    ("ravi_after", 84.061, 87.811, 4.667, "ravi_preview"),
    # One short provider caveat and a return to Arjun's selected outcome.
    ("support", 104.007, 107.507, 4.7, "support_full"),
    ("return", 0.1, 3.8, 4.0, "thread_upper"),
    ("takeaway", 0.1, 4.1, 4.5, "takeaway_upper"),
    ("takeaway", 4.1, 8.1, 4.5, "takeaway_lower"),
    ("takeaway", 8.1, 12.1, 4.5, "takeaway_upper"),
    ("takeaway", 12.1, 16.1, 4.5, "takeaway_lower"),
    ("maybe", 0.1, 4.1, 5.0, "takeaway_upper"),
    ("maybe", 4.1, 8.1, 5.0, "takeaway_lower"),
    ("offer", 0.1, 3.1, 5.0, "takeaway_upper"),
    ("offer", 3.1, 6.1, 5.0, "takeaway_lower"),
    ("draft", 0.1, 4.0, 4.5, "draft_upper"),
    ("close", 159.654, 163.654, 5.0, "close_upper"),
]
# Reuse the same story structure while aligning source cuts to this fresh
# Playwright take's measured scene boundaries rather than relying on v11 timing.
REFERENCE_TIMELINE = json.loads((ROOT / ".." / "v12" / "capture" / "timeline.json").read_text())
CURRENT_TIMELINE = json.loads(TIMELINE.read_text())
reference_time = {row["name"]: row["seconds"] for row in REFERENCE_TIMELINE}
current_time = {row["name"]: row["seconds"] for row in CURRENT_TIMELINE}
reference_time["06a-selected-private-takeaway"] = 0.0
reference_time["06b-experience-intro"] = 0.0
reference_time["14-selected-private-takeaway"] = 0.0
reference_time["15-private-only-choice"] = 0.0
reference_time["16-optional-offer-selected"] = 0.0
reference_time["17-exact-unsent-dev-draft"] = 0.0
reference_time["18-composed-agency-close"] = current_time["18-composed-agency-close"]
anchor_for_group = {
    "hook": "01-arjun-fictional-hook", "entry": "01-arjun-fictional-hook", "selected": "06a-selected-private-takeaway",
    "start": "02-start-privately", "reply": "03-prepared-first-reply", "correction": "03-prepared-first-reply",
    "not_quite": "04-not-quite-selected", "rewrite": "05-arjun-rewrites", "changed": "06-changed-editable-reflection",
    "day4": "07-day-4-peer-perspective", "day9": "08-day-9-host-boundary", "host": "08-day-9-host-boundary",
    "triage": "09-prepared-no-report", "day16": "10-day-16-dev-unanswered", "ravi": "11-ravi-before-edit",
    "support": "13-support-caveat", "return": "14-selected-private-takeaway", "takeaway": "14-selected-private-takeaway",
    "maybe": "15-private-only-choice", "offer": "16-optional-offer-selected", "draft": "17-exact-unsent-dev-draft",
    "close": "18-composed-agency-close",
    "final_close": "18-composed-agency-close",
    "experience_intro": "06b-experience-intro",
    "ravi_before": "11-ravi-before-edit", "ravi_after": "12-ravi-changed-preview",
}
# Show one edited preview route and one local optional draft instance; later crops do not revisit consent.
_filtered = []
_seen = {"ravi_after": 0, "draft": 0}
for row in shots:
    if row[0] in _seen:
        if _seen[row[0]] >= 1:
            continue
        _seen[row[0]] += 1
    _filtered.append(row)
shots = _filtered
shots.append(("selected", .1, 4.6, 4.5, "private_outcome_detail"))
shots.append(("close", 163.654, 167.654, 4.5, "close_private"))
shots.append(("close", 167.654, 171.654, 4.35, "close_upper"))
shots.append(("final_close", 170.752, 174.752, 4.55, "close_private"))
shots.append(("final_close", 170.752, 174.752, 3.2, "close_upper"))
shots.append(("final_close", 170.752, 174.752, 4.2, "takeaway_upper"))
shots.append(("final_close", 170.752, 174.752, 4.2, "private_outcome"))
shots.append(("final_close", 170.752, 174.752, 4.2, "close_upper"))
shots.append(("final_close", 170.752, 174.752, 3.9, "close_private"))

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
    "private_outcome": (0, 210, 1600, 650),
    "private_outcome_detail": (140, 370, 1320, 420),
    "thread_upper": (0, 110, 1600, 760),
    "thread_lower": (0, 180, 1600, 720),
    "thread_triage": (0, 150, 1600, 740),
    "ravi_top": (0, 0, 1600, 800),
    "ravi_form": (0, 40, 1600, 800),
    "ravi_preview": (0, 40, 1600, 800),
    "ravi_preview_detail": (170, 180, 1260, 550),
    "support_top": (0, 0, 1600, 800),
    "support_full": (0, 0, 1600, 900),
    "takeaway_upper": (0, 60, 1600, 760),
    "takeaway_lower": (0, 130, 1600, 740),
    "draft_upper": (0, 40, 1600, 800),
    "draft_lower": (0, 100, 1600, 760),
    "close_upper": (0, 30, 1600, 780),
    "close_lower": (0, 100, 1600, 760),
    "close_private": (200, 220, 1200, 675),
}

# Scene boundaries in output time are computed from shots, not hardcoded.
groups = {}
position = INTRO_DURATION
for group, src_start, src_end, out_duration, profile in shots:
    groups.setdefault(group, position)
    position += out_duration
END = position
if not 176 <= END <= 179:
    raise SystemExit(f"Expected a 176–179 second film, got {END:.3f}s")
if any(row[3] > 5.0 for row in shots):
    raise SystemExit("No single shot may hold longer than five seconds")

lines = [
    (0.0, "I can’t tell my family what I want."),
    (3.98, "Think privately. Correct it. Choose whether to explore peers."),
    (8.7, "Fictional Arjun. No model connected."),
    (12.0, "For adults facing family pressure."),
    (15.8, "Planned Muse Spark can organize themes."),
    (19.2, "Arjun begins privately, in his own words."),
    (23.4, "Prepared local reply: maybe he needs time."),
    (26.9, "He chooses Not quite."),
    (30.4, "He corrects it: the pressure comes from his parents."),
    (34.2, "He wants time to decide what he wants."),
    (38.0, "Now the editable reflection changes with his words."),
    (42.25, "This is still an editable reflection."),
    (46.5, "Arjun chooses to keep the takeaway privately."),
    (51.0, "Peer stories are optional, not a required next step."),
    (55.5, "Day four: one peer names pressure from family calls."),
    (60.2, "Day nine: the host can listen, not decide for him."),
    (64.9, "A prepared example holds a directive reply."),
    (68.4, "Day sixteen: Dev's question has no replies yet."),
    (73.1, "Ravi accepts questions in the group only."),
    (77.77, "The alias, audience and edited question stay visible."),
    (82.43, "Private context is excluded. Consent stays unchecked."),
    (87.13, "This preview sends nothing."),
    (91.13, "His private takeaway stays selected."),
    (95.63, "I can ask for time before deciding."),
    (100.13, "Maybe later keeps sharing optional."),
    (109.13, "He may keep the reflection private."),
    (114.13, "He could offer one bounded thing to Dev later."),
    (119.13, "Consent stays unchecked; nothing is posted."),
    (124.13, "He edits only the local example draft."),
    (129.13, "The draft remains optional and unsent."),
    (133.63, "His kept takeaway remains the center."),
    (138.63, "A separate draft is only a preview."),
    (143.13, "Nothing goes to a real group."),
    (147.63, "It does not settle what happens at home."),
    (151.98, "Arjun chose to keep this next step private."),
    (156.53, "The family decision remains his to make."),
    (159.73, "Optional peer experience can wait."),
    (163.93, "For this session, the takeaway stays private."),
    (168.13, "No reply is promised, and nothing is sent."),
    (172.33, "Preview session only. Nothing is sent."),
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
hook_text = ROOT / "capture" / "type-hook.txt"
promise_text = ROOT / "capture" / "type-promise.txt"
label_text = ROOT / "capture" / "type-label.txt"
hook_text.write_text("I can’t tell my family\nwhat I want without feeling ungrateful.", encoding="utf-8")
promise_text.write_text("Think privately.\nCorrect the reflection.\nChoose whether to explore peer experiences.", encoding="utf-8")
label_text.write_text("""PREPARED PRODUCT-STORY GRAPHIC · FICTIONAL ARJUN
PREPARED SCENARIO · NO MODEL CONNECTED""", encoding="utf-8")
intro_filter = (
    f"drawbox=x=145:y=300:w=7:h=500:color=0x1d6255:t=fill,"
    f"drawtext=fontfile={BOLD}:textfile={label_text}:fontcolor=0x31564b:fontsize=24:line_spacing=10:x=170:y=118,"
    f"drawtext=fontfile={REGULAR}:textfile={hook_text}:fontcolor=0x1f2f28:fontsize=68:line_spacing=18:x=170:"
    "y='350-28*max(0,1-t/0.45)':alpha='if(lt(t,0.25),t/0.25,if(gt(t,3.85),(4.2-t)/0.35,1))':enable='between(t,0,4.2)',"
    f"drawtext=fontfile={BOLD}:textfile={promise_text}:fontcolor=0x1f2f28:fontsize=54:line_spacing=22:x=170:"
    "y='300-20*max(0,1-(t-4.2)/0.4)':alpha='if(lt(t,4.5),(t-4.2)/0.3,1)':enable='between(t,4.2,12)'"
)
subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
    f"color=c=0xf7f6f2:s=1920x1080:r=30:d={INTRO_DURATION}", "-vf", intro_filter,
    "-frames:v", str(round(INTRO_DURATION * 30)), "-an", "-c:v", "libx264", "-preset", "medium",
    "-crf", "19", "-pix_fmt", "yuv420p", str(INTRO)
], check=True)
if os.environ.get("INTRO_ONLY") == "1":
    print(f"Rendered typography preview {INTRO}")
    raise SystemExit(0)

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
video_parts.append("[intro]" + "".join(f"[v{i}]" for i in range(len(shots))) + f"concat=n={len(shots)+1}:v=1:a=0,trim=end={END:.6f},setpts=PTS-STARTPTS,fps=30,subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=16,Alignment=2'[vout]")

# Feed the same captured video independently through each trim branch.
filters = ["[0:v]fps=30,scale=1920:1080,setsar=1[intro]", "[1:v]split=" + str(len(shots)) + "".join(f"[src{i}]" for i in range(len(shots))), *video_parts]
for i, (start, _) in enumerate(lines):
    ms = round(start * 1000)
    filters.append(f"[{i+2}:a]adelay={ms}|{ms}[a{i}]")
filters.append("".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:duration=longest:normalize=0,volume=0.8,apad=whole_dur={END:.6f},atrim=0:{END:.6f}[aout]")
args = ["ffmpeg", "-hide_banner", "-y", "-i", str(INTRO), "-i", str(SOURCE)]
for wav in voices:
    args.extend(["-i", str(wav)])
args.extend(["-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]", "-r", "30", "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(OUTPUT)])
subprocess.run(args, check=True)
for path in voices:
    path.unlink(missing_ok=True)
    path.with_suffix(".txt").unlink(missing_ok=True)
print(f"Rendered {OUTPUT}; output={END:.3f}s, shots={len(shots)}, cues={len(cues)}.")

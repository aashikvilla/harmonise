#!/usr/bin/env python3
"""Edit a fresh Playwright React recording into the v14 film."""
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
    # First-person hook, then a larger promise/mechanism frame and actual chat.
    ("hook", 1.184, 4.184, 3.75, "entry_hook"),
    ("entry", 4.184, 7.347, 3.75, "entry_promise"),
    ("start", 7.347, 10.536, 3.75, "conversation_full"),
    ("reply", 10.536, 14.2, 3.75, "reply_focus"),
    # The local response, actual rejection, typed correction, and changed reflection.
    ("reply", 14.2, 16.2, 4.75, "reply_lower"),
    ("correction", 16.2, 18.702, 4.75, "reply_focus"),
    ("not_quite", 18.702, 21.702, 4.75, "not_quite"),
    ("rewrite", 21.702, 25.0, 4.75, "rewrite"),
    ("rewrite", 25.0, 28.8, 4.75, "rewrite_lower"),
    ("changed", 28.8, 32.0, 4.75, "changed"),
    ("changed", 32.0, 36.0, 4.75, "changed_lower"),
    ("changed", 36.0, 40.2, 4.75, "changed"),
    # One compact historical story, cropped to dates/posts so captions avoid the summary copy.
    ("day4", 48.624, 52.8, 5.0, "thread_story"),
    ("day4", 52.8, 56.7, 4.5, "thread_story_lower"),
    ("day9", 57.767, 61.7, 5.0, "thread_host"),
    ("triage", 65.948, 68.0, 2.5, "thread_no_report"),
    ("day16", 70.113, 74.0, 5.0, "thread_unanswered"),
    ("day16", 74.0, 78.589, 5.0, "thread_unanswered_lower"),
    # A single edit into the exact audience preview and consent boundary.
    ("ravi_before", 78.589, 82.0, 4.0, "ravi_upper"),
    ("ravi_after", 83.712, 87.4, 4.0, "ravi_whole"),
    ("ravi_after", 87.4, 91.0, 4.0, "ravi_question"),
    ("ravi_after", 91.0, 94.6, 3.5, "ravi_audience"),
    ("ravi_after", 94.6, 98.2, 3.5, "ravi_consent"),
    ("ravi_after", 98.2, 102.0, 3.0, "ravi_disabled"),
    ("support", 104.343, 108.0, 4.0, "support_tight"),
    ("support", 108.0, 111.343, 3.0, "support_return"),
    ("return", 114.343, 116.343, 3.0, "thread_story"),
    # Private takeaway, “maybe later,” optional offer, typed local draft, and actual choice summary.
    ("takeaway", 116.707, 120.2, 4.5, "takeaway_upper"),
    ("takeaway", 120.2, 123.8, 4.5, "takeaway_lower"),
    ("takeaway", 123.8, 127.4, 4.5, "takeaway_upper"),
    ("takeaway", 127.4, 132.915, 4.5, "takeaway_lower"),
    ("maybe", 132.915, 136.9, 4.5, "takeaway_upper"),
    ("maybe", 136.9, 141.145, 4.5, "takeaway_lower"),
    ("offer", 141.145, 144.5, 5.0, "takeaway_upper"),
    ("offer", 144.5, 147.272, 5.0, "takeaway_lower"),
    ("draft", 147.272, 150.0, 4.8, "draft_upper"),
    ("draft", 150.0, 153.0, 4.8, "draft_lower"),
    ("draft", 153.0, 156.0, 4.8, "draft_upper"),
    ("draft", 156.0, 159.48, 4.8, "draft_lower"),
    ("draft", 159.48, 162.8, 4.8, "draft_upper"),
    # End on the actual composed agency choice captured from the app.
    ("close", 159.654, 163.654, 5.0, "close_choice"),
]
# Reuse the same story structure while aligning source cuts to this fresh
# Playwright take's measured scene boundaries rather than relying on v11 timing.
REFERENCE_TIMELINE = json.loads((ROOT / ".." / "v13" / "capture" / "timeline.json").read_text())
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
    "entry_hook": (160, 60, 1240, 580),
    "entry_promise": (160, 210, 1240, 420),
    "conversation_full": (0, 0, 1600, 900),
    "reply_focus": (0, 65, 1600, 750),
    "reply_lower": (0, 145, 1600, 730),
    "not_quite": (0, 90, 1600, 730),
    "rewrite": (0, 120, 1600, 740),
    "rewrite_lower": (0, 170, 1600, 700),
    "changed": (0, 70, 1600, 740),
    "changed_lower": (0, 145, 1600, 720),
    "thread_story": (180, 330, 1240, 480),
    "thread_host": (180, 350, 1240, 480),
    "thread_story_lower": (180, 360, 1240, 440),
    "thread_unanswered": (180, 300, 1240, 510),
    "thread_unanswered_lower": (180, 340, 1240, 470),
    "thread_no_report": (180, 740, 1240, 160),
    "ravi_upper": (100, 0, 1400, 700),
    "ravi_whole": (100, 0, 1400, 700),
    "ravi_question": (180, 300, 1240, 380),
    "ravi_audience": (660, 180, 880, 360),
    "ravi_consent": (180, 490, 1240, 240),
    "ravi_disabled": (576, 200, 1024, 500),
    "support_tight": (180, 150, 1240, 460),
    "support_return": (180, 250, 1240, 450),
    "takeaway_upper": (180, 80, 1240, 470),
    "takeaway_lower": (180, 250, 1240, 470),
    "draft_upper": (180, 130, 1240, 470),
    "draft_lower": (180, 330, 1240, 440),
    "close_choice": (180, 240, 1240, 500),
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
    (9.0, "He can correct a possibility, then choose peer stories."),
    (13.8, "Fictional, prepared; no model."),
    (16.8, "The reply uses prepared local rules."),
    (20.3, "Arjun taps Not quite."),
    (23.2, "He changes one word: partner becomes parents."),
    (27.5, "He writes that he wants time to decide."),
    (31.2, "The editable reflection now keeps his words."),
    (35.0, "No one is choosing stay or leave for him."),
    (39.3, "Planned Muse Spark may organize themes for review, not decide what is true."),
    (44.4, "The corrected reflection stays his."),
    (49.0, "He wants time to think before he answers."),
    (53.0, "Day four: Arjun wants time to choose."),
    (57.5, "Ravi has a different experience; it did not settle the question."),
    (62.2, "Day nine. The host says, I can listen; I can’t decide for you."),
    (67.0, "Prepared triage; no report is sent."),
    (70.0, "Day sixteen: Dev’s question still has no replies."),
    (74.3, "Fictional historical examples, prepared and not live."),
    (80.0, "Ravi accepts group replies only, not private messages."),
    (84.3, "Arjun edits his question; the exact preview changes."),
    (88.4, "The group and alias are visible."),
    (91.5, "His private conversation is excluded."),
    (95.0, "Consent is unchecked; the action stays disabled."),
    (99.0, "Nothing is sent from this preview."),
    (102.0, "No provider is verified or bookable here."),
    (105.7, "Arjun returns to the thread."),
    (109.0, "He keeps one takeaway privately: I want time to decide."),
    (113.5, "That thought is not shared with the group."),
    (118.0, "Maybe later means he can leave without sharing."),
    (122.5, "The private reflection remains his."),
    (127.0, "He chooses one helpful thing he could offer Dev."),
    (131.5, "The draft stays bounded to that one thing."),
    (136.0, "He can review the exact text before any choice to share."),
    (140.5, "Prepared local draft for a fictional group."),
    (145.0, "The alias and group audience stay visible."),
    (149.5, "Private context is excluded."),
    (154.0, "Consent stays unchecked; posting stays disabled."),
    (158.5, "Nothing is sent."),
    (163.0, "The next step is still Arjun’s choice."),
    (168.0, "His optional draft remains local and unsent."),
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
video_parts.append("".join(f"[v{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0,trim=end={END:.6f},setpts=PTS-STARTPTS,fps=30,subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=20,Alignment=2'[vout]")

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

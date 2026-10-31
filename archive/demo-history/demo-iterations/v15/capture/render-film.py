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
    # Product proposition and actual Start privately choice.
    ("hook", 1.3, 4.3, 5.0, "entry_hook"),
    ("entry", 4.3, 7.4, 5.0, "entry_promise"),
    ("start", 7.4, 10.7, 5.0, "conversation_full"),
    # Causal correction: initial words, prepared rule, rejection, rewrite, reflection.
    ("reply", 13.69, 16.0, 5.0, "reply_focus"),
    ("reply", 16.0, 18.69, 5.0, "reply_lower"),
    ("not_quite", 21.84, 25.84, 5.0, "not_quite"),
    ("rewrite", 25.84, 29.07, 5.0, "rewrite"),
    ("changed", 29.07, 32.0, 5.0, "changed"),
    ("changed", 32.0, 36.294, 5.0, "changed_lower"),
    ("changed", 36.294, 40.294, 5.0, "changed"),
    ("changed", 40.294, 45.0, 5.0, "changed_lower"),
    # Three short dates in one prepared thread; cuts follow selected date/posts.
    ("day4", 54.821, 59.821, 5.0, "thread_story"),
    ("day9", 64.006, 69.006, 5.0, "thread_host"),
    ("day9", 69.006, 72.288, 5.0, "thread_host"),
    ("triage", 72.288, 76.48, 5.0, "thread_no_report"),
    ("day16", 76.48, 81.48, 5.0, "thread_unanswered"),
    ("day16", 81.48, 84.969, 5.0, "thread_unanswered_lower"),
    # Ravi's edited wording and exact audience preview, each shown once in sequence.
    ("ravi_before", 84.969, 88.5, 5.0, "ravi_question"),
    ("ravi_before", 88.5, 91.938, 5.0, "ravi_question"),
    ("ravi_after", 91.938, 96.938, 5.0, "ravi_whole"),
    ("ravi_after", 96.938, 100.0, 5.0, "ravi_audience"),
    ("ravi_after", 100.0, 104.0, 5.0, "ravi_consent"),
    ("ravi_after", 104.0, 108.0, 5.0, "ravi_disabled"),
    # Real support caveat, then the captured return to the peer thread.
    ("support", 112.343, 117.343, 4.0, "support_tight"),
    ("support_return", 124.733, 128.733, 4.0, "thread_unanswered"),
    # End on a series of actual selected choices and the composed no-send summary.
    ("takeaway", 124.733, 128.733, 5.0, "takeaway_upper"),
    ("takeaway", 128.733, 132.733, 5.0, "takeaway_lower"),
    ("maybe", 140.917, 144.917, 5.0, "takeaway_upper"),
    ("offer", 149.172, 153.172, 5.0, "takeaway_lower"),
    ("offer", 155.172, 157.2, 5.0, "draft_upper"),
    ("offer", 157.2, 158.836, 5.0, "draft_lower"),
    ("draft", 158.836, 162.836, 5.0, "draft_upper"),
    ("draft", 162.836, 166.836, 5.0, "draft_lower"),
    ("close", 170.977, 174.977, 5.0, "close_choice"),
    ("close", 174.977, 178.977, 5.0, "close_choice"),
    ("close", 178.977, 182.977, 5.0, "close_choice"),
]
# Reuse the same story structure while aligning source cuts to this fresh
# Playwright take's measured scene boundaries rather than relying on v11 timing.
REFERENCE_TIMELINE = json.loads((ROOT / ".." / "v14" / "capture" / "timeline.json").read_text())
CURRENT_TIMELINE = json.loads(TIMELINE.read_text())
reference_time = {row["name"]: row["seconds"] for row in REFERENCE_TIMELINE}
reference_time["13a-support-return-peers"] = 124.733
current_time = {row["name"]: row["seconds"] for row in CURRENT_TIMELINE}
anchor_for_group = {
    "hook": "01-arjun-fictional-hook", "entry": "01-arjun-fictional-hook",
    "start": "02-start-privately", "reply": "03-prepared-first-reply", "correction": "03-prepared-first-reply",
    "not_quite": "04-not-quite-selected", "rewrite": "05-arjun-rewrites", "changed": "06-changed-editable-reflection",
    "day4": "07-day-4-peer-perspective", "day9": "08-day-9-host-boundary", "host": "08-day-9-host-boundary",
    "triage": "09-prepared-no-report", "day16": "10-day-16-dev-unanswered", "ravi": "11-ravi-before-edit",
    "support": "13-support-caveat", "support_return": "13a-support-return-peers", "return": "14-selected-private-takeaway", "takeaway": "14-selected-private-takeaway",
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
    "conversation_full": (0, 0, 1600, 750),
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
    "close_choice": (180, 520, 1240, 380),
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
    (0.0, "Arjun can’t tell his family what he wants without feeling ungrateful."),
    (5.0, "Private reflection you can correct before exploring peer experiences."),
    (10.0, "Muse Spark may organize possibilities for review, not decide."),
    (15.0, "This is a prepared local example; no model is connected."),
    (20.0, "A prepared local reply offers one possibility, not a decision."),
    (25.0, "He chooses Not quite."),
    (30.0, "He changes partner to parents, and asks for time."),
    (35.0, "The changed reflection keeps his wording."),
    (40.0, "This reply came from prepared local rules, not Muse Spark."),
    (45.0, "Arjun’s correction changes the reflection."),
    (50.0, "He chooses whether to explore lived experience."),
    (55.0, "Fictional historical posts show a different perspective."),
    (60.0, "Ravi also wanted time; it did not settle Arjun’s question."),
    (65.0, "Day nine: the host says, I can listen; I can’t decide for you."),
    (70.0, "The example shows a prepared hold; no report is sent."),
    (75.0, "Day sixteen: Dev’s side question still has no replies."),
    (80.0, "These are prepared fictional posts, not live community activity."),
    (85.0, "Arjun edits his question to Ravi."),
    (90.0, "The exact preview changes with his words."),
    (95.0, "It names the group and alias; replies stay group-only."),
    (100.0, "His private conversation is excluded."),
    (105.0, "Consent is unchecked; sending is disabled."),
    (110.0, "Nothing is sent from this preview."),
    (115.0, "No provider is verified or bookable here."),
    (119.0, "He returns to the peer thread, then keeps a takeaway privately."),
    (124.0, "He wants time to decide; that thought stays private."),
    (129.0, "Maybe later leaves sharing optional."),
    (134.0, "He chooses one bounded thing he could offer Dev."),
    (139.0, "He types a local draft in his own words."),
    (144.0, "He can review its exact text and group audience."),
    (149.0, "The private context is excluded."),
    (154.0, "Consent stays unchecked; the post action stays disabled."),
    (159.0, "The draft remains local and unsent."),
    (164.0, "Arjun’s next step stays his choice."),
    (169.0, "Nothing is sent without consent."),
    (175.0, "He can leave it here."),
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

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
    # Four-step prepared mock-up, then Start privately and actual first-use chat.
    ("hook", 1.2, 4.2, 5.0, "entry_hook"),
    ("entry", 4.2, 7.2, 5.0, "entry_promise"),
    ("start", 7.2, 10.7, 5.0, "conversation_full"),
    # Actual local response, rejection, changed words, editable reflection.
    ("reply", 13.69, 17.69, 5.0, "reply_focus"),
    ("not_quite", 21.828, 25.828, 5.0, "not_quite"),
    ("rewrite", 25.828, 28.792, 5.0, "rewrite"),
    ("changed", 28.792, 32.792, 5.0, "changed"),
    ("changed", 32.792, 36.064, 5.0, "changed_lower"),
    ("confirmed", 54.3, 58.3, 5.0, "changed"),
    ("discovery", 58.3, 63.3, 5.0, "conversation_full"),
    # One connected historical thread, cuts follow real date selections/posts.
    ("day4", 54.707, 59.707, 5.0, "thread_story"),
    ("day9", 63.85, 68.85, 5.0, "thread_overview"),
    ("day9", 68.85, 72.018, 5.0, "thread_host"),
    ("triage", 72.018, 76.206, 5.0, "thread_no_report"),
    ("day16", 76.206, 81.206, 5.0, "thread_overview"),
    ("day16", 81.206, 84.679, 5.0, "thread_unanswered"),
    ("day16", 84.679, 88.0, 5.0, "thread_unanswered_lower"),
    # Ravi edit into one exact group-only preview and the consent boundary.
    ("ravi_before", 84.679, 88.0, 5.0, "ravi_question"),
    ("ravi_before", 88.0, 91.673, 5.0, "ravi_question"),
    ("ravi_after", 91.673, 96.673, 5.0, "ravi_whole"),
    ("ravi_after", 96.673, 100.0, 5.0, "ravi_audience"),
    ("ravi_after", 100.0, 104.0, 5.0, "ravi_consent"),
    ("ravi_after", 104.0, 108.0, 5.0, "ravi_disabled"),
    # Verified-provider caveat and actual return to the selected peer thread.
    ("support", 112.034, 117.034, 4.0, "support_tight"),
    ("support_return", 124.365, 128.365, 4.0, "thread_unanswered"),
    # Choices progress from private note to optional local draft and final summary.
    ("takeaway", 128.482, 132.482, 5.0, "takeaway_upper"),
    ("takeaway", 132.482, 136.482, 5.0, "takeaway_lower"),
    ("maybe", 144.654, 148.654, 5.0, "takeaway_upper"),
    ("offer", 152.856, 156.856, 5.0, "takeaway_lower"),
    ("offer", 158.856, 160.884, 5.0, "draft_upper"),
    ("offer", 160.884, 162.396, 5.0, "draft_lower"),
    ("draft", 162.396, 166.396, 5.0, "draft_upper"),
    ("draft", 166.396, 170.396, 5.0, "draft_lower"),
    ("close", 174.557, 178.557, 5.0, "close_choice"),
    ("close", 178.557, 182.557, 5.0, "close_tight"),
    ("close", 182.557, 186.557, 5.0, "close_choice"),
]
# Reuse the same story structure while aligning source cuts to this fresh
# Playwright take's measured scene boundaries rather than relying on v11 timing.
REFERENCE_TIMELINE = json.loads((ROOT / ".." / "v15" / "capture" / "timeline.json").read_text())
CURRENT_TIMELINE = json.loads(TIMELINE.read_text())
reference_time = {row["name"]: row["seconds"] for row in REFERENCE_TIMELINE}
reference_time["06a-arjun-confirms-reflection"] = 54.3
reference_time["06b-optional-human-perspectives"] = 58.3
reference_time["13a-support-return-peers"] = 124.365
current_time = {row["name"]: row["seconds"] for row in CURRENT_TIMELINE}
anchor_for_group = {
    "hook": "01-arjun-fictional-hook", "entry": "01-arjun-fictional-hook",
    "start": "02-start-privately", "reply": "03-prepared-first-reply", "correction": "03-prepared-first-reply",
    "not_quite": "04-not-quite-selected", "rewrite": "05-arjun-rewrites", "changed": "06-changed-editable-reflection",
    "confirmed": "06a-arjun-confirms-reflection", "discovery": "06b-optional-human-perspectives",
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
    "entry_hook": (80, 50, 1440, 650),
    "entry_promise": (80, 180, 1440, 500),
    "conversation_full": (0, 0, 1600, 750),
    "reply_focus": (0, 65, 1600, 750),
    "reply_lower": (0, 145, 1600, 730),
    "not_quite": (0, 90, 1600, 730),
    "rewrite": (0, 120, 1600, 740),
    "rewrite_lower": (0, 170, 1600, 700),
    "changed": (0, 70, 1600, 740),
    "changed_lower": (0, 145, 1600, 720),
    "thread_story": (180, 330, 1240, 480),
    "thread_overview": (100, 220, 1400, 580),
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
    "close_tight": (180, 600, 1240, 300),
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
    (20.0, "The reply is a prepared possibility, not a decision."),
    (25.0, "Arjun taps Not quite."),
    (30.0, "He changes partner to parents, then asks for time."),
    (35.0, "The editable reflection keeps his words."),
    (40.0, "Arjun confirms what feels closer."),
    (45.0, "He chooses to look at lived experiences."),
    (50.0, "A fictional thread begins on Day four."),
    (55.0, "Ravi offers a different perspective."),
    (60.0, "Day nine: the host sets a boundary."),
    (65.0, "I can listen; I can’t decide for you."),
    (70.0, "Prepared triage: no report is sent."),
    (75.0, "Day sixteen: Dev’s side question remains open."),
    (80.0, "No replies yet."),
    (85.0, "Arjun changes his question to Ravi."),
    (90.0, "The exact preview changes with his words."),
    (95.0, "The group and alias stay visible."),
    (100.0, "Ravi accepts group replies only."),
    (105.0, "Private context is excluded."),
    (110.0, "Consent is unchecked; sending stays disabled."),
    (115.0, "Nothing is sent."),
    (120.0, "No provider is verified or bookable here."),
    (125.0, "He returns to peer stories."),
    (130.0, "He keeps one takeaway privately."),
    (135.0, "The thought stays his."),
    (140.0, "Maybe later keeps sharing optional."),
    (145.0, "He chooses one bounded thought he could offer Dev."),
    (150.0, "He writes the exact local draft."),
    (155.0, "He reviews the text and example audience."),
    (160.0, "The private conversation is excluded."),
    (165.0, "Consent stays off; posting is disabled."),
    (170.0, "The draft remains local and unsent."),
    (175.0, "Nothing is sent without consent."),
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

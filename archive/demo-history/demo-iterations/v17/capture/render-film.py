#!/usr/bin/env python3
"""Cut captured, local React interactions into the v17 preview film."""
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

# marker, source offset, source seconds, output seconds, focus crop.
# Reframing calls attention to real changed words and controls, not invented UI.
specs = [
    ("01-arjun-fictional-hook", .1, 3.8, 4, "entry_headline"),
    ("01-arjun-fictional-hook", .5, 3.8, 4, "entry_promise"),
    ("01-arjun-fictional-hook", 1.0, 3.8, 4, "entry_mechanism"),
    ("01-arjun-fictional-hook", 2.0, 2.8, 3, "entry_role"),
    ("02-start-privately", .1, 2.8, 3, "conversation_top"),
    ("03-prepared-first-reply", .1, 3.8, 4, "reply_focus"),
    ("03-prepared-first-reply", .2, 4.8, 5, "reply_context"),
    ("03-prepared-first-reply", 4.1, 3.8, 4, "reply_focus"),
    ("04-not-quite-selected", .1, 3.8, 4, "not_quite"),
    ("05-arjun-rewrites", .1, 4.8, 5, "rewrite"),
    ("05-arjun-rewrites", 5.1, 3.8, 4, "rewrite_words"),
    ("06-changed-editable-reflection", .1, 4.8, 5, "changed"),
    ("06-changed-editable-reflection", 5.1, 2.8, 3, "changed_words"),
    ("06a-arjun-confirms-reflection", .1, 3.8, 4, "confirmed"),
    ("06a-arjun-confirms-reflection", .2, 4.8, 5, "outcome_choice"),
    ("06b-private-outcome-selected", .1, 3.8, 4, "private_outcome"),
    ("06b-private-outcome-selected", 4.1, 4.8, 5, "private_outcome_close"),
    ("06c-optional-human-perspectives", .1, 4.8, 5, "peer_choice"),
    ("07-day-4-peer-perspective", .1, 4.8, 5, "day4"),
    ("07-day-4-peer-perspective", 4.1, 3.8, 4, "day4_perspective"),
    ("08-day-9-host-boundary", .1, 4.8, 5, "day9"),
    ("08-day-9-host-boundary", 4.1, 3.8, 4, "host_boundary"),
    ("09-prepared-no-report", .1, 2.8, 3, "triage"),
    ("10-day-16-dev-unanswered", .1, 4.8, 5, "day16"),
    ("10-day-16-dev-unanswered", 4.1, 3.8, 4, "dev_unanswered"),
    ("10-day-16-dev-unanswered", .2, 4.8, 5, "day16_status"),
    ("11-ravi-before-edit", .1, 2.8, 3, "ravi_edit"),
    ("12-ravi-changed-preview", .1, 4.8, 5, "ravi_preview"),
    ("12-ravi-changed-preview", 4.1, 4.8, 5, "ravi_preview_detail"),
    ("13-support-caveat", .1, 2.8, 3, "support"),
    ("13a-support-return-peers", .1, 2.8, 3, "support_return"),
    ("14-selected-private-takeaway", .1, 4.8, 5, "takeaway"),
    ("14-selected-private-takeaway", 4.1, 3.8, 4, "takeaway_close"),
    ("15-private-only-choice", .1, 3.8, 4, "maybe_later"),
    ("16-optional-offer-selected", .1, 4.8, 5, "optional_offer"),
    ("17-exact-unsent-dev-draft", .1, 4.8, 5, "dev_draft"),
    ("17-exact-unsent-dev-draft", 4.1, 3.8, 4, "dev_draft_detail"),
    ("18-composed-agency-close", .1, 4.8, 5, "close"),
    ("18-composed-agency-close", 4.1, 4.8, 5, "close_private"),
    ("18-composed-agency-close", .2, 4.8, 5, "close_boundary"),
    ("18-composed-agency-close", 4.2, 4.8, 5, "close"),
    ("18-composed-agency-close", .2, 2.8, 3, "close_private"),
]

timeline = json.loads(TIMELINE.read_text())
times = {row["name"]: row["seconds"] for row in timeline}
shots = [(marker, times[marker] + offset, times[marker] + offset + source_len, output_len, profile)
         for marker, offset, source_len, output_len, profile in specs]

profiles = {
    "entry_headline": (80, 30, 1440, 400),
    "entry_promise": (80, 130, 1440, 510),
    "entry_mechanism": (80, 250, 1440, 450),
    "entry_role": (80, 350, 1440, 420),
    "conversation_top": (0, 0, 1600, 700),
    "reply_focus": (0, 50, 1600, 740),
    "reply_context": (100, 80, 1400, 700),
    "not_quite": (0, 100, 1600, 720),
    "rewrite": (0, 120, 1600, 720),
    "rewrite_words": (100, 350, 1400, 400),
    "changed": (0, 70, 1600, 730),
    "changed_words": (150, 380, 1300, 380),
    "confirmed": (0, 130, 1600, 690),
    "outcome_choice": (0, 220, 1600, 650),
    "private_outcome": (0, 260, 1600, 630),
    "private_outcome_close": (120, 360, 1360, 480),
    "peer_choice": (100, 0, 1400, 730),
    "day4": (100, 220, 1400, 580),
    "day4_perspective": (180, 350, 1240, 480),
    "day9": (100, 220, 1400, 580),
    "host_boundary": (180, 360, 1240, 460),
    "triage": (180, 660, 1240, 230),
    "day16": (100, 220, 1400, 580),
    "dev_unanswered": (180, 300, 1240, 500),
    "day16_status": (180, 560, 1240, 330),
    "ravi_edit": (100, 80, 1400, 620),
    "ravi_preview": (80, 0, 1440, 740),
    "ravi_preview_detail": (180, 200, 1240, 520),
    "support": (180, 150, 1240, 460),
    "support_return": (180, 260, 1240, 420),
    "takeaway": (180, 500, 1240, 390),
    "takeaway_close": (180, 550, 1240, 340),
    "maybe_later": (180, 350, 1240, 440),
    "optional_offer": (180, 320, 1240, 480),
    "dev_draft": (180, 180, 1240, 620),
    "dev_draft_detail": (180, 420, 1240, 350),
    "close": (120, 120, 1360, 680),
    "close_private": (160, 220, 1280, 540),
    "close_boundary": (160, 390, 1280, 370),
}

position = 0.0
for row in shots:
    position += row[3]
END = position
if not 176 <= END <= 179:
    raise SystemExit(f"Expected a 176–179 second film, got {END:.3f}s")
if any(row[3] > 5.0 for row in shots):
    raise SystemExit("No shot may hold longer than five seconds")

lines = [
    (0.0, "I can’t tell my family what I want without feeling ungrateful."),
    (5.0, "For adults facing family pressure, this starts in private."),
    (10.0, "Find words for a boundary you choose."),
    (15.0, "Possible themes are a prepared mock-up, not generated."),
    (20.0, "Planned Muse Spark could organize possibilities for review."),
    (25.0, "No model is connected. Arjun shares what he wants to explore."),
    (30.0, "The local reply is only a prepared possibility."),
    (35.0, "Arjun chooses Not quite."),
    (40.0, "He changes partner to parents and asks for time."),
    (45.0, "The reflection changes with his edited words."),
    (50.0, "He confirms what feels closer."),
    (55.0, "He keeps one next step private: I can ask for time before deciding."),
    (60.0, "Only then does he choose whether peer experience could help."),
    (65.0, "Day four: a fictional peer describes a different experience."),
    (70.0, "That perspective can add context without choosing for him."),
    (75.0, "Day nine: the fictional host sets a boundary."),
    (80.0, "I can listen. I can’t decide for you."),
    (85.0, "A prepared triage example sends no report."),
    (90.0, "Day sixteen: Dev’s question stays unanswered."),
    (95.0, "No reply is promised."),
    (100.0, "Arjun edits one question for Ravi."),
    (105.0, "The exact group preview names the audience and alias."),
    (110.0, "Ravi accepts group replies only, never a private message."),
    (115.0, "Private conversation is excluded. Consent stays unchecked."),
    (120.0, "Nothing is sent. No provider is verified or bookable here."),
    (125.0, "He returns to the peer story, with his own choice intact."),
    (130.0, "His takeaway is kept in this preview session only."),
    (135.0, "Maybe later leaves any contribution optional."),
    (140.0, "He drafts one bounded thought he could offer Dev."),
    (145.0, "It is local, fictional and unsent."),
    (150.0, "The optional group draft leaves his private conversation out."),
    (155.0, "Consent is unchecked. Posting is disabled."),
    (160.0, "No send action is connected."),
    (165.0, "Arjun keeps the next step in his hands."),
    (170.0, "I can ask for time before deciding."),
    (174.0, "He keeps his takeaway private. Nothing is sent."),
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
    output, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and len(candidate) > width:
            output.append(current)
            current = word
        else:
            current = candidate
    if current:
        output.append(current)
    return "\\N".join(output)


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
        raise SystemExit(f"Narration cue {i+1} overruns next beat ({start:.2f}s + {length:.2f}s; limit {limit:.2f}s): {text}")
    cues.append((start, end, wrap_caption(text)))
if any(a[1] >= b[0] for a, b in zip(cues, cues[1:])):
    raise SystemExit("Generated SRT cue timings overlap")
CAPTIONS.write_text("\n\n".join(f"{i}\n{stamp(start)} --> {stamp(end)}\n{text.replace(chr(92)+'N', chr(10))}" for i, (start, end, text) in enumerate(cues, 1)) + "\n", encoding="utf-8")
TRANSCRIPT.write_text("\n\n".join(text for _, text in lines) + "\n", encoding="utf-8")
if os.environ.get("VALIDATE_ONLY") == "1":
    for (start, text), length, (_, cue_end, _) in zip(lines, voice_durations, cues):
        print(f"{start:7.3f}–{cue_end:7.3f}  voice {length:4.2f}s  {text}")
    for path in voices:
        path.unlink(missing_ok=True)
        path.with_suffix(".txt").unlink(missing_ok=True)
    raise SystemExit(0)

video_parts = []
raw_duration = float(probe(SOURCE, "duration"))
for i, (_, source_start, source_end, out_duration, profile) in enumerate(shots):
    source_end = min(source_end, raw_duration - .04)
    if source_end <= source_start:
        raise SystemExit(f"Shot {i+1} starts beyond raw video")
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
print(f"Rendered {OUTPUT}; output={END:.3f}s, shots={len(shots)}, cues={len(cues)}; source={raw_duration:.3f}s")

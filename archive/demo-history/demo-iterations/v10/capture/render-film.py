#!/usr/bin/env python3
"""Render v10 from the actual React browser recording."""
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
VIDEO_PAD = min(0.5, max(0.0, 179.0 - VIDEO_END))
END = VIDEO_END + VIDEO_PAD
if not 176 <= END <= 179:
    raise SystemExit(f"Expected a 176–179 second film, got {END:.3f}s")
scene_rows = json.loads(TIMELINE.read_text(encoding="utf-8"))
scene = {row["name"]: float(row["seconds"]) for row in scene_rows}
def at(name: str) -> float:
    return scene[name] - TRIM_START

lines = [
    (0.0, "Arjun cannot tell his family what he wants without feeling ungrateful."),
    (4.6, "Planned Muse Spark: help organize a reflection Arjun can correct."),
    (at("03-prepared-first-reply"), "This prepared local reply is not a model response."),
    (at("03-prepared-first-reply") + 4.0, "His words lead to a possibility, not a conclusion."),
    (at("04-not-quite-selected"), "He says Not quite. The first thought misses him."),
    (at("05-arjun-rewrites"), "Arjun rewrites the correction in his own words."),
    (at("05-arjun-rewrites") + 3.5, "He names his parents, not separation."),
    (at("06-changed-editable-reflection"), "His correction changes the editable reflection."),
    (at("06-changed-editable-reflection") + 4.5, "Arjun can change the confirmed words or set them aside."),
    (at("06-changed-editable-reflection") + 9.0, "Planned Muse Spark could organize options for review, not decide."),
    (at("06-changed-editable-reflection") + 14.0, "Prepared local example. No model connected."),
    (at("07-day-4-peer-perspective"), "Day four: Ravi shares the pull between family care and time to choose."),
    (at("07-day-4-peer-perspective") + 4.5, "His experience offers perspective, not a decision for Arjun."),
    (at("08-day-9-host-boundary"), "Day nine: their talk became an argument."),
    (at("08-day-9-host-boundary") + 4.5, "Host: I can listen; I can’t decide for you."),
    (at("09-prepared-no-report"), "Prepared triage example. No report was sent."),
    (at("10-day-16-dev-unanswered"), "Day sixteen: Dev's side question has no replies yet."),
    (at("10-day-16-dev-unanswered") + 4.0, "This historical thread promises no response."),
    (at("11-ravi-before-edit"), "Ravi accepts replies in the group only, not privately."),
    (at("12-ravi-changed-preview"), "Arjun edits the question; the group preview changes."),
    (at("12-ravi-changed-preview") + 4.5, "Alias visible; group only, no private chat."),
    (at("12-ravi-changed-preview") + 9.0, "Consent remains unchecked and the next step stays disabled."),
    (at("12-ravi-changed-preview") + 14.0, "No message is sent to Ravi in this preview."),
    (at("13-support-caveat"), "No professional provider is verified or bookable here."),
    (at("13-support-caveat") + 4.0, "He can return to peer perspectives without sending this conversation."),
    (at("14-selected-private-takeaway"), "Arjun keeps a private takeaway: no one chooses for him."),
    (at("14-selected-private-takeaway") + 4.5, "He can leave with this thought and share nothing."),
    (at("14-selected-private-takeaway") + 9.0, "The fictional example remains his choice to use or set aside."),
    (at("14-selected-private-takeaway") + 13.5, "He chooses the pace."),
    (at("15-private-only-choice"), "Maybe later keeps the reflection private."),
    (at("15-private-only-choice") + 4.0, "No contribution is required."),
    (at("16-optional-offer-selected"), "Instead, Arjun chooses to offer one helpful thing to Dev."),
    (at("17-exact-unsent-dev-draft"), "He reviews one edited sentence for the fictional group."),
    (at("17-exact-unsent-dev-draft") + 4.0, "Alias visible; private context excluded."),
    (at("17-exact-unsent-dev-draft") + 8.0, "Consent off. Posting disabled. Local draft only."),
    (at("18-composed-agency-close"), "Takeaway private; Dev draft optional."),
    (at("18-composed-agency-close") + 4.2, "Prepared fictional-group draft; context private."),
    (at("18-composed-agency-close") + 8.5, "Nothing is sent without consent."),
    (at("18-composed-agency-close") + 15.2, "Arjun can leave the draft here."),
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
not_quite_start = at("04-not-quite-selected")
rewrite_start = at("05-arjun-rewrites")
corrected_start = at("06-changed-editable-reflection")
thread_start = at("07-day-4-peer-perspective")
thread_end = at("11-ravi-before-edit")
ravi_start = at("11-ravi-before-edit")
ravi_end = at("13-support-caveat")
support_start = at("13-support-caveat")
support_end = at("14-selected-private-takeaway")
take_start = at("14-selected-private-takeaway")
draft_start = at("16-optional-offer-selected")
draft_end = at("18-composed-agency-close")
close_start = at("18-composed-agency-close")
video = (
    f"[0:v]trim=start={TRIM_START},setpts=PTS-STARTPTS,split=11[base][entry][notquite][rewrite][corrected][thread][ravi][support][take][final][close];"
    "[base]scale=1920:1080:flags=lanczos[baseout];"
    "[entry]crop=1600:700:0:0,scale=1920:840:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[entryout];"
    "[notquite]crop=1600:760:0:100,scale=1920:912:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[notquiteout];"
    "[rewrite]crop=1600:800:0:100,scale=1920:960:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[rewriteout];"
    "[corrected]crop=1600:700:0:0,scale=1920:840:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[correctedout];"
    "[thread]crop=1600:670:0:230,scale=1920:804:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[threadout];"
    "[ravi]crop=1600:790:0:0,scale=1920:948:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[raviout];"
    "[support]crop=1600:800:0:0,scale=1920:960:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[supportout];"
    "[take]crop=1600:800:0:100,scale=1920:960:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[takeout];"
    "[final]crop=1600:800:0:100,scale=1920:960:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[finalout];"
    "[close]crop=1600:760:0:100,scale=1920:912:flags=lanczos,pad=1920:1080:0:0:color=0xf7f6f2[closeout];"
    f"[baseout][entryout]overlay=0:0:enable='between(t,0,{entry_end:.3f})'[v1];"
    f"[v1][notquiteout]overlay=0:0:enable='between(t,{not_quite_start:.3f},{rewrite_start:.3f})'[v2];"
    f"[v2][rewriteout]overlay=0:0:enable='between(t,{rewrite_start:.3f},{corrected_start:.3f})'[v3];"
    f"[v3][correctedout]overlay=0:0:enable='between(t,{corrected_start:.3f},{thread_start:.3f})'[v4];"
    f"[v4][threadout]overlay=0:0:enable='between(t,{thread_start:.3f},{thread_end:.3f})'[v5];"
    f"[v5][raviout]overlay=0:0:enable='between(t,{ravi_start:.3f},{ravi_end:.3f})'[v6];"
    f"[v6][supportout]overlay=0:0:enable='between(t,{support_start:.3f},{support_end:.3f})'[v7];"
    f"[v7][takeout]overlay=0:0:enable='between(t,{take_start:.3f},{draft_start:.3f})'[v8];"
    f"[v8][finalout]overlay=0:0:enable='between(t,{draft_start:.3f},{draft_end:.3f})'[v9];"
    f"[v9][closeout]overlay=0:0:enable='between(t,{close_start:.3f},{END:.3f})'[v10];"
    f"[v10]setpts=PTS-STARTPTS,fps=30,subtitles={CAPTIONS}:force_style='FontName=DejaVu Sans,FontSize=10,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=10,Alignment=2',tpad=stop_mode=clone:stop_duration=1,trim=end_frame={int(END*30)},setpts=N/(30*TB)[vout]"
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

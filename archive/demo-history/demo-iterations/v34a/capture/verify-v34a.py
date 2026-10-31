#!/usr/bin/env python3
"""Correct video-only verification for the preserved v34a candidate."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[3]
MASTER = ROOT / "demo-iterations/v13/demo.mp4"
CANDIDATE = ROOT / "demo-iterations/v34a/demo.mp4"
OUT = ROOT / "demo-iterations/v34a/verification"


def run(args):
    return subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def digest_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frame_hashes(path, vf=None):
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-map", "0:v:0"]
    if vf:
        args += ["-vf", vf]
    args += ["-fps_mode", "passthrough", "-f", "framemd5", "-"]
    data = run(args).stdout
    return [line.rsplit(b",", 1)[-1].strip().decode() for line in data.splitlines()
            if line.strip() and not line.startswith(b"#")]


def audio_hash(path):
    return run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
                "-map", "0:a:0", "-c:a", "copy", "-f", "hash", "-hash", "sha256", "-"]).stdout.decode().strip()


OUT.mkdir(parents=True, exist_ok=True)
for path in (MASTER, CANDIDATE):
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "null", "-"])

master_frames = frame_hashes(MASTER)
candidate_frames = frame_hashes(CANDIDATE)
windows = {}
for name, start, end in (("preWindow", 0, 114), ("editedWindow", 114, 321), ("postWindow", 321, 5363)):
    mismatches = [i for i in range(start, min(end, len(master_frames), len(candidate_frames)))
                  if master_frames[i] != candidate_frames[i]]
    windows[name] = {
        "frameRangeInclusiveExclusive": [start, end],
        "framesCompared": min(end, len(master_frames), len(candidate_frames)) - start,
        "mismatchCount": len(mismatches),
        "firstMismatchFrames": mismatches[:20],
        "identical": not mismatches and len(master_frames) >= end and len(candidate_frames) >= end,
    }

master_band = frame_hashes(MASTER, "crop=1920:180:0:900,format=yuv420p")
candidate_band = frame_hashes(CANDIDATE, "crop=1920:180:0:900,format=yuv420p")
master_audio = audio_hash(MASTER)
candidate_audio = audio_hash(CANDIDATE)
sidecar_equal = (ROOT / "demo-iterations/v13/captions.srt").read_bytes() == (ROOT / "demo-iterations/v34a/capture/captions.srt").read_bytes()
result = {
    "master": "demo-iterations/v13/demo.mp4",
    "masterSha256": digest_file(MASTER),
    "candidate": "demo-iterations/v34a/demo.mp4",
    "candidateSha256": digest_file(CANDIDATE),
    "fullDecode": "passed for master and candidate",
    "videoOnlyHashMethod": "ffmpeg framemd5 with -map 0:v:0; raw decoded yuv420p frame hashes",
    "videoFrameCountMaster": len(master_frames),
    "videoFrameCountCandidate": len(candidate_frames),
    "decodedVideoWindows": windows,
    "captionBand": {
        "crop": "1920x180 at x=0,y=900",
        "masterFrames": len(master_band),
        "candidateFrames": len(candidate_band),
        "identicalAllFrames": master_band == candidate_band,
    },
    "audioPacketPayloadSha256Master": master_audio,
    "audioPacketPayloadSha256Candidate": candidate_audio,
    "audioBitstreamIdentical": master_audio == candidate_audio,
    "captionsSidecarIdentical": sidecar_equal,
    "priorFailure": {
        "reportedPost15Identical": False,
        "reportedPostWindowFrames": 13421,
        "cause": "The prior framemd5 helper omitted -map 0:v:0, so its returned checksum list combined video frames and AAC packets and was not a valid frame-to-frame comparison.",
        "correctedPostWindowIdentical": windows["postWindow"]["identical"],
    },
}
(OUT / "media-checks.json").write_text(json.dumps(result, indent=2) + "\n")
(OUT / "sha256.txt").write_text(f"{result['candidateSha256']}  demo-iterations/v34a/demo.mp4\n")
print(json.dumps(result, indent=2))

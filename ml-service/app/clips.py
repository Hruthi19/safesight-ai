import os
import subprocess
import tempfile
import uuid


def extract_clip(video_path, center_sec, before=10, after=10):
    """Extract a video clip around a detection timestamp."""
    start = max(0, center_sec - before)
    duration = before + after
    output = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.mp4")

    cmd = [
        "ffmpeg",
        "-y",
        "-ss",
        str(start),
        "-i",
        video_path,
        "-t",
        str(duration),
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-c:a",
        "aac",
        output,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[:200]}")

    return output


def get_video_duration(video_path):
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        video_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        return 0
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0

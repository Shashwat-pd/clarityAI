import subprocess


def pcm_to_mp3(pcm_bytes: bytes, sample_rate: int = 24000) -> bytes:
    result = subprocess.run(
        [
            "ffmpeg", "-f", "s16le", "-ar", str(sample_rate), "-ac", "1",
            "-i", "pipe:0", "-f", "mp3", "pipe:1",
        ],
        input=pcm_bytes,
        capture_output=True,
        check=True,
    )
    return result.stdout


MIMETYPE_MAP = {
    "audio/webm": "audio/webm",
    "audio/ogg": "audio/ogg",
    "audio/mp3": "audio/mpeg",
    "audio/mpeg": "audio/mpeg",
    "audio/wav": "audio/wav",
    "audio/x-wav": "audio/wav",
    "audio/m4a": "audio/mp4",
    "audio/mp4": "audio/mp4",
}


def normalize_mimetype(content_type: str) -> str:
    base = content_type.split(";")[0].strip().lower()
    return MIMETYPE_MAP.get(base, base)

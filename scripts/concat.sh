#!/usr/bin/env bash
# Authorized final-export tool. Usage: bash concat.sh audio.mp3 final.mp4 part1.mp4 part2.mp4
# Segments must be contiguous and share fps. Do not run for previews.
set -euo pipefail
if [ "$#" -lt 3 ]; then
  echo "Usage: bash scripts/concat.sh audio.mp3 final.mp4 part1.mp4 [part2.mp4 ...]" >&2
  exit 2
fi
AUDIO="$1"; OUT="$2"; shift 2
LIST=$(mktemp)
JOINED=$(mktemp "${TMPDIR:-/tmp}/motion-layer-joined.XXXXXX.mp4")
cleanup() { rm -f "$LIST" "$JOINED"; }
trap cleanup EXIT
for f in "$@"; do
  printf "file '%s'\n" "$(realpath "$f")" >> "$LIST"
done
ffmpeg -y -f concat -safe 0 -i "$LIST" -c copy "$JOINED"
ffmpeg -y -i "$JOINED" -i "$AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "完成：$OUT"

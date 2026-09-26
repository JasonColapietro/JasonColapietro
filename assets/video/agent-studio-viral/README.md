# Agent Studio: viral promo

`agent-studio-viral.mp4`: 31.5 s, 1080×1920 (9:16), 30 fps, H.264 + AAC. Made for TikTok, Reels, and Shorts.

- **Footage:** real Suede Agent Studio product captures and App Store / Google Play screenshots from the `suede-agent-studio` repo.
- **Music:** an original 128 BPM track in A minor, synthesized from scratch in `music.py` with no samples, so there's nothing to license. It goes intro and riser, drop, breakdown, second drop, then an impact.
- **Edit:** `render.py` cuts on the beat, adds kick-synced zoom punches, flashes on the drops, and kinetic captions in the brand fonts (Instrument Serif, Geist) and indigo `#4f46e5`.

To rebuild, put `suede-agent-studio` at `/home/user/suede-agent-studio`, then:

```sh
pip install numpy pillow imageio-ffmpeg
python3 music.py && python3 render.py agent-studio-viral.mp4
```

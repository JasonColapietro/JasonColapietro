"""Beat-synced 9:16 promo for Suede Agent Studio. Frames piped to ffmpeg."""
import math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import imageio_ffmpeg

REPO = "/home/user/suede-agent-studio"
W, H, FPS = 1080, 1920, 30
BPM = 128; BEAT = 60 / BPM; BAR = BEAT * 4
TOTAL = 16 * BAR + 1.5
INDIGO = (79, 70, 229); INK = (16, 17, 20); PAGE = (250, 251, 253); MUTED = (100, 104, 118)

F = f"{REPO}/src/lib/og/fonts"
def font(name, size): return ImageFont.truetype(f"{F}/{name}.ttf", size)
SERIF = lambda s: font("instrument-serif-400", s)
SERIF_I = lambda s: font("instrument-serif-400-italic", s)
SANS_B = lambda s: font("geist-sans-700", s)
SANS_M = lambda s: font("geist-sans-500", s)
MONO = ImageFont.truetype("/mnt/skills/examples/canvas-design/canvas-fonts/GeistMono-Regular.ttf", 30)

def load(p): return Image.open(f"{REPO}/{p}").convert("RGB")
WEB = "docs/marketing/assets/source-captures/"
IOS = "ios-app/AppStore-Submission/screenshots-raw/en-US/iphone-69/"
AND = "ios-app/android/fastlane/metadata/android/en-US/images/phoneScreenshots/"

# ---------- helpers ----------
def ease_out(x): x = min(max(x, 0), 1); return 1 - (1 - x) ** 3
def ease_io(x): x = min(max(x, 0), 1); return x * x * (3 - 2 * x)

def rounded(img, r):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], r, fill=255)
    out = Image.new("RGBA", img.size); out.paste(img, (0, 0), m); return out

def with_shadow(card, blur=40, off=24, alpha=70):
    pad = blur * 2
    sh = Image.new("RGBA", (card.width + pad * 2, card.height + pad * 2), (0, 0, 0, 0))
    a = card.split()[3].point(lambda v: alpha if v else 0)
    sh.paste((20, 18, 60, 255), (pad, pad + off), a)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(card, (pad, pad))
    return sh

def phone(img, h=1480):
    """Screenshot in a phone bezel, returned as RGBA with shadow."""
    w = int(img.width * h / img.height)
    scr = rounded(img.resize((w, h), Image.LANCZOS), 70)
    b = 22
    body = Image.new("RGBA", (w + 2 * b, h + 2 * b))
    ImageDraw.Draw(body).rounded_rectangle([0, 0, body.width - 1, body.height - 1], 90, fill=(18, 18, 22, 255))
    body.alpha_composite(scr, (b, b))
    ImageDraw.Draw(body).rounded_rectangle([body.width // 2 - 90, b + 18, body.width // 2 + 90, b + 70], 28, fill=(8, 8, 10, 255))
    return with_shadow(body, 50, 30, 90)

def browser(img, crop, width=980):
    """Crop of a web capture inside a browser chrome card."""
    c = img.crop(crop)
    h = int(c.height * width / c.width)
    c = c.resize((width, h), Image.LANCZOS)
    bar = 56
    card = Image.new("RGB", (width, h + bar), (255, 255, 255))
    d = ImageDraw.Draw(card)
    d.rectangle([0, 0, width, bar], fill=(241, 242, 247))
    for i, col in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        d.ellipse([22 + i * 30, 20, 38 + i * 30, 36], fill=col)
    d.rounded_rectangle([130, 12, width - 40, bar - 12], 14, fill=(255, 255, 255))
    d.text((150, 16), "agents.suedeai.ai", font=SANS_M(22), fill=MUTED)
    card.paste(c, (0, bar))
    return with_shadow(rounded(card, 26), 45, 28, 80)

BG_CACHE = {}
def background(kind="light"):
    if kind in BG_CACHE: return BG_CACHE[kind].copy()
    if kind == "light":
        bg = Image.new("RGB", (W, H), PAGE); d = ImageDraw.Draw(bg)
        for x in range(0, W, 54): d.line([x, 0, x, H], fill=(236, 237, 250))
        for y in range(0, H, 54): d.line([0, y, W, y], fill=(236, 237, 250))
        glow = Image.new("RGB", (W, H), (0, 0, 0)); ImageDraw.Draw(glow).ellipse([-300, 500, 1380, 1700], fill=(60, 55, 30))
        bg = Image.fromarray(np.clip(np.asarray(bg, np.int16) - np.asarray(glow.filter(ImageFilter.GaussianBlur(220)), np.int16) // 3, 0, 255).astype(np.uint8))
    else:  # indigo
        y = np.linspace(0, 1, H)[:, None, None]
        top = np.array([30, 27, 75]); bot = np.array([79, 70, 229])
        arr = (top * (1 - y) + bot * y) * np.ones((1, W, 1))
        bg = Image.fromarray(arr.astype(np.uint8)); d = ImageDraw.Draw(bg)
        for x in range(0, W, 54): d.line([x, 0, x, H], fill=(255, 255, 255, 20))
        bg = Image.blend(bg, Image.fromarray(arr.astype(np.uint8)), 0.85)
    BG_CACHE[kind] = bg
    return bg.copy()

def place(canvas, layer, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
    if scale != 1.0:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.BILINEAR)
    if rot: layer = layer.rotate(rot, Image.BILINEAR, expand=True)
    if alpha < 1: layer.putalpha(layer.split()[3].point(lambda v: int(v * alpha)))
    canvas.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)

def text_center(d, y, txt, f, fill, cx=W // 2):
    w = d.textlength(txt, font=f); d.text((cx - w / 2, y), txt, font=f, fill=fill)

def pill(canvas, y, txt, t_in, size=58, bg=INDIGO, fg=(255, 255, 255)):
    """Caption pill that pops in with overshoot."""
    if t_in < 0: return
    f = SANS_B(size)
    d0 = ImageDraw.Draw(canvas)
    tw = d0.textlength(txt, font=f); pw, ph = int(tw + 70), int(size * 1.7)
    lay = Image.new("RGBA", (pw, ph)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle([0, 0, pw - 1, ph - 1], ph // 2, fill=bg + (255,))
    d.text((35, (ph - size * 1.2) / 2), txt, font=f, fill=fg)
    k = min(t_in / 0.18, 1); s = 0.6 + 0.4 * (1 + 0.25 * math.sin(k * math.pi)) if k < 1 else 1.0
    place(canvas, with_shadow(lay, 20, 10, 60), W // 2, y, s, alpha=min(1, t_in / 0.08))

def headline(canvas, y, parts, t_in, size=112, color=INK):
    """Serif headline; parts = [(text, italic_indigo?)] ; slides up."""
    if t_in < 0: return
    k = ease_out(t_in / 0.35)
    d = ImageDraw.Draw(canvas)
    fonts = [SERIF_I(size) if it else SERIF(size) for _, it in parts]
    total = sum(d.textlength(t, font=f) for (t, _), f in zip(parts, fonts))
    x = W / 2 - total / 2; yy = y + (1 - k) * 60
    lay = Image.new("RGBA", (W, int(size * 1.4))); dl = ImageDraw.Draw(lay)
    for (t, it), f in zip(parts, fonts):
        dl.text((x, 0), t, font=f, fill=(INDIGO if it else color) + (255,)); x += d.textlength(t, font=f)
    place(canvas, lay, W / 2, yy + lay.height / 2, alpha=k)

# ---------- assets ----------
print("building assets", file=sys.stderr)
A = {
    "earn": phone(load(AND + "01_AgentsThatEarn.png")),
    "dir": phone(load(IOS + "02-directory.png")),
    "endpoint": phone(load(IOS + "03-agent-endpoint.png")),
    "flows": phone(load(IOS + "04-flows.png")),
    "docs": phone(load(IOS + "05-docs.png")),
    "studio_ios": phone(load(IOS + "01-studio.png")),
    "templates": phone(load(AND + "03_AgentTemplates.png")),
    "company": phone(load(AND + "04_AutonomousCompany.png")),
    "adir": phone(load(AND + "02_AgentDirectory.png")),
    "orgchart": browser(load(WEB + "homepage-hero-1440x900.png"), (740, 90, 1300, 740), 900),
    "guided": browser(load(WEB + "guided-builder-1440x900.png"), (150, 80, 1150, 600), 980),
    "canvas": browser(load(WEB + "studio-contract-scan-1440x900.png"), (0, 0, 1440, 900), 1400),
    "scorecard": browser(load(WEB + "public-agent-sales-scorecard-1440x900.png"), (300, 100, 1080, 900), 900),
    "site": browser(load(WEB + "website-to-agent-1440x900.png"), (130, 130, 1000, 880), 920),
    "comp_web": browser(load(WEB + "company-templates-1440x900.png"), (130, 120, 1220, 820), 1000),
}
ICON = rounded(load("ios-app/assets/icon-only.png").resize((300, 300), Image.LANCZOS), 66)

# ---------- scenes ----------
def s_intro(t, dur):
    c = background("indigo")
    # blurred phone rising behind
    k = ease_io(t / dur)
    place(c, A["earn"], W / 2, 2350 - 450 * k, 0.9, alpha=0.35 + 0.4 * k)
    d = ImageDraw.Draw(c)
    lines = [(0, "What if every seat", SERIF(104)), (1, "in your company", SERIF(104)),
             (2, "was an AI agent", SERIF_I(118)), (4, "…that gets paid", SERIF_I(118)), (5, "per call?", SANS_B(96))]
    y = 240
    for beat, txt, f in lines:
        tin = t - beat * BEAT
        if tin >= 0:
            kk = ease_out(tin / 0.25)
            lay = Image.new("RGBA", (W, 170)); dl = ImageDraw.Draw(lay)
            col = (199, 210, 254) if f in () else (255, 255, 255)
            if "agent" in txt or "paid" in txt: col = (165, 180, 252)
            w = dl.textlength(txt, font=f); dl.text(((W - w) / 2, 10), txt, font=f, fill=col + (255,))
            place(c, lay, W / 2, y + 85 + (1 - kk) * 50, 1 + 0.15 * (1 - kk), alpha=kk)
        y += 150
    return c

def s_phone(key, cap, head=None):
    def f(t, dur):
        c = background("light")
        k = ease_out(t / 0.4)
        z = 1.12 - 0.12 * k + 0.05 * (t / dur)
        place(c, A[key], W / 2, 1060 + (1 - k) * 200, 0.95 * z)
        if head: headline(c, 120, head, t)
        pill(c, 1720, cap, t - 0.12)
        return c
    return f

def s_web(key, cap, head=None, pan=None, zoom=(0.98, 1.06), y=1000):
    def f(t, dur):
        c = background("light")
        p = t / dur; k = ease_out(t / 0.4)
        z = zoom[0] + (zoom[1] - zoom[0]) * ease_io(p)
        dx = 0 if pan is None else pan[0] + (pan[1] - pan[0]) * ease_io(p)
        place(c, A[key], W / 2 + dx + (1 - k) * 400, y, z, rot=(1 - k) * 4)
        if head: headline(c, 150, head, t)
        pill(c, 1720, cap, t - 0.12)
        return c
    return f

def s_break(t, dur):
    c = background("light")
    p = t / dur
    place(c, A["comp_web"], W / 2, 1000, 0.95 + 0.12 * ease_io(p))
    headline(c, 150, [("Pick a template.", False)], t)
    headline(c, 290, [("It opens ", False), ("pre-staffed.", True)], t - 2 * BEAT)
    if t > 5 * BEAT:
        pill(c, 1720, "Departments · specialists · budgets", t - 5 * BEAT, 46)
    # darken into drop
    if p > 0.85:
        a = (p - 0.85) / 0.15
        c = Image.blend(c, background("indigo"), a * 0.9)
    return c

MONTAGE = [("studio_ios", "Guided."), ("canvas_ph", "Studio."), ("docs", "Code."), ("flows", "Versioned."),
           ("endpoint", "Priced."), ("adir", "Live."), ("company", "Your company."), ("earn", "Every seat earns.")]
def s_montage(t, dur):
    i = min(int(t / BEAT), 7); tl = t - i * BEAT
    key, word = MONTAGE[i]
    c = background("indigo" if i % 2 else "light")
    if key == "canvas_ph":
        place(c, A["canvas"], W / 2, 980, 0.72 + 0.06 * tl / BEAT, rot=-3)
    else:
        place(c, A[key], W / 2 + (-1) ** i * 40 * (1 - ease_out(tl / 0.2)), 1040, 0.9 * (1.08 - 0.08 * ease_out(tl / 0.25)), rot=(-1) ** i * 2.5)
    col = (255, 255, 255) if i % 2 else INK
    d = ImageDraw.Draw(c)
    f = SERIF_I(150) if i >= 6 else SERIF(170)
    w = d.textlength(word, font=f)
    if w > W - 80: f = SERIF_I(118); w = d.textlength(word, font=f)
    d.text(((W - w) / 2, 110), word, font=f, fill=col)
    return c

def s_end(t, dur):
    c = background("indigo")
    d = ImageDraw.Draw(c)
    k = ease_out(t / 0.5)
    place(c, with_shadow(ICON, 40, 20, 110), W / 2, 560 - (1 - k) * 80, 0.6 + 0.4 * k, alpha=k)
    if t > BEAT:
        kk = ease_out((t - BEAT) / 0.4)
        lay = Image.new("RGBA", (W, 350)); dl = ImageDraw.Draw(lay)
        for yy, txt, f, col in [(0, "Suede Agent Studio", SERIF(110), (255, 255, 255)),
                                (150, "Build a company where", SERIF_I(72), (199, 210, 254)),
                                (228, "every seat is a service.", SERIF_I(72), (199, 210, 254))]:
            w = dl.textlength(txt, font=f); dl.text(((W - w) / 2, yy), txt, font=f, fill=col + (255,))
        place(c, lay, W / 2, 900 + 150 + (1 - kk) * 40, alpha=kk)
    if t > 2 * BEAT:
        pill(c, 1390, "Start building  →", t - 2 * BEAT, 64, bg=(255, 255, 255), fg=INDIGO)
    if t > 3 * BEAT:
        kk = ease_out((t - 3 * BEAT) / 0.3)
        lay = Image.new("RGBA", (W, 200)); dl = ImageDraw.Draw(lay)
        for yy, txt, f in [(0, "agents.suedeai.ai", SANS_B(60)), (90, "Web  ·  iOS  ·  Android", SANS_M(40))]:
            w = dl.textlength(txt, font=f); dl.text(((W - w) / 2, yy), txt, font=f, fill=(255, 255, 255, 255))
        place(c, lay, W / 2, 1620, alpha=kk)
    return c

TIMELINE = [  # (beats, scene)
    (8, s_intro),
    (4, s_phone("earn", "An agent in every seat.", [("Revenue on ", False), ("every call.", True)])),
    (4, s_web("orgchart", "Staff your org chart with agents", [("Chart your ", False), ("company.", True)], zoom=(0.98, 1.06))),
    (4, s_web("guided", "Describe the job → it builds the agent", [("Build it by ", False), ("describing it.", True)])),
    (4, s_web("canvas", "Rewire it on the canvas", [("Then open ", False), ("Studio.", True)], pan=(260, -260), zoom=(1.05, 1.15))),
    (2, s_phone("dir", "Agents for hire, by the call")),
    (2, s_phone("endpoint", "Pay-per-call endpoint")),
    (4, s_web("scorecard", "Paid over x402. No API key.", [("Every call ", False), ("pays for itself.", True)], zoom=(0.95, 1.08), y=1040)),
    (4, s_web("site", "Your website → a paid agent", [("Your site already ", False), ("knows.", True)], zoom=(0.95, 1.08), y=1040)),
    (2, s_phone("templates", "Start from 87 templates")),
    (2, s_phone("company", "Works while you don't")),
    (8, s_break),
    (8, s_montage),
    (8 + 1.5 / BEAT, s_end),
]

# ---------- render ----------
ff = imageio_ffmpeg.get_ffmpeg_exe()
out = sys.argv[1] if len(sys.argv) > 1 else "agent-studio-viral.mp4"
proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                         "-i", "music.wav", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], stdin=subprocess.PIPE)

starts = []; acc = 0
for beats, fn in TIMELINE: starts.append(acc); acc += beats * BEAT
nframes = int(TOTAL * FPS)
DROPS = [(2 * BAR, 10 * BAR), (12 * BAR, 16 * BAR)]
for fi in range(nframes):
    t = fi / FPS
    si = max(i for i, s in enumerate(starts) if s <= t + 1e-6)
    beats, fn = TIMELINE[si]
    tl = t - starts[si]
    img = fn(tl, beats * BEAT)
    in_drop = any(a <= t < b for a, b in DROPS)
    bt = (t % BEAT)
    # kick punch: subtle zoom on every beat during drops
    if in_drop:
        s = 1 + 0.025 * math.exp(-bt / 0.07)
        if s > 1.002:
            nw, nh = int(W * s), int(H * s)
            img = img.resize((nw, nh), Image.BILINEAR).crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    # white flash on scene cuts & drop hits
    if tl < 2 / FPS and si > 0:
        img = Image.blend(img, Image.new("RGB", (W, H), (255, 255, 255)), 0.55 if tl < 1 / FPS else 0.25)
    if any(abs(t - a) < 3 / FPS and t >= a for a, _ in DROPS):
        img = Image.blend(img, Image.new("RGB", (W, H), (255, 255, 255)), 0.8 - 0.25 * (t - [a for a, _ in DROPS if t >= a][-1]) * FPS)
    # progress bar
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, int(W * t / TOTAL), 8], fill=INDIGO)
    proc.stdin.write(img.tobytes())
    if fi % 90 == 0: print(f"{fi}/{nframes}", file=sys.stderr)
proc.stdin.close(); proc.wait()
print("done", out)

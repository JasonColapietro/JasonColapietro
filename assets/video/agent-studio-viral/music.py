"""Original 128 BPM EDM track for the Agent Studio promo. Fully synthesized, no samples."""
import numpy as np, wave

SR = 44100
BPM = 128
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 16
TAIL = 1.5
N = int((BARS * BAR + TAIL) * SR)
rng = np.random.default_rng(7)

L = np.zeros(N); R = np.zeros(N)

def at(t): return int(round(t * SR))

def add(sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if i >= N: return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414
    R[i:i + len(sig)] += sig * gain * r * 1.414

def env(n, a=0.002, d=0.1, s=0.0, rel=0.05, hold=None):
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    if hold is not None:
        e = np.where(t > hold, e[min(at(hold), n - 1)] * np.exp(-(t - hold) / rel), e)
    return e

def midi(m): return 440 * 2 ** ((m - 69) / 12)

def lowpass(x, cutoff):
    # one-pole, cutoff may be array
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); p = 0.0
    for i in range(len(x)):
        p = (1 - a[i]) * x[i] + a[i] * p; y[i] = p
    return y

# ---- drums ----
def kick():
    n = at(0.45); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t / 0.22)) + 0.3 * rng.standard_normal(n) * np.exp(-t / 0.004)

def clap():
    n = at(0.3); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = noise - lowpass(noise, 900)
    e = sum(np.exp(-np.clip(t - d, 0, None) / 0.012) * (t >= d) for d in (0, 0.011, 0.022))
    e = e * 0.5 + np.exp(-np.clip(t - 0.03, 0, None) / 0.09) * (t >= 0.03)
    return noise * e * 0.6

def hat(open_=False):
    n = at(0.25 if open_ else 0.05); t = np.arange(n) / SR
    x = rng.standard_normal(n); x = x - lowpass(x, 7000)
    return x * np.exp(-t / (0.08 if open_ else 0.012)) * 0.5

K, C, H, OH = kick(), clap(), hat(), hat(True)

# ---- synths ----
def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (f * (1 + detune) * t + rng.random()) % 1
    return 2 * ph - 1

def supersaw(freqs, dur, cutoff=5000, amp=0.12):
    n = at(dur)
    x = np.zeros(n)
    for f in freqs:
        for d in (-0.012, -0.006, 0, 0.006, 0.012):
            x += saw(f, n, d)
    x /= len(freqs) * 5
    e = env(n, a=0.01, d=10, s=1, rel=0.08, hold=dur - 0.08)
    return lowpass(x * e, cutoff) * amp * 6

def bass(f, dur):
    n = at(dur); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.tanh(3 * np.sin(2 * np.pi * f * t))
    return x * env(n, a=0.004, d=dur * 0.7, s=0.3, rel=0.03, hold=dur - 0.03) * 0.5

def pluck(f, dur=0.2):
    n = at(dur); t = np.arange(n) / SR
    x = saw(f, n) * 0.6 + saw(f, n, 0.005) * 0.6
    x = lowpass(x, 1200 + 6000 * np.exp(-t / 0.05))
    return x * np.exp(-t / 0.09) * 0.35

# Am - F - C - G   (A minor, uplifting)
PROG = [
    ([57, 60, 64, 69], 33),  # Am
    ([53, 57, 60, 65], 29),  # F
    ([55, 60, 64, 67], 36),  # C
    ([55, 59, 62, 67], 31),  # G
]
ARP = [[69, 72, 76, 81], [65, 69, 72, 77], [67, 72, 76, 79], [67, 71, 74, 79]]

DROP = set(range(2, 10)) | set(range(12, 16))
BREAK = {10, 11}
INTRO = {0, 1}

# chord sidechain envelope
side = np.ones(N)
for b in range(BARS):
    for q in range(4):
        t0 = b * BAR + q * BEAT
        if b in DROP:
            i = at(t0); n = at(BEAT)
            tt = np.arange(n) / SR
            side[i:i + n] = np.minimum(side[i:i + n], 0.25 + 0.75 * (1 - np.exp(-tt / 0.09)))

pad_L = np.zeros(N); pad_R = np.zeros(N)
for b in range(BARS):
    notes, root = PROG[b % 4]
    t0 = b * BAR
    freqs = [midi(m) for m in notes]
    if b in INTRO:
        cut = 900 + 1800 * b
    elif b in BREAK:
        cut = 1800 + 1500 * (b - 10)
    else:
        cut = 5500
    s = supersaw(freqs, BAR, cutoff=cut, amp=0.13 if b in DROP else 0.1)
    i = at(t0); s = s[: N - i]
    pad_L[i:i + len(s)] += s; pad_R[i:i + len(s)] += np.roll(s, 300)

    # drums
    if b in DROP:
        for q in range(4):
            add(K, t0 + q * BEAT, 0.95)
            add(OH, t0 + q * BEAT + BEAT / 2, 0.35, 0.2)
            add(bass(midi(root), BEAT / 2 - 0.01), t0 + q * BEAT + BEAT / 2, 0.8)
            add(bass(midi(root), BEAT / 4), t0 + q * BEAT + BEAT * 0.75, 0.45)
        for q in (1, 3):
            add(C, t0 + q * BEAT, 0.8)
        for s16 in range(16):
            add(H, t0 + s16 * BEAT / 4, 0.25 if s16 % 2 else 0.12, -0.3)
    # arp (all but first intro bar)
    if b >= 1:
        for s16 in range(16):
            m = ARP[b % 4][s16 % 4] + (12 if (s16 // 4) % 2 and b in DROP else 0)
            add(pluck(midi(m)), t0 + s16 * BEAT / 4, 0.5 if b in DROP else 0.35, 0.4 if s16 % 2 else -0.4)
    if b in BREAK:
        add(K, t0, 0.6)

L += pad_L * side; R += pad_R * side

# snare rolls + risers before each drop
def roll(t_start, bars=1):
    steps = [(i, 4) for i in range(4)] + [(i, 8) for i in range(8)] if bars == 1 else []
    t = t_start
    for d in (BEAT / 2,) * 2 + (BEAT / 4,) * 4 + (BEAT / 8,) * 8:
        add(C, t, 0.25 + 0.5 * (t - t_start) / BAR); t += d

def riser(t_start, dur):
    n = at(dur); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    x = lowpass(x, 300 + 9000 * (t / dur) ** 2)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1600 * (t / dur) ** 2) / SR) * 0.15
    return (x * 0.5 + sweep) * (t / dur) ** 1.5 * 0.5

def impact():
    n = at(1.6); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5)
    x = rng.standard_normal(n); x = lowpass(x, 3000) * np.exp(-t / 0.35)
    return boom * 0.9 + x * 0.35

roll(1 * BAR); add(riser(0, 2 * BAR), 0, 0.8)
roll(11 * BAR); add(riser(10 * BAR, 2 * BAR), 10 * BAR, 0.8)
for d in (2, 12):
    add(impact(), d * BAR, 0.7)
add(impact(), BARS * BAR, 0.8)
add(K, BARS * BAR, 1.0)
end = supersaw([midi(m) for m in PROG[0][0]], TAIL, cutoff=3000, amp=0.12)
add(end * np.exp(-np.arange(len(end)) / SR / 0.5), BARS * BAR, 0.8)

# simple stereo reverb-ish delay for width
def delay(x, t, fb=0.3, mix=0.18):
    d = at(t); y = x.copy()
    for k in range(1, 4):
        y[d * k:] += x[:-d * k] * (fb ** k) * mix / 0.3
    return y
L = delay(L, BEAT * 0.75); R = delay(R, BEAT * 0.5)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 0.9)  # glue/limit
mix /= np.abs(mix).max() * 1.05
fade = at(0.8); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

with wave.open("music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("duration", N / SR)

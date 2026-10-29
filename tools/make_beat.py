# Original 30 s bed at 120 BPM (beat = 0.5 s = 15 frames @ 30 fps). No samples, no licensing.
import numpy as np, wave, sys
SR = 48000; DUR = 30.0; BPM = 120; BEAT = 60 / BPM
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)
rng = np.random.default_rng(7)

def env(n, a, d):
    e = np.ones(n); ai = int(a * SR); e[:ai] = np.linspace(0, 1, ai) if ai else 1
    return e * np.exp(-np.arange(n) / (d * SR))

def add(at, sig):
    i = int(at * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[: j - i]

def kick(g=1.0):
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 45 + 110 * np.exp(-tt * 28)
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.16)

def hat(g=0.18):
    n = int(0.06 * SR); s = rng.standard_normal(n); s = np.diff(s, prepend=0)
    return g * s * env(n, 0.001, 0.015)

def clap(g=0.35):
    n = int(0.25 * SR); s = rng.standard_normal(n)
    return g * s * env(n, 0.001, 0.05)

def impact(g=1.0):  # big hit for slams
    n = int(1.6 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-tt * 9)) / SR) * env(n, 0.001, 0.5)
    noise = rng.standard_normal(n) * env(n, 0.001, 0.12) * 0.5
    return g * (boom + noise)

def riser(length, g=0.25):
    n = int(length * SR); tt = np.arange(n) / SR
    s = rng.standard_normal(n) * (tt / length) ** 2
    return g * s

# chord pads (A minor -> F -> C -> G), 2 bars each
chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
bar = 4 * BEAT
for k in range(int(DUR / (2 * bar)) + 1):
    c = chords[k % 4]; start = k * 2 * bar; n = int(2 * bar * SR); tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2.003 * f * tt) for f in c)
    add(start, 0.05 * pad * np.minimum(1, tt / 0.4) * np.minimum(1, (2 * bar - tt) / 0.3))
    # pulsing bass on 8ths
    for e in range(16):
        nn = int(BEAT / 2 * SR); te = np.arange(nn) / SR
        add(start + e * BEAT / 2, 0.22 * np.tanh(3 * np.sin(2 * np.pi * c[0] / 2 * te)) * env(nn, 0.003, 0.12))

nb = int(DUR / BEAT)
for b in range(nb):
    at = b * BEAT
    if 1.5 <= at < 28: add(at, kick())
    if 3 <= at < 28: add(at + BEAT / 2, hat())
    if 6 <= at < 28 and b % 2 == 1: add(at, clap())
for s in (0.0, 12.0, 19.0, 24.0): add(s, impact(0.9))   # hook slam, savings, total lock (frame 570), CTA
add(10.0, riser(2.0)); add(22.0, riser(2.0))
add(28.0, impact(0.6))

out *= np.minimum(1, (DUR - t) / 1.2)          # fade tail
out = np.tanh(out * 1.4) / np.tanh(1.4) * 0.85  # glue + limit
pcm = (out * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1], round(len(pcm) / SR, 2), "s")

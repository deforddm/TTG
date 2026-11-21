#!/usr/bin/env python3
"""Trygalle Run's app icon (the installed game's thumbnail): the warren torn open on the road at night, and a guild horse
at full gallop racing for it, in black against the light. Original art; the horse is the game's own (src/048_ttg_art.js).
Writes icon SVGs to a folder; tools/ttg_icon_png.js renders them to the PNGs the manifest names.
Run: python3 tools/ttg_icon.py OUTDIR"""
import json, math, os, random, subprocess, sys

out = sys.argv[1] if len(sys.argv) > 1 else '.'
horse = json.loads(subprocess.check_output(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ttg_horse_svg.js'),
    json.dumps([{'gait': 'run', 'ph': .78, 'col': '#07060a', 'mane': '#07060a', 'feather': '#07060a', 'far': True}])]))[0]
import re
horse = re.sub(r'fill="#(?!c9a15a)[0-9a-f]{6}"', 'fill="#07060a"', horse)  # one black silhouette against the light, brass left to catch it

def gash(cx, top, bot, wid, jag, seed, lean):
    rr = random.Random(seed); L, R = [], []
    n = 18
    for i in range(n + 1):
        t = i / n; y = top + (bot - top) * t
        w = wid * math.sin(math.pi * (.02 + .96 * t)) ** 1.05 * (1 + .22 * math.sin(t * 8))
        x = cx + (t - .5) * lean
        L.append((x - w + rr.uniform(-jag, jag), y)); R.append((x + w + rr.uniform(-jag, jag), y))
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in L + R[::-1]) + 'Z'

def icon(safe):
    # safe: the scale of the picture inside the square (maskable icons keep to the middle 80%)
    k = safe
    o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
         '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06070f"/><stop offset=".6" stop-color="#171331"/><stop offset="1" stop-color="#2a1d36"/></linearGradient>'
         '<radialGradient id="g" cx="300" cy="230" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c9f2d8" stop-opacity=".6"/><stop offset=".35" stop-color="#7fd0b0" stop-opacity=".22"/><stop offset="1" stop-color="#3d6a72" stop-opacity="0"/></radialGradient>'
         '<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fff6"/><stop offset=".5" stop-color="#c4f0d8"/><stop offset=".85" stop-color="#f2dca0"/><stop offset="1" stop-color="#ffd890"/></linearGradient>'
         '<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter><filter id="b2"><feGaussianBlur stdDeviation="2"/></filter></defs>',
         '<rect width="512" height="512" fill="url(#s)"/><rect width="512" height="512" fill="url(#g)"/>']
    rr = random.Random(4)
    for _ in range(40):
        x, y = rr.uniform(0, 512), rr.uniform(0, 300)
        if abs(x - 300) < 110: continue
        o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rr.choice([1, 1.4, 2])}" fill="#dfe6ff" opacity="{rr.uniform(.3, .8):.2f}"/>')
    if k < 1: o.append('<rect y="400" width="512" height="112" fill="#0c0a12"/>')  # the ground runs to the edges of a maskable icon
    o.append(f'<g transform="translate(256 256) scale({k}) translate(-256 -256)">')
    cx, top, bot, lean = 300, 40, 420, -60
    o.append(f'<path d="{gash(cx, top, bot, 150, 18, 2, lean)}" fill="#9fe8c4" opacity=".3" filter="url(#b)"/>')
    o.append(f'<path d="{gash(cx, top, bot, 84, 14, 3, lean)}" fill="#0b0912"/>')
    o.append(f'<path d="{gash(cx, top, bot, 64, 7, 5, lean)}" fill="url(#w)"/>')
    o.append(f'<path d="{gash(cx, top, bot, 64, 7, 5, lean)}" fill="none" stroke="#f4fff8" stroke-width="4" filter="url(#b2)"/>')
    o.append(f'<circle cx="{cx + 4}" cy="190" r="26" fill="#fffbe8" opacity=".85"/>')
    # flaps torn back from the edges
    for i in range(6):
        t = .15 + .7 * i / 5; y = top + (bot - top) * t; sd = -1 if i % 2 else 1
        w = 64 * math.sin(math.pi * (.02 + .96 * t)) ** 1.05; x = cx + (t - .5) * lean + sd * (w + 6); L = 30 + 8 * (i % 3)
        o.append(f'<path d="M{x:.0f},{y - 12:.0f} Q{x + sd * L * .9:.0f},{y - 18:.0f} {x + sd * L:.0f},{y + 6:.0f} Q{x + sd * L * .4:.0f},{y + 4:.0f} {x:.0f},{y + 14:.0f}Z" fill="#0b0912"/>')
    # the ground and the road running into the tear
    o.append('<path d="M-20,430 Q256,400 532,416 L532,532 L-20,532Z" fill="#0c0a12"/>')
    o.append('<path d="M-20,512 C80,470 200,440 286,420 L316,420 C260,446 170,482 120,532Z" fill="#4a4450" opacity=".8"/>')
    o.append('<ellipse cx="290" cy="420" rx="120" ry="14" fill="#d9ffe4" opacity=".35" filter="url(#b)"/>')
    # the horse, at a full gallop for the light
    o.append(f'<g transform="translate(150 446) scale(15.5)">{horse}</g>')
    o.append('</g></svg>')
    return ''.join(o)

os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'icon.svg'), 'w').write(icon(1))
open(os.path.join(out, 'icon-maskable.svg'), 'w').write(icon(.8))
print('wrote', out)

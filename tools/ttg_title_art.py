#!/usr/bin/env python3
"""Trygalle Run title art: the guild carriage on the road at night, running for a warren that has torn open in the sky,
with ash hounds behind. Writes src/046_ttg_title_art.js (ART['title/ttg'] and the guild seal ART['insignia/ttg']).
Original artwork for this fan game. Run: python3 tools/ttg_title_art.py, then python3 build.py."""
import json, math, os, random

R = random.Random(7)
W, H = 1600, 900
o = []
A = o.append

A(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="The guild carriage racing toward a torn warren under a night sky">')
A('''<defs>
<linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060d"/><stop offset=".45" stop-color="#121027"/><stop offset=".72" stop-color="#2a1d36"/><stop offset="1" stop-color="#3a2430"/></linearGradient>
<radialGradient id="tglow" cx="1430" cy="330" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c9f2d8" stop-opacity=".55"/><stop offset=".25" stop-color="#7fd0b0" stop-opacity=".25"/><stop offset=".6" stop-color="#3d6a72" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="trift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4fff6"/><stop offset=".5" stop-color="#d9ffe4"/><stop offset="1" stop-color="#f2d9a0"/></linearGradient>
<radialGradient id="tlamp" r=".5"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".95"/><stop offset=".35" stop-color="#f0a84a" stop-opacity=".45"/><stop offset="1" stop-color="#f0a84a" stop-opacity="0"/></radialGradient>
<linearGradient id="troad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2b2630"/><stop offset=".6" stop-color="#4a4450"/><stop offset="1" stop-color="#8fb8a8"/></linearGradient>
<linearGradient id="tground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151320"/><stop offset="1" stop-color="#07070c"/></linearGradient>
<filter id="tblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="tblur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="tsoft"><feGaussianBlur stdDeviation="1.2"/></filter>
</defs>
<style>
.tt-rift{animation:ttrift 5.5s ease-in-out infinite}
@keyframes ttrift{0%,100%{opacity:.82}50%{opacity:1}}
.tt-ember{animation:ttember 9s linear infinite}
@keyframes ttember{0%{transform:translate(0,0);opacity:0}10%{opacity:.9}100%{transform:translate(-60px,-260px);opacity:0}}
.tt-spin{animation:ttspin 1.1s linear infinite;transform-box:fill-box;transform-origin:center}
@keyframes ttspin{to{transform:rotate(360deg)}}
.tt-lamp{animation:ttlamp 2.6s ease-in-out infinite}
@keyframes ttlamp{0%,100%{opacity:.85}45%{opacity:1}60%{opacity:.75}}
@media (prefers-reduced-motion: reduce){.tt-rift,.tt-ember,.tt-spin,.tt-lamp{animation:none}}
</style>''')
A(f'<rect width="{W}" height="{H}" fill="url(#tsky)"/>')
# stars
for _ in range(170):
    x, y = R.uniform(0, W), R.uniform(0, 520) ** 1.0
    if abs(x - 1430) < 190: continue
    r = R.choice([.6, .8, 1, 1, 1.3, 1.8])
    A(f'<circle cx="{x:.0f}" cy="{y * .95:.0f}" r="{r}" fill="#dfe6ff" opacity="{R.uniform(.25, .85):.2f}"/>')
# the warren glow and the tear
A(f'<rect width="{W}" height="{H}" fill="url(#tglow)"/>')
def tear(cx, top, bot, wid, jag, seed):
    rr = random.Random(seed); L, Rr = [], []
    n = 16
    for i in range(n + 1):
        t = i / n; y = top + (bot - top) * t
        w = wid * math.sin(math.pi * t) ** .8 + 2
        x = cx + (t - .5) * 120 + rr.uniform(-jag, jag)
        L.append((x - w + rr.uniform(-jag, jag) * .6, y)); Rr.append((x + w + rr.uniform(-jag, jag) * .6, y))
    pts = L + Rr[::-1]
    return 'M' + ' L'.join(f'{x:.0f},{y:.0f}' for x, y in pts) + 'Z'
# (the tear itself is drawn standing on the road, after the ground: see 'the tear in the warren' below)
# hills: three layers
def ridge(y0, amp, seed, col, op=1):
    rr = random.Random(seed); pts = []; x = -20
    while x < W + 40:
        pts.append((x, y0 - abs(math.sin(x / rr.uniform(140, 260))) * amp - rr.uniform(0, amp * .35))); x += rr.uniform(40, 90)
    d = f'M-20,{H} ' + ' '.join(f'L{x:.0f},{y:.0f}' for x, y in pts) + f' L{W + 40},{H}Z'
    A(f'<path d="{d}" fill="{col}" opacity="{op}"/>')
ridge(470, 80, 11, '#1f1b33')
ridge(520, 55, 12, '#18152a')
# a far city of the guild's destination? no: a broken tower on the left ridge
A('<path d="M240,470 L252,380 L262,386 L270,362 L282,470Z" fill="#141226"/>')
ridge(570, 36, 13, '#100e1c')
# ground
A(f'<rect x="0" y="570" width="{W}" height="{H - 570}" fill="url(#tground)"/>')
# ---- the tear in the warren (David, Nov 21: "create an obvious tear in the warren they are trying to reach") ----
# a great ragged gash standing on the road ahead, sky to ground: torn dark edges curling back, another world's light inside,
# shards of the torn night drifting off it, and its light spilled down the road toward the carriage
TX, TTOP, TBOT = 1365, 30, 600
def gash(wid, jag, seed, top=TTOP, bot=TBOT, lean=-190):
    rr = random.Random(seed); L, Rr = [], []
    n = 22
    for i in range(n + 1):
        t = i / n; y = top + (bot - top) * t
        w = wid * math.sin(math.pi * (.02 + .96 * t)) ** 1.05 * (1 + .25 * math.sin(t * 9))
        x = TX + (t - .5) * lean
        L.append((x - w + rr.uniform(-jag, jag), y)); Rr.append((x + w + rr.uniform(-jag, jag), y))
    return 'M' + ' L'.join(f'{x:.0f},{y:.0f}' for x, y in L + Rr[::-1]) + 'Z'
A('<defs><linearGradient id="twin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fff2"/><stop offset=".45" stop-color="#bfeed4"/><stop offset=".8" stop-color="#f0dca0"/><stop offset="1" stop-color="#ffd890"/></linearGradient>'
  f'<clipPath id="tinside"><path d="{gash(96, 12, 21)}"/></clipPath></defs>')
A('<g class="tt-rift">')
A(f'<path d="{gash(230, 30, 20)}" fill="#9fe8c4" opacity=".28" filter="url(#tblur2)"/>')
A(f'<path d="{gash(128, 26, 22)}" fill="#0b0912"/>')   # the torn edge of the night, dark and ragged
A(f'<path d="{gash(96, 12, 21)}" fill="url(#twin)"/>')  # the warren beyond
# what lies inside: another sky, a pale sun, a long flat land of ochre and ash
A('<g clip-path="url(#tinside)">')
A(f'<circle cx="{TX + 10}" cy="250" r="46" fill="#fffbe8" opacity=".9"/><circle cx="{TX + 10}" cy="250" r="90" fill="#fff6d0" opacity=".35" filter="url(#tblur)"/>')
A(f'<path d="M{TX - 160},470 L{TX - 90},452 L{TX - 40},462 L{TX + 20},440 L{TX + 80},458 L{TX + 160},446 L{TX + 160},620 L{TX - 160},620Z" fill="#b89a5a" opacity=".75"/>')
A(f'<path d="M{TX - 160},520 L{TX + 160},500 L{TX + 160},620 L{TX - 160},620Z" fill="#8a6c3a" opacity=".7"/>')
A(f'<path d="M{TX - 20},620 L{TX + 6},470 L{TX + 16},470 L{TX + 60},620Z" fill="#d8c890" opacity=".55"/>')  # the road, going on inside
A('</g>')
A(f'<path d="{gash(96, 12, 21)}" fill="none" stroke="#f4fff8" stroke-width="5" opacity=".9" filter="url(#tsoft)"/>')
# flaps of the torn night curling back from the edges
rr = random.Random(31)
for i in range(9):
    t = .1 + .8 * i / 8; y = TTOP + (TBOT - TTOP) * t; sd = -1 if i % 2 else 1
    w = 96 * math.sin(math.pi * (.02 + .96 * t)) ** 1.05; x = TX + (t - .5) * -190 + sd * (w + 8)
    L = rr.uniform(26, 54)
    A(f'<path d="M{x:.0f},{y - 14:.0f} Q{x + sd * L * .9:.0f},{y - 22:.0f} {x + sd * L:.0f},{y + 6:.0f} Q{x + sd * L * .4:.0f},{y + 4:.0f} {x:.0f},{y + 16:.0f}Z" fill="#0b0912"/>')
    A(f'<path d="M{x:.0f},{y - 14:.0f} Q{x + sd * L * .9:.0f},{y - 22:.0f} {x + sd * L:.0f},{y + 6:.0f}" stroke="#bff0d6" stroke-width="1.6" fill="none" opacity=".55"/>')
# shards torn off it, drifting
for i in range(16):
    x, y = TX + rr.uniform(-260, 260), rr.uniform(60, 520)
    if abs(x - TX) < 150: x += 150 * (1 if x > TX else -1)
    sz = rr.uniform(6, 18); a = rr.uniform(0, 6.3)
    pts = ' '.join(f'{x + math.cos(a + k * 2.2) * sz * (1 if k else 1.6):.0f},{y + math.sin(a + k * 2.2) * sz * (1 if k else 1.6):.0f}' for k in range(3))
    A(f'<polygon points="{pts}" fill="#0b0912" stroke="#bff0d6" stroke-opacity=".5" stroke-width="1.2"/>')
# light spilling out: rays across the sky, and a pool of it down the road
for i in range(11):
    ang = math.pi + (i - 5) * .2
    A(f'<path d="M{TX},330 L{TX + math.cos(ang) * 1300:.0f},{330 + math.sin(ang) * 1300 * .55:.0f}" stroke="#bff0d6" stroke-width="{R.uniform(14, 44):.0f}" opacity=".022"/>')
A('</g>')
A(f'<ellipse cx="{TX - 120}" cy="{TBOT - 6}" rx="300" ry="30" fill="#d9ffe4" opacity=".22" filter="url(#tblur2)"/>')
# the road: from the bottom left, sweeping up and right into the distance, the carriage running straight along it (David, Nov 21: line the carriage up with the road)
A('<path d="M-40,900 C300,800 600,712 860,664 L1700,534 L1700,566 L860,724 C600,775 330,860 120,920Z" fill="url(#troad)" opacity=".75"/>')
A('<path d="M60,905 C360,806 640,724 860,694 L1700,550" stroke="#a9c9b9" stroke-opacity=".18" stroke-width="3" fill="none" stroke-dasharray="18 22"/>')
# ash on the road behind (the warren turns ground to ash): pale drifting smears
for i in range(14):
    x, y = R.uniform(300, 900), R.uniform(680, 880)
    A(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{R.uniform(40, 120):.0f}" ry="{R.uniform(4, 10):.0f}" fill="#8b8790" opacity="{R.uniform(.05, .12):.2f}" filter="url(#tsoft)"/>')

# ---- the carriage, heading right toward the tear ----
CX, CY = 745, 712   # the body's bottom-left corner; the whole team is drawn here and scaled by the group below
import subprocess
GROUND = CY + 64
A('<g transform="translate(860 650) rotate(-9.4 0 45) scale(.7) translate(-745 -712)">')
A(f'<ellipse cx="{CX + 330}" cy="{GROUND}" rx="470" ry="16" fill="#000" opacity=".55" filter="url(#tblur)"/>')
A('<defs><linearGradient id="tcoach" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2130"/><stop offset=".55" stop-color="#17121c"/><stop offset="1" stop-color="#0c0a10"/></linearGradient>'
  '<linearGradient id="ttarp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3a38"/><stop offset="1" stop-color="#1a1918"/></linearGradient></defs>')
INK = '#0a090e'
def wheel(cx, cy, r, n=14):
    A(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="{r * .18:.1f}"/>')               # the felloe
    A(f'<circle cx="{cx}" cy="{cy}" r="{r + r * .09:.1f}" fill="none" stroke="#3a3440" stroke-width="{r * .05:.1f}"/>')  # the iron tyre
    A(f'<path d="M{cx + r * .6:.1f},{cy - r * .9:.1f} A{r * 1.09:.1f},{r * 1.09:.1f} 0 0 1 {cx + r * 1.05:.1f},{cy - r * .2:.1f}" stroke="#9fe0c0" stroke-opacity=".5" stroke-width="2" fill="none"/>')  # warren light on the rim
    sp = ''.join(f'<path d="M{cx + math.cos(k * 2 * math.pi / n) * r * .2:.1f},{cy + math.sin(k * 2 * math.pi / n) * r * .2:.1f} L{cx + math.cos(k * 2 * math.pi / n) * r * .9:.1f},{cy + math.sin(k * 2 * math.pi / n) * r * .9:.1f}" stroke="{INK}" stroke-width="{r * .085:.1f}" stroke-linecap="round"/>' for k in range(n))
    A(f'<g class="tt-spin">{sp}<circle cx="{cx}" cy="{cy}" r="{r * .24:.1f}" fill="{INK}"/><circle cx="{cx}" cy="{cy}" r="{r * .1:.1f}" fill="#a08050"/></g>')
RW, FW = (CX + 62, GROUND - 52, 52), (CX + 236, GROUND - 40, 40)
# the far-side wheels peeking out, darker
for (wx, wy, wr) in (RW, FW): A(f'<circle cx="{wx + 14}" cy="{wy - 4}" r="{wr}" fill="none" stroke="#06050a" stroke-width="{wr * .16:.1f}"/>')
# the perch, the springs over each axle
A(f'<path d="M{CX + 20},{CY + 10} L{CX + 300},{CY + 6}" stroke="{INK}" stroke-width="9"/>')
for (wx, wy, wr) in (RW, FW):
    A(f'<path d="M{wx - 34},{CY + 4} Q{wx},{CY + 26} {wx + 34},{CY + 4}" stroke="{INK}" stroke-width="5" fill="none"/><path d="M{wx - 30},{CY + 4} Q{wx},{CY - 10} {wx + 30},{CY + 4}" stroke="{INK}" stroke-width="4" fill="none"/>')
    A(f'<path d="M{wx},{CY + 14} L{wx},{wy}" stroke="{INK}" stroke-width="6"/>')
# the rear boot: a strong box slung behind, chained
A(f'<path d="M{CX - 46},{CY - 6} L{CX - 50},{CY - 70} L{CX + 4},{CY - 74} L{CX + 4},{CY - 4} Z" fill="url(#tcoach)"/>')
A(f'<path d="M{CX - 50},{CY - 50} L{CX + 4},{CY - 52} M{CX - 48},{CY - 28} L{CX + 4},{CY - 30}" stroke="#3a3440" stroke-width="3"/>')
A(f'<path d="M{CX - 48},{CY - 70} Q{CX - 30},{CY - 58} {CX - 20},{CY - 72}" stroke="#6d6070" stroke-width="1.6" fill="none" stroke-dasharray="3 2"/>')
# the body: a long coach under a barrel roof, the front raked toward the box
BODY = f'M{CX},{CY} L{CX - 2},{CY - 138} Q{CX + 140},{CY - 178} {CX + 282},{CY - 140} L{CX + 296},{CY - 64} L{CX + 288},{CY} Z'
A(f'<path d="{BODY}" fill="url(#tcoach)"/>')
A(f'<path d="M{CX - 2},{CY - 138} Q{CX + 140},{CY - 178} {CX + 282},{CY - 140} L{CX + 296},{CY - 64}" stroke="#9fe0c0" stroke-opacity=".6" stroke-width="2.4" fill="none"/>')  # rim light
A(f'<path d="M{CX - 2},{CY - 132} Q{CX + 140},{CY - 170} {CX + 282},{CY - 134}" stroke="#4a3e52" stroke-width="3" fill="none"/>')  # the roof's eave
# panels: three framed panels, brass at the corners
for (x0, x1) in ((CX + 14, CX + 92), (CX + 104, CX + 186), (CX + 198, CX + 276)):
    top = CY - 122 - (8 if x0 == CX + 104 else 2)
    A(f'<rect x="{x0}" y="{top}" width="{x1 - x0}" height="{CY - 18 - top}" rx="3" fill="none" stroke="#3b3244" stroke-width="3"/>')
    for (bx, by) in ((x0, top), (x1, top), (x0, CY - 18), (x1, CY - 18)): A(f'<circle cx="{bx}" cy="{by}" r="2.6" fill="#a8844c"/>')
# the door in the middle panel: the guild's seal in brass
A(f'<circle cx="{CX + 145}" cy="{CY - 62}" r="17" fill="none" stroke="#c9a15a" stroke-width="2.6"/><circle cx="{CX + 145}" cy="{CY - 62}" r="6" fill="#c9a15a"/>')
for k in range(8): A(f'<path d="M{CX + 145 + math.cos(k * math.pi / 4) * 6:.1f},{CY - 62 + math.sin(k * math.pi / 4) * 6:.1f} L{CX + 145 + math.cos(k * math.pi / 4) * 15:.1f},{CY - 62 + math.sin(k * math.pi / 4) * 15:.1f}" stroke="#c9a15a" stroke-width="1.6"/>')
A(f'<path d="M{CX + 151},{CY - 82} L{CX + 146},{CY - 66} L{CX + 152},{CY - 63} L{CX + 140},{CY - 42}" stroke="#bff3d8" stroke-width="2" fill="none"/>')
A(f'<path d="M{CX + 184},{CY - 70} L{CX + 184},{CY - 54}" stroke="#a8844c" stroke-width="3" stroke-linecap="round"/>')  # the handle
# shuttered windows, lamplight through the slats
for wx in (CX + 30, CX + 214):
    A(f'<rect x="{wx}" y="{CY - 112}" width="46" height="34" rx="2" fill="#1a120a"/>')
    for j in range(4): A(f'<rect x="{wx + 3}" y="{CY - 108 + j * 8}" width="40" height="3" fill="#f3b95c" opacity="{.95 - j * .12:.2f}"/>')
    A(f'<rect x="{wx}" y="{CY - 112}" width="46" height="34" fill="#ffcf7a" opacity=".35" filter="url(#tblur)"/>')
# iron straps over the roof's edge and down the sides, studded
for x in (CX + 98, CX + 192):
    A(f'<path d="M{x},{CY - 160 if x < CX + 150 else CY - 158} L{x},{CY - 4}" stroke="#2c2834" stroke-width="6"/>')
    for j in range(6): A(f'<circle cx="{x}" cy="{CY - 140 + j * 24}" r="1.8" fill="#7a6c80"/>')
A(f'<path d="M{CX - 2},{CY - 12} L{CX + 290},{CY - 12}" stroke="#2c2834" stroke-width="6"/>')
# the roof: a rail on posts, cargo under a lashed tarp, a chest at the back
A(f'<path d="M{CX + 10},{CY - 186} L{CX + 270},{CY - 186}" stroke="{INK}" stroke-width="3"/>')
for x in range(CX + 14, CX + 271, 32): A(f'<path d="M{x},{CY - 186} L{x},{CY - 158 - (140 - abs(x - CX - 140)) * .12:.0f}" stroke="{INK}" stroke-width="2.4"/>')
A(f'<path d="M{CX + 70},{CY - 168} Q{CX + 74},{CY - 214} {CX + 118},{CY - 216} Q{CX + 160},{CY - 222} {CX + 196},{CY - 204} Q{CX + 214},{CY - 186} {CX + 216},{CY - 168} Z" fill="url(#ttarp)"/>')
A(f'<path d="M{CX + 96},{CY - 214} L{CX + 92},{CY - 168} M{CX + 140},{CY - 220} L{CX + 140},{CY - 170} M{CX + 184},{CY - 208} L{CX + 190},{CY - 168}" stroke="#7a6a50" stroke-width="1.8"/>')
A(f'<path d="M{CX + 74},{CY - 200} Q{CX + 140},{CY - 214} {CX + 212},{CY - 188}" stroke="#9fe0c0" stroke-opacity=".35" stroke-width="1.6" fill="none"/>')
A(f'<rect x="{CX + 14}" y="{CY - 196}" width="44" height="30" fill="{INK}"/><path d="M{CX + 14},{CY - 182} L{CX + 58},{CY - 182}" stroke="#a8844c" stroke-width="1.6"/>')
# the box: the driver's seat out front, a footboard, the driver hunched over the reins
A(f'<path d="M{CX + 288},{CY - 70} L{CX + 344},{CY - 76} L{CX + 350},{CY - 62} L{CX + 296},{CY - 52} Z" fill="{INK}"/>')
A(f'<path d="M{CX + 330},{CY - 60} L{CX + 366},{CY - 24}" stroke="{INK}" stroke-width="5"/><path d="M{CX + 356},{CY - 26} L{CX + 382},{CY - 30}" stroke="{INK}" stroke-width="5"/>')
A(f'<path d="M{CX + 304},{CY - 74} Q{CX + 302},{CY - 112} {CX + 322},{CY - 120} Q{CX + 340},{CY - 116} {CX + 344},{CY - 96} L{CX + 352},{CY - 74} Z" fill="{INK}"/>')  # body, hunched
A(f'<circle cx="{CX + 330}" cy="{CY - 130}" r="10" fill="{INK}"/><path d="M{CX + 318},{CY - 134} L{CX + 344},{CY - 140} L{CX + 340},{CY - 132}Z" fill="{INK}"/>')  # head, a hat brim
A(f'<path d="M{CX + 312},{CY - 112} Q{CX + 290},{CY - 108} {CX + 270},{CY - 92}" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round"/>')  # the cloak streaming back
A(f'<path d="M{CX + 338},{CY - 110} Q{CX + 362},{CY - 170} {CX + 420},{CY - 196} Q{CX + 480},{CY - 210} {CX + 520},{CY - 170}" stroke="{INK}" stroke-width="2.2" fill="none"/>')  # the whip, cracking out over the team
# lamps on brackets, front and back
for (lx, ly, bx) in ((CX + 300, CY - 150, CX + 290), (CX - 16, CY - 146, CX - 2)):
    A(f'<path d="M{bx},{ly + 20} L{lx},{ly + 10}" stroke="{INK}" stroke-width="3"/>')
    A(f'<g class="tt-lamp"><circle cx="{lx}" cy="{ly}" r="54" fill="url(#tlamp)"/><path d="M{lx - 6},{ly - 10} L{lx + 6},{ly - 10} L{lx + 8},{ly + 8} L{lx - 8},{ly + 8}Z" fill="#ffe7a8"/><path d="M{lx - 8},{ly - 10} L{lx},{ly - 18} L{lx + 8},{ly - 10}" fill="{INK}"/></g>')
# shareholders on the roof: one kneeling at the back with a crossbow aimed behind, one standing with a spear
A(f'<path d="M{CX + 22},{CY - 196} L{CX + 26},{CY - 222} L{CX + 22},{CY - 240} Q{CX + 32},{CY - 252} {CX + 44},{CY - 240} L{CX + 46},{CY - 214} L{CX + 58},{CY - 196}Z" fill="{INK}"/><circle cx="{CX + 33}" cy="{CY - 258}" r="9" fill="{INK}"/>')
A(f'<path d="M{CX + 30},{CY - 240} L{CX - 22},{CY - 232}" stroke="{INK}" stroke-width="5"/><path d="M{CX - 18},{CY - 246} L{CX - 16},{CY - 220}" stroke="{INK}" stroke-width="3"/>')
A(f'<path d="M{CX + 228},{CY - 166} L{CX + 230},{CY - 206} L{CX + 224},{CY - 236} Q{CX + 236},{CY - 248} {CX + 248},{CY - 236} L{CX + 244},{CY - 206} L{CX + 248},{CY - 166}Z" fill="{INK}"/><circle cx="{CX + 236}" cy="{CY - 254}" r="9.5" fill="{INK}"/>')
A(f'<path d="M{CX + 224},{CY - 236} Q{CX + 200},{CY - 222} {CX + 186},{CY - 196}" stroke="{INK}" stroke-width="6" fill="none" stroke-linecap="round"/>')
A(f'<path d="M{CX + 252},{CY - 300} L{CX + 256},{CY - 166}" stroke="{INK}" stroke-width="3"/><path d="M{CX + 250},{CY - 314} L{CX + 256},{CY - 294} L{CX + 246},{CY - 296}Z" fill="#9fe0c0"/>')
# the mage at the rear hatch: a cold fire held out behind
A(f'<circle cx="{CX - 62}" cy="{CY - 96}" r="28" fill="#9ff0d0" opacity=".25" filter="url(#tblur)"/><circle cx="{CX - 62}" cy="{CY - 96}" r="5" fill="#e8fff2"/>')
A(f'<path d="M{CX - 4},{CY - 104} Q{CX - 30},{CY - 108} {CX - 58},{CY - 98}" stroke="{INK}" stroke-width="5" fill="none" stroke-linecap="round"/>')
# wheels last, over the body's foot
wheel(*RW); wheel(*FW)

# ---- six horses at a full gallop: Trygalle Run's own coach horse (ttgHorseParts, src/048_ttg_art.js), drawn through tools/ttg_horse_svg.js ----
HS = 11  # horse units to picture units: withers about 92 up
# six: the fewest a guild carriage ever runs on (David, Nov 21, 2026); three pairs, the far horse of each pair a step up the road and darker
spec = [{'gait': 'run', 'ph': [.08, .46, .71][i % 3] + (.0 if i < 3 else .2), 'col': '#211b2c' if i < 3 else INK, 'mane': '#07060a', 'feather': '#3a3448' if i < 3 else '#2c2834', 'far': i < 3} for i in range(6)]
frag = json.loads(subprocess.check_output(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ttg_horse_svg.js'), json.dumps(spec)]))
PX = [CX + 450, CX + 625, CX + 800]   # wheelers, swing pair, leaders
team = [(PX[i] + 40, GROUND - 22, frag[i]) for i in range(3)] + [(PX[i], GROUND, frag[3 + i]) for i in range(3)]
# the pole and the traces, behind the near horses
A(f'<path d="M{CX + 350},{CY - 30} L{CX + 470},{GROUND - 74}" stroke="{INK}" stroke-width="5"/>')
A(f'<path d="M{CX + 340},{CY - 46} L{CX + 400},{GROUND - 70} M{CX + 500},{GROUND - 76} L{CX + 560},{GROUND - 74} M{CX + 666},{GROUND - 76} L{CX + 726},{GROUND - 74}" stroke="{INK}" stroke-width="2.6"/>')
for i, (hx, hy, svg) in enumerate(team):
    A(f'<g transform="translate({hx} {hy}) scale({HS})">{svg}</g>')
    if i >= 3:  # warren light along the near horses' backs
        A(f'<g transform="translate({hx} {hy}) scale({HS})"><path d="M-4.2 -9.75 Q-1.5 -9.95 1.2 -9.55" stroke="#9fe0c0" stroke-opacity=".55" stroke-width=".22" fill="none"/></g>')
# the reins from the driver's hands to the leaders
A(f'<path d="M{CX + 350},{CY - 98} Q{CX + 520},{GROUND - 150} {CX + 878},{GROUND - 126}" stroke="{INK}" stroke-width="1.4" fill="none"/>')

# dust kicked up behind the wheels and hooves
for i in range(16):
    x, y = CX + R.uniform(-160, 340), CY + R.uniform(40, 66)
    A(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{R.uniform(20, 60):.0f}" ry="{R.uniform(6, 14):.0f}" fill="#6e6676" opacity="{R.uniform(.06, .16):.2f}" filter="url(#tblur)"/>')

A('</g>')
# ---- the hounds behind: low shapes on the road, eyes like coals ----
def hound(x, y, s):
    A(f'<path d="M{x - 50 * s},{y} Q{x - 40 * s},{y - 28 * s} {x},{y - 26 * s} Q{x + 30 * s},{y - 30 * s} {x + 46 * s},{y - 40 * s} L{x + 70 * s},{y - 34 * s} L{x + 66 * s},{y - 24 * s} L{x + 46 * s},{y - 20 * s} Q{x + 30 * s},{y - 4 * s} {x + 34 * s},{y + 16 * s} L{x + 26 * s},{y + 18 * s} L{x + 14 * s},{y - 2 * s} L{x - 20 * s},{y - 2 * s} L{x - 44 * s},{y + 16 * s} L{x - 54 * s},{y + 14 * s} L{x - 44 * s},{y - 4 * s} Q{x - 66 * s},{y - 10 * s} {x - 80 * s},{y - 22 * s} Q{x - 60 * s},{y - 8 * s} {x - 50 * s},{y}Z" fill="#0a090e"/>')
    A(f'<circle cx="{x + 58 * s:.0f}" cy="{y - 33 * s:.0f}" r="{2.6 * s:.1f}" fill="#ff7a3a"/><circle cx="{x + 58 * s:.0f}" cy="{y - 33 * s:.0f}" r="{8 * s:.1f}" fill="#ff7a3a" opacity=".3" filter="url(#tblur)"/>')
hound(800, 714, .62)
hound(725, 736, .55)
hound(655, 758, .5)

# embers drifting up from the road
emb = []
for i in range(26):
    x, y = R.uniform(700, 1500), R.uniform(520, 900)
    emb.append(f'<circle class="tt-ember" style="animation-delay:-{R.uniform(0, 9):.1f}s;animation-duration:{R.uniform(7, 13):.1f}s" cx="{x:.0f}" cy="{y:.0f}" r="{R.choice([1.2, 1.6, 2, 2.4])}" fill="{R.choice(["#ffb35c", "#ffd08a", "#9ff0d0"])}"/>')
A('<g>' + ''.join(emb) + '</g>')
A('</svg>')
TITLE = ''.join(o)

# ---- the guild seal: a spoked wheel in a ring, a warren tear across it ----
s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Seal of the Trygalle Trade Guild">',
     '<defs><radialGradient id="tsb" r=".6"><stop offset="0" stop-color="#3a2f22"/><stop offset="1" stop-color="#15110c"/></radialGradient></defs>',
     '<circle cx="100" cy="100" r="94" fill="url(#tsb)" stroke="#c9a15a" stroke-width="5"/>',
     '<circle cx="100" cy="100" r="80" fill="none" stroke="#c9a15a" stroke-width="1.5" stroke-dasharray="3 5" opacity=".7"/>',
     '<circle cx="100" cy="100" r="50" fill="none" stroke="#e2c07a" stroke-width="8"/>',
     '<circle cx="100" cy="100" r="11" fill="#e2c07a"/>']
for k in range(8):
    a = k * math.pi / 4
    s.append(f'<path d="M{100 + math.cos(a) * 11:.1f},{100 + math.sin(a) * 11:.1f} L{100 + math.cos(a) * 47:.1f},{100 + math.sin(a) * 47:.1f}" stroke="#e2c07a" stroke-width="5"/>')
s.append('<path d="M128,22 L116,64 L132,74 L98,122 L112,130 L74,180 L88,128 L72,120 L104,76 L90,66 Z" fill="#bff3d8" opacity=".95"/>')
s.append('<path d="M128,22 L116,64 L132,74 L98,122 L112,130 L74,180" stroke="#f6fff9" stroke-width="2" fill="none"/>')
s.append('</svg>')
SEAL = ''.join(s)

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', '046_ttg_title_art.js')
with open(out, 'w') as fh:
    fh.write('/* Trygalle Run title art and guild seal: generated by tools/ttg_title_art.py (do not edit by hand) */\n')
    fh.write(f"ART['title/ttg'] = {json.dumps(TITLE)};\nART_SIZE['title/ttg'] = [1600, 900];\n")
    fh.write(f"ART['insignia/ttg'] = {json.dumps(SEAL)};\nART_SIZE['insignia/ttg'] = [200, 200];\n")
    fh.write("BOOKS.ttg.titleArt = 'title/ttg'; BOOKS.ttg.patch = 'insignia/ttg';\n")
print('wrote', out, len(TITLE), 'bytes of title art')
open('/tmp/claude-0/-home-user/c5cae737-fc53-572d-84bf-69cedb34c4bc/scratchpad/ttg_title.svg', 'w').write(TITLE)
open('/tmp/claude-0/-home-user/c5cae737-fc53-572d-84bf-69cedb34c4bc/scratchpad/ttg_seal.svg', 'w').write(SEAL)

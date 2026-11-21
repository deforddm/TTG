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
<radialGradient id="tglow" cx="1250" cy="250" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c9f2d8" stop-opacity=".55"/><stop offset=".25" stop-color="#7fd0b0" stop-opacity=".25"/><stop offset=".6" stop-color="#3d6a72" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
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
    if math.hypot(x - 1250, y - 250) < 170: continue
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
A('<g class="tt-rift">')
A(f'<path d="{tear(1250, 30, 470, 70, 18, 3)}" fill="#9fe8c4" opacity=".35" filter="url(#tblur2)"/>')
A(f'<path d="{tear(1250, 45, 455, 34, 14, 4)}" fill="#cff7e0" opacity=".7" filter="url(#tblur)"/>')
A(f'<path d="{tear(1250, 58, 442, 14, 9, 5)}" fill="url(#trift)"/>')
# light spilling from the tear: faint rays
for i in range(9):
    a = -math.pi / 2 + (i - 4) * .22
    x2, y2 = 1180 + math.cos(a + math.pi) * 900, 300 - math.sin(a + math.pi) * 900
    A(f'<path d="M1250,250 L{1250 + math.cos(a) * 1100:.0f},{300 + math.sin(a) * -1100 * -1:.0f}" stroke="#bff0d6" stroke-width="{R.uniform(10, 40):.0f}" opacity=".035" />')
A('</g>')
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
# the road: from the bottom left, sweeping right toward the tear's foot
A('<path d="M-40,900 C300,800 620,700 880,650 C1100,612 1260,580 1300,520 L1336,522 C1260,620 1060,666 860,712 C600,770 330,860 120,920Z" fill="url(#troad)" opacity=".75"/>')
A('<path d="M60,905 C360,806 690,712 950,664 C1150,630 1280,590 1318,522" stroke="#a9c9b9" stroke-opacity=".18" stroke-width="3" fill="none" stroke-dasharray="18 22"/>')
# ash on the road behind (the warren turns ground to ash): pale drifting smears
for i in range(14):
    x, y = R.uniform(300, 900), R.uniform(680, 880)
    A(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{R.uniform(40, 120):.0f}" ry="{R.uniform(4, 10):.0f}" fill="#8b8790" opacity="{R.uniform(.05, .12):.2f}" filter="url(#tsoft)"/>')

# ---- the carriage, heading right toward the tear ----
CX, CY = 745, 712   # carriage body bottom-left
def wheel(cx, cy, r, front=False):
    A(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#0b0a10" stroke-width="{r * .16:.1f}"/>')
    A(f'<circle cx="{cx}" cy="{cy}" r="{r + 1.5}" fill="none" stroke="#6a5a44" stroke-opacity=".55" stroke-width="1.4"/>')
    sp = ''.join(f'<path d="M{cx},{cy} L{cx + math.cos(k * math.pi / 6) * r * .92:.1f},{cy + math.sin(k * math.pi / 6) * r * .92:.1f}" stroke="#0b0a10" stroke-width="{r * .07:.1f}"/>' for k in range(12))
    A(f'<g class="tt-spin">{sp}<circle cx="{cx}" cy="{cy}" r="{r * .2:.1f}" fill="#0b0a10"/><circle cx="{cx}" cy="{cy}" r="{r * .08:.1f}" fill="#7d6a4c"/></g>')
A('<g transform="translate(905 612) scale(.8) translate(-745 -712)">')
# shadow
A(f'<ellipse cx="{CX + 300}" cy="{CY + 62}" rx="420" ry="16" fill="#000" opacity=".55" filter="url(#tblur)"/>')
# body: a heavy iron-bound coach, taller at the back, roof rail
A(f'<path d="M{CX},{CY} L{CX - 6},{CY - 128} L{CX + 14},{CY - 150} L{CX + 236},{CY - 150} L{CX + 262},{CY - 124} L{CX + 268},{CY - 20} L{CX + 250},{CY} Z" fill="#0e0c14"/>')
# rim light from the tear on the body's leading edge and roof
A(f'<path d="M{CX + 14},{CY - 150} L{CX + 236},{CY - 150} L{CX + 262},{CY - 124} L{CX + 268},{CY - 20}" stroke="#9fe0c0" stroke-opacity=".55" stroke-width="2.2" fill="none"/>')
# iron bands and studs
for k in range(4):
    x = CX + 30 + k * 62
    A(f'<path d="M{x},{CY - 146} L{x},{CY - 6}" stroke="#2c2834" stroke-width="5"/>')
    for j in range(5): A(f'<circle cx="{x}" cy="{CY - 130 + j * 28}" r="2" fill="#6d6070"/>')
A(f'<path d="M{CX - 4},{CY - 70} L{CX + 266},{CY - 70}" stroke="#2c2834" stroke-width="6"/>')
# a slit window with a warm light inside
A(f'<rect x="{CX + 150}" y="{CY - 118}" width="62" height="14" rx="2" fill="#f3b95c" opacity=".85"/>')
A(f'<rect x="{CX + 150}" y="{CY - 118}" width="62" height="14" rx="2" fill="#ffd58a" opacity=".5" filter="url(#tblur)"/>')
# the guild sign on the door: a wheel inside a ring
A(f'<circle cx="{CX + 92}" cy="{CY - 92}" r="15" fill="none" stroke="#b08a4a" stroke-width="2.5" opacity=".8"/><circle cx="{CX + 92}" cy="{CY - 92}" r="6" fill="none" stroke="#b08a4a" stroke-width="2" opacity=".8"/>')
# undercarriage and wheels
A(f'<rect x="{CX + 10}" y="{CY - 6}" width="250" height="12" fill="#0b0a10"/>')
wheel(CX + 52, CY + 18, 44); wheel(CX + 214, CY + 26, 36, True)
# roof: crates lashed down, a rail
A(f'<path d="M{CX + 8},{CY - 158} L{CX + 244},{CY - 158}" stroke="#0e0c14" stroke-width="5"/>')
for x0, w, h in [(CX + 26, 54, 34), (CX + 82, 40, 24), (CX + 84, 30, 20)]:
    pass
A(f'<rect x="{CX + 24}" y="{CY - 194}" width="58" height="38" fill="#0e0c14"/><path d="M{CX + 24},{CY - 175} L{CX + 82},{CY - 175}" stroke="#3b3442" stroke-width="2"/>')
A(f'<rect x="{CX + 86}" y="{CY - 180}" width="40" height="24" fill="#0e0c14"/>')
# shareholders on the roof: one kneeling with a crossbow aimed back, one standing with a spear, one at the rear hatch
def figure(x, y, s=1, pose='stand', face=1):
    f = face
    if pose == 'stand':
        A(f'<path d="M{x - 9 * s},{y} L{x - 7 * s},{y - 38 * s} L{x - 11 * s},{y - 64 * s} Q{x},{y - 74 * s} {x + 11 * s},{y - 64 * s} L{x + 7 * s},{y - 38 * s} L{x + 9 * s},{y} Z" fill="#0b0a10"/>')
        A(f'<circle cx="{x}" cy="{y - 80 * s}" r="{9 * s}" fill="#0b0a10"/>')
        A(f'<path d="M{x - 13 * s},{y - 70 * s} Q{x - 30 * s},{y - 50 * s} {x - 40 * s},{y - 22 * s}" stroke="#0b0a10" stroke-width="{6 * s}" fill="none"/>')  # cloak flying back
    elif pose == 'kneel':
        A(f'<path d="M{x - 14 * s},{y} L{x - 10 * s},{y - 26 * s} L{x - 12 * s},{y - 46 * s} Q{x - 2 * s},{y - 56 * s} {x + 8 * s},{y - 46 * s} L{x + 12 * s},{y - 20 * s} L{x + 22 * s},{y} Z" fill="#0b0a10"/>')
        A(f'<circle cx="{x - 1 * s}" cy="{y - 61 * s}" r="{8.5 * s}" fill="#0b0a10"/>')
    return
figure(CX + 166, CY - 158, 1, 'stand')
A(f'<path d="M{CX + 174},{CY - 246} L{CX + 182},{CY - 160}" stroke="#0b0a10" stroke-width="3"/><path d="M{CX + 172},{CY - 256} L{CX + 176},{CY - 238} L{CX + 168},{CY - 240}Z" fill="#9fe0c0" opacity=".8"/>')  # spear, its head catching the warren light
figure(CX + 54, CY - 194, .95, 'kneel')
A(f'<path d="M{CX + 46},{CY - 246} L{CX - 2},{CY - 236}" stroke="#0b0a10" stroke-width="5"/><path d="M{CX + 2},{CY - 248} L{CX + 4},{CY - 224}" stroke="#0b0a10" stroke-width="3"/>')  # crossbow aimed back
# the mage's light at the rear hatch: a small cold fire in a hand
A(f'<circle cx="{CX - 14}" cy="{CY - 96}" r="22" fill="url(#tlamp)" opacity=".0"/>')
A(f'<circle cx="{CX - 16}" cy="{CY - 100}" r="26" fill="#9ff0d0" opacity=".25" filter="url(#tblur)"/><circle cx="{CX - 16}" cy="{CY - 100}" r="5" fill="#e8fff2"/>')
# the driver on the bench, whip raised
A(f'<path d="M{CX + 262},{CY - 96} L{CX + 312},{CY - 96} L{CX + 318},{CY - 84} L{CX + 266},{CY - 80}Z" fill="#0e0c14"/>')
figure(CX + 292, CY - 94, .9, 'kneel')
A(f'<path d="M{CX + 300},{CY - 140} Q{CX + 330},{CY - 200} {CX + 380},{CY - 210} Q{CX + 420},{CY - 214} {CX + 450},{CY - 180}" stroke="#0b0a10" stroke-width="2.2" fill="none"/>')
# lanterns, front and back
for lx, ly in [(CX + 270, CY - 132), (CX - 6, CY - 138)]:
    A(f'<g class="tt-lamp"><circle cx="{lx}" cy="{ly}" r="46" fill="url(#tlamp)"/><rect x="{lx - 5}" y="{ly - 8}" width="10" height="15" rx="2" fill="#ffe7a8"/></g>')

# ---- four horses at a gallop, two pairs, the far pair a little higher and darker ----
def horse(x, y, s, col, phase):
    # body
    A(f'<g fill="{col}">')
    A(f'<ellipse cx="{x}" cy="{y}" rx="{58 * s:.1f}" ry="{22 * s:.1f}"/>')
    # neck and head, reaching forward
    A(f'<path d="M{x + 40 * s},{y - 12 * s} Q{x + 66 * s},{y - 46 * s} {x + 84 * s},{y - 50 * s} L{x + 112 * s},{y - 36 * s} Q{x + 116 * s},{y - 28 * s} {x + 106 * s},{y - 24 * s} L{x + 86 * s},{y - 28 * s} Q{x + 70 * s},{y - 10 * s} {x + 52 * s},{y + 10 * s} Z"/>')
    A(f'<path d="M{x + 82 * s},{y - 50 * s} L{x + 86 * s},{y - 64 * s} L{x + 92 * s},{y - 50 * s}Z"/>')  # ear
    # mane streaming back
    A(f'<path d="M{x + 84 * s},{y - 52 * s} Q{x + 60 * s},{y - 58 * s} {x + 34 * s},{y - 38 * s} Q{x + 58 * s},{y - 44 * s} {x + 70 * s},{y - 36 * s}Z"/>')
    # tail
    A(f'<path d="M{x - 54 * s},{y - 8 * s} Q{x - 92 * s},{y - 20 * s} {x - 108 * s},{y + 4 * s} Q{x - 86 * s},{y - 4 * s} {x - 56 * s},{y + 4 * s}Z"/>')
    A('</g>')
    # legs: a gallop. phase 0: forelegs reaching, hind legs pushing back
    legs = [((x + 34 * s, y + 12 * s), (x + 70 * s, y + 30 * s), (x + 92 * s, y + 46 * s)),
            ((x + 26 * s, y + 14 * s), (x + 46 * s, y + 42 * s), (x + 60 * s, y + 62 * s)),
            ((x - 38 * s, y + 10 * s), (x - 64 * s, y + 36 * s), (x - 98 * s, y + 48 * s)),
            ((x - 30 * s, y + 14 * s), (x - 40 * s, y + 44 * s), (x - 58 * s, y + 64 * s))]
    if phase: legs = [legs[1], legs[0], legs[3], legs[2]]
    for (a, b, c) in legs:
        A(f'<path d="M{a[0]:.0f},{a[1]:.0f} Q{b[0]:.0f},{b[1]:.0f} {c[0]:.0f},{c[1]:.0f}" stroke="{col}" stroke-width="{10 * s:.1f}" fill="none" stroke-linecap="round"/>')
# traces from the coach to the team
A(f'<path d="M{CX + 268},{CY - 40} L{CX + 470},{CY - 64} M{CX + 268},{CY - 30} L{CX + 610},{CY - 60}" stroke="#0b0a10" stroke-width="3"/>')
horse(CX + 560, CY - 92, .92, '#120f1a', 1)      # far leader
horse(CX + 410, CY - 88, .95, '#120f1a', 0)      # far wheeler
horse(CX + 590, CY - 64, 1.0, '#09080d', 0)      # near leader
horse(CX + 440, CY - 60, 1.03, '#09080d', 1)     # near wheeler
# rim light on the near horses' backs
A(f'<path d="M{CX + 400},{CY - 82} Q{CX + 440},{CY - 88} {CX + 480},{CY - 82} M{CX + 550},{CY - 86} Q{CX + 590},{CY - 92} {CX + 630},{CY - 86}" stroke="#9fe0c0" stroke-opacity=".45" stroke-width="2" fill="none"/>')
# dust kicked up behind the wheels and hooves
for i in range(16):
    x, y = CX + R.uniform(-160, 640), CY + R.uniform(20, 60)
    A(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{R.uniform(20, 60):.0f}" ry="{R.uniform(6, 14):.0f}" fill="#6e6676" opacity="{R.uniform(.06, .16):.2f}" filter="url(#tblur)"/>')

A('</g>')
# ---- the hounds behind: low shapes on the road, eyes like coals ----
def hound(x, y, s):
    A(f'<path d="M{x - 50 * s},{y} Q{x - 40 * s},{y - 28 * s} {x},{y - 26 * s} Q{x + 30 * s},{y - 30 * s} {x + 46 * s},{y - 40 * s} L{x + 70 * s},{y - 34 * s} L{x + 66 * s},{y - 24 * s} L{x + 46 * s},{y - 20 * s} Q{x + 30 * s},{y - 4 * s} {x + 34 * s},{y + 16 * s} L{x + 26 * s},{y + 18 * s} L{x + 14 * s},{y - 2 * s} L{x - 20 * s},{y - 2 * s} L{x - 44 * s},{y + 16 * s} L{x - 54 * s},{y + 14 * s} L{x - 44 * s},{y - 4 * s} Q{x - 66 * s},{y - 10 * s} {x - 80 * s},{y - 22 * s} Q{x - 60 * s},{y - 8 * s} {x - 50 * s},{y}Z" fill="#0a090e"/>')
    A(f'<circle cx="{x + 58 * s:.0f}" cy="{y - 33 * s:.0f}" r="{2.6 * s:.1f}" fill="#ff7a3a"/><circle cx="{x + 58 * s:.0f}" cy="{y - 33 * s:.0f}" r="{8 * s:.1f}" fill="#ff7a3a" opacity=".3" filter="url(#tblur)"/>')
hound(845, 668, .62)
hound(770, 690, .55)
hound(700, 712, .5)

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

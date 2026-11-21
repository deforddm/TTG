/* ============ Trygalle Run: the guild's own art (v0.7.0) ============
   David, Nov 21, 2026: "Please make some new art for the guild and it's members. Nothing directly recycled from FTR."
   Everything here is drawn fresh for Trygalle Run and uses no From the Ranks drawing code: the coach horse (side view and from above),
   the shareholders and the yard folk as walking figures, and the five shareholders' portraits. The figures keep the engine's
   drawFigure contract (about 32 units tall, feet on y = 13, facing +x), and the portraits paint in the engine's bust units
   (the frame's foot at y = 0, the head near y = -75), so every screen that already draws them picks these up.
   The horse is written as parts with SVG path data, so the same horse is drawn on the canvas and in the title's SVG
   (tools/ttg_horse_svg.js reads ttgHorseParts from this file). */

/* ---------- small helpers of our own ---------- */
const TA_PATHS = new Map();
function taPath(d){ let p = TA_PATHS.get(d); if (!p) { if (TA_PATHS.size > 3000) TA_PATHS.clear(); p = new Path2D(d); TA_PATHS.set(d, p); } return p; }
function taFill(ctx, d, col){ ctx.fillStyle = col; ctx.fill(taPath(d)); }
function taLine(ctx, d, col, w, cap){ ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = cap || 'round'; ctx.lineJoin = 'round'; ctx.stroke(taPath(d)); }
function taOval(ctx, x, y, rx, ry, col, rot){ ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
function taMix(hex, amt){ const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join(''); }
function taAlpha(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function taGrad(ctx, x0, y0, x1, y1, stops){ const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, c]) => g.addColorStop(k, c)); return g; }
function taRad(ctx, x, y, r0, r1, stops, x1, y1){ const g = ctx.createRadialGradient(x, y, r0, x1 ?? x, y1 ?? y, r1); stops.forEach(([k, c]) => g.addColorStop(k, c)); return g; }
function taRng(seed){ let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const taN = v => +v.toFixed(2);

/* ================= the coach horse =================
   A heavy guild horse: deep in the chest, feathered at the fetlock, the mane roached short and the tail knotted up so nothing
   catches in a warren seam, blinkers, a padded collar with brass hames, and the guild's knot as a brass boss on the breast strap.
   Units: facing +x, hooves on y = 0, withers about 9.8 up, nose to tail about 17.
   o: {gait:'run'|'walk'|'stand', ph:0..1 (the stride), col, mane, feather, sock, blaze, g (head down 0..1, standing), far (darker, no tack shine)} */
function ttgHorseParts(o = {}){
  const col = o.col || '#3a2418', mane = o.mane || '#140c08', feather = o.feather || '#cfc6b4', tack = '#1a120d', brass = '#c9a15a';
  const ph = ((o.ph || 0) % 1 + 1) % 1, gait = o.gait || 'stand', TAU = Math.PI * 2, P = [];
  const add = (d, f, extra) => P.push(Object.assign({d, f}, extra || {}));
  // the legs: front from the shoulder, hind from the stifle; each leg an upper and a lower bone, a fetlock tuft, a hoof
  const legs = [], LEG = {
    fh:{x:-3.7, y:-6.9, l1:3.6, l2:3.5, hind:1, off:0, near:0}, nh:{x:-3.4, y:-6.8, l1:3.6, l2:3.5, hind:1, off:.12, near:1},
    ff:{x:3.4, y:-6.3, l1:3.15, l2:3.05, hind:0, off:.5, near:0}, nf:{x:3.7, y:-6.2, l1:3.15, l2:3.05, hind:0, off:.62, near:1}};
  const WALK = {fh:0, ff:.25, nh:.5, nf:.75};
  let pitch = 0, nod = 0;
  Object.entries(LEG).forEach(([k, L]) => {
    let a = 0, bend = 0;
    if (gait === 'run') { const q = (ph + L.off) % 1; if (q < .42) a = .62 - 1.24 * q / .42; else { const s = (q - .42) / .58; a = -.62 + 1.24 * s; bend = Math.sin(Math.PI * s) * (L.hind ? .9 : 1.15); } }
    else if (gait === 'walk') { const q = (ph + WALK[k]) % 1; if (q < .62) a = .3 - .6 * q / .62; else { const s = (q - .62) / .38; a = -.3 + .6 * s; bend = Math.sin(Math.PI * s) * .9; } }
    else { a = (L.near ? .04 : -.04) + (k === 'nh' ? -.06 * (o.g || 0) : 0); }
    const u = L.hind ? a - .28 : a + .02, lo = L.hind ? a + .3 + bend * .85 : a - bend;
    const kx = L.x + Math.sin(u) * L.l1, ky = L.y + Math.cos(u) * L.l1, fx = kx + Math.sin(lo) * L.l2, fy = ky + Math.cos(lo) * L.l2;
    legs.push({k, L, kx, ky, fx, fy, lo});
  });
  if (gait === 'run') { pitch = .05 * Math.sin(TAU * ph); nod = .1 * Math.sin(TAU * ph + 1.2); } else if (gait === 'walk') nod = .05 * Math.sin(TAU * ph * 2); else nod = .55 * (o.g || 0);
  const lift = Math.max(...legs.map(l => l.fy)); // the lowest hoof is on the ground
  const dy = -lift, legPart = (l, dark) => {
    const c = dark ? taMix(col, -.38) : col, w1 = l.L.hind ? 1.9 : 1.45;
    add(`M${taN(l.L.x)} ${taN(l.L.y)}L${taN(l.kx)} ${taN(l.ky)}`, null, {s:c, w:w1, ty:dy});
    add(`M${taN(l.kx)} ${taN(l.ky)}L${taN(l.fx)} ${taN(l.fy - .3)}`, null, {s:c, w:.78, ty:dy});
    const fc = dark ? taMix(col, -.2) : (o.sock ? feather : taMix(col, .22));
    add(`M${taN(l.fx - .55)} ${taN(l.fy - 1.1)}Q${taN(l.fx - .7)} ${taN(l.fy - .1)} ${taN(l.fx - .45)} ${taN(l.fy)}L${taN(l.fx + .55)} ${taN(l.fy)}Q${taN(l.fx + .5)} ${taN(l.fy - .7)} ${taN(l.fx + .25)} ${taN(l.fy - 1.1)}Z`, fc, {ty:dy, op:dark ? .7 : .92});
    add(`M${taN(l.fx - .45)} ${taN(l.fy - .32)}L${taN(l.fx + .5)} ${taN(l.fy - .32)}L${taN(l.fx + .62)} ${taN(l.fy + .02)}L${taN(l.fx - .5)} ${taN(l.fy + .02)}Z`, '#141010', {ty:dy});
  };
  // far legs first, darker
  legs.filter(l => !l.L.near).forEach(l => legPart(l, true));
  const tf = {ty:dy, rot:pitch, px:0, py:-7};
  // the tail, knotted up short, swinging
  const sw = gait === 'run' ? Math.sin(TAU * ph + 2) * .5 : Math.sin((o.t || 0) / 700) * .25;
  add(`M-4.9 -8.6Q-6.3 -9.1 -6.9 -7.9Q-7.6 -6.2 ${taN(-7.0 + sw)} ${taN(-4.4 + sw * .3)}Q-6.5 -5.7 -6.15 -6.7Q-5.8 -7.6 -4.8 -7.7Z`, mane, tf);
  add('M-7.15 -8.05L-6.4 -7.6', null, Object.assign({s:brass, w:.32}, tf));
  // the body: croup, back, withers, the deep chest, the belly
  add('M-5.2 -8.2Q-4.7 -9.8 -2.8 -9.6L1.2 -9.2Q3.0 -9.9 4.3 -9.8L5.3 -7.6Q6.0 -6.0 4.6 -5.0Q0.8 -4.5 -2.6 -5.1Q-3.6 -5.0 -4.0 -5.6Q-5.7 -6.0 -5.2 -8.2Z', col, tf);
  add('M-2.8 -5.2Q0.8 -4.5 4.6 -5.0Q2.0 -5.9 -2.4 -5.75Z', 'rgba(0,0,0,.28)', tf);
  add('M-2.8 -8.9Q-4.4 -7.2 -3.5 -5.3', null, Object.assign({s:'rgba(0,0,0,.25)', w:.3}, tf));
  add('M2.9 -9.2Q3.8 -7.4 3.3 -5.4', null, Object.assign({s:'rgba(0,0,0,.2)', w:.3}, tf));
  if (!o.far) add('M-4.4 -9.35Q-2.8 -9.65 1.2 -9.25', null, Object.assign({s:'rgba(255,236,205,.28)', w:.28}, tf));
  // the neck and head, nodding from the withers
  const hf = {ty:dy, rot:pitch + nod, px:4.6, py:-8.4};
  add('M3.0 -9.6Q5.0 -10.6 6.3 -12.6L6.7 -13.1Q7.2 -13.3 7.5 -12.9L9.9 -10.6Q10.6 -9.9 10.2 -9.4Q9.7 -9.0 9.0 -9.4L7.9 -10.0Q7.1 -10.2 6.9 -10.9Q6.5 -8.8 6.0 -7.2L4.6 -7.0Z', col, hf);
  add('M6.8 -12.9L7.0 -14.15L7.4 -13.0Z', col, hf);
  add('M3.3 -9.75Q5.2 -10.8 6.5 -12.8', null, Object.assign({s:mane, w:.7}, hf));
  add('M7.0 -13.0Q7.8 -12.9 7.9 -12.4', null, Object.assign({s:mane, w:.34}, hf));
  if (o.blaze) add('M7.7 -12.6L9.8 -10.4L9.6 -10.2L7.6 -12.2Z', taMix(feather, .3), hf);
  add('M7.1 -12.9L9.8 -10.2M7.5 -10.6L10.0 -10.1M8.8 -11.7L8.3 -10.0', null, Object.assign({s:tack, w:.2}, hf)); // the bridle
  add('M7.7 -12.5L8.6 -12.4L8.55 -11.5L7.65 -11.55Z', tack, hf); // a blinker
  add('M9.85 -9.85L10.0 -9.8', null, Object.assign({s:'#0c0808', w:.22}, hf)); // the nostril
  add('M8.5 -9.8Q7.8 -8.8 6.4 -8.3', null, Object.assign({s:tack, w:.14}, hf)); // the rein
  // the collar and hames, the girth pad, the breast strap and its brass knot
  add('M4.75 -10.2Q6.0 -8.6 5.55 -6.6', null, Object.assign({s:tack, w:1.05}, tf));
  if (!o.far) add('M5.1 -10.4Q6.35 -8.6 5.9 -6.6', null, Object.assign({s:brass, w:.24}, tf));
  add('M0.3 -9.3L1.9 -9.2L1.85 -8.4L0.35 -8.5Z', tack, tf);
  add('M1.15 -8.8L0.9 -4.65', null, Object.assign({s:tack, w:.32}, tf));
  add('M5.6 -7.2L-5.2 -7.0', null, Object.assign({s:tack, w:.26}, tf)); // the trace, back to the bar
  add(`M5.25 -7.1a.38 .38 0 1 0 .76 0a.38 .38 0 1 0 -.76 0`, o.far ? taMix(brass, -.5) : brass, tf);
  add('M7.95 -12.0a.17 .17 0 1 0 .34 0a.17 .17 0 1 0 -.34 0', o.far ? '#111' : '#e8d8b8', hf); // the eye, just past the blinker's edge
  // near legs, over the body
  legs.filter(l => l.L.near).forEach(l => legPart(l, false));
  return P;
}
/* draw the horse's parts on a canvas, in horse units at the current transform */
function ttgHorse(ctx, o = {}){
  ttgHorseParts(o).forEach(p => {
    ctx.save(); ctx.translate(0, p.ty || 0); if (p.rot) { ctx.translate(p.px, p.py); ctx.rotate(p.rot); ctx.translate(-p.px, -p.py); }
    if (p.op != null) ctx.globalAlpha *= p.op;
    if (p.s) taLine(ctx, p.d, p.s, p.w); else taFill(ctx, p.d, p.f);
    ctx.restore(); });
}
/* the same horse as SVG markup (the title art) */
function ttgHorseSVG(o = {}){
  return ttgHorseParts(o).map(p => {
    const tf = `translate(0 ${taN(p.ty || 0)})` + (p.rot ? ` rotate(${taN(p.rot * 180 / Math.PI)} ${p.px} ${p.py})` : ''), op = p.op != null ? ` opacity="${p.op}"` : '';
    return p.s ? `<path transform="${tf}" d="${p.d}" fill="none" stroke="${p.s}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"${op}/>`
               : `<path transform="${tf}" d="${p.d}" fill="${p.f}"${op}/>`; }).join('');
}
/* a horse from above, for the fight: nose toward +x, centred, about 1 unit long; legs reach out as it runs */
function ttgHorseTop(ctx, x, y, L, col, t, moving, i){
  const W = L * .34, ph = moving ? t / 160 + i * .37 : 0, sw = k => moving ? Math.sin(ph * Math.PI * 2 + k) * L * .09 : 0;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(L * .06, W * .25, L * .55, W * .62, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = taMix(col, -.35); ctx.lineWidth = Math.max(1, L * .07); ctx.lineCap = 'round';
  [[L * .26, -1, 0], [L * .26, 1, Math.PI], [-L * .26, -1, Math.PI], [-L * .26, 1, 0]].forEach(([lx, sd, k]) => { ctx.beginPath(); ctx.moveTo(lx, sd * W * .3); ctx.lineTo(lx + sw(k), sd * W * .62); ctx.stroke(); });
  const g = ctx.createLinearGradient(0, -W / 2, 0, W / 2); g.addColorStop(0, taMix(col, .18)); g.addColorStop(.5, col); g.addColorStop(1, taMix(col, -.3));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L * .46, 0); ctx.bezierCurveTo(-L * .46, -W * .55, L * .2, -W * .6, L * .32, -W * .3); ctx.lineTo(L * .32, W * .3); ctx.bezierCurveTo(L * .2, W * .6, -L * .46, W * .55, -L * .46, 0); ctx.fill();
  const nod = moving ? Math.sin(ph * Math.PI * 2) * L * .025 : 0;
  ctx.beginPath(); ctx.moveTo(L * .28, -W * .24); ctx.quadraticCurveTo(L * .5 + nod, -W * .2, L * .62 + nod, -W * .1); ctx.lineTo(L * .62 + nod, W * .1); ctx.quadraticCurveTo(L * .5 + nod, W * .2, L * .28, W * .24); ctx.fill();
  ctx.strokeStyle = '#120c08'; ctx.lineWidth = Math.max(1, L * .05); ctx.beginPath(); ctx.moveTo(L * .26, 0); ctx.lineTo(L * .56 + nod, 0); ctx.stroke(); // the roached mane
  ctx.strokeStyle = '#1a120d'; ctx.lineWidth = Math.max(1, L * .08); ctx.beginPath(); ctx.moveTo(L * .27, -W * .34); ctx.quadraticCurveTo(L * .33, 0, L * .27, W * .34); ctx.stroke(); // the collar
  ctx.fillStyle = '#c9a15a'; ctx.fillRect(L * .25, -W * .4, L * .04, W * .8);
  ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.ellipse(-L * .5, 0, L * .07, W * .12, 0, 0, 7); ctx.fill(); // the knotted tail
  ctx.restore();
}

/* ================= the walking figures =================
   One shared stance of our own (feet on y = 13, facing +x, the head about y = -11), built per figure from a few parts. */
const TTG_SKIN = {captain:'#b88a6a', tavos:'#9a6a48', mira:'#c49a7a', quill:'#d2a888', ossel:'#c8aa98', ressel:'#b48c70', hand:'#8a5e44', guard:'#a87a5c'};
const TF = {
  legs(ctx, c, boot, o = {}){ const st = o.stride || 0, bw = o.bow || 0;
    taFill(ctx, `M-3.7 3.4L-1.0 3.4L${taN(-1.2 - st)} 10.3L${taN(-3.9 - st - bw)} 10.3Z`, taMix(c, -.25));
    taFill(ctx, `M-4.3 10.0L-1.0 10.0L-0.8 13.0L${taN(-4.7 - bw)} 13.0Z`, taMix(boot, -.2));
    taFill(ctx, `M0.2 3.4L3.1 3.4L${taN(3.3 + st + bw)} 10.3L${taN(0.5 + st)} 10.3Z`, c);
    taFill(ctx, `M${taN(.3 + st)} 9.9L${taN(3.6 + st + bw)} 9.9L${taN(5.3 + st + bw)} 11.9L${taN(5.3 + st + bw)} 13.0L${taN(.3 + st)} 13.0Z`, boot);
    taFill(ctx, `M${taN(.3 + st)} 9.9L${taN(3.6 + st + bw)} 9.9L${taN(3.7 + st + bw)} 10.6L${taN(.3 + st)} 10.6Z`, 'rgba(255,240,220,.12)'); },
  /* the coat or jacket: shoulders at y -7, hem at y hem; flare widens the skirt */
  coat(ctx, c1, c2, o = {}){ const hem = o.hem ?? 4.5, w = o.w || 5.6, fl = o.flare || 0;
    const d = `M${-w} -6.4Q0 -8.2 ${w} -6.6L${taN(w + .6 + fl)} ${hem}Q0 ${hem + .8} ${taN(-w - .8 - fl)} ${hem}Z`;
    ctx.fillStyle = taGrad(ctx, -w, 0, w, 0, [[0, taMix(c1, .12)], [.55, c1], [1, c2]]); ctx.fill(taPath(d));
    if (o.belt) taFill(ctx, `M${taN(-w - .2)} 2.2L${taN(w + .3)} 2.2L${taN(w + .35)} 3.6L${taN(-w - .25)} 3.6Z`, o.belt);
    if (o.buckle) taFill(ctx, 'M1.2 2.1L2.6 2.1L2.6 3.7L1.2 3.7Z', o.buckle);
    return d; },
  head(ctx, sk, o = {}){ const y = o.y ?? -11.2, r = o.r || 4.3;
    taOval(ctx, .2, y + 3.6, 1.7, 1.6, taMix(sk, -.25)); // the neck
    ctx.fillStyle = taRad(ctx, -.8, y - 1.6, .5, r * 1.3, [[0, taMix(sk, .14)], [.6, sk], [1, taMix(sk, -.3)]]); ctx.beginPath(); ctx.ellipse(.3, y, r * .95, r * 1.04, 0, 0, 7); ctx.fill();
    taFill(ctx, `M${taN(r * .85)} ${taN(y - 1.0)}L${taN(r * 1.22)} ${taN(y + .7)}L${taN(r * .9)} ${taN(y + 1.1)}Z`, taMix(sk, -.08)); // the nose
    taOval(ctx, -1.6, y + .2, .8, 1.15, taMix(sk, -.2)); // the ear
    if (!o.noEye) { taOval(ctx, r * .58, y - .55, .5, .55, '#1a120c'); taOval(ctx, r * .66, y - .7, .16, .16, 'rgba(255,255,255,.6)'); }
    if (o.brow) taLine(ctx, `M${taN(r * .3)} ${taN(y - 1.6)}L${taN(r * .95)} ${taN(y - 1.45)}`, o.brow, .55);
    if (o.mouth !== false) taLine(ctx, `M${taN(r * .55)} ${taN(y + 2.1)}L${taN(r * .95)} ${taN(y + 2.0)}`, 'rgba(60,24,20,.55)', .35); },
  arm(ctx, sx, sy, hx, hy, sleeve, hand, w){ taLine(ctx, `M${taN(sx)} ${taN(sy)}Q${taN((sx + hx) / 2 - .6)} ${taN((sy + hy) / 2 + .6)} ${taN(hx)} ${taN(hy)}`, 'rgba(0,0,0,.35)', (w || 2.6) + .8);
    taLine(ctx, `M${taN(sx)} ${taN(sy)}Q${taN((sx + hx) / 2 - .6)} ${taN((sy + hy) / 2 + .6)} ${taN(hx)} ${taN(hy)}`, sleeve, w || 2.6); taOval(ctx, hx, hy, 1.25, 1.25, hand); },
  knot(ctx, x, y, r, col, w){ ctx.strokeStyle = col; ctx.lineWidth = w || .45; ctx.beginPath(); ctx.arc(x - r * .55, y, r, 0, 7); ctx.moveTo(x + r * 1.55, y); ctx.arc(x + r * .55, y, r, 0, 7); ctx.stroke(); }, // the guild's knot: two linked rings
};
const TTG_FIGS = {
  /* the captain: a guild coat of deep blue-black to the knee, brass buttons, the knot on the breast, a ledger under the arm and a sword at the hip */
  ttg_sgt(ctx, t){ const sk = TTG_SKIN.captain;
    taLine(ctx, 'M-4.6 3.0L-9.0 9.2', '#2a2422', 1.2); taFill(ctx, 'M-4.4 2.4L-3.6 3.6L-5.2 4.2Z', '#c9a15a'); // the scabbard behind
    TF.arm(ctx, -3.6, -5.6, -4.8, 1.8, '#1a2230', sk);
    TF.legs(ctx, '#2c2a2e', '#17110d');
    TF.coat(ctx, '#2a3446', '#121822', {hem:7.6, w:5.7, flare:.8, belt:'#3a2a1c', buckle:'#c9a15a'});
    taFill(ctx, 'M0.6 -6.9L2.0 -6.9L1.6 7.6L0.3 7.6Z', 'rgba(0,0,0,.25)'); // the coat's front edge
    [-4.6, -2.4, -.2].forEach(y => taOval(ctx, 2.1, y, .45, .45, '#c9a15a'));
    TF.knot(ctx, -1.6, -3.6, .9, '#e2c07a', .4);
    taFill(ctx, 'M-5.0 -6.7Q0 -9.0 5.2 -6.9L4.4 -5.6Q0 -7.4 -4.4 -5.6Z', '#3a4660'); // the turned collar
    TF.head(ctx, sk, {brow:'#2a1c14'});
    taFill(ctx, 'M-3.6 -12.4Q-3.4 -16.2 0.6 -16.0Q4.0 -15.9 4.5 -13.2L3.4 -13.9Q1.4 -14.6 -.6 -13.8L-1.2 -11.2L-3.6 -10.0Z', '#2a1c14'); // short dark hair
    TF.arm(ctx, 3.0, -5.6, 4.4, 0.6, '#2a3446', sk);
    taFill(ctx, 'M2.6 -1.4L6.6 -1.8L6.9 2.6L2.9 3.0Z', '#5a3c22'); taFill(ctx, 'M2.9 -1.2L6.4 -1.6L6.5 -.9L3.0 -.5Z', '#d8c8a2'); // the ledger
  },
  /* Tavos the driver: short and broad, bowed at the knee, oiled leather, a hat with a brim wide enough to hold rain, the long whip */
  ttg_tavos(ctx, t, o){ const sk = TTG_SKIN.tavos, sway = o.still ? 0 : Math.sin(t / 380 + (o.phase || 0)) * .8;
    ctx.save(); ctx.translate(0, 13); ctx.scale(1.12, .92); ctx.translate(0, -13);
    TF.arm(ctx, -4.0, -5.2, -5.6, 1.6, '#4a3020', sk, 2.9);
    TF.legs(ctx, '#3a3026', '#1c140e', {bow:.7});
    TF.coat(ctx, '#6a4426', '#2e1c10', {hem:5.4, w:6.2, belt:'#22160e', buckle:'#8a7a5a'});
    taLine(ctx, 'M-4.6 -5.6Q-1 -1.6 3.6 -5.4', 'rgba(255,230,190,.18)', .5); // the oil's shine
    ctx.strokeStyle = '#d8c8a2'; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(-3.4, -6.4); ctx.quadraticCurveTo(0, -3.0, 3.8, -6.2); ctx.stroke(); // the eleven knotted cords
    for (let i = 0; i < 6; i++) taOval(ctx, -2.8 + i * 1.2, -5.5 + Math.sin(i / 5 * Math.PI) * 1.7, .3, .3, '#e8dcbc');
    TF.head(ctx, sk, {brow:'#5a5048'});
    taFill(ctx, 'M1.2 -9.0Q3.0 -8.0 4.6 -8.9L4.4 -8.2Q2.8 -7.4 1.4 -8.2Z', '#8a8278'); // a grey moustache
    taFill(ctx, 'M-8.6 -13.2Q0.4 -15.0 9.0 -13.0Q9.4 -12.2 8.0 -12.0Q0.4 -13.4 -7.4 -12.0Q-9.0 -12.2 -8.6 -13.2Z', '#3a2a1c'); // the brim
    taFill(ctx, 'M-3.6 -13.6Q-3.4 -18.6 0.4 -18.6Q4.2 -18.6 4.4 -13.6Z', '#4a3624'); taFill(ctx, 'M-3.5 -14.9L4.3 -14.9L4.35 -13.7L-3.55 -13.7Z', '#7a2a1c');
    // the whip: a stock in the hand, the thong in a long loose curve that moves
    TF.arm(ctx, 3.2, -5.2, 5.0, -1.2, '#6a4426', sk, 2.9);
    taLine(ctx, 'M5.0 -1.2L7.6 -10.4', '#4a3220', .9);
    taLine(ctx, `M7.6 -10.4Q${taN(12 + sway)} -16 ${taN(14.5 + sway * 1.5)} -9.5Q${taN(15.5 + sway)} -5 ${taN(13.4 + sway * 2)} -1.8`, '#2a1c12', .4);
    ctx.restore(); },
  /* Mira the warden: tall, scale over leather, an open-faced helm, the broad-bladed spear behind and the rimmed shield with the knot in front */
  ttg_mira(ctx, t){ const sk = TTG_SKIN.mira;
    ctx.save(); ctx.translate(0, 13); ctx.scale(1.06, 1.12); ctx.translate(0, -13);
    taLine(ctx, 'M6.8 12.6L6.8 -19.5', '#6a5034', 1.3, 'butt'); taFill(ctx, 'M6.8 -25.5Q8.6 -21.6 7.6 -19.2L6.0 -19.2Q5.0 -21.6 6.8 -25.5Z', '#d4ccbc'); taFill(ctx, 'M5.6 -19.4L8.0 -19.4L7.8 -18.6L5.8 -18.6Z', '#5a5048');
    TF.arm(ctx, 3.2, -5.6, 6.4, -1.6, '#5a5a5e', sk, 2.7);
    TF.legs(ctx, '#3a3a40', '#1a1614');
    const d = TF.coat(ctx, '#8a8a86', '#3a3a3c', {hem:5.6, w:6.4, belt:'#5a2418', buckle:'#b8b0a0'});
    ctx.save(); ctx.clip(taPath(d)); ctx.strokeStyle = 'rgba(20,20,24,.45)'; ctx.lineWidth = .35; for (let y = -5.6; y < 5; y += 1.3) for (let x = -6.4 + (Math.round(y * 10) % 2 ? .65 : 0); x < 7; x += 1.3) { ctx.beginPath(); ctx.arc(x, y, .65, 0, Math.PI); ctx.stroke(); } ctx.restore(); // the scales
    TF.head(ctx, sk, {brow:'#2a1a12', mouth:true});
    taFill(ctx, 'M-4.4 -11.6Q-4.6 -16.8 0.4 -16.9Q5.2 -16.8 5.0 -12.6L4.6 -12.4Q4.4 -15.4 0.4 -15.4Q-3.0 -15.4 -2.8 -11.0L-1.4 -8.0L-3.6 -7.6Z', '#7a7a80'); // the helm, open-faced, a cheek guard
    taLine(ctx, 'M-3.8 -14.8Q0.2 -17.0 4.6 -14.4', 'rgba(255,255,255,.35)', .4);
    taFill(ctx, 'M-4.0 -9.0Q-6.0 -6.8 -5.4 -4.6L-4.4 -4.6Q-4.6 -6.8 -3.2 -8.6Z', '#2a1a12'); // the braid under it
    // the shield, big and round on the near arm: dark red, a bone band, an iron rim, the knot in brass
    const sx = 1.4, sy = -.6, R = 7.4;
    ctx.fillStyle = taRad(ctx, sx - 2, sy - 2, 1, R, [[0, '#8a3426'], [1, '#3a120c']]); ctx.beginPath(); ctx.arc(sx, sy, R, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a8680'; ctx.lineWidth = 1.1; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(sx, sy, R - .3, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    TF.knot(ctx, sx, sy, 2.1, '#e2c07a', .75); taOval(ctx, sx, sy, .7, .7, '#b8b0a0');
    ctx.restore(); },
  /* Quill the marksman: slight, a quilted jacket that does not ring, the hood down, a recurved horn bow, grey fletching at the shoulder */
  ttg_quill(ctx, t, o){ const sk = TTG_SKIN.quill;
    ctx.save(); ctx.translate(0, 13); ctx.scale(.92, .98); ctx.translate(0, -13);
    taFill(ctx, 'M-5.2 -6.4L-3.4 -7.0L-1.0 3.4L-2.8 3.8Z', '#3a2c20'); // the quiver
    [-5.6, -4.7, -3.8].forEach((x, i) => taFill(ctx, `M${x} ${-7.4 - i * .3}L${x + .8} ${-9.6 - i * .3}L${x + 1.2} ${-7.2 - i * .3}Z`, '#a8a8a4'));
    TF.arm(ctx, -3.4, -5.6, -3.0, 1.6, '#4a5a50', sk, 2.3);
    TF.legs(ctx, '#3a3830', '#2a1e14', {stride:.4});
    const d = TF.coat(ctx, '#5f7a6a', '#2a3a32', {hem:5.0, w:5.0, belt:'#3a2a1c'});
    ctx.save(); ctx.clip(taPath(d)); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = .3; for (let k = -10; k < 10; k += 1.8) { ctx.beginPath(); ctx.moveTo(k, -8); ctx.lineTo(k + 12, 6); ctx.moveTo(k + 12, -8); ctx.lineTo(k, 6); ctx.stroke(); } ctx.restore(); // the quilting
    taFill(ctx, 'M-5.2 -6.6Q-6.0 -9.6 -3.0 -9.0Q0 -7.6 4.4 -7.2L4.6 -6.0Q0 -6.0 -5.0 -5.4Z', '#4a6252'); // the hood, down
    TF.head(ctx, sk, {r:4.0, y:-11.0, brow:'#b89060'});
    taFill(ctx, 'M-3.4 -11.4Q-3.6 -15.6 0.4 -15.4Q3.8 -15.2 4.1 -12.6Q2.0 -13.6 0.6 -13.2L-0.8 -11.6L-1.6 -9.6L-3.4 -9.2Z', '#c8a068'); // cropped hair, sun-pale
    taOval(ctx, 2.4, -9.6, .25, .2, 'rgba(140,80,50,.4)'); taOval(ctx, 3.1, -9.9, .2, .18, 'rgba(140,80,50,.4)'); // freckles
    // the bow held low and ready: horn and sinew, a deep recurve, the string straight
    TF.arm(ctx, 2.8, -5.6, 6.0, -1.8, '#5f7a6a', sk, 2.3);
    ctx.strokeStyle = '#d8c8a8'; ctx.lineWidth = .3; ctx.beginPath(); ctx.moveTo(7.6, -11.6); ctx.lineTo(7.6, 8.0); ctx.stroke();
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.0; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(7.6, -11.6); ctx.quadraticCurveTo(6.0, -10.6, 6.0, -8.0); ctx.quadraticCurveTo(5.4, -1.8, 6.0, 4.4); ctx.quadraticCurveTo(6.0, 7.0, 7.6, 8.0); ctx.stroke();
    taFill(ctx, 'M5.4 -2.6L6.6 -2.6L6.6 -.8L5.4 -.8Z', '#3a2618'); // the grip
    ctx.restore(); },
  /* Ossel the seam-reader: old and stooped, a plum coat of too many pockets, a white beard, a staff of black wood, the warren never quite gone from him */
  ttg_ossel(ctx, t, o){ const sk = TTG_SKIN.ossel, fl = .5 + Math.sin(t / 260 + (o.phase || 0)) * .25;
    ctx.save(); ctx.translate(0, 13); ctx.scale(1, 1.02); ctx.translate(0, -13);
    TF.arm(ctx, -3.6, -5.2, -4.2, 1.8, '#3a2234', sk, 2.4);
    TF.legs(ctx, '#2a2228', '#18120e');
    ctx.save(); ctx.translate(0, -6.5); ctx.rotate(.12); ctx.translate(0, 6.5); // the stoop
    const d = TF.coat(ctx, '#56324e', '#22121e', {hem:11.6, w:5.8, flare:1.8});
    ctx.save(); ctx.clip(taPath(d)); [[-4, -2], [-4.4, 3.6], [-1.6, 7.6], [1.4, 1.2], [3.2, 6.4], [-2.4, -5.2]].forEach(([x, y]) => { taFill(ctx, `M${x} ${y}L${x + 2.6} ${y}L${x + 2.4} ${y + 2.2}L${x + .2} ${y + 2.2}Z`, 'rgba(0,0,0,.28)'); taLine(ctx, `M${x} ${y}L${x + 2.6} ${y}`, 'rgba(255,220,240,.18)', .3); }); ctx.restore(); // pockets, everywhere
    taOval(ctx, -2.6, 5.0, .9, .5, 'rgba(240,240,230,.35)'); // chalk dust
    TF.head(ctx, sk, {y:-10.4, r:4.1, brow:'#e8e4dc'});
    taFill(ctx, 'M-3.2 -12.6Q-3.8 -9.6 -2.2 -8.8L-1.4 -10.6Q-1.8 -12.2 -2.0 -13.6Z', '#dcd6cc'); // the white fringe round a bald crown
    taLine(ctx, 'M-1.8 -14.4Q1.0 -15.3 3.0 -14.2', 'rgba(255,255,255,.3)', .5);
    taFill(ctx, 'M0.6 -8.8Q2.6 -7.8 4.4 -8.6Q4.2 -5.4 2.4 -1.6Q1.6 -4.6 0.4 -6.6Z', '#e4e0d8'); // the long thin beard
    TF.arm(ctx, 3.0, -5.2, 5.6, -1.0, '#56324e', sk, 2.4);
    ctx.restore();
    taLine(ctx, 'M6.4 13.0L5.8 -15.6', '#141016', 1.25); // the staff of black wood
    ctx.save(); ctx.globalAlpha *= fl; ctx.fillStyle = taRad(ctx, 5.8, -16.6, 0, 4.4, [[0, 'rgba(200,180,255,.9)'], [1, 'rgba(160,141,224,0)']]); ctx.fillRect(1.4, -21, 8.8, 8.8); ctx.restore();
    taOval(ctx, 5.8, -16.6, .75, .75, '#ece4ff');
    ctx.restore(); },
  /* Factor Ressel: the counting-room's clerk, a long grey gown, ink on the cuffs, spectacles, the manifest */
  ttg_factor(ctx, t){ const sk = TTG_SKIN.ressel;
    TF.arm(ctx, -3.6, -5.6, -4.2, 2.0, '#4a4640', sk);
    TF.legs(ctx, '#2a2622', '#17120e');
    TF.coat(ctx, '#6a665e', '#2e2c28', {hem:11.8, w:6.0, flare:1.2, belt:'#2a2018'});
    taFill(ctx, 'M-6.0 -6.4L6.0 -6.6L6.0 -5.4L-6.0 -5.2Z', '#8a2a20'); // the guild's red shoulder-band, for staff of the house
    TF.head(ctx, sk, {brow:'#3a3230'});
    taFill(ctx, 'M-3.8 -11.4Q-3.6 -16.0 0.4 -15.8Q4.0 -15.7 4.4 -13.4L-0.4 -13.6L-1.6 -10.6Z', '#4a4440');
    ctx.strokeStyle = '#c9a15a'; ctx.lineWidth = .3; ctx.beginPath(); ctx.arc(2.6, -11.6, .9, 0, 7); ctx.moveTo(-0.6, -11.8); ctx.lineTo(1.7, -11.7); ctx.stroke(); // spectacles
    TF.arm(ctx, 3.0, -5.6, 3.6, -1.0, '#6a665e', sk);
    taFill(ctx, 'M1.6 -3.4L7.0 -3.8L7.2 1.8L1.8 2.2Z', '#e4d8bc'); taLine(ctx, 'M2.6 -2.2L6.2 -2.5M2.6 -1.0L6.2 -1.3M2.6 .2L5.2 0', 'rgba(40,30,20,.55)', .3); // the manifest
    taOval(ctx, 4.6, -1.0, 1.0, 1.0, '#8a2a20'); // its seal
  },
  /* a stable hand: sleeves rolled, a leather apron, a bucket of oats */
  ttg_hand(ctx, t){ const sk = TTG_SKIN.hand;
    TF.arm(ctx, -3.6, -5.6, -5.0, 1.4, sk, sk, 2.4);
    TF.legs(ctx, '#4a3e30', '#22180e');
    TF.coat(ctx, '#a89a7a', '#5a5040', {hem:4.0, w:5.4});
    taFill(ctx, 'M-4.0 -3.0L4.4 -3.0L5.2 9.2L-4.8 9.2Z', '#5a3a22'); // the apron
    TF.head(ctx, sk, {brow:'#1a120c'});
    taFill(ctx, 'M-3.8 -11.0Q-4.4 -16.4 0.6 -16.2Q4.6 -16.0 4.4 -13.0Q2.4 -14.6 0.2 -13.8L-1.2 -10.0Z', '#1e1410'); // dark curls
    taOval(ctx, -1.6, -15.2, 1.4, 1.1, '#1e1410'); taOval(ctx, 1.2, -16.0, 1.3, 1.0, '#1e1410');
    TF.arm(ctx, 3.0, -5.6, 5.2, 1.6, sk, sk, 2.4);
    taFill(ctx, 'M3.6 2.0L8.0 2.0L7.4 7.0L4.2 7.0Z', '#5a5048'); taLine(ctx, 'M3.6 2.0Q5.8 -1.6 8.0 2.0', '#3a3430', .35); taOval(ctx, 5.8, 2.1, 2.1, .5, '#c8a860'); // the bucket of oats
  },
  /* the yard guard: a guild tabard with the knot, a helm with a brim, a halberd, a lantern at the belt */
  ttg_guard(ctx, t, o){ const sk = TTG_SKIN.guard, fl = .7 + Math.sin(t / 190 + (o.phase || 0)) * .15;
    taLine(ctx, 'M6.2 12.8L6.2 -20.0', '#5a4228', 1.2, 'butt');
    taFill(ctx, 'M6.2 -25.0L7.0 -20.0L5.4 -20.0Z', '#cfc8b8'); taFill(ctx, 'M6.4 -21.6Q10.4 -22.2 10.0 -17.6Q8.6 -19.2 6.4 -18.8Z', '#a8a29a'); // the halberd's head
    TF.arm(ctx, -3.6, -5.6, -4.6, 2.0, '#3a3a44', sk);
    TF.legs(ctx, '#2c2c30', '#17120e');
    TF.coat(ctx, '#5a5e66', '#2a2c30', {hem:4.4, w:5.8});
    taFill(ctx, 'M-3.6 -6.8L3.8 -6.8L4.0 8.0L-3.8 8.0Z', '#1e2a3c'); TF.knot(ctx, 0.2, -1.6, 1.2, '#c9a15a', .45); // the tabard
    taFill(ctx, 'M-4.6 3.0L4.8 3.0L4.8 4.2L-4.6 4.2Z', '#3a2a1c');
    TF.head(ctx, sk, {brow:'#2a1c14'});
    taFill(ctx, 'M-4.4 -12.4Q-4.4 -17.0 0.4 -17.0Q5.0 -17.0 5.0 -12.4Z', '#6a6c72'); taFill(ctx, 'M-6.0 -12.8L6.6 -12.8L6.0 -11.8L-5.4 -11.8Z', '#5a5c62');
    taLine(ctx, 'M-3.4 -15.2Q0 -16.6 3.4 -15.2', 'rgba(255,255,255,.3)', .4);
    TF.arm(ctx, 3.0, -5.6, 5.8, -2.0, '#5a5e66', sk);
    ctx.save(); ctx.globalAlpha *= fl; ctx.fillStyle = taRad(ctx, -5.4, 5.6, 0, 4.6, [[0, 'rgba(150,190,255,.8)'], [1, 'rgba(110,160,255,0)']]); ctx.fillRect(-10, 1, 9.2, 9.2); ctx.restore();
    taFill(ctx, 'M-6.4 4.0L-4.4 4.0L-4.2 7.4L-6.6 7.4Z', '#2a2a30'); taFill(ctx, 'M-6.0 4.6L-4.8 4.6L-4.7 6.8L-6.1 6.8Z', '#bcd4ff'); // the lantern, gaslight blue
  },
};
/* the shareholders' ids and the yard's kinds lead here */
const TTG_FIG = {sgt:'ttg_sgt', tavos:'ttg_tavos', mira:'ttg_mira', quill:'ttg_quill', ossel:'ttg_ossel', pell:'ttg_factor', ressel:'ttg_factor'};
{ const _drawFigure = drawFigure; drawFigure = function(ctx, kind, cx, cy, s, t, o = {}){
    const k = TTG_FIG[kind] || kind, F = TTG_FIGS[k]; if (!F) return _drawFigure.apply(this, arguments);
    const dir = o.dir || 1, bob = o.still ? 0 : Math.sin(t / 420 + (o.phase || 0)) * .6 * s;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir * s, s); ctx.translate(0, bob); ctx.globalAlpha = o.alpha ?? 1;
    if (!o.air) taOval(ctx, 0, 13, 9, 3, 'rgba(0,0,0,.5)');
    try { F(ctx, t || 0, o); } finally { ctx.restore(); } }; }
TTG_SQUAD.forEach(id => { if (TPL[id]) TPL[id].fig = TTG_FIG[id]; });

/* ================= the portraits =================
   Painted in bust units: x from about -46 to 46, the frame's foot at y = 0, shoulders near y = -40, the head near y = -75.
   One painter of our own for the head and the shoulders, and each shareholder's kit, hair and wear on top. */
const TB = {
  shoulders(ctx, o){ const w = o.wide || 42, nw = o.nw || 8, top = o.top ?? -44, slope = o.slope || 0;
    const d = `M${-w - 4} 2L${-w} -16C${-w} ${top + 12 + slope} ${-w * .8} ${top + 4 + slope} ${-w * .46} ${top + 2}Q-16 ${top} ${-nw - 3} ${top - 4}L${nw + 3} ${top - 4}Q16 ${top} ${w * .46} ${top + 2}C${w * .8} ${top + 4 - slope} ${w} ${top + 12 - slope} ${w} -16L${w + 4} 2Z`;
    ctx.fillStyle = taGrad(ctx, -w, 0, w, 0, [[0, taMix(o.c1, .14)], [.38, o.c1], [.78, o.c2], [1, '#070606']]); ctx.fill(taPath(d));
    return d; },
  neck(ctx, F, nw){ const d = `M${-nw} ${F.cy + F.h * .55}L${-nw - 1.5} -40L${nw + 1.5} -40L${nw} ${F.cy + F.h * .55}Z`;
    ctx.fillStyle = taGrad(ctx, -nw, 0, nw, 0, [[0, taMix(F.skin, -.1)], [.5, taMix(F.skin, -.2)], [1, taMix(F.skin, -.5)]]); ctx.fill(taPath(d));
    ctx.fillStyle = 'rgba(20,10,6,.45)'; ctx.beginPath(); ctx.ellipse(0, F.cy + F.h * .8, nw + 1, 4.5, 0, 0, 7); ctx.fill(); },
  headPath(F){ const {cy, w, h} = F, j = F.jaw || .72, c = F.chin || .3, t = F.turn || 0;
    return `M${t} ${cy - h}C${w * .78 + t} ${cy - h} ${w + t * .4} ${cy - h * .55} ${w} ${cy - h * .08}C${w} ${cy + h * .36} ${w * j + t * .4} ${cy + h * .72} ${w * c + t} ${cy + h * .96}Q${t} ${cy + h * 1.06} ${-w * c + t} ${cy + h * .96}C${-w * j + t * .4} ${cy + h * .72} ${-w} ${cy + h * .36} ${-w} ${cy - h * .08}C${-w} ${cy - h * .55} ${-w * .78 + t} ${cy - h} ${t} ${cy - h}Z`; },
  /* the face: lit from the low left, as the frame's lantern is */
  face(ctx, F){ const {cy, w, h, skin} = F, t = F.turn || 0, P = taPath(TB.headPath(F)), dk = taMix(skin, -.42);
    [-1, 1].forEach(sd => { ctx.fillStyle = taMix(skin, sd < 0 ? -.12 : -.36); ctx.beginPath(); ctx.ellipse(sd * (w + .6), cy + 1, 2.6, 4.6, sd * .12, 0, 7); ctx.fill(); // the ears
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sd * (w + .9), cy + 1, 1.1, 2.6, 0, 0, 7); ctx.fill(); });
    ctx.fillStyle = taRad(ctx, -w * .35 + t, cy - h * .25, 1, h * 1.25, [[0, taMix(skin, .16)], [.45, skin], [.85, taMix(skin, -.28)], [1, dk]]); ctx.fill(P);
    ctx.save(); ctx.clip(P);
    ctx.fillStyle = taGrad(ctx, -w, 0, w, 0, [[0, 'rgba(0,0,0,0)'], [.62, 'rgba(0,0,0,0)'], [1, 'rgba(10,4,2,.45)']]); ctx.fillRect(-w - 2, cy - h - 2, w * 2 + 4, h * 2 + 4); // the dark side
    ctx.fillStyle = 'rgba(30,12,6,.12)'; ctx.beginPath(); ctx.ellipse(t, cy + h * 1.04, w * .45, h * .14, 0, 0, 7); ctx.fill(); // under the chin
    const soft = (x, y, rx, ry, rgb, a) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.fillStyle = taRad(ctx, 0, 0, 0, rx, [[0, `rgba(${rgb},${a})`], [1, `rgba(${rgb},0)`]]); ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore(); };
    if (F.blush) [-1, 1].forEach(sd => soft(sd * w * .52 + t, cy + h * .25, w * .3, h * .16, '190,80,70', F.blush));
    if (F.hollow) [-1, 1].forEach(sd => soft(sd * w * .66 + t, cy + h * .4, w * .3, h * .26, '40,16,10', F.hollow));
    if (F.stubble) { const r = taRng(F.seed || 3); ctx.fillStyle = F.stubble; for (let i = 0; i < 520; i++) { const x = (r() - .5) * 2 * w, y = cy + h * (.3 + r() * .72); if (Math.abs(x - t) < w * .26 && y < cy + h * .7) continue; ctx.fillRect(x, y, .45, .45); } }
    ctx.restore();
    const ey = cy - h * .06, ex = w * .43, sq = F.squint || 0;
    [-1, 1].forEach(sd => { const x = sd * ex + t * (sd > 0 ? .7 : 1.1), ew = 3.1 - (sd > 0 ? t * .25 : 0);
      taOval(ctx, x, ey - .6, ew + 1.6, 3.2, 'rgba(40,16,8,.24)'); // the socket
      const lid = 1.55 * (1 - sq * .55);
      const eye = `M${x - ew} ${ey}Q${x} ${ey - lid * 1.4} ${x + ew} ${ey}Q${x} ${ey + lid} ${x - ew} ${ey}Z`;
      taFill(ctx, eye, '#e8ded0'); ctx.save(); ctx.clip(taPath(eye)); const ix = x + (F.look || .4);
      taOval(ctx, ix, ey - .1, 1.45, 1.55, F.iris || '#4a3020'); taOval(ctx, ix, ey - .1, .62, .66, '#0a0606'); taOval(ctx, ix - .5, ey - .6, .4, .36, 'rgba(255,255,255,.85)');
      ctx.fillStyle = 'rgba(40,20,10,.35)'; ctx.fillRect(x - ew, ey - lid * 1.4, ew * 2, lid * .7); ctx.restore();
      taLine(ctx, `M${x - ew - .3} ${ey + .1}Q${x} ${ey - lid * 1.5} ${x + ew + .2} ${ey - .2}`, '#1e100a', .75); // the upper lid
      taLine(ctx, `M${x - ew + .6} ${ey + lid * .9}Q${x} ${ey + lid * 1.3} ${x + ew - .4} ${ey + lid * .7}`, taAlpha(dk, .5), .35);
      if (F.age > .4) { taLine(ctx, `M${x + sd * (ew + .6)} ${ey - .2}l${sd * 2.2} -1.0M${x + sd * (ew + .7)} ${ey + .7}l${sd * 2.4} .2M${x + sd * (ew + .5)} ${ey + 1.5}l${sd * 2} 1.2`, taAlpha(dk, F.age * .55), .3); // crow's feet
        taLine(ctx, `M${x - ew + .8} ${ey + lid + 1.4}Q${x} ${ey + lid + 2.3} ${x + ew - .6} ${ey + lid + 1.2}`, taAlpha(dk, F.age * .5), .35); } // bags
      const by = ey - 4.6 - (F.arch || 0) * sd * 0;
      taLine(ctx, `M${x - sd * (ew + .4) + (sd > 0 ? 0 : 0)} ${by + (sd < 0 ? .8 : .4)}Q${x} ${by - 1.4 - (F.arch || 0)} ${x + sd * (ew + .8)} ${by + .6 + (F.browDrop || 0)}`, F.browCol || '#2a1a10', F.browW || 1.6); });
    // the nose: the bridge's shadow on the dark side, a lit tip, the nostrils
    const nt = cy + h * .34, nx = t * 1.3 + .4;
    ctx.save(); ctx.filter = 'blur(.6px)'; taLine(ctx, `M${nx + 1.6} ${ey + 1}Q${nx + 2.4} ${cy + h * .16} ${nx + 2.8} ${nt - .6}`, taAlpha(dk, .3), 1.1); ctx.restore();
    taOval(ctx, nx + .2, nt - .8, 2.4, 2.0, taAlpha(taMix(skin, .14), .55));
    taOval(ctx, nx - 1.6, nt + .5, 1.0, .55, 'rgba(30,10,6,.6)'); taOval(ctx, nx + 2.0, nt + .5, 1.0, .55, 'rgba(30,10,6,.7)');
    taLine(ctx, `M${nx - 3.0} ${nt}Q${nx - 3.4} ${nt + 1.0} ${nx - 2.2} ${nt + 1.1}M${nx + 3.4} ${nt - .2}Q${nx + 3.8} ${nt + .9} ${nx + 2.6} ${nt + 1.1}`, taAlpha(dk, .6), .45);
    if (F.age > .3) taLine(ctx, `M${nx - 4.2} ${nt + 1.6}Q${nx - 6.6} ${cy + h * .55} ${nx - 6.0} ${cy + h * .72}M${nx + 4.6} ${nt + 1.6}Q${nx + 7.0} ${cy + h * .55} ${nx + 6.4} ${cy + h * .72}`, taAlpha(dk, F.age * .6), .45); // the folds
    // the mouth
    const my = cy + h * .58, mw = F.mouthW || 5.4, sm = F.smile || 0;
    taFill(ctx, `M${nx - mw} ${my}Q${nx} ${my - 1.6} ${nx + mw} ${my}Q${nx} ${my + 2.8} ${nx - mw} ${my}Z`, F.lip || taMix(skin, -.22));
    taLine(ctx, `M${nx - mw - .4} ${my - sm}Q${nx} ${my + .7} ${nx + mw + .4} ${my - sm * 1.2}`, '#2a0e08', .8);
    taOval(ctx, nx - .8, my + 1.5, 2.2, .55, 'rgba(255,230,220,.22)');
    if (F.forehead) taLine(ctx, `M${-w * .5 + t} ${cy - h * .58}Q${t} ${cy - h * .64} ${w * .5 + t} ${cy - h * .57}M${-w * .38 + t} ${cy - h * .48}Q${t} ${cy - h * .53} ${w * .4 + t} ${cy - h * .47}`, taAlpha(dk, F.forehead), .4);
    if (F.scar) taLine(ctx, F.scar, 'rgba(240,200,190,.55)', .6);
  },
  /* a soft rim of cool light down the right edge, and the lantern warm on the left */
  light(ctx, d){ ctx.save(); ctx.clip(taPath(d)); ctx.fillStyle = taGrad(ctx, 46, -60, 20, -20, [[0, 'rgba(190,210,245,.25)'], [1, 'rgba(190,210,245,0)']]); ctx.fillRect(-50, -110, 100, 112);
    ctx.fillStyle = taRad(ctx, -40, -10, 0, 60, [[0, 'rgba(255,190,120,.22)'], [1, 'rgba(255,190,120,0)']]); ctx.fillRect(-50, -110, 100, 112); ctx.restore(); },
};
const TTG_POR = {
  /* the captain: the guild coat, deep blue-black with a high collar and brass buttons, the knot brooch, the ledger's strap across, short dark hair */
  sgt(ctx){ const F = {cy:-75, w:13.2, h:19, jaw:.74, chin:.32, skin:'#b88a6a', iris:'#4a3626', browCol:'#2a1c14', browW:1.7, age:.3, turn:.6, look:.5, mouthW:5.2, smile:.15, forehead:.18};
    TB.neck(ctx, F, 8.6);
    const d = TB.shoulders(ctx, {wide:43, c1:'#2c3a52', c2:'#121826'});
    ctx.save(); ctx.clip(taPath(d));
    taFill(ctx, 'M-3 -46L3 -46L5 2L-1 2Z', 'rgba(0,0,0,.35)'); taLine(ctx, 'M1.8 -44L4.6 2', 'rgba(255,255,255,.08)', .8); // the front of the coat
    [-34, -24, -14, -4].forEach(y => { taOval(ctx, 8, y, 1.7, 1.7, '#c9a15a'); taOval(ctx, 7.5, y - .5, .6, .6, '#f4dca0'); });
    taLine(ctx, 'M-30 -42L22 2', '#3a2616', 4.2); taLine(ctx, 'M-30 -42L22 2', 'rgba(255,220,180,.12)', .8); // the ledger's strap
    taOval(ctx, -9, -24, 2.6, 2.2, '#8a8070'); taOval(ctx, -9, -24, 1.4, 1.1, '#2a2622');
    TB.light(ctx, d); ctx.restore();
    taFill(ctx, 'M-15 -50Q-20 -44 -26 -40L-14 -36Q-8 -44 -6 -50Z', '#3a4a68'); taFill(ctx, 'M15 -50Q20 -44 26 -40L14 -36Q8 -44 6 -50Z', '#1e2638'); // the high collar
    TF.knot(ctx, -18, -30, 3.0, '#e2c07a', 1.2); taOval(ctx, -18, -30, .9, .9, '#f4dca0');
    TB.face(ctx, F);
    // short dark hair, cut square, a little grey at the temple
    taFill(ctx, 'M-14 -76Q-16 -98 1 -98Q17 -98 15 -78L13.4 -84Q10 -91 2 -90Q-6 -91 -10 -86L-12.8 -74Z', '#22160e');
    taFill(ctx, 'M-13.6 -84Q-12.2 -80 -12.6 -74L-13.8 -75Q-14.2 -80 -13.6 -84Z', 'rgba(190,180,170,.45)');
    ctx.strokeStyle = 'rgba(80,56,40,.5)'; ctx.lineWidth = .4; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(-10 + i * 1.7, -96 + Math.abs(i - 7) * .3); ctx.lineTo(-11 + i * 1.8, -88); ctx.stroke(); }
  },
  /* Tavos: weathered brown, squinting into weather, a grey moustache and stubble, the wide brim, oiled leather, the whip coiled on his shoulder */
  tavos(ctx){ const F = {cy:-72, w:14.4, h:18, jaw:.88, chin:.42, skin:'#9a6a48', iris:'#3a2a1a', browCol:'#6a6058', browW:2.2, age:.8, squint:.6, turn:-.4, look:.2, mouthW:5.6, smile:.4, forehead:.4, stubble:'rgba(150,140,130,.55)', seed:11};
    TB.neck(ctx, F, 10);
    const d = TB.shoulders(ctx, {wide:46, top:-42, c1:'#6a4426', c2:'#2a180c'});
    ctx.save(); ctx.clip(taPath(d));
    taLine(ctx, 'M-38 -30Q-10 -10 6 -40', 'rgba(255,230,190,.16)', 2.4); taLine(ctx, 'M10 -40Q22 -22 40 -26', 'rgba(255,230,190,.08)', 1.6); // the oil's shine
    taFill(ctx, 'M-10 -46L10 -46L4 2L-4 2Z', '#3a2616'); taLine(ctx, 'M-8 -40L-3 2M8 -40L3 2', 'rgba(0,0,0,.4)', .6); // the open front, a shirt of dark wool under
    ctx.strokeStyle = '#d8c8a2'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-12, -46); ctx.quadraticCurveTo(0, -22, 12, -46); ctx.stroke(); // the eleven knotted cords
    for (let i = 0; i < 11; i++) { const k = i / 10, x = -12 + 24 * k, y = -46 + 4 * 24 * k * (1 - k) * .98 * 1; taOval(ctx, x, -46 + (1 - Math.pow(2 * k - 1, 2)) * 12, .9, .9, '#ece0c0'); }
    // the whip, coiled on the left shoulder
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-30 + i * 1.5, -34 + i * 1.2, 9 - i, 5.5 - i * .4, -.35, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,220,180,.2)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(-30, -35, 8.6, 5.2, -.35, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    TB.light(ctx, d); ctx.restore();
    TB.face(ctx, F);
    taFill(ctx, 'M-7.8 -60.6Q-4 -63.4 0 -62.2Q4 -63.4 7.4 -60.8Q8.6 -58.6 7.6 -56.6Q4.6 -59.4 0 -59.0Q-4.6 -59.4 -7.4 -56.4Q-8.8 -58.4 -7.8 -60.6Z', '#8a8278'); // the moustache
    taLine(ctx, 'M-6 -60Q0 -61.6 6 -60', 'rgba(255,255,255,.18)', .5);
    // the hat: a felt crown, a red band, the brim wide and a little bent down at the front
    taFill(ctx, 'M-14 -86Q-14 -106 0 -106Q14 -106 14 -86Z', '#4a3624'); taFill(ctx, 'M-14 -90L14 -90L14.2 -85.6L-14.2 -85.6Z', '#7a2a1c');
    taLine(ctx, 'M-10 -103Q0 -106 9 -102', 'rgba(255,230,190,.14)', 1.2);
    ctx.fillStyle = taGrad(ctx, -40, 0, 40, 0, [[0, '#5a4430'], [.6, '#3a2a1c'], [1, '#140c06']]); ctx.beginPath(); ctx.ellipse(0, -86, 37, 7.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, -83, 30, 4, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-15, -84, 30, 5); // the brim's shade over the brow
  },
  /* Mira: an open-faced helm with cheek guards, a dark braid, a strong jaw, scale over leather, the shield's iron rim behind her and the spear */
  mira(ctx){ const F = {cy:-74, w:13.4, h:19.4, jaw:.82, chin:.36, skin:'#c49a7a', iris:'#3a4a3a', browCol:'#2a1a12', browW:1.9, age:.25, turn:.2, look:.3, mouthW:5.0, smile:-.1, lip:'#a8705a',
      scar:'M8.4 -69 L10.6 -65.4'};
    // the shield behind the left shoulder, the spear behind the right
    ctx.fillStyle = taRad(ctx, -40, -46, 4, 36, [[0, '#8a3426'], [1, '#2a0c08']]); ctx.beginPath(); ctx.arc(-34, -40, 32, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a8680'; ctx.lineWidth = 4; ctx.stroke(); TF.knot(ctx, -38, -54, 6, '#c9a15a', 2.2);
    taLine(ctx, 'M30 2L36 -110', '#6a5034', 3.2, 'butt');
    TB.neck(ctx, F, 9);
    const d = TB.shoulders(ctx, {wide:45, top:-45, c1:'#8a8a88', c2:'#2e2e30'});
    ctx.save(); ctx.clip(taPath(d)); ctx.strokeStyle = 'rgba(15,15,18,.5)'; ctx.lineWidth = .8;
    for (let y = -48, r = 0; y < 4; y += 3.2, r++) for (let x = -50 + (r % 2) * 1.8; x < 50; x += 3.6) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI); ctx.stroke(); } // the scales
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = .4; for (let y = -46, r = 0; y < 4; y += 3.2, r++) for (let x = -50 + (r % 2) * 1.8; x < 0; x += 3.6) { ctx.beginPath(); ctx.arc(x, y, 1.5, Math.PI * 1.1, Math.PI * 1.5, false); ctx.stroke(); }
    taLine(ctx, 'M-42 -18L42 -18', '#3a2418', 3.4); // the leather edge
    TB.light(ctx, d); ctx.restore();
    taFill(ctx, 'M-12 -52Q-9 -44 0 -43Q9 -44 12 -52L14 -46Q6 -40 0 -40Q-6 -40 -14 -46Z', '#5a2418'); // a red scarf at the throat
    TB.face(ctx, F);
    taFill(ctx, 'M-14.6 -64Q-19 -56 -16 -44L-12 -44Q-14.4 -54 -11.6 -62Z', '#2a1a12'); // the braid
    for (let i = 0; i < 4; i++) taLine(ctx, `M-16.2 ${-58 + i * 3.4}l3.6 1.2`, 'rgba(0,0,0,.45)', .6);
    // the helm: a steel cap, a brow band, cheek guards down to the jaw
    ctx.save(); ctx.translate(0, -6.5);
    ctx.fillStyle = taGrad(ctx, -16, 0, 16, 0, [[0, '#b8b8bc'], [.4, '#808086'], [1, '#2a2a2e']]); ctx.fill(taPath('M-16 -76Q-17 -102 0 -102Q17 -102 16 -76L13.6 -78Q13 -90 0 -90Q-13 -90 -13.6 -78Z'));
    taFill(ctx, 'M-16.2 -80L16.2 -80L16 -76.4L-16 -76.4Z', '#5a5a60'); [-12, -6, 0, 6, 12].forEach(x => taOval(ctx, x, -78.2, .7, .7, '#c8c8cc'));
    ctx.fillStyle = taGrad(ctx, -18, 0, 18, 0, [[0, '#9a9aa0'], [1, '#2a2a2e']]); ctx.fill(taPath('M-16 -77L-12.6 -77L-11.6 -62L-14.4 -60Z')); ctx.fill(taPath('M16 -77L12.6 -77L11.6 -62L14.4 -60Z'));
    taLine(ctx, 'M-11 -99Q-2 -102.4 6 -100', 'rgba(255,255,255,.45)', 1.2);
    ctx.restore();
  },
  /* Quill: young and narrow, sun-pale cropped hair, freckles, the quilted jacket and its hood down, the bow over her shoulder, grey fletching, a ring on a cord */
  quill(ctx){ const F = {cy:-74, w:12, h:18, jaw:.7, chin:.26, skin:'#d2a888', iris:'#5a6a4a', browCol:'#a07a4a', browW:1.3, age:0, turn:1.0, look:.9, mouthW:4.4, smile:.05, blush:.12, lip:'#b07a68'};
    taLine(ctx, 'M-40 -100Q-56 -40 -30 2', '#6a4a2a', 3.4); taLine(ctx, 'M-40 -100L-30 2', '#d8c8a8', .6); // the bow over the back
    [[26, -86], [30, -82], [33, -88]].forEach(([x, y]) => { taLine(ctx, `M${x} ${y - 10}L${x - 6} ${y + 46}`, '#6a5038', 1); taFill(ctx, `M${x - .2} ${y - 10}Q${x - 3.4} ${y - 4} ${x - 1.6} ${y + 4}L${x - .9} ${y - 2}Z`, '#b8b8b4'); taFill(ctx, `M${x} ${y - 10}Q${x + 3} ${y - 4} ${x - .6} ${y + 4}L${x - .5} ${y - 2}Z`, '#8a8a86'); taOval(ctx, x, y - 10.4, .8, .8, '#2a2420'); }); // grey fletching, the arrows' ends over the shoulder
    TB.neck(ctx, F, 7.2);
    const d = TB.shoulders(ctx, {wide:38, top:-43, nw:7, c1:'#5f7a6a', c2:'#1e2a24'});
    ctx.save(); ctx.clip(taPath(d)); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = .7;
    for (let k = -90; k < 90; k += 7) { ctx.beginPath(); ctx.moveTo(k, -60); ctx.lineTo(k + 60, 4); ctx.moveTo(k + 60, -60); ctx.lineTo(k, 4); ctx.stroke(); } // the quilting
    ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let k = -90; k < 90; k += 7) for (let j = -60; j < 4; j += 7) taOval(ctx, k + 3.5, j + 3.5, 1.6, 1.6, 'rgba(255,255,255,.05)');
    taLine(ctx, 'M30 -44L-14 2', '#3a2c20', 3.6); // the quiver's strap
    TB.light(ctx, d); ctx.restore();
    ctx.fillStyle = taGrad(ctx, -30, 0, 30, 0, [[0, '#6a8676'], [1, '#22302a']]); ctx.fill(taPath('M-28 -40Q-30 -56 -14 -56Q0 -46 14 -56Q30 -56 28 -40Q16 -46 0 -40Q-16 -46 -28 -40Z')); // the hood, down
    taLine(ctx, 'M-6 -52Q0 -36 6 -52', '#d8c8a2', .5); taOval(ctx, 0, -38.6, 1.6, 1.6, 'rgba(0,0,0,0)'); ctx.strokeStyle = '#e2c07a'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(0, -38, 1.7, 0, 7); ctx.stroke(); // the ring on its cord
    TB.face(ctx, F);
    const r = taRng(5); for (let i = 0; i < 26; i++) taOval(ctx, (r() - .5) * 15 + 1, -72 + r() * 6, .45, .4, 'rgba(150,80,50,.45)'); // freckles
    taFill(ctx, 'M-12.6 -76Q-15 -96 1 -95Q15 -95 13 -78Q12 -86 6 -87Q8 -84 5 -82Q1 -88 -4 -86Q-3 -84 -6 -82Q-9 -86 -10 -80L-11.8 -72Z', '#c8a068'); // cropped, sun-pale, cut with a knife
    ctx.strokeStyle = 'rgba(120,80,40,.5)'; ctx.lineWidth = .4; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-9 + i * 1.7, -94); ctx.lineTo(-10 + i * 1.9, -85 + (i % 3)); ctx.stroke(); }
  },
  /* Ossel: sixty-one, bald with a white fringe, a long thin white beard, deep eyes that hold a little violet, the plum coat of pockets, the black staff, a seam of warren light */
  ossel(ctx){ const F = {cy:-72, w:12.6, h:19, jaw:.66, chin:.24, skin:'#c8aa98', iris:'#7a62b8', browCol:'#e4e0d8', browW:2.0, age:1, squint:.3, turn:-.8, look:-.2, mouthW:4.6, smile:-.3, hollow:.35, forehead:.6, lip:'#9a7466'};
    taLine(ctx, 'M34 2L32 -116', '#141016', 4.6); taLine(ctx, 'M33 -40L31.6 -116', 'rgba(255,255,255,.08)', 1); // the staff of black wood
    ctx.fillStyle = taRad(ctx, 32, -104, 0, 26, [[0, 'rgba(200,180,255,.55)'], [1, 'rgba(160,141,224,0)']]); ctx.fillRect(4, -132, 56, 56); taOval(ctx, 32, -104, 2.4, 2.4, '#ece4ff');
    TB.neck(ctx, F, 7.4);
    const d = TB.shoulders(ctx, {wide:40, top:-40, nw:7.4, slope:6, c1:'#5a3452', c2:'#1e101c'});
    ctx.save(); ctx.clip(taPath(d));
    [[-34, -26], [-22, -12], [14, -28], [24, -12], [-8, -4], [30, -32]].forEach(([x, y], i) => { taFill(ctx, `M${x} ${y}L${x + 10} ${y - .6}L${x + 9.6} ${y + 9}L${x + .4} ${y + 9.4}Z`, 'rgba(0,0,0,.25)'); taLine(ctx, `M${x} ${y}L${x + 10} ${y - .6}`, 'rgba(255,220,240,.2)', .8); taOval(ctx, x + 5, y + 1.4, .9, .9, '#8a7a5a'); }); // pockets
    taLine(ctx, 'M-30 -14Q-26 -10 -22 -15', 'rgba(240,240,230,.45)', 1.4); // chalk
    TB.light(ctx, d); ctx.restore();
    TB.face(ctx, F);
    // the beard: long and thin, parted at the chin, the moustache hanging into it
    ctx.fillStyle = taGrad(ctx, -10, 0, 10, 0, [[0, '#f0ece4'], [1, '#a8a49c']]); ctx.fill(taPath('M-8 -62Q-10 -54 -6 -44Q-3 -30 0 -18Q2 -32 6 -44Q10 -54 8 -62Q4 -56 0 -56Q-4 -56 -8 -62Z'));
    taFill(ctx, 'M-6.8 -59.4Q-3 -62.4 0 -61.4Q3 -62.4 6.6 -59.6Q5 -57.4 0 -58.0Q-5 -57.4 -6.8 -59.4Z', '#e4e0d8');
    ctx.strokeStyle = 'rgba(120,110,100,.5)'; ctx.lineWidth = .35; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 1.3, -56); ctx.quadraticCurveTo(-4 + i * .9, -40, -.4 + i * .1, -22); ctx.stroke(); }
    // the fringe round a bald crown, and the crown's shine
    taFill(ctx, 'M-13.4 -78Q-15.4 -70 -13.2 -64L-11.6 -66Q-12 -74 -10.8 -82Z', '#e8e4dc'); taFill(ctx, 'M13.4 -78Q15.4 -70 13.2 -64L11.6 -66Q12 -74 10.8 -82Z', '#b8b4ac');
    taOval(ctx, -4, -86, 5, 2.4, 'rgba(255,255,255,.18)', -.3);
    // a seam of the warren, never quite shut, drawn across the air beside him
    ctx.strokeStyle = 'rgba(190,170,255,.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-42, -96); ctx.bezierCurveTo(-30, -88, -40, -76, -26, -66); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,170,255,.2)'; ctx.lineWidth = 3; ctx.stroke();
  },
};
Object.entries(TTG_POR).forEach(([id, f]) => { POR[id] = f; });

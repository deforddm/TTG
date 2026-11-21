/* ============ Trygalle Run: backdrops for talk nodes ============
   SCENEX[kind](canvas, t), drawn with FTR's helpers (sceneFit, glow, ell, poly, drawFigure). */
Object.assign(SCENES, {
  ttg_yard:{loc:'The guild yard', sub:'Darujhistan · the Trygalle Trade Guild', cap:'Blue gaslight on wet cobbles, one carriage in its traces, and the horses already sweating.', amb:'explore'},
  ttg_counting:{loc:'The counting-room', sub:'The guild house · Darujhistan', cap:'Ledgers to the ceiling, one lamp, and a casket nobody wants to touch.', amb:'explore'},
  ttg_fire:{loc:'The shareholders\' fire', sub:'The guild yard', cap:'A brazier by the stable wall. The old mage sits closest, and never seems warm.', amb:'explore'},
  ttg_gate:{loc:'The yard gate', sub:'Ossel\'s gate', cap:'The gate is still a gate, and then it is not.', amb:'explore', warren:1},
  ttg_kan:{loc:'Kan', sub:'The buyer\'s yard · the far side', cap:'Real rain, real stone, and a clerk with a ledger under an oilcloth.', amb:'explore'},
});
/* a side view of the carriage and its two horses, facing right, wheels on the ground line y */
function ttgCarriageSide(ctx, x, y, s, t, moving, opt = {}){
  const bob = moving ? Math.sin(t / 90) * 1.2 : 0;
  // the team: six at the least (a guild carriage never runs on fewer), three pairs, From the Ranks' horse (017b), the far horse of each pair a step up and darker
  const team = Math.max(6, opt.team || 6), pairs = Math.min(5, Math.ceil(team / 2)), k = 3.3*s;
  ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.2*s; ctx.beginPath(); ctx.moveTo(x + 62*s, y - 18*s); ctx.lineTo(x + (78 + 40*(pairs - 1) + 8)*s, y - 22*s); ctx.stroke(); // traces
  for (let p = pairs - 1; p >= 0; p--) [1, 0].forEach(far => { const hx = x + (84 + 40*p + far*4)*s, hy = y - far*3*s, ph = (t / 260 + p*.7 + far*.35) % 2;
    ctx.save(); ctx.translate(hx, hy + (moving ? Math.sin(t / 90 + p + far) * .8*s : 0)); ctx.scale(k, k);
    beastHorse(ctx, far ? '#24170f' : (p % 2 ? '#3a2418' : '#33200f'), moving ? {run:ph < 1 ? 1 : 2, mane:'#140c08'} : {g:Math.sin(t / 600 + p), mane:'#140c08'}); ctx.restore(); });
  // body
  const g = ctx.createLinearGradient(0, y - 52*s, 0, y - 10*s); g.addColorStop(0, '#2e2622'); g.addColorStop(1, '#120e0c'); ctx.fillStyle = g;
  ctx.fillRect(x, y - 50*s, 60*s, 36*s); ctx.strokeStyle = '#8a6a32'; ctx.lineWidth = 1.2*s; ctx.strokeRect(x, y - 50*s, 60*s, 36*s);
  ctx.fillStyle = '#4a3622'; ctx.fillRect(x + 56*s, y - 36*s, 12*s, 3*s); // the bench
  ctx.fillStyle = 'rgba(255,190,110,.18)'; ctx.fillRect(x + 22*s, y - 44*s, 14*s, 12*s); // the door window
  ctx.strokeStyle = 'rgba(232,192,115,.75)'; ctx.lineWidth = 1*s; ctx.beginPath(); ctx.arc(x + 26*s, y - 24*s, 3.2*s, 0, 7); ctx.arc(x + 31*s, y - 24*s, 3.2*s, 0, 7); ctx.stroke(); // the guild's knot
  ctx.fillStyle = '#5a4630'; ctx.fillRect(x + 4*s, y - 58*s, 16*s, 8*s); ctx.fillRect(x + 24*s, y - 56*s, 12*s, 6*s); // crates lashed on the roof
  [[12, 0], [50, 0]].forEach(([wx]) => { ctx.strokeStyle = '#17120e'; ctx.lineWidth = 2.4*s; ctx.beginPath(); ctx.arc(x + wx*s, y - 9*s, 9*s, 0, 7); ctx.stroke();
    ctx.lineWidth = 1*s; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4 + (moving ? t / 300 : 0); ctx.beginPath(); ctx.moveTo(x + wx*s - Math.cos(a)*9*s, y - 9*s - Math.sin(a)*9*s); ctx.lineTo(x + wx*s + Math.cos(a)*9*s, y - 9*s + Math.sin(a)*9*s); ctx.stroke(); } });
}
function ttgNight(ctx, W, H, t, opt = {}){
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, opt.dawn ? '#3a4048' : '#070a14'); g.addColorStop(1, opt.dawn ? '#1c1e22' : '#0b0c10'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!opt.dawn) for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${.2 + hash(i, 5) * .5})`; ctx.fillRect(hash(i, 1) * W, hash(i, 2) * H * .4, 1, 1); }
  // the guild house wall and its lamps
  ctx.fillStyle = opt.dawn ? '#24262a' : '#141218'; ctx.fillRect(0, H * .28, W, H * .44);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = opt.dawn ? '#2c2e33' : '#1a1820'; ctx.fillRect(i * W / 8 - 6, H * .28, 12, H * .44); }
  if (!opt.dawn) [.12, .46, .8].forEach((k, i) => { const x = W * k; ctx.fillStyle = '#222'; ctx.fillRect(x - 1, H * .3, 2, H * .4); glow(ctx, x, H * .3, 46, '#6aa0ff', .45 + Math.sin(t / 700 + i) * .05); ell(ctx, x, H * .3, 4, 5, '#bcd4ff'); });
  // cobbles
  const cg = ctx.createLinearGradient(0, H * .72, 0, H); cg.addColorStop(0, opt.dawn ? '#2a2a2c' : '#121218'); cg.addColorStop(1, opt.dawn ? '#1a1a1c' : '#08080a'); ctx.fillStyle = cg; ctx.fillRect(0, H * .72, W, H * .28);
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.ellipse(hash(i, 7) * W, H * .74 + hash(i, 8) * H * .26, 9, 3, 0, 0, 7); ctx.stroke(); }
}
SCENEX.ttg_yard = (cv, t) => { const {ctx, W, H} = sceneFit(cv); ttgNight(ctx, W, H, t); ttgCarriageSide(ctx, W * .5 - 140, H * .9, 1.3, t, false);
  drawFigure(ctx, 'sgt', W * .22, H * .95, 1.9, t, {dir:1}); drawFigure(ctx, 'mira', W * .44, H * .93, 1.7, t, {dir:1, phase:2}); };
SCENEX.ttg_counting = (cv, t) => { const {ctx, W, H} = sceneFit(cv), fl = .85 + Math.sin(t / 110) * .06;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e1610'); g.addColorStop(1, '#0c0806'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { const x = i * W / 13; ctx.fillStyle = '#140e0a'; ctx.fillRect(x, 0, 3, H * .62); } // panelling
  for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) { if (hash(i, r) < .2) continue; ctx.fillStyle = ['#3a2a1c', '#2a3a2a', '#4a2a22', '#2c2a3a'][(i + r) % 4]; ctx.fillRect(W * .62 + i * 9, H * (.08 + r * .13), 7, H * .1); } // ledgers on the shelves
  drawFigure(ctx, 'pell', W * .5, H * .66, 2, t, {dir:-1, still:true}); // the factor, behind the desk
  ctx.fillStyle = '#3e2c1c'; ctx.fillRect(W * .24, H * .62, W * .52, H * .08); ctx.fillStyle = '#26180e'; ctx.fillRect(W * .28, H * .7, W * .44, H * .3);
  ctx.fillStyle = '#e6dac2'; ctx.fillRect(W * .38, H * .595, 34, 6); ctx.fillStyle = '#3a3a40'; ctx.fillRect(W * .6, H * .55, 20, 12); ctx.strokeStyle = '#9c9cae'; ctx.lineWidth = 1; ctx.strokeRect(W * .6, H * .55, 20, 12); // manifest, casket
  glow(ctx, W * .3, H * .52, W * .4, '#ffb060', .42 * fl); ell(ctx, W * .3, H * .57, 3, 7, '#e8d8a8'); poly(ctx, [[W * .3 - 2, H * .53], [W * .3 + 2, H * .53], [W * .3 + Math.sin(t / 90), H * .53 - 9 * fl]], '#fff1c2');
  drawFigure(ctx, 'sgt', W * .16, H * .97, 2.1, t, {dir:1}); };
SCENEX.ttg_fire = (cv, t) => { const {ctx, W, H} = sceneFit(cv), fl = .8 + Math.sin(t / 90) * .1 + Math.sin(t / 37) * .05; ttgNight(ctx, W, H, t);
  glow(ctx, W * .5, H * .78, W * .4, '#ff8a3a', .5 * fl); ctx.fillStyle = '#2a2420'; ctx.fillRect(W * .5 - 14, H * .8, 28, 12);
  for (let i = 0; i < 5; i++) poly(ctx, [[W * .5 - 12 + i * 6, H * .8], [W * .5 - 8 + i * 6, H * .8], [W * .5 - 10 + i * 6 + Math.sin(t / 80 + i) * 3, H * .8 - (10 + hash(i, 9) * 10) * fl]], i % 2 ? '#ffb04a' : '#ff7a2a');
  drawFigure(ctx, 'ossel', W * .64, H * .95, 1.9, t, {dir:-1, still:true}); drawFigure(ctx, 'sgt', W * .3, H * .97, 2, t, {dir:1}); };
SCENEX.ttg_gate = (cv, t) => { const {ctx, W, H} = sceneFit(cv); ttgNight(ctx, W, H, t);
  const cx = W * .74, r = H * .34 * (1 + Math.sin(t / 400) * .03); glow(ctx, cx, H * .55, r * 1.6, '#9a86e0', .55); ctx.fillStyle = '#3a3438'; ctx.beginPath(); ctx.ellipse(cx, H * .55, r * .55, r, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c9bbff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, H * .55, r * .55, r, 0, 0, 7); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#1a1614'; ctx.fillRect(cx - r * .4 + i * r * .14, H * .55 + r * .2 - hash(i, 3) * r * .5, 4, hash(i, 3) * r * .5); } // standing stones beyond
  ttgCarriageSide(ctx, W * .5 - 150, H * .9, 1.2, t, true); drawFigure(ctx, 'ossel', W * .5 - 175, H * .95, 1.8, t, {dir:1}); };
SCENEX.ttg_kan = (cv, t) => { const {ctx, W, H} = sceneFit(cv); ttgNight(ctx, W, H, t, {dawn:true}); ttgCarriageSide(ctx, W * .5 - 120, H * .9, 1.25, t, false);
  const sq = SQUAD().filter(id => id !== 'tavos'); sq.forEach((id, i) => drawFigure(ctx, id, W * .12 + i * 34, H * .96 - (i % 2) * 3, 1.7, t, {dir:1, phase:i}));
  ctx.strokeStyle = 'rgba(190,200,215,.35)'; ctx.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = (hash(i, 1) * W + t * .12) % W, y = (hash(i, 2) * H + t * .5) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 9); ctx.stroke(); } };

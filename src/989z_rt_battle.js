/* ============ the real-time carriage battle (Trygalle Run) ============
   A battle def with rt:true runs here instead of FTR's turn-based 031. Real time with pause: a fixed 30 Hz simulation on a
   seeded RNG, auto-pause on wounds, a shareholder going down, a crate hit and every drift shift. The carriage (3 long, 2 wide)
   rolls along the road on its own clock; the crew fight round it, ride on its seats, and must be on it or near it when it
   crosses out of the warren. Drawn with FTR's tiles (drawTile via prerender) and figures (drawFigure).
   Logical grid: x runs forward along the road, y across it. A phone held upright turns the map so the road runs up the screen.
   Test hook: window.__rt (state, update, orders, finish). */
const RT = (() => {
  const STEP = 1 / 30, CW = 3, CHH = 2, DRIFT_MAX = 12, ESCAPE_RANGE = 2, ROOF_BONUS = 2, RAM = 2, LURCH = .3, DOWN_AT = 3;
  const PERIOD_DRIVER = 1.9, PERIOD_LOOSE = 2.6;
  const SEATS = [{x:2, y:0, name:'driver\'s bench'}, {x:1, y:0, name:'roof'}, {x:0, y:1, name:'rear hatch'}];
  const CRATE_CELLS = [[0, 0], [1, 1], [2, 1]];
  const GROUND = 0, ROCK = 1, ASH = 2, FIRE = 3;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const WOUNDS = ['broken arm', 'gashed leg', 'cracked ribs', 'shaken nerve', 'burned hands'];
  /* each shareholder's part in a real-time fight: grit soaks blows before they wound, cd is seconds between strikes, speed is tiles a second */
  const ROLE = {
    sgt:  {label:'Captain',  grit:6, atk:3, range:1, cd:1.2, speed:2.6, skill:'rally'},
    tavos:{label:'Driver',   grit:4, atk:2, range:1, cd:1.2, speed:3.0, skill:'whip', driver:true},
    mira: {label:'Warden',   grit:7, atk:3, range:1, cd:1.2, speed:2.4, skill:'brace'},
    quill:{label:'Marksman', grit:3, atk:3, range:4, cd:1.8, speed:2.8, skill:'volley', roof:true},
    ossel:{label:'Mage',     grit:3, atk:2, range:4, cd:2.2, speed:2.2, skill:'anchor', magic:true},
  };
  const SKILL = {
    rally: {name:'Rally', desc:'Shareholders within 3 tiles get grit back.', uses:1},
    whip:  {name:'Whip', desc:'From the bench: the carriage lunges forward and runs faster for 4 seconds.', cd:20},
    brace: {name:'Brace', desc:'For 6 seconds, Mira and anyone beside her take half damage.', cd:16},
    volley:{name:'Volley', desc:'One arrow into every enemy in range.', cd:14},
    anchor:{name:'Anchor', desc:'Holds the drift still for 8 seconds.', uses:1},
  };
  const pick = (id, k) => { try { return typeof has === 'function' && has(id, k); } catch (e) { return false; } };
  const prefs = {auto:true, speed:1};
  try { const p = JSON.parse(localStorage.getItem('ttg-rt') || '{}'); if (typeof p.auto === 'boolean') prefs.auto = p.auto; if (p.speed === 1 || p.speed === 2) prefs.speed = p.speed; } catch (e) {}
  const savePrefs = () => { try { localStorage.setItem('ttg-rt', JSON.stringify(prefs)); } catch (e) {} };
  function mulberry32(a){ return function(){ a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  let R = null; // the fight
  const W = () => R.w, H = () => R.h;

  /* ---------------- set-up ---------------- */
  function begin(id, def, opt){
    const seed = opt.seed != null ? opt.seed : Math.floor(Math.random() * 1e9);
    if (S.scene === 'battle' && S.battle === id && S.binv) S.inv = Object.assign({}, S.binv); else S.binv = Object.assign({}, S.inv);
    S.scene = 'battle'; S.battle = id; S.bopt = {}; S.node = null; S.bg = 'battle'; save();
    const map = def.map, h = map.length, w = map[0].length;
    R = {id, def, snap:JSON.stringify(S), seed, rnd:mulberry32(seed), w, h, t:0, drift:0, nextDrift:(def.drift && def.drift.every) || 3.4, every:(def.drift && def.drift.every) || 3.4,
      anchorT:0, tiles:[], road:[], actors:[], fx:[], log:[], crates:[], carriage:{x:def.carriage.x, y:def.carriage.y, timer:1.5, hold:false, anim:1, blockedMsg:'', whipT:0},
      paused:true, pauseReason:'Give your first orders, then press Resume.', result:'', summary:'', selected:null, foeN:0, nextId:1, used:{}, cdT:{}, braceT:0, rallyT:0,
      known:S.f.ttg_drift === 'known'};
    for (let y = 0; y < h; y++) { const row = [], rr = []; for (let x = 0; x < w; x++) { const c = map[y][x]; row.push(c === '#' ? ROCK : GROUND); rr.push(c === '~'); } R.tiles.push(row); R.road.push(rr); }
    const names = def.cargo ? def.cargo() : ['spice', 'casket', 'silk'];
    R.crates = names.map(k => { const c = (typeof TTG_CARGO !== 'undefined' && TTG_CARGO[k]) || {name:k, hp:6, value:30}; return {key:k, name:c.name, hp:c.hp, max:c.hp, value:c.value, wt:c.wt || 2, hit:false}; });
    { const load = R.crates.reduce((n, c) => n + c.wt, 0) + (def.passengers || 0) * 2; R.team = typeof ttgTeam === 'function' ? ttgTeam(load) : 6; R.load0 = load;
      log(`${['', '', '', '', '', '', 'Six', '', '', 'Nine'][R.team] || 'Twenty'} horses in the traces for a load of ${load}.`); }
    const party = Object.assign({}, def.party);
    if (party.ossel === 'seat2' && !S.f.ttg_osselIn) party.ossel = [0, 7]; // he rides inside only if the captain told him to
    if (S.f.ttg_miraPlan === 'crates') party.mira = [1, 7];
    SQUAD().forEach(pid => { if (S.dead && S.dead[pid]) return; const r = ROLE[pid] || ROLE.mira, p = party[pid] || [2, 4];
      const a = addActor({side:'squad', key:pid, name:NAME(pid), fig:(TPL[pid] && TPL[pid].fig) || pid, role:r.label, grit:r.grit + (pid === 'mira' && pick('mira', 'ttg_wall') ? 2 : 0),
        atk:r.atk, range:r.range + (pid === 'quill' && pick('quill', 'ttg_roof') ? 1 : 0), cd:r.cd * (pid === 'quill' && pick('quill', 'ttg_quick') ? .67 : 1), speed:r.speed, skill:r.skill,
        driver:!!r.driver, roof:!!r.roof, magic:!!r.magic}, typeof p === 'string' ? -1 : p[0], typeof p === 'string' ? -1 : p[1]);
      if (typeof p === 'string') { a.seat = +p.slice(4); } });
    syncRiders();
    def.foes.forEach(f => spawn(f[0], f[1], f[2]));
    R.selected = R.actors.find(a => a.key === 'mira') || R.actors[0];
    log('The gate seals behind you. Get the carriage to the far edge.');
    if (S.f.ttg_drift === 'known') log('Ossel\'s chalk count: ash at the fourth turn, fire at the eighth.');
  }
  function addActor(o, x, y){
    const a = Object.assign({id:R.nextId++, x:0, y:0, nx:null, ny:null, stepT:0, stepDur:1, maxGrit:o.grit, wounds:0, woundNames:[], cdLeft:0, alive:true, down:false, seat:-1, order:null, burnT:0, flash:0, face:1}, o);
    if (x >= 0) { const p = freeNear(x, y); a.x = p[0]; a.y = p[1]; }
    R.actors.push(a); return a;
  }
  function spawn(key, x, y){
    const f = FOES[key] || {name:key, hp:9, atk:2, rng:1}; R.foeN++;
    const a = addActor({side:'enemy', key, name:f.name, fig:f.fig || 'hound', grit:f.grit || Math.round((f.hp || 9) / 2.3), atk:f.atk || 2, range:f.rng || 1, cd:f.cd || 2, speed:f.speed || 2, cargo:!!f.cargo, verb:f.verb || 'hits'}, x, y);
    a.cdLeft = .5 + R.rnd(); a.face = -1; return a;
  }
  function spawnWave(keys){ keys.forEach(k => { const x = Math.max(0, Math.min(W() - 1, R.carriage.x + 2 + Math.floor(R.rnd() * 9))), y = R.rnd() < .5 ? 0 : H() - 1; const a = spawn(k, x, y); a.arrived = 1; addFx('ring', a); }); }

  /* ---------------- queries ---------------- */
  const inB = (x, y) => x >= 0 && y >= 0 && x < W() && y < H();
  const tile = (x, y) => R.tiles[y][x];
  const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
  const squad = () => R.actors.filter(a => a.alive && a.side === 'squad');
  const crew = () => R.actors.filter(a => a.side === 'squad');
  const enemies = () => R.actors.filter(a => a.alive && a.side === 'enemy');
  const cratesLeft = () => R.crates.filter(c => c.hp > 0).length;
  const cargoValue = () => R.crates.reduce((s, c) => s + (c.hp > 0 ? c.value : 0), 0);
  const isCar = (x, y) => { const c = R.carriage; return x >= c.x && x < c.x + CW && y >= c.y && y < c.y + CHH; };
  const toCar = (x, y) => { const c = R.carriage; const dx = x < c.x ? c.x - x : x >= c.x + CW ? x - (c.x + CW - 1) : 0, dy = y < c.y ? c.y - y : y >= c.y + CHH ? y - (c.y + CHH - 1) : 0; return dx + dy; };
  const on = (x, y, ex) => { for (const a of R.actors) { if (!(a.alive || a.down) || a.carried || a === ex || a.seat >= 0) continue; if ((a.x === x && a.y === y) || (a.nx === x && a.ny === y)) return a; } return null; };
  const passable = (x, y, self) => inB(x, y) && tile(x, y) !== ROCK && !isCar(x, y) && !on(x, y, self);
  function freeNear(x, y){ const seen = new Set([x + ',' + y]), q = [[x, y]]; while (q.length) { const [cx, cy] = q.shift(); if (passable(cx, cy, null)) return [cx, cy]; for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny; if (inB(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } } } return [x, y]; }
  const freeSeat = (a) => { const order = a && a.driver ? [0, 1, 2] : a && a.roof ? [1, 2, 0] : [2, 1, 0]; for (const i of order) if (!R.actors.some(o => o.alive && o.seat === i)) return i; return -1; };
  const driverAboard = () => R.actors.some(a => a.alive && a.seat === 0);
  const rangeOf = a => a.range + (a.seat >= 0 && a.roof ? ROOF_BONUS + (pick('quill', 'ttg_roof') ? 2 : 0) - (pick('quill', 'ttg_roof') ? 0 : 0) : 0);
  const inRange = (a, t) => t.alive && dist(a.x, a.y, t.x, t.y) <= rangeOf(a);
  const speedOf = a => a.speed * Math.max(.5, 1 - .12 * a.wounds);
  const cdOf = a => a.cd * (1 + .15 * a.wounds) * (a.side === 'squad' && R.rallyT > 0 ? .6 : 1);
  function firstStep(a, goal){ if (goal(a.x, a.y)) return []; const start = a.x + ',' + a.y, prev = new Map([[start, null]]), q = [[a.x, a.y]];
    while (q.length) { const [cx, cy] = q.shift(); for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny; if (prev.has(k) || !passable(nx, ny, a)) continue; prev.set(k, cx + ',' + cy);
      if (goal(nx, ny)) { let cur = k; while (prev.get(cur) !== start) cur = prev.get(cur); return cur.split(',').map(Number); } q.push([nx, ny]); } } return null; }
  function beginStep(a, x, y){ if (!passable(x, y, a)) return false; if (x !== a.x) a.face = x > a.x ? 1 : -1; a.nx = x; a.ny = y; a.stepT = 0; a.stepDur = (1 / speedOf(a)) * (tile(x, y) === ASH ? 1.6 : 1); return true; }
  function stepToward(a, goal){ const s = firstStep(a, goal); if (s === null) return 'stuck'; if (!s.length) return 'there'; return beginStep(a, s[0], s[1]) ? 'moving' : 'stuck'; }

  /* ---------------- events ---------------- */
  function log(t){ R.log.push(t); if (R.log.length > 60) R.log.shift(); R.logDirty = true; }
  function autoPause(why){ if (prefs.auto && !R.paused && !R.result) { R.paused = true; R.pauseReason = why; } }
  function addFx(kind, a, extra){ R.fx.push(Object.assign({kind, x:a.nx !== null && a.nx !== undefined ? a.x + (a.nx - a.x) * a.stepT : a.x, y:a.nx !== null && a.nx !== undefined ? a.y + (a.ny - a.y) * a.stepT : a.y, seat:a.seat, t:0}, extra || {})); }
  function besideMira(t){ const m = R.actors.find(a => a.key === 'mira' && a.alive); return m && m !== t && dist(m.x, m.y, t.x, t.y) <= 1 ? m : null; }
  function damage(t, n, src){
    if (t.side === 'squad') {
      if (t.key === 'ossel' && S.f.ttg_miraPlan === 'ossel') { const m = besideMira(t); if (m) { log(`Mira takes the blow meant for Ossel.`); t = m; } }
      if (R.braceT > 0) { const m = R.actors.find(a => a.key === 'mira' && a.alive); if (m && dist(m.x, m.y, t.x, t.y) <= 1) n = Math.ceil(n / 2); }
      if (pick('mira', 'ttg_door') && besideMira(t)) n = Math.max(1, n - 1);
    }
    t.flash = .25; addFx('num', t, {text:'-' + n, col:t.side === 'squad' ? '#e0574a' : '#e8c073'});
    if (src && dist(src.x, src.y, t.x, t.y) > 1) R.fx.push({kind:'shot', from:src, to:t, magic:!!src.magic, t:0});
    if (typeof AUDIO !== 'undefined') try { AUDIO.play(t.side === 'squad' ? 'hurt' : 'hit'); } catch (e) {}
    if (t.side === 'enemy') { t.grit -= n; if (t.grit <= 0) { t.alive = false; t.nx = null; log(`${t.name} falls.`); addFx('ring', t, {col:'#9c8c78'}); } return; }
    if (n <= t.grit) { t.grit -= n; return; }
    t.grit = 0; t.wounds++; const w = WOUNDS[Math.floor(R.rnd() * WOUNDS.length)]; t.woundNames.push(w);
    log(`${t.name} takes a wound: ${w}. Slower from now on.`);
    if (t.wounds >= DOWN_AT) {
      if (t.seat >= 0) { const p = freeNear(R.carriage.x + SEATS[t.seat].x, R.carriage.y + (SEATS[t.seat].y ? CHH : -1)); t.x = p[0]; t.y = p[1]; }
      t.alive = false; t.down = true; t.seat = -1; t.nx = null; t.order = null; log(`${t.name} is down.`); autoPause(`${t.name} is down`);
      if (R.selected === t) R.selected = squad()[0] || null;
    } else autoPause(`${t.name} is wounded`);
  }
  function strike(a, t){ if (a.cdLeft > 0) return; a.cdLeft = cdOf(a); if (t.x !== a.x) a.face = t.x > a.x ? 1 : -1; a.swing = .2; damage(t, a.atk, a); }
  function hitCrate(a){
    if (a.cdLeft > 0) return; const live = R.crates.filter(c => c.hp > 0); if (!live.length) return;
    a.cdLeft = cdOf(a); a.swing = .2; const c = live[Math.floor(R.rnd() * live.length)];
    let n = a.atk; if (pick('sgt', 'ttg_ledger')) n--; const m = R.actors.find(o => o.key === 'mira' && o.alive && o.seat < 0);
    if (S.f.ttg_miraPlan === 'crates' && m && toCar(m.x, m.y) <= 1) n--;
    n = Math.max(1, n); c.hp = Math.max(0, c.hp - n); addFx('num', a, {text:'crate -' + n, col:'#e8c073'});
    if (!c.hp) { log(`${a.name} smashes the ${c.name} crate.`); autoPause(`The ${c.name} crate is destroyed`); }
    else if (!c.hit) { log(`${a.name} is tearing at the ${c.name} crate.`); autoPause(`The ${c.name} crate is under attack`); }
    c.hit = true;
  }

  /* ---------------- skills ---------------- */
  function skillState(a){
    if (!a || !a.alive || !a.skill) return {ok:false, why:''};
    const k = a.skill, sk = SKILL[k], uses = (sk.uses || 0) + (k === 'rally' && pick('sgt', 'ttg_rally') ? 0 : 0);
    if (sk.uses && (R.used[k] || 0) >= uses) return {ok:false, why:'spent'};
    if (sk.cd && (R.cdT[k] || 0) > 0) return {ok:false, why:Math.ceil(R.cdT[k]) + 's'};
    if (k === 'whip' && a.seat !== 0) return {ok:false, why:'bench only'};
    if (k === 'anchor' && !R.known && R.drift < 2) return {ok:false, why:'not yet'};
    if (k === 'anchor' && R.anchorT > 0) return {ok:false, why:'holding'};
    if (k === 'volley' && !enemies().some(e => inRange(a, e))) return {ok:false, why:'no target'};
    return {ok:true, why:''};
  }
  function useSkill(a){
    const st = skillState(a); if (!st.ok) return false; const k = a.skill, sk = SKILL[k];
    if (sk.uses) R.used[k] = (R.used[k] || 0) + 1; if (sk.cd) R.cdT[k] = sk.cd;
    if (k === 'rally') { const big = pick('sgt', 'ttg_rally'); squad().forEach(o => { if (dist(o.x, o.y, a.x, a.y) <= (big ? 99 : 3)) { o.grit = Math.min(o.maxGrit, o.grit + (big ? 4 : 3)); addFx('num', o, {text:'+grit', col:'#6f9f82'}); } }); if (big) R.rallyT = 6;
      log(`${a.name}: "On me! Shares out at the far side!"`); try { AUDIO.play('heal'); } catch (e) {} }
    if (k === 'whip') { R.carriage.timer = Math.min(R.carriage.timer, .4); R.carriage.whipT = 4; log(`${a.name} cracks the whip. The horses lunge.`); }
    if (k === 'brace') { R.braceT = 6; log(`${a.name} sets her shield. "Behind me."`); }
    if (k === 'volley') { enemies().filter(e => inRange(a, e)).forEach(e => damage(e, 2, a)); log(`${a.name} empties a fistful of arrows down the road.`); }
    if (k === 'anchor') { R.anchorT = pick('ossel', 'ttg_anchor') ? 16 : 8; log(`${a.name} plants his staff. The seam holds still.`); addFx('ring', a, {col:'#9a86e0', big:1}); }
    return true;
  }

  /* ---------------- orders ---------------- */
  const orderMove = (a, x, y) => { a.order = {type:'move', x, y}; };
  const orderAttack = (a, t) => { a.order = {type:'attack', target:t}; };
  const orderBoard = a => { a.order = {type:'board'}; };
  const orderJump = (a, x, y) => { a.order = {type:'jump', x, y}; };

  /* ---------------- simulation ---------------- */
  function update(dt){
    if (R.result) return;
    R.t += dt;
    if (R.anchorT > 0) { R.anchorT = Math.max(0, R.anchorT - dt); R.nextDrift += dt; }
    while (R.t >= R.nextDrift && !R.result) tickDrift();
    for (const k in R.cdT) R.cdT[k] = Math.max(0, R.cdT[k] - dt);
    R.braceT = Math.max(0, R.braceT - dt); R.rallyT = Math.max(0, R.rallyT - dt); R.carriage.whipT = Math.max(0, R.carriage.whipT - dt);
    updateCarriage(dt);
    for (const a of R.actors) updateActor(a, dt);
    for (const f of R.fx) f.t += dt; R.fx = R.fx.filter(f => f.t < (f.kind === 'shot' ? .2 : f.kind === 'ring' ? .9 : .9));
    checkEnd();
  }
  function tickDrift(){
    R.nextDrift += R.every; if (R.drift >= DRIFT_MAX) return; R.drift++;
    const sh = R.def.drift && R.def.drift.shifts && R.def.drift.shifts[R.drift]; if (!sh) return;
    log(sh.say); if (sh.kind === 'ash') convert(t => t === GROUND, ASH, sh.count, true); else convert(t => t !== ROCK, FIRE, sh.count, false);
    if (sh.wave) spawnWave(sh.wave); try { AUDIO.play('growl'); } catch (e) {}
    R.shake = .5; autoPause(`Drift ${R.drift}: ${sh.kind === 'ash' ? 'ash, and more of them' : 'fire, and a larger pack'}`);
  }
  function convert(pred, to, n, skipRoad){ let tries = 0; while (n > 0 && tries++ < 3000) { const x = Math.floor(R.rnd() * W()), y = Math.floor(R.rnd() * H()), t = tile(x, y);
    if (t === to || !pred(t) || isCar(x, y)) continue; if (skipRoad && R.road[y][x]) continue; R.tiles[y][x] = to; n--; } }
  function syncRiders(){ for (const a of R.actors) if (a.alive && a.seat >= 0) { a.x = R.carriage.x + SEATS[a.seat].x; a.y = R.carriage.y + SEATS[a.seat].y; a.nx = null; } }
  /* the team's pace: 1 at the load it was harnessed for; each unit of cargo lost (a crate smashed) takes a little off the period */
  function loadPace(){ if (!R.load0) return 1; const now = R.crates.reduce((n, c) => n + (c.hp > 0 ? c.wt : 0), 0) + (R.def.passengers || 0) * 2;
    return Math.max(.85, 1 - .4 * (R.load0 - now) / (typeof ttgTeamCap === 'function' ? ttgTeamCap(R.team) : 8)); }
  function updateCarriage(dt){
    const c = R.carriage; c.anim = Math.min(1, c.anim + dt / .4);
    const drv = driverAboard(); if (!drv) c.hold = false;
    c.timer -= dt; if (c.timer > 0) return;
    const fast = drv && R.actors.some(a => a.alive && a.seat === 0 && a.driver);
    c.timer = (drv ? PERIOD_DRIVER : PERIOD_LOOSE) * (fast && pick('tavos', 'ttg_whip') ? .67 : 1) * (c.whipT > 0 ? .65 : 1) * loadPace();
    if (c.hold) return;
    let steps = 1; if (!drv && !pick('tavos', 'ttg_steady') && R.rnd() < LURCH) { steps = 2; log('No hand on the reins: the horses lurch forward.'); }
    for (let i = 0; i < steps; i++) {
      if (c.x + CW >= W()) { exitRealm(); return; }
      let blocked = '';
      for (let dy = 0; dy < CHH; dy++) { const o = on(c.x + CW, c.y + dy, null); if (!o) continue;
        if (o.side === 'enemy' && o.alive) { log(`The carriage rams ${o.name}.`); damage(o, RAM, null); if (o.alive && !shove(o, dy === 0 ? -1 : 1)) blocked = o.name; }
        else if (o.down) { o.carried = true; o.x = o.y = -9; log(`The crew haul ${o.name} up onto the carriage.`); } // the fallen in the road are picked up, not run down
        else if (!shove(o, dy === 0 ? -1 : 1)) blocked = o.name; else log(`${o.name} steps out of the horses' way.`); }
      if (blocked) { if (c.blockedMsg !== blocked) log(`The carriage is blocked by ${blocked}.`); c.blockedMsg = blocked; break; }
      c.blockedMsg = ''; c.x++; c.anim = 0; syncRiders();
    }
  }
  function shove(o, side){ const bx = o.nx !== null ? o.nx : o.x, by = o.nx !== null ? o.ny : o.y;
    for (const [dx, dy] of [[0, side], [0, -side], [1, side], [1, -side]]) { const x = bx + dx, y = by + dy; if (y >= R.carriage.y && y < R.carriage.y + CHH && x === R.carriage.x + CW) continue;
      if (passable(x, y, o)) { o.x = x; o.y = y; o.nx = null; o.stepT = 0; return true; } } return false; }
  function osselWard(a){ if (!pick('ossel', 'ttg_ward')) return false; const o = R.actors.find(x => x.key === 'ossel' && x.alive); return o && dist(o.x, o.y, a.x, a.y) <= 1; }
  function updateActor(a, dt){
    if (!a.alive) return;
    a.cdLeft = Math.max(0, a.cdLeft - dt); a.flash = Math.max(0, a.flash - dt); a.swing = Math.max(0, (a.swing || 0) - dt);
    if (a.seat < 0 && a.nx === null && tile(a.x, a.y) === FIRE && !(a.side === 'squad' && osselWard(a))) { a.burnT += dt; if (a.burnT >= 2) { a.burnT = 0; log(`${a.name} is scorched by realm-fire.`); damage(a, 1, null); } }
    else a.burnT = 0;
    if (!a.alive) return;
    if (a.nx !== null) { a.stepT += dt / a.stepDur; if (a.stepT < 1) return; a.x = a.nx; a.y = a.ny; a.nx = null; a.stepT = 0; }
    if (a.side === 'enemy') enemyThink(a); else squadThink(a);
  }
  function squadThink(a){
    const o = a.order;
    if (o && o.type === 'attack') { const t = o.target;
      if (!t.alive) a.order = null; else if (inRange(a, t)) { strike(a, t); return; } else if (a.seat >= 0) a.order = null;
      else { if (stepToward(a, (x, y) => dist(x, y, t.x, t.y) <= rangeOf(a)) === 'stuck') a.order = null; return; } }
    if (o && o.type === 'move') {
      if (a.seat >= 0) { orderJump(a, o.x, o.y); return; }
      const r = stepToward(a, (x, y) => x === o.x && y === o.y);
      if (r === 'there') a.order = null; else if (r === 'stuck') { if (stepToward(a, (x, y) => dist(x, y, o.x, o.y) <= 1) !== 'moving') a.order = null; }
      if (a.order) return; }
    if (o && o.type === 'board') {
      if (a.seat >= 0) a.order = null;
      else if (toCar(a.x, a.y) === 1) { const s = freeSeat(a); if (s < 0) log('Every seat on the carriage is taken.'); else { a.seat = s; syncRiders(); log(`${a.name} climbs onto the ${SEATS[s].name}.`); } a.order = null; return; }
      else { if (stepToward(a, (x, y) => toCar(x, y) === 1) === 'stuck') a.order = null; return; } }
    if (o && o.type === 'jump') {
      if (a.seat < 0) { a.order = null; return; }
      let best = null; for (let x = R.carriage.x - 1; x <= R.carriage.x + CW; x++) for (let y = R.carriage.y - 1; y <= R.carriage.y + CHH; y++) { if (toCar(x, y) !== 1 || !passable(x, y, a)) continue; if (!best || dist(x, y, o.x, o.y) < dist(best[0], best[1], o.x, o.y)) best = [x, y]; }
      if (!best) { log(`${a.name} can't find room to jump down.`); a.order = null; return; }
      a.seat = -1; a.x = best[0]; a.y = best[1]; log(`${a.name} jumps down.`); a.order = best[0] === o.x && best[1] === o.y ? null : {type:'move', x:o.x, y:o.y}; return; }
    let t = null; for (const e of enemies()) if (inRange(a, e) && (!t || e.grit < t.grit)) t = e;
    if (t) strike(a, t);
  }
  function enemyThink(a){
    if (a.cargo && cratesLeft() > 0) { if (toCar(a.x, a.y) === 1) { if (a.x !== R.carriage.x + 1) a.face = a.x < R.carriage.x + 1 ? 1 : -1; hitCrate(a); return; }
      if (stepToward(a, (x, y) => toCar(x, y) === 1) !== 'stuck') return; }
    let t = null; for (const s of squad()) if (!t || dist(a.x, a.y, s.x, s.y) < dist(a.x, a.y, t.x, t.y)) t = s;
    if (!t) return; if (inRange(a, t)) { strike(a, t); return; }
    stepToward(a, (x, y) => dist(x, y, t.x, t.y) <= a.range);
  }
  function exitRealm(){
    const out = [], left = [];
    for (const a of crew()) { if (!a.alive && !a.down) continue; if (a.seat >= 0 || a.carried || toCar(a.x, a.y) <= ESCAPE_RANGE) out.push(a); else left.push(a); }
    R.out = out; R.left = left;
    const n = cratesLeft(), capLost = left.some(a => a.key === 'sgt');
    R.result = capLost || !out.length ? 'lose' : 'win';
    R.summary = capLost ? 'The carriage crosses out of the warren without its captain. The guild does not pay for that.'
      : `The carriage crosses out of the warren with ${n} of ${R.crates.length} crates, worth ${cargoValue()} in coin. `
        + `Out: ${out.map(a => a.name + (a.down ? ' (carried)' : '')).join(', ') || 'nobody'}.` + (left.length ? ` Left in the Ashway: ${left.map(a => a.name).join(', ')}.` : '');
    log(R.summary); onEnd();
  }
  function checkEnd(){ if (R.result) return; if (!squad().length) { R.result = 'lose'; R.summary = 'Every shareholder is down. The horses run on, with nobody left to defend the carriage.'; R.out = []; R.left = crew(); onEnd(); } }

  /* ---------------- the end of the fight ---------------- */
  function onEnd(){ try { AUDIO.play(R.result === 'win' ? 'win' : 'lose'); } catch (e) {} R.endShown = false; }
  function finish(){
    if (!R || !R.result) return;
    const def = R.def;
    if (R.mp && !R.mp.host) { MP.st.dismissed = R.seed; R = null; stopLoop(); MP.showLobby(); return; } // a guest: the host carries the story on
    if (R.result === 'lose') { tallyT('retries'); const mp = R.mp; S = migrate(JSON.parse(R.snap)); return begin2(R.id, def, {mp}); }
    if (R.mp) MP.send({t:'over'});
    const lost = (R.left || []).filter(a => a.key !== 'sgt');
    S.f.ttg_cratesLeft = cratesLeft(); S.f.ttg_casketSafe = R.crates.some(c => c.key === 'casket' && c.hp > 0) ? 1 : 0;
    S.f.ttg_cargoValue = cargoValue(); S.f.ttg_lost = lost.length ? listOf(lost.map(a => a.name)) : '';
    S.f.ttg_wounded = crew().filter(a => a.wounds && (R.out || []).includes(a)).map(a => a.key);
    lost.forEach(a => { try { kill(a.key); } catch (e) {} });
    tallyT('won');
    const xp = Math.round((def.xp || 0) * (typeof XPK !== 'undefined' ? XPK : 1)), up = gainXP(xp);
    note(`Through. +${xp} experience.`, 'good'); if (up && typeof lvlNote === 'function') note(lvlNote(), 'good');
    R = null; stopLoop();
    S.scene = 'talk'; S.battle = null; S.binv = null; save();
    talk(def.after);
  }
  const listOf = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
  const tallyT = k => { try { if (typeof tally === 'function') tally(k); } catch (e) {} };

  /* ---------------- the screen ---------------- */
  const L = {portrait:false, T:32, cols:20, rows:12, dpr:1};
  let cv = null, ctx = null, bg = null, raf = 0, last = 0, acc = 0, hudKey = '', logKey = '';
  function begin2(id, def, opt){
    begin(id, def, opt);
    if (opt.mp) { R.mp = Object.assign({}, opt.mp, {host:true}); R.selected = crew().find(mine) || null; log('Every shareholder answers to one of you. Pause stops the run for everyone.'); }
    screen(def);
  }
  function screen(def){
    view = 'rtbattle'; B = null; document.body.classList.add('rt'); try { AUDIO.setScene(def.music || 'battle'); } catch (e) {}
    $('#sheet').hidden = true; toTop();
    const known = R.known;
    $('#app').innerHTML = `<header class="hud bhud"><div class="bhead"><div class="loc">${esc(def.title)}</div><div class="sub">${esc(def.sub || '')}</div></div><div class="hudr">${hudButtons()}</div></header>
      <div class="rtdrift" aria-label="Drift"><span class="lbl">Drift</span><span class="bar" id="rtBar">${Array.from({length:DRIFT_MAX}, (_, i) => `<i class="${known && (i + 1 === 4 || i + 1 === 8) ? 'mark' : ''}"></i>`).join('')}</span><span id="rtDn" class="dn"></span><span class="sp"></span><span class="rtclock" id="rtClock">0:00</span></div>
      <div class="rtstage" id="rtStage"><canvas id="rtcv" aria-label="Battle map"></canvas><div class="rtbanner" id="rtBanner" hidden></div><div class="rtlog" id="rtLog" aria-live="polite"></div>
        <div class="rtover" id="rtOver" hidden><div class="ubar"><div class="rtot" id="rtOt"></div><div class="txt" id="rtOx"></div><button class="btn primary" id="rtGo"></button></div></div></div>
      <div class="rtorders"><button class="btn primary" id="rtPause">Resume</button><button class="btn" id="rtSkill">Skill</button><button class="btn" id="rtBoard">Board</button><button class="btn" id="rtHold">Hold</button><span class="sp"></span><button class="btn" id="rtAuto">Auto-pause</button><button class="btn" id="rtSpeed">1×</button></div>
      <div class="rtroster" id="rtRoster"></div>
      <div class="hint rthelp">Tap a shareholder, then tap ground to move, an enemy to attack, or the carriage to climb aboard. Riders tap a tile beside the carriage to jump down. Space pauses, 1 to 5 select, Q uses a skill.</div>`;
    bindHud();
    cv = $('#rtcv'); ctx = cv.getContext('2d');
    $('#rtPause').onclick = () => { click(); act({c:'pause', p:!R.paused}); };
    $('#rtSkill').onclick = () => { click(); const s = sel(); if (s) act({c:'skill', a:s.id}); };
    $('#rtBoard').onclick = () => { click(); const s = sel(); if (!s) return; if (s.seat >= 0) act({c:'jump', a:s.id, x:s.x, y:s.y - 1}); else act({c:'board', a:s.id}); };
    $('#rtHold').onclick = () => { click(); act({c:'hold'}); };
    if (R.mp && !R.mp.host) { $('#rtAuto').hidden = $('#rtSpeed').hidden = true; }
    $('#rtAuto').onclick = () => { click(); prefs.auto = !prefs.auto; savePrefs(); };
    $('#rtSpeed').onclick = () => { click(); prefs.speed = prefs.speed === 1 ? 2 : 1; savePrefs(); };
    $('#rtGo').onclick = () => { click(); finish(); };
    cv.onpointerdown = tap;
    buildRoster(); hudKey = logKey = '';
    layout(); if (!raf) { last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
  }
  const click = () => { try { AUDIO.play('click'); } catch (e) {} };
  const sel = () => R && R.selected && R.selected.alive && mine(R.selected) ? R.selected : null;
  /* together: who holds which shareholder (owners: key -> player id); alone, every one is yours */
  const mine = a => !R || !R.mp || a.side !== 'squad' || (R.mp.owners[a.key] || R.mp.hostId) === R.mp.me;
  const ownerOf = a => R.mp ? (R.mp.owners[a.key] || R.mp.hostId) : null;
  /* every order goes through here: alone or hosting it is applied at once, as a guest it goes to the host */
  function act(c){ if (!R || R.result) return; if (R.mp && !R.mp.host) { MP.send({t:'cmd', c, to:R.mp.hostId}); return; } applyCmd(R.mp ? R.mp.me : null, c); }
  function applyCmd(from, c){
    if (!R || R.result || !c) return;
    const byId = id => R.actors.find(a => a.id === id), a = c.a != null ? byId(c.a) : null;
    if (a && (a.side !== 'squad' || !a.alive)) return;
    if (a && R.mp && from && ownerOf(a) !== from) return; // only the player who holds a shareholder gives them orders
    if (c.c === 'move' && a && inB(c.x, c.y)) { if (a.seat >= 0) orderJump(a, c.x, c.y); else orderMove(a, c.x, c.y); }
    else if (c.c === 'jump' && a) orderJump(a, c.x, c.y);
    else if (c.c === 'board' && a) orderBoard(a);
    else if (c.c === 'attack' && a) { const t = byId(c.t); if (t && t.alive && t.side === 'enemy') orderAttack(a, t); }
    else if (c.c === 'skill' && a) useSkill(a);
    else if (c.c === 'hold') { if (!driverAboard()) return; R.carriage.hold = !R.carriage.hold; log(R.carriage.hold ? 'The driver hauls on the reins. The carriage holds.' : 'The driver lets the horses run.'); }
    else if (c.c === 'pause') { setPaused(!!c.p); if (c.p && R.mp && from && from !== R.mp.me) R.pauseReason = `${MP.nameOf(from)} paused the run.`; }
  }
  function setPaused(p){ if (R.result) return; R.paused = p; if (p) R.pauseReason = 'Give orders, then press Resume.'; }
  function stopLoop(){ if (raf) cancelAnimationFrame(raf); raf = 0; document.body.classList.remove('rt'); }

  function layout(){
    if (!cv || !R) return; const st = $('#rtStage'); if (!st) return;
    const portrait = window.innerHeight > window.innerWidth * 1.05, cols = portrait ? H() : W(), rows = portrait ? W() : H();
    const below = ['.rtorders', '.rtroster', '.rthelp'].reduce((s, q) => { const e = $(q); return s + (e && e.offsetParent ? e.offsetHeight + 10 : 0); }, 0);
    const top = st.getBoundingClientRect().top + window.scrollY, room = Math.max(200, window.innerHeight - top - below - 26);
    const T = Math.max(14, Math.floor(Math.min(st.clientWidth / cols, room / rows)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (L.T === T && L.portrait === portrait && L.dpr === dpr && bg && bg.w === W() && L.id === R.id + R.seed) return;
    Object.assign(L, {portrait, cols, rows, T, dpr, id:R.id + R.seed});
    cv.width = cols * T * dpr; cv.height = rows * T * dpr; cv.style.width = cols * T + 'px'; cv.style.height = rows * T + 'px';
    paintGround();
  }
  /* the ground, painted once in logical orientation with FTR's own tiles; ash and fire go over it each frame */
  function paintGround(){
    const T = L.T, dpr = L.dpr, c = document.createElement('canvas'); c.width = W() * T * dpr; c.height = H() * T * dpr; c.w = W();
    const bctx = c.getContext('2d'); bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; const dctx = d.getContext('2d');
    const map = R.def.map.map(r => r.replace(/~/g, '.'));
    const g0 = G; G = Object.assign({}, G, {bctx, dctx, T});
    try { prerender(map, W(), H(), !!R.def.dark, false, R.def.style || 'plain', false); } catch (e) { console.warn('rt ground', e); for (let y = 0; y < H(); y++) for (let x = 0; x < W(); x++) { bctx.fillStyle = map[y][x] === '#' ? '#111' : '#3a332c'; bctx.fillRect(x * T, y * T, T, T); } }
    G = g0;
    // a dead warren: the colour drained out of the ground, then darkened
    bctx.save(); bctx.globalCompositeOperation = 'saturation'; bctx.fillStyle = 'rgba(128,128,128,' + (R.def.wash != null ? R.def.wash : .85) + ')'; bctx.fillRect(0, 0, W() * T, H() * T);
    bctx.globalCompositeOperation = 'multiply'; bctx.fillStyle = R.def.tint || '#b8a898'; bctx.fillRect(0, 0, W() * T, H() * T); bctx.restore();
    // the road: two worn ruts and a pale crown down the middle, where the carriage runs
    for (let y = 0; y < H(); y++) for (let x = 0; x < W(); x++) if (R.road[y][x]) { const px = x * T, py = y * T;
      bctx.fillStyle = 'rgba(120,100,80,.28)'; bctx.fillRect(px, py, T, T);
      const top = !R.road[y - 1] || !R.road[y - 1][x]; bctx.fillStyle = 'rgba(30,22,16,.45)'; bctx.fillRect(px, py + (top ? T * .28 : T * .62), T, Math.max(2, T * .1));
      for (let i = 0; i < 3; i++) { const hx = hash(x, y, i + 40), hy = hash(y, x, i + 41); bctx.fillStyle = 'rgba(200,180,150,.12)'; bctx.fillRect(px + hx * T, py + hy * T, Math.max(1, T * .08), Math.max(1, T * .05)); } }
    // the far gate: a seam of warren light at the road's end
    const gx = (W() - 1) * T, gy = R.carriage.y * T, gr = bctx.createLinearGradient(gx, 0, gx + T, 0); gr.addColorStop(0, 'rgba(154,134,224,0)'); gr.addColorStop(1, 'rgba(201,187,255,.55)');
    bctx.fillStyle = gr; bctx.fillRect(gx, gy - T * .2, T, CHH * T + T * .4);
    bg = c;
  }
  /* logical (x forward, y across) to the screen; in portrait the road runs up */
  const scr = (x, y) => L.portrait ? [(y + .5) * L.T, (W() - x - .5) * L.T] : [(x + .5) * L.T, (y + .5) * L.T];
  const cellAt = (px, py) => L.portrait ? [W() - 1 - Math.floor(py / L.T), Math.floor(px / L.T)] : [Math.floor(px / L.T), Math.floor(py / L.T)];
  const ease = k => 1 - (1 - k) * (1 - k);
  const carX = () => R.carriage.x - (1 - ease(R.carriage.anim));
  const posOf = a => a.seat >= 0 ? [carX() + SEATS[a.seat].x, R.carriage.y + SEATS[a.seat].y] : a.nx !== null ? [a.x + (a.nx - a.x) * a.stepT, a.y + (a.ny - a.y) * a.stepT] : [a.x, a.y];
  const logical = () => { const T = L.T; ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); if (L.portrait) { ctx.translate(0, W() * T); ctx.rotate(-Math.PI / 2); } };
  const upright = () => ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);

  function draw(now){
    const T = L.T; upright(); ctx.clearRect(0, 0, L.cols * T, L.rows * T);
    let sx = 0, sy = 0; if (R.shake > 0) { sx = (Math.random() - .5) * T * .15 * R.shake * 2; sy = (Math.random() - .5) * T * .15 * R.shake * 2; R.shake = Math.max(0, R.shake - 1 / 60); }
    logical(); ctx.translate(sx, sy); ctx.drawImage(bg, 0, 0, W() * T, H() * T);
    for (let y = 0; y < H(); y++) for (let x = 0; x < W(); x++) { const k = tile(x, y); if (k === ASH) { const ag = ctx.createRadialGradient((x + .5) * T, (y + .5) * T, T * .1, (x + .5) * T, (y + .5) * T, T * .75); ag.addColorStop(0, 'rgba(150,142,132,.55)'); ag.addColorStop(1, 'rgba(150,142,132,.12)'); ctx.fillStyle = ag; ctx.fillRect(x * T, y * T, T, T); ctx.fillStyle = 'rgba(220,214,204,.22)'; for (let i = 0; i < 4; i++) ctx.fillRect(x * T + hash(x, y, i) * T, y * T + hash(y, x, i) * T, Math.max(1, T * .07), Math.max(1, T * .07)); }
      else if (k === FIRE) { const f = .75 + .25 * Math.sin(now / 150 + x * 1.7 + y * 2.3), g = ctx.createRadialGradient((x + .5) * T, (y + .6) * T, T * .05, (x + .5) * T, (y + .5) * T, T * .75); g.addColorStop(0, `rgba(255,200,90,${.8 * f})`); g.addColorStop(.5, `rgba(224,90,30,${.6 * f})`); g.addColorStop(1, 'rgba(120,30,10,.15)'); ctx.fillStyle = g; ctx.fillRect(x * T, y * T, T, T); } }
    const s = sel();
    if (s && s.seat >= 0 && !R.result) { ctx.fillStyle = 'rgba(111,159,130,.3)'; for (let x = R.carriage.x - 1; x <= R.carriage.x + CW; x++) for (let y = R.carriage.y - 1; y <= R.carriage.y + CHH; y++) if (inB(x, y) && toCar(x, y) === 1 && passable(x, y, s)) ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4); }
    if (s && !R.result && s.seat < 0) { const r = rangeOf(s); if (r > 1) { ctx.strokeStyle = 'rgba(232,192,115,.18)'; ctx.lineWidth = 1; for (let y = 0; y < H(); y++) for (let x = 0; x < W(); x++) if (dist(x, y, s.x, s.y) === r) ctx.strokeRect(x * T + 3, y * T + 3, T - 6, T - 6); } }
    drawCarriage(now, s);
    // order line
    if (s && s.order && !R.result) { const p = posOf(s); let q = null; const o = s.order;
      if (o.type === 'move' || o.type === 'jump') q = [o.x, o.y]; else if (o.type === 'attack' && o.target.alive) q = posOf(o.target); else if (o.type === 'board') q = [R.carriage.x + 1, R.carriage.y + .5];
      if (q) { ctx.setLineDash([T * .14, T * .14]); ctx.strokeStyle = o.type === 'attack' ? '#e0574a' : '#e8c073'; ctx.lineWidth = Math.max(1.5, T * .05); ctx.beginPath(); ctx.moveTo((p[0] + .5) * T, (p[1] + .5) * T); ctx.lineTo((q[0] + .5) * T, (q[1] + .5) * T); ctx.stroke(); ctx.setLineDash([]); } }
    // the figures, upright, back to front
    upright(); ctx.translate(sx, sy);
    const list = R.actors.filter(a => (a.alive || a.down) && !a.carried).map(a => ({a, p:posOf(a)})).map(o => Object.assign(o, {s:scr(o.p[0], o.p[1])})).sort((u, v) => u.s[1] - v.s[1]);
    const fs = T / 34;
    for (const {a, s:[x, y]} of list) {
      const base = y + T * .3, sc = fs * (a.seat >= 0 ? .85 : 1);
      if (a === s) { ctx.save(); ctx.strokeStyle = '#e8c073'; ctx.lineWidth = Math.max(1.5, T * .06); ctx.beginPath(); ctx.ellipse(x, base + T * .08, T * .36, T * .14, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      if (a.side === 'enemy' && R.selected && R.selected.order && R.selected.order.target === a) { ctx.save(); ctx.strokeStyle = '#e0574a'; ctx.lineWidth = Math.max(1.5, T * .05); ctx.beginPath(); ctx.ellipse(x, base + T * .08, T * .34, T * .13, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      const lunge = a.swing > 0 ? Math.sin((1 - a.swing / .2) * Math.PI) * T * .12 * a.face : 0, dir = L.portrait ? (a.side === 'enemy' ? -1 : 1) : a.face;
      if (a.down) { ctx.save(); ctx.translate(x, base); ctx.rotate(Math.PI / 2 * .9); try { drawFigure(ctx, a.fig, 0, 0, sc, now, {alpha:.55, still:true, dir}); } catch (e) {} ctx.restore(); continue; }
      try { drawFigure(ctx, a.fig, x + (L.portrait ? 0 : lunge), base - (L.portrait ? lunge * a.face : 0), sc, now, {dir, phase:a.id, alpha:a.arrived && R.t < 1 ? .6 : 1}); } catch (e) { ctx.fillStyle = a.side === 'squad' ? '#6f9f82' : '#a8332a'; ctx.beginPath(); ctx.arc(x, y, T * .3, 0, 7); ctx.fill(); }
      if (a.flash > 0) { ctx.save(); ctx.globalAlpha = a.flash * 2; ctx.fillStyle = a.side === 'squad' ? '#e0574a' : '#fff4dc'; ctx.beginPath(); ctx.ellipse(x, base - T * .4, T * .24, T * .4, 0, 0, 7); ctx.globalCompositeOperation = 'overlay'; ctx.fill(); ctx.restore(); }
      // grit bar and wound pips over the head
      const bw = T * .62, bx = x - bw / 2, by = base - T * 1.12;
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx - 1, by - 1, bw + 2, Math.max(3, T * .08) + 2);
      ctx.fillStyle = a.side === 'squad' ? '#8fc29f' : '#c9973f'; ctx.fillRect(bx, by, bw * Math.max(0, a.grit) / a.maxGrit, Math.max(3, T * .08));
      for (let w = 0; w < a.wounds; w++) { ctx.fillStyle = '#e0574a'; ctx.beginPath(); ctx.arc(bx + T * .06 + w * T * .16, by - T * .08, Math.max(2, T * .055), 0, 7); ctx.fill(); }
    }
    // effects
    for (const f of R.fx) {
      if (f.kind === 'shot') { const p = scr(...posOf(f.from)), q = scr(...posOf(f.to)), k = 1 - f.t / .2; ctx.strokeStyle = f.magic ? `rgba(201,187,255,${k})` : `rgba(232,220,190,${k})`; ctx.lineWidth = f.magic ? Math.max(2, T * .08) : Math.max(1.4, T * .04);
        ctx.beginPath(); ctx.moveTo(p[0], p[1] - T * .35); ctx.lineTo(q[0], q[1] - T * .3); ctx.stroke(); }
      else if (f.kind === 'ring') { const p = scr(f.x, f.y), k = f.t / .9; ctx.strokeStyle = f.col || '#9a86e0'; ctx.globalAlpha = 1 - k; ctx.lineWidth = Math.max(1.5, T * .06); ctx.beginPath(); ctx.ellipse(p[0], p[1] + T * .3, T * (.2 + k * (f.big ? 1.6 : .6)), T * (.08 + k * (f.big ? .6 : .25)), 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      else { const p = f.seat >= 0 ? scr(carX() + SEATS[f.seat].x, R.carriage.y + SEATS[f.seat].y) : scr(f.x, f.y); ctx.globalAlpha = 1 - f.t / .9; ctx.fillStyle = f.col; ctx.font = `700 ${Math.max(11, T * .36)}px var(--label, sans-serif)`; ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3; ctx.strokeText(f.text, p[0], p[1] - T * 1.2 - f.t * T * .8); ctx.fillText(f.text, p[0], p[1] - T * 1.2 - f.t * T * .8); ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
    }
    if (R.anchorT > 0) { ctx.fillStyle = `rgba(154,134,224,${.06 + .03 * Math.sin(now / 300)})`; ctx.fillRect(0, 0, L.cols * T, L.rows * T); }
    if (R.paused && !R.result) { ctx.fillStyle = 'rgba(13,11,10,.22)'; ctx.fillRect(0, 0, L.cols * T, L.rows * T); }
  }
  /* the carriage, from above: black lacquer gone grey at the edges, brass trim, the guild's knot on the door, the team ahead (the guild's own horses, 048) */
  function drawCarriage(now, s){
    const T = L.T, x0 = carX() * T, y0 = R.carriage.y * T, w = CW * T, h = CHH * T, moving = R.carriage.anim < 1;
    // the team: ranks of horses ahead of the box, two abreast for six, three for nine, four for twenty (the first five ranks drawn)
    const team = R.team || 6, abreast = team <= 6 ? 2 : team <= 9 ? 3 : 4, ranks = Math.ceil(team / abreast), hx = x0 + w + T * .1, rl = T * .78;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1, T * .04); ctx.beginPath();
    for (let j = 0; j < abreast; j++) { const ty = y0 + h * (j + .5) / abreast; ctx.moveTo(x0 + w, y0 + h * .5); ctx.lineTo(hx + T * .3, ty); ctx.moveTo(hx + T * .3, ty); ctx.lineTo(hx + T * .3 + rl * (Math.min(ranks, 5) - 1), ty); }
    ctx.stroke();
    for (let r = 0; r < Math.min(ranks, 5); r++) for (let j = 0; j < abreast && r * abreast + j < team; j++) {
      const i = r * abreast + j, cy = y0 + h * (j + .5) / abreast, bx = hx + r * rl, bob = moving ? Math.sin(now / 90 + i * 2) * T * .03 : 0, hc = TTG_COATS[i % TTG_COATS.length];
      ctx.globalAlpha = r < 4 ? 1 : .55; ttgHorseTop(ctx, bx + T * .4, cy + bob * .3, T * .8, hc, now, moving, i); ctx.globalAlpha = 1; }
    // wheels
    ctx.fillStyle = '#17120e'; [[.12, -.06], [.12, 1.06], [.82, -.06], [.82, 1.06]].forEach(([a, b]) => { ctx.fillRect(x0 + w * a - T * .22, y0 + h * b - T * .07, T * .44, T * .14); });
    // shadow and body
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x0 + T * .1, y0 + T * .14, w - T * .1, h - T * .06);
    const g = ctx.createLinearGradient(x0, y0, x0, y0 + h); g.addColorStop(0, '#2c2420'); g.addColorStop(.5, '#1a1512'); g.addColorStop(1, '#241d19'); ctx.fillStyle = g; ctx.fillRect(x0 + T * .06, y0 + T * .06, w - T * .12, h - T * .12);
    ctx.strokeStyle = s && s.seat < 0 ? '#e8c073' : '#8a6a32'; ctx.lineWidth = Math.max(1.5, T * .06); ctx.strokeRect(x0 + T * .06, y0 + T * .06, w - T * .12, h - T * .12);
    ctx.strokeStyle = 'rgba(201,151,63,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + T * .2, y0 + T * .2, w - T * .4, h - T * .4);
    // the driver's bench (front) and the roof rail
    ctx.fillStyle = '#4a3622'; ctx.fillRect(x0 + w - T * .5, y0 + T * .12, T * .36, h - T * .24);
    // the guild's knot on the side
    ctx.strokeStyle = 'rgba(232,192,115,.7)'; ctx.lineWidth = Math.max(1, T * .04); const kx = x0 + w * .5, ky = y0 + h * .5; ctx.beginPath(); ctx.arc(kx - T * .1, ky, T * .14, 0, 7); ctx.arc(kx + T * .1, ky, T * .14, 0, 7); ctx.stroke();
    // crates
    R.crates.forEach((c, i) => { const cc = CRATE_CELLS[i]; if (!cc) return; const px = x0 + cc[0] * T, py = y0 + cc[1] * T, m = T * .2;
      if (c.hp > 0) { ctx.fillStyle = c.key === 'casket' ? '#3a3a40' : '#8a6a42'; ctx.fillRect(px + m, py + m, T - 2 * m, T - 2 * m); ctx.strokeStyle = c.key === 'casket' ? '#9c9cae' : '#3d2a16'; ctx.lineWidth = Math.max(1, T * .05); ctx.strokeRect(px + m, py + m, T - 2 * m, T - 2 * m);
        ctx.beginPath(); ctx.moveTo(px + m, py + T / 2); ctx.lineTo(px + T - m, py + T / 2); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(px + m, py + T - m + 1, T - 2 * m, Math.max(2, T * .07)); ctx.fillStyle = c.hit ? '#e0574a' : '#e8c073'; ctx.fillRect(px + m, py + T - m + 1, (T - 2 * m) * c.hp / c.max, Math.max(2, T * .07)); }
      else { ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = Math.max(1.5, T * .05); ctx.beginPath(); ctx.moveTo(px + m, py + m); ctx.lineTo(px + T - m, py + T - m); ctx.moveTo(px + T - m, py + m); ctx.lineTo(px + m, py + T - m); ctx.stroke(); } });
    if (R.carriage.hold) { ctx.fillStyle = '#e8c073'; ctx.fillRect(x0 + w - T * .16, y0 + T * .1, T * .08, h - T * .2); }
  }

  /* ---------------- the HUD ---------------- */
  function buildRoster(){
    $('#rtRoster').innerHTML = crew().map((a, i) => `<button class="rtcard${R.mp && !mine(a) ? ' other' : ''}" data-i="${i}"><span class="top"><span class="nm">${i + 1}. ${esc(a.name)}</span><span class="rl">${esc(R.mp ? (mine(a) ? 'yours' : MP.nameOf(ownerOf(a))) : a.role)}</span></span><span class="grit"><i></i></span><span class="st"></span></button>`).join('');
    $('#rtRoster').onclick = e => { const b = e.target.closest('[data-i]'); if (!b || !R) return; const a = crew()[+b.dataset.i]; if (a && a.alive && mine(a)) { if (R.selected === a && a.skill) act({c:'skill', a:a.id}); R.selected = a; click(); } };
  }
  function status(a){ if (a.carried) return 'Down, on the carriage'; if (a.down) return 'Down'; if (!a.alive) return 'Gone'; const o = a.order;
    if (o && o.type === 'attack') return 'Attacking ' + o.target.name; if (o && o.type === 'board') return 'To the carriage'; if (o && (o.type === 'move' || o.type === 'jump')) return 'Moving';
    if (a.seat >= 0) return 'On the ' + SEATS[a.seat].name; return 'Holding ground'; }
  function hud(){
    const s = Math.floor(R.t), narrow = window.innerWidth <= 520, sa = sel(), sk = sa ? skillState(sa) : {ok:false, why:''};
    const ks = [s, R.drift, Math.ceil(R.nextDrift - R.t), R.anchorT > 0, R.paused, R.pauseReason, R.result, sa && sa.id, sa && sa.seat, sk.ok, sk.why, R.carriage.hold, driverAboard(), prefs.auto, prefs.speed, narrow,
      crew().map(a => [a.grit, a.wounds, a.alive, status(a)].join()).join('|')].join('/');
    if (ks !== hudKey) { hudKey = ks;
      $('#rtClock').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      [...$('#rtBar').children].forEach((e, i) => { const n = i + 1; e.className = (R.known && (n === 4 || n === 8) ? 'mark ' : '') + (n <= R.drift ? (n >= 8 ? 'on fire' : n >= 4 ? 'on ash' : 'on') : ''); });
      $('#rtDn').textContent = R.anchorT > 0 ? `anchored, ${Math.ceil(R.anchorT)}s` : R.drift >= DRIFT_MAX ? 'burning' : R.known ? (R.drift < 4 ? `ash in ${Math.ceil(R.nextDrift - R.t + (3 - R.drift) * R.every)}s` : R.drift < 8 ? `fire in ${Math.ceil(R.nextDrift - R.t + (7 - R.drift) * R.every)}s` : 'burning') : 'listen for the ground';
      const bn = $('#rtBanner'); if (R.paused && !R.result) { bn.hidden = false; bn.innerHTML = `<b>Paused</b>${esc(R.pauseReason)}`; } else bn.hidden = true;
      $('#rtPause').textContent = R.paused ? 'Resume' : 'Pause'; $('#rtPause').disabled = !!R.result;
      const skb = $('#rtSkill'); skb.disabled = !sk.ok; skb.textContent = sa && sa.skill ? SKILL[sa.skill].name + (sk.why ? ` · ${sk.why}` : '') : 'Skill'; skb.title = sa && sa.skill ? SKILL[sa.skill].desc : '';
      const bb = $('#rtBoard'); if (sa && sa.seat >= 0) { bb.textContent = narrow ? 'Down' : 'Jump down'; bb.disabled = false; } else { bb.textContent = 'Board'; bb.disabled = !sa || freeSeat(sa) < 0; }
      const hb = $('#rtHold'); hb.disabled = !driverAboard(); hb.textContent = R.carriage.hold ? 'Release' : 'Hold'; hb.classList.toggle('on', R.carriage.hold);
      const ab = $('#rtAuto'); ab.textContent = narrow ? 'Auto' : prefs.auto ? 'Auto-pause on' : 'Auto-pause off'; ab.classList.toggle('on', prefs.auto);
      $('#rtSpeed').textContent = prefs.speed + '×';
      crew().forEach((a, i) => { const b = $(`#rtRoster [data-i="${i}"]`); if (!b) return; b.classList.toggle('sel', a === R.selected && a.alive); b.classList.toggle('down', !a.alive);
        b.querySelector('.grit i').style.width = (100 * Math.max(0, a.grit) / a.maxGrit) + '%'; b.querySelector('.st').innerHTML = esc(status(a)) + (a.wounds && a.alive ? ` <span class="w">· ${a.wounds} wound${a.wounds > 1 ? 's' : ''}</span>` : ''); });
      const ov = $('#rtOver'); if (R.result) { ov.hidden = false; $('#rtOt').textContent = R.result === 'win' ? 'Through the gate' : 'The run fails'; $('#rtOt').className = 'rtot ' + R.result; $('#rtOx').textContent = R.summary; $('#rtGo').textContent = R.mp && !R.mp.host ? 'Back to the crew' : R.result === 'win' ? 'Out into the rain' : 'Run the Ashway again'; } else ov.hidden = true;
    }
    const lk = R.log.length + ':' + R.log[R.log.length - 1]; if (lk !== logKey) { logKey = lk; $('#rtLog').innerHTML = R.log.slice(window.innerWidth <= 520 ? -2 : -3).map(l => `<div>${esc(l)}</div>`).join(''); }
  }

  /* ---------------- input ---------------- */
  function actorAt(px, py){ let best = null, bd = L.T * .62; for (const a of R.actors) { if (!a.alive) continue; const [x, y] = scr(...posOf(a)), d = Math.hypot(px - x, py - (y - L.T * .1)); if (d < bd) { best = a; bd = d; } } return best; }
  function tap(ev){
    if (!R || R.result) return; const r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    const hit = actorAt(px, py), s = sel();
    if (hit && hit.side === 'squad' && mine(hit)) { R.selected = hit; click(); return; }
    if (!s) return;
    if (hit && hit.side === 'enemy') { act({c:'attack', a:s.id, t:hit.id}); click(); return; }
    const [x, y] = cellAt(px, py); if (!inB(x, y)) return;
    if (isCar(x, y)) { if (s.seat < 0) act({c:'board', a:s.id}); click(); return; }
    if (tile(x, y) === ROCK) return;
    act({c:s.seat >= 0 ? 'jump' : 'move', a:s.id, x, y}); click();
  }
  window.addEventListener('keydown', e => {
    if (view !== 'rtbattle' || !R) return; if (!$('#sheet').hidden || ($('#settings') && !$('#settings').hidden) || ($('#chars') && !$('#chars').hidden)) return;
    if (e.code === 'Space') { e.preventDefault(); if (R.result) finish(); else act({c:'pause', p:!R.paused}); }
    else if (/^Digit[1-5]$/.test(e.code)) { const a = crew()[+e.code.slice(5) - 1]; if (a && a.alive && mine(a)) R.selected = a; }
    else if (e.code === 'KeyB') $('#rtBoard').click(); else if (e.code === 'KeyH') $('#rtHold').click(); else if (e.code === 'KeyQ') $('#rtSkill').click();
    else return;
    e.stopImmediatePropagation();
  }, true);
  window.addEventListener('resize', () => { if (view === 'rtbattle') layout(); });

  function frame(now){
    raf = 0;
    if (view !== 'rtbattle' || !R || !cv || !cv.isConnected) { stopLoop(); return; }
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (R.mp && !R.mp.host) guestTick(dt);
    else { if (!R.paused && !R.result) { acc += dt * prefs.speed; while (acc >= STEP) { update(STEP); acc -= STEP; } }
      if (R.mp && (now - (R.mp.sent || 0) > 100 || R.result && !R.mp.sentEnd)) { R.mp.sent = now; if (R.result) R.mp.sentEnd = 1; MP.send({t:'snap', s:snapshot()}); } }
    layout(); draw(now); hud();
    raf = requestAnimationFrame(frame);
  }

  /* ---------------- together: the host's fight, sent ten times a second; a guest draws what it is sent ---------------- */
  const ORD = o => !o ? null : o.type === 'attack' ? {type:'attack', t:o.target.id} : Object.assign({}, o);
  const AK = ['id', 'side', 'key', 'name', 'fig', 'role', 'x', 'y', 'nx', 'ny', 'stepT', 'stepDur', 'grit', 'maxGrit', 'wounds', 'alive', 'down', 'carried', 'seat', 'face', 'flash', 'swing', 'skill', 'driver', 'roof', 'magic', 'range', 'arrived', 'cargo'];
  function snapshot(){
    return {id:R.id, seed:R.seed, t:R.t, drift:R.drift, nextDrift:R.nextDrift, every:R.every, anchorT:R.anchorT, braceT:R.braceT, rallyT:R.rallyT, known:R.known,
      paused:R.paused, pauseReason:R.pauseReason, result:R.result, summary:R.summary, owners:R.mp.owners, hostId:R.mp.me, used:R.used, cdT:R.cdT,
      car:{x:R.carriage.x, y:R.carriage.y, anim:R.carriage.anim, hold:R.carriage.hold}, tiles:R.tiles.map(r => r.join('')).join('/'),
      crates:R.crates, team:R.team, log:R.log.slice(-6), logN:R.log.length,
      actors:R.actors.filter(a => a.alive || a.side === 'squad').map(a => { const o = {}; AK.forEach(k => { if (a[k] !== undefined) o[k] = a[k]; }); o.order = ORD(a.order); return o; }),
      fx:R.fx.map(f => f.kind === 'shot' ? {kind:'shot', from:f.from.id, to:f.to.id, magic:f.magic, t:f.t} : f)};
  }
  /* a guest: build the board from the battle def, then take everything else from the host */
  function guestStart(s, mp){
    const def = (typeof battleDef === 'function' ? battleDef(s.id) : BATTLES[s.id]); if (!def) return;
    const map = def.map;
    R = {id:s.id, def, seed:s.seed, w:map[0].length, h:map.length, road:map.map(r => [...r].map(c => c === '~')), actors:[], fx:[], log:[], crates:[], carriage:{x:0, y:0, anim:1}, mp:Object.assign({}, mp, {host:false}), selected:null};
    guestSnap(s); R.selected = crew().find(mine) || null; screen(def);
  }
  function guestSnap(s){
    if (!R || R.seed !== s.seed || R.id !== s.id) return guestStart(s, R ? R.mp : MP.mpInfo());
    ['t', 'drift', 'nextDrift', 'every', 'anchorT', 'braceT', 'rallyT', 'known', 'paused', 'pauseReason', 'summary', 'used', 'cdT'].forEach(k => { R[k] = s[k]; });
    if (s.result && !R.result) onEndGuest(s); R.result = s.result;
    R.mp.owners = s.owners || {}; R.mp.hostId = s.hostId;
    R.tiles = s.tiles.split('/').map(r => [...r].map(Number)); R.crates = s.crates; R.team = s.team;
    const c = R.carriage; if (c.x !== s.car.x) c.anim = Math.min(c.anim, s.car.anim); c.x = s.car.x; c.y = s.car.y; c.hold = s.car.hold; if (s.car.anim >= 1) c.anim = 1;
    const old = new Map(R.actors.map(a => [a.id, a]));
    R.actors = s.actors.map(o => { const a = old.get(o.id) || {}; Object.keys(a).forEach(k => { if (!(k in o)) delete a[k]; }); Object.assign(a, o); if (a.nx === undefined) a.nx = null; return a; });
    const byId = new Map(R.actors.map(a => [a.id, a]));
    R.actors.forEach(a => { if (a.order && a.order.type === 'attack') { const t = byId.get(a.order.t); a.order = t ? {type:'attack', target:t} : null; } });
    R.fx = s.fx.map(f => f.kind === 'shot' ? (byId.get(f.from) && byId.get(f.to) ? {kind:'shot', from:byId.get(f.from), to:byId.get(f.to), magic:f.magic, t:f.t} : null) : f).filter(Boolean);
    if (s.logN !== R.logN) { R.log = s.log; R.logN = s.logN; }
    if (R.selected && !byId.has(R.selected.id)) R.selected = null;
    if (!sel()) R.selected = crew().find(a => a.alive && mine(a)) || null;
    if (R.rosterKey !== JSON.stringify(s.owners)) { R.rosterKey = JSON.stringify(s.owners); if (cv && cv.isConnected) buildRoster(); }
  }
  function onEndGuest(s){ try { AUDIO.play(s.result === 'win' ? 'win' : 'lose'); } catch (e) {} }
  function guestTick(dt){ // between the host's messages: steps keep walking, the carriage keeps rolling, effects keep fading
    for (const a of R.actors) if (a.nx !== null && a.nx !== undefined && !R.paused) a.stepT = Math.min(.98, a.stepT + dt / (a.stepDur || 1));
    if (!R.paused) R.carriage.anim = Math.min(1, R.carriage.anim + dt / .4);
    for (const f of R.fx) f.t += dt; R.fx = R.fx.filter(f => f.t < (f.kind === 'shot' ? .2 : .9));
  }

  /* the table changed (someone left, came back, or took over): redraw who drives whom */
  function refresh(me){ if (!R || !R.mp) return; if (me) R.mp.me = me; R.rosterKey = JSON.stringify(R.mp.owners); if (R.selected && !mine(R.selected)) R.selected = null;
    if (!R.selected) R.selected = crew().find(a => a.alive && mine(a)) || null; if (cv && cv.isConnected) buildRoster(); }

  return {start:begin2, refresh, guestStart, guestSnap, applyCmd, snapshot, mine, update, finish, useSkill, skillState, orderMove, orderAttack, orderBoard, orderJump, freeSeat, toCar, enemies, squad, crew, inRange, setPaused, prefs,
    get R(){ return R; }};
})();
window.__rt = RT;

/* an rt:true fight goes to the real-time battle; any other still goes to FTR's */
{ const _ftrStartBattle = startBattle; startBattle = function(id, opt = {}){ const def = typeof battleDef === 'function' ? battleDef(id) : BATTLES[id]; if (def && def.rt) return RT.start(id, def, opt || {}); return _ftrStartBattle.apply(this, arguments); }; }

/* ============ Trygalle Run: playing together ============
   Co-op over a room code. Every player's browser connects to the guild's relay (relay/ in the repo, a Cloudflare Worker) at
   /room/CODE; the relay passes messages between the players in that room and keeps nothing itself. The host's browser runs
   the fight (989z) and sends what it looks like ten times a second; the others draw that and send their orders back.
   Each shareholder answers to one player. Same wifi or across the world, it is the same: everyone types the same code.
   Messages: host -> all {t:'lobby'} {t:'snap'} {t:'over'}; guest -> host {t:'cmd'}; the relay adds {t:'hello'|'join'|'leave'}. */
const MP = (() => {
  const CREW = ['sgt', 'tavos', 'mira', 'quill', 'ossel'];
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const st = {ws:null, me:null, hostId:null, host:false, code:'', name:'', players:[], owners:{}, status:'', dismissed:null, open:false, lost:{}, want:false, retry:0, retryT:null, prevMe:null};
  const relayURL = () => {
    try { const q = new URLSearchParams(location.search).get('relay'); if (q) localStorage.setItem('ttg-relay', q); } catch (e) {}
    let r = ''; try { r = localStorage.getItem('ttg-relay') || ''; } catch (e) {}
    if (r) return r.replace(/\/$/, '');
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return 'ws://localhost:8787';
    return 'wss://relay.playfromtheranks.com';
  };
  const savedName = () => { try { return localStorage.getItem('ttg-name') || ''; } catch (e) { return ''; } };
  const keepName = n => { try { localStorage.setItem('ttg-name', n); } catch (e) {} };
  const nameOf = id => (st.players.find(p => p.id === id) || {}).name || 'a shareholder';
  const send = m => { if (st.ws && st.ws.readyState === 1) try { st.ws.send(JSON.stringify(m)); } catch (e) {} };
  const mpInfo = () => ({me:st.me, hostId:st.hostId, owners:st.owners});
  const inRun = () => view === 'rtbattle' && RT.R && RT.R.mp;

  /* rejoin: a dropped connection (a phone that went to another app, a wifi blip) comes back to the same room on its own.
     The relay gives the new connection a new id; the host hands the shareholders back by the player's name. */
  function connect(code, name, host, rejoin){
    const keep = rejoin && inRun();
    if (!rejoin) { st.lost = {}; st.retry = 0; }
    leave(true); st.want = true; st.prevMe = keep ? st.me : null;
    st.code = code; st.name = name; st.host = host; st.players = []; if (!keep) st.owners = {}; st.hostId = keep && host ? st.hostId : null; st.status = rejoin ? 'Reconnecting to the room…' : 'Reaching the guild\'s relay…'; st.open = false; keepName(name);
    let ws; try { ws = new WebSocket(`${relayURL()}/room/${code}?name=${encodeURIComponent(name)}`); } catch (e) { st.status = 'This browser could not open a connection.'; return render(); }
    st.ws = ws; render();
    const timer = setTimeout(() => { if (!st.open && st.ws === ws) { st.status = 'The guild\'s relay did not answer. Check the connection and try again.'; try { ws.close(); } catch (e) {} render(); } }, 8000);
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (err) { return; } if (st.ws === ws) onMsg(m); };
    ws.onclose = () => { clearTimeout(timer); if (st.ws !== ws) return; st.ws = null;
      if (st.open) { st.status = 'The connection to the room was lost. Reconnecting…'; st.open = false; if (inRun() && !RT.R.mp.host) { RT.R.paused = true; RT.R.pauseReason = 'Lost the connection. Reconnecting…'; } }
      if (st.want) retryLater(); render(); };
    ws.onerror = () => { if (!st.open) st.status = 'Could not reach the guild\'s relay. Check the connection and try again.'; };
  }
  function retryLater(){ clearTimeout(st.retryT); if (!st.want || st.retry >= 12) { if (st.want) st.status = 'Could not get back into the room. Join again with the same code.'; return; }
    const wait = Math.min(8000, 1000 * Math.pow(1.6, st.retry++)); st.retryT = setTimeout(() => { if (st.want && !st.ws) connect(st.code, st.name, st.host, true); }, wait); }
  /* a phone coming back to the game reconnects at once */
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.want && !st.ws && st.code) { clearTimeout(st.retryT); st.retry = 0; connect(st.code, st.name, st.host, true); } });
  function leave(quiet){ if (!quiet) { st.want = false; clearTimeout(st.retryT); } const ws = st.ws; st.ws = null; st.open = false; if (ws) try { ws.close(); } catch (e) {} if (!quiet) { st.code = ''; st.players = []; st.status = ''; } }

  function onMsg(m){
    if (m.t === 'hello') { st.open = true; st.retry = 0; const was = st.prevMe; st.me = m.you; st.players = [{id:m.you, name:st.name}, ...m.peers];
      if (st.host && was) { // the host back in its own room: its shareholders follow it to the new id
        st.hostId = st.me; CREW.forEach(k => { if (!st.owners[k] || st.owners[k] === was) st.owners[k] = st.me; });
        CREW.forEach(k => { if (!st.players.some(p => p.id === st.owners[k])) st.owners[k] = st.me; }); st.status = ''; lobbyOut();
        if (inRun()) { RT.R.mp.hostId = st.me; RT.refresh(st.me); } return render(); }
      if (st.host) { if (m.peers.length) { st.status = 'Someone is already using that code. Host again for a fresh one.'; st.want = false; leave(true); return render(); }
        st.hostId = st.me; CREW.forEach(k => { st.owners[k] = st.me; }); st.status = ''; lobbyOut(); }
      else { st.status = m.peers.length ? (was ? '' : 'Waiting for the host…') : was ? 'The host is not in the room right now. Waiting…' : 'Nobody is in that room yet. Check the code with whoever is hosting.';
        if (inRun()) RT.refresh(st.me); }
      return render(); }
    if (m.t === 'join') { st.players = st.players.filter(p => p.id !== m.id).concat([{id:m.id, name:m.name}]);
      if (st.host) { const back = st.lost[m.name]; delete st.lost[m.name];
        if (back) { back.forEach(k => { if (st.owners[k] === st.me) st.owners[k] = m.id; }); lobbyOut(); if (inRun()) { RT.refresh(); RT.R.pauseReason = `${m.name} is back, with their shareholders. Resume when you are ready.`; } }
        else { lobbyOut(); if (!inRun()) share(); } }
      return render(); }
    if (m.t === 'leave') { m.name = nameOf(m.id); st.players = st.players.filter(p => p.id !== m.id);
      if (st.host) { const had = CREW.filter(k => st.owners[k] === m.id); if (had.length && m.name) st.lost[m.name] = had;
        had.forEach(k => { st.owners[k] = st.me; }); lobbyOut();
        if (inRun()) { RT.refresh(); RT.R.paused = true; RT.R.pauseReason = `${(m.name || 'A player')} dropped out. Their shareholders are yours until they come back with the same code.`; } }
      else if (m.id === st.hostId) { st.status = 'The host dropped out. Waiting for them to come back.'; st.hostId = null; if (inRun()) { RT.R.paused = true; RT.R.pauseReason = 'The host dropped out. Waiting for them to come back.'; } }
      return render(); }
    if (st.host) { if (m.t === 'cmd' && inRun()) RT.applyCmd(m.from, m.c); return; }
    // a guest from here on: only the host's word counts
    if (m.t === 'lobby') { if (st.hostId && m.from !== st.hostId) return; st.hostId = m.from; st.players = m.players; st.owners = m.owners; st.status = ''; if (inRun()) { RT.R.mp.owners = m.owners; RT.R.mp.hostId = m.from; RT.refresh(st.me); } return render(); }
    if (m.t === 'snap' && m.from === st.hostId) {
      if (st.dismissed === m.s.seed && m.s.result) return;
      if (!inRun() || RT.R.seed !== m.s.seed) { st.dismissed = null; RT.guestStart(m.s, mpInfo()); } else RT.guestSnap(m.s); }
  }
  function lobbyOut(){ send({t:'lobby', players:st.players, owners:st.owners}); }
  /* the host's default split: the captain stays with the host, the rest go round the table */
  function share(){ const ids = st.players.map(p => p.id); CREW.forEach((k, i) => { st.owners[k] = ids[i % ids.length]; }); st.owners.sgt = st.me; lobbyOut(); }

  /* the host starts the run: the first contract, signed as it stands, straight to the Ashway */
  function startRun(){
    if (!st.host || !st.open) return;
    S = newState('Hask'); S.f.ttg_manifest = 1; S.f.ttg_casket = 'signed'; S.f.ttg_osselIn = 1; S.f.ttg_together = 1; S._guest = 1; // a co-op run never overwrites the host's story save
    startBattle('ttg_ashway', {mp:mpInfo()});
  }
  /* after a run: back to the room, still connected */

  /* ---------------- the screen ---------------- */
  function showLobby(){
    if (S && !S._guest && view !== 'lobby') save();
    view = 'lobby'; B = null; titleAnim = null; document.body.classList.remove('rt'); $('#sheet').hidden = true; toTop();
    if (!S) { S = newState('Hask'); S._guest = 1; }
    try { AUDIO.setScene('explore'); } catch (e) {}
    $('#app').innerHTML = `<header class="hud"><div><div class="loc">Play together</div><div class="sub">One carriage, a crew of friends</div></div><div class="hudr"><button class="btn" id="lbTitle">Title</button></div></header><div class="lobby ubar" id="lobby"></div>`;
    $('#lbTitle').onclick = () => { try { AUDIO.play('click'); } catch (e) {} leave(); S = null; showTitle(); };
    render();
  }
  function render(){
    const el = $('#lobby'); if (!el || view !== 'lobby') return;
    const on = !!st.ws, open = st.open && on;
    if (!on && !open) {
      el.innerHTML = `<p class="txt">Everyone plays on their own phone or computer. One of you hosts and gets a four-letter code; the others type it in. It works the same on one wifi or across the world.</p>
        <div class="field"><label for="lbName">Your name</label><input type="text" id="lbName" maxlength="18" value="${esc(st.name || savedName() || '')}" placeholder="Your name" autocomplete="off" autocapitalize="words" spellcheck="false"></div>
        <div class="lbrow"><button class="btn primary" id="lbHost">Host a run</button></div>
        <div class="field"><label for="lbCode">Or join with a code</label><div class="lbrow"><input type="text" id="lbCode" maxlength="4" placeholder="ABCD" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn" id="lbJoin">Join</button></div></div>
        <p class="fine lbmsg" role="status">${esc(st.status || '')}</p>`;
      const nm = () => ($('#lbName').value || '').trim().slice(0, 18) || 'Shareholder';
      $('#lbHost').onclick = () => { try { AUDIO.play('click'); } catch (e) {} let c = ''; for (let i = 0; i < 4; i++) c += LETTERS[Math.floor(Math.random() * LETTERS.length)]; connect(c, nm(), true); };
      const join = () => { const c = ($('#lbCode').value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length !== 4) { st.status = 'A room code is four letters.'; return render(); } try { AUDIO.play('click'); } catch (e) {} connect(c, nm(), false); };
      $('#lbJoin').onclick = join; $('#lbCode').onkeydown = e => { if (e.key === 'Enter') join(); };
      return; }
    const host = st.host, hostName = host ? st.name : nameOf(st.hostId);
    const opts = k => st.players.map(p => `<option value="${p.id}" ${st.owners[k] === p.id ? 'selected' : ''}>${esc(p.name)}${p.id === st.me ? ' (you)' : ''}</option>`).join('');
    el.innerHTML = `<div class="lbcode"><span>Room code</span><b>${esc(st.code)}</b></div>
      <p class="fine">${host ? 'Give this code to the others. They open the game, choose Play together, and type it in.' : open ? `In ${esc(hostName)}'s room.` : ''}</p>
      <div class="rh">The crew · ${st.players.length} ${st.players.length === 1 ? 'player' : 'players'}</div>
      <ul class="lbplayers">${st.players.map(p => `<li>${esc(p.name)}${p.id === st.hostId ? ' <small>host</small>' : ''}${p.id === st.me ? ' <small>you</small>' : ''}</li>`).join('')}</ul>
      ${open && st.hostId ? `<div class="rh">Who drives whom</div><div class="lbcrew">${CREW.map(k => `<label for="lbo_${k}">${esc(NAME(k))} <small>${esc(TPL[k] ? (k === 'sgt' ? 'captain' : TPL[k].role || '') : '')}</small></label>${host ? `<select id="lbo_${k}" data-k="${k}">${opts(k)}</select>` : `<span class="own" id="lbo_${k}">${esc(nameOf(st.owners[k]))}${st.owners[k] === st.me ? ' (you)' : ''}</span>`}`).join('')}</div>` : ''}
      <div class="lbrow">${host ? `<button class="btn primary" id="lbStart" ${open ? '' : 'disabled'}>Start the run</button>` : ''}<button class="btn" id="lbLeave">Leave the room</button></div>
      <p class="fine lbmsg" role="status">${esc(st.status || (host ? '' : open ? `Waiting for ${hostName} to start the run.` : ''))}</p>`;
    if (host) { el.querySelectorAll('select[data-k]').forEach(s => s.onchange = () => { st.owners[s.dataset.k] = s.value; lobbyOut(); });
      $('#lbStart').onclick = () => { try { AUDIO.play('click'); } catch (e) {} startRun(); }; }
    $('#lbLeave').onclick = () => { try { AUDIO.play('click'); } catch (e) {} leave(); render(); };
  }
  return {connect, leave, send, nameOf, mpInfo, showLobby, startRun, render, st, CREW};
})();

/* a guest's game is never saved: it is only a window on the host's run */
{ const _save = save; save = function(){ if (S && S._guest) return; return _save.apply(this, arguments); }; }

/* the title gets a way in */
{ const _showTitle = showTitle; showTitle = function(){ const r = _showTitle.apply(this, arguments);
  try { if (view === 'title' && !$('#bTogether')) { const host = $('.tbtns'); if (host) { const b = document.createElement('button'); b.className = 'btn primary'; b.id = 'bTogether'; b.textContent = 'Play together';
    b.onclick = () => { try { AUDIO.play('click'); } catch (e) {} S = null; MP.showLobby(); }; host.prepend(b); } } } catch (e) { console.warn('together button', e); }
  return r; }; }

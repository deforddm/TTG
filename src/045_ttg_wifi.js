/* ============ Trygalle Run: playing together on one wifi, no internet ============
   The relay needs the internet. On a wifi with no internet the browsers talk straight to each other (WebRTC data channels).
   Browsers cannot find each other on their own, so each player and the host swap one code each, by QR or by copy and paste:
   the host's code (an offer) goes to the player, the player's code (an answer) comes back. The host then acts as the relay:
   the same messages (hello/join/leave, lobby/snap/cmd) travel over the data channels, so the game above does not know the
   difference. The codes hold only what a connection needs (ICE user and password, the DTLS fingerprint, local addresses).
   QR drawing (vendor/qrcode.js, MIT) and reading (vendor/jsQR.js, Apache-2.0) load on first use and are precached for offline. */
const WIFI = (() => {
  const st = {mode:'', offer:'', answer:'', status:'', busy:false, pending:null, guest:null};
  const rid = () => Math.random().toString(16).slice(2, 10);
  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const hex2b = h => btoa(h.split(':').map(x => String.fromCharCode(parseInt(x, 16))).join(''));
  const b2hex = b => [...atob(b)].map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join(':');

  /* ---- the short codes ---- */
  function pack(sdp, extra){
    const g = re => (sdp.match(re) || [])[1] || '';
    const c = [...sdp.matchAll(/a=candidate:\S+ \d+ udp \d+ (\S+) (\d+) typ (host|srflx)/gi)].map(m => [m[1], +m[2]]);
    return Object.assign({u:g(/a=ice-ufrag:(\S+)/), p:g(/a=ice-pwd:(\S+)/), f:hex2b(g(/a=fingerprint:sha-256 (\S+)/)), c}, extra);
  }
  function unpack(o, type){
    const L = ['v=0', `o=- ${Date.now()} 2 IN IP4 127.0.0.1`, 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=msid-semantic: WMS',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0'];
    o.c.forEach(([ip, port], i) => L.push(`a=candidate:${i + 1} 1 udp ${2122260223 - i} ${ip} ${port} typ host generation 0`));
    L.push(`a=ice-ufrag:${o.u}`, `a=ice-pwd:${o.p}`, `a=fingerprint:sha-256 ${b2hex(o.f)}`, `a=setup:${type === 'offer' ? 'actpass' : 'active'}`,
      'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144');
    return {type, sdp: L.join('\r\n') + '\r\n'};
  }
  const encode = o => 'TTG1' + b64u(JSON.stringify(o));
  function decode(text, kind){
    let s = String(text || '').trim(); const h = s.indexOf('#wifi='); if (h >= 0) s = s.slice(h + 6);
    s = s.replace(/\s+/g, ''); if (!s.startsWith('TTG1')) throw new Error('That is not a Trygalle Run wifi code.');
    const o = JSON.parse(unb64u(s.slice(4))); if (o.k !== kind) throw new Error(kind === 'o' ? 'That is a player\'s code. Scan the host\'s code here.' : 'That is the host\'s code. Scan the player\'s code here.');
    return o;
  }
  const linkFor = code => `${location.origin}${location.pathname}#wifi=${code}`;
  /* no ICE servers at all: on one wifi the local addresses are enough, and offline there is nothing else to reach */
  const newPC = () => new RTCPeerConnection({iceServers:[]});
  const gathered = pc => new Promise(res => { if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, 3000); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); });
  const deliver = (t, m) => { if (t.onmessage) t.onmessage({data: JSON.stringify(m)}); };

  /* ---- the host: one peer connection per player; the host's page plays the relay ---- */
  function hostTransport(name){
    const me = rid(), peers = new Map(); // id -> {pc, dc, name}
    const t = {readyState:1, me, name, peers, onmessage:null, onclose:null, onerror:null,
      send(str){ let m; try { m = JSON.parse(str); } catch (e) { return; } m.from = me; const out = JSON.stringify(m);
        peers.forEach((p, id) => { if (p.dc && p.dc.readyState === 'open' && (!m.to || m.to === id)) try { p.dc.send(out); } catch (e) {} }); },
      close(){ if (t.readyState === 3) return; t.readyState = 3; peers.forEach(p => { try { p.pc.close(); } catch (e) {} }); peers.clear(); setTimeout(() => t.onclose && t.onclose(), 0); }};
    setTimeout(() => deliver(t, {t:'hello', you:me, peers:[]}), 0);
    return t;
  }
  async function makeOffer(t){
    const id = rid(), pc = newPC(), dc = pc.createDataChannel('ttg', {ordered:true});
    const p = {pc, dc, name:'', id}; t.peers.set(id, p);
    dc.onopen = () => { if (t.readyState !== 1) return; deliver(t, {t:'join', id, name:p.name || 'Shareholder'}); st.pending = null; st.offer = ''; st.status = `${p.name || 'A player'} is in.`; MP.render(); };
    dc.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (err) { return; } m.from = id; deliver(t, m); };
    let gone = false; const drop = () => { if (gone) return; gone = true; const was = dc.readyState; t.peers.delete(id); if (p.joined !== false && t.readyState === 1 && p.opened) deliver(t, {t:'leave', id}); };
    dc.addEventListener('open', () => { p.opened = true; });
    dc.onclose = drop; pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { if (pc.connectionState !== 'disconnected') drop(); } };
    await pc.setLocalDescription(await pc.createOffer()); await gathered(pc);
    return {id, code: encode(pack(pc.localDescription.sdp, {k:'o', i:id, h:t.name}))};
  }
  async function takeAnswer(t, text){
    const o = decode(text, 'a'), p = t.peers.get(o.i); if (!p) throw new Error('That code answers an older host code. Make a new one.');
    p.name = String(o.n || 'Shareholder').slice(0, 18); await p.pc.setRemoteDescription(unpack(o, 'answer'));
  }

  /* ---- a player: answer the host's offer; once the channel opens it behaves like the relay ---- */
  async function makeAnswer(text, name){
    const o = decode(text, 'o'), pc = newPC();
    const t = {readyState:0, onmessage:null, onclose:null, onerror:null, send(str){ if (t.dc && t.dc.readyState === 'open') try { t.dc.send(str); } catch (e) {} },
      close(){ if (t.readyState === 3) return; t.readyState = 3; try { pc.close(); } catch (e) {} setTimeout(() => t.onclose && t.onclose(), 0); }};
    pc.ondatachannel = e => { const dc = t.dc = e.channel;
      dc.onopen = () => { t.readyState = 1; st.mode = ''; st.answer = ''; st.status = ''; MP.connect('WIFI', name, false, false, t);
        setTimeout(() => deliver(t, {t:'hello', you:o.i, peers:[{id:'host', name:o.h || 'the host'}]}), 0); };
      dc.onmessage = ev => { if (t.readyState === 1 && t.onmessage) t.onmessage({data: ev.data}); };
      dc.onclose = () => t.close(); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { st.status = 'The two devices could not reach each other. Check you are on the same wifi, then try a new code.'; MP.render(); t.close(); } };
    await pc.setRemoteDescription(unpack(o, 'offer')); await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc);
    st.guest = t; return {host:o.h, code: encode(pack(pc.localDescription.sdp, {k:'a', i:o.i, n:name}))};
  }

  /* ---- QR codes: draw and read ---- */
  const loaded = {};
  const load = src => loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error('Could not load ' + src)); }; document.head.appendChild(s); }));
  async function qrSVG(text){ await load('vendor/qrcode.js'); const q = qrcode(0, 'L'); q.addData(text); q.make(); return q.createSvgTag({cellSize:4, margin:3, scalable:true}); }
  let scanStop = null;
  async function scan(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('This browser cannot use the camera here. Paste the code instead.');
    const bd = ('BarcodeDetector' in window) ? await BarcodeDetector.getSupportedFormats().then(f => f.includes('qr_code') ? new BarcodeDetector({formats:['qr_code']}) : null).catch(() => null) : null;
    if (!bd) await load('vendor/jsQR.js');
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
    const ov = document.createElement('div'); ov.className = 'lbscan';
    ov.innerHTML = `<video playsinline muted></video><p>Point the camera at the code</p><button class="btn" type="button">Cancel</button>`;
    document.body.appendChild(ov); const v = ov.querySelector('video'); v.srcObject = stream; await v.play().catch(() => {});
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', {willReadFrequently:true});
    return new Promise((res, rej) => {
      let done = false; const end = (val, err) => { if (done) return; done = true; scanStop = null; stream.getTracks().forEach(k => k.stop()); ov.remove(); err ? rej(err) : res(val); };
      scanStop = () => end(null, new Error('cancelled')); ov.querySelector('button').onclick = scanStop;
      const tick = async () => { if (done) return;
        try { if (v.readyState >= 2 && v.videoWidth) {
          if (bd) { const r = await bd.detect(v); if (r[0] && r[0].rawValue) return end(r[0].rawValue); }
          else { const w = Math.min(720, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth); cv.width = w; cv.height = h; cx.drawImage(v, 0, 0, w, h);
            const r = jsQR(cx.getImageData(0, 0, w, h).data, w, h, {inversionAttempts:'dontInvert'}); if (r && r.data) return end(r.data); } } } catch (e) {}
        setTimeout(tick, 120); };
      tick();
    });
  }

  /* ---- the screens: added to the Play together lobby ---- */
  const say = (m, err) => { st.status = m; st.err = !!err; MP.render(); };
  const why = e => (e && e.message) || 'Something went wrong. Try again.';
  const codeBox = (code, label) => `<div class="lbqr" data-code="${esc(code)}"><div class="qr" aria-label="${esc(label)}"></div>
    <div class="lbrow"><input type="text" readonly value="${esc(code)}" aria-label="${esc(label)} as text"><button class="btn" type="button" data-copy>Copy</button></div></div>`;
  const pasteRow = (id, what) => `<div class="field"><label for="${id}">${what}</label><div class="lbrow"><button class="btn primary" type="button" id="${id}Scan">Scan it</button><input type="text" id="${id}" placeholder="or paste it here" autocomplete="off" spellcheck="false"><button class="btn" type="button" id="${id}Go">Use</button></div></div>`;
  function wire(el){
    el.querySelectorAll('.lbqr').forEach(b => { const code = b.dataset.code; qrSVG(linkFor(code)).then(svg => { b.querySelector('.qr').innerHTML = svg; }).catch(() => { b.querySelector('.qr').textContent = 'The QR picture could not be drawn. Use the text code.'; });
      b.querySelector('[data-copy]').onclick = () => { const i = b.querySelector('input'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).catch(() => { try { document.execCommand('copy'); } catch (e) {} }); }; });
  }
  const nm = () => { const i = $('#lbName'); return ((i && i.value) || MP.st.name || '').trim().slice(0, 18) || 'Shareholder'; };
  function decorate(el, connected){
    const S_ = MP.st;
    if (!connected) {
      if (st.mode === 'join') {
        el.innerHTML = `<div class="rh">Join on this wifi</div>
          ${st.answer ? `<p class="txt">Now show this to ${esc(st.hostName || 'the host')}. They scan it (or paste it) under Add a player.</p>${codeBox(st.answer, 'Your answer code')}<p class="fine">Waiting for the host…</p>`
            : `<p class="txt">On the host's screen, under Add a player, there is a QR code. Scan it here, or with your phone's camera app.</p>${pasteRow('wfOffer', 'The host\'s code')}`}
          <p class="fine lbmsg${st.err ? ' bad' : ''}" role="status">${esc(st.status || '')}</p>
          <div class="lbrow"><button class="btn" type="button" id="wfBack">Back</button></div>`;
        $('#wfBack').onclick = () => { reset(); MP.render(); };
        if (!st.answer) { const use = v => { if (!v) return; say('Making your answer…'); makeAnswer(v, st.name || nm()).then(r => { st.answer = r.code; st.hostName = r.host; say(''); }).catch(e => say(why(e), true)); };
          $('#wfOfferGo').onclick = () => use($('#wfOffer').value); $('#wfOffer').onkeydown = e => { if (e.key === 'Enter') use($('#wfOffer').value); };
          $('#wfOfferScan').onclick = () => scan().then(use).catch(e => { if (e.message !== 'cancelled') say(why(e), true); }); }
        wire(el); return;
      }
      const box = document.createElement('div'); box.className = 'lbwifi';
      box.innerHTML = `<div class="rh">No internet? Play on one wifi</div>
        <p class="fine">Phones and computers on the same wifi can play with no internet. Everyone needs to have opened the game once before, and the host and each player swap a QR code, so the host needs a camera (a phone, or a computer with a webcam), or a way to paste.</p>
        <div class="lbrow"><button class="btn" type="button" id="wfHost">Host on this wifi</button><button class="btn" type="button" id="wfJoin">Join on this wifi</button></div>`;
      el.appendChild(box);
      $('#wfHost').onclick = () => { try { AUDIO.play('click'); } catch (e) {} reset(); const n = nm(); MP.connect('WIFI', n, true, false, hostTransport(n)); };
      $('#wfJoin').onclick = () => { try { AUDIO.play('click'); } catch (e) {} reset(); st.mode = 'join'; st.name = nm(); MP.render(); };
      return;
    }
    if (!S_.local || !S_.host || !S_.open || !S_.ws) return;
    const box = document.createElement('div'); box.className = 'lbwifi';
    box.innerHTML = `<div class="rh">Add a player</div>` + (st.offer
      ? `<p class="txt">On their device: Play together, Join on this wifi, then scan this. Their phone's camera app works too.</p>${codeBox(st.offer, 'Host code')}${pasteRow('wfAns', 'Then scan or paste their answer')}`
      : `<p class="fine">One code per player. Make one, let them scan it, then scan the answer they show you.</p><div class="lbrow"><button class="btn" type="button" id="wfAdd">Make a code for a player</button></div>`)
      + `<p class="fine lbmsg${st.err ? ' bad' : ''}" role="status">${esc(st.status || '')}</p>`;
    const lv = el.querySelector('#lbLeave'); el.insertBefore(box, lv ? lv.closest('.lbrow') : null);
    if (!st.offer) $('#wfAdd').onclick = () => { say('Making a code…'); makeOffer(S_.ws).then(r => { st.offer = r.code; st.pending = r.id; say(''); }).catch(e => say(why(e), true)); };
    else { const use = v => { if (!v) return; say('Connecting…'); takeAnswer(S_.ws, v).then(() => say('Connecting… this takes a few seconds.')).catch(e => say(why(e), true)); };
      $('#wfAnsGo').onclick = () => use($('#wfAns').value); $('#wfAns').onkeydown = e => { if (e.key === 'Enter') use($('#wfAns').value); };
      $('#wfAnsScan').onclick = () => scan().then(use).catch(e => { if (e.message !== 'cancelled') say(why(e), true); }); }
    wire(el);
  }
  function reset(){ if (scanStop) scanStop(); if (st.guest && st.guest.readyState !== 1) try { st.guest.close(); } catch (e) {} Object.assign(st, {mode:'', offer:'', answer:'', status:'', err:false, pending:null, guest:null}); }

  /* opened from the host's QR with the phone's own camera app: straight to the answer */
  function fromLink(){ const h = location.hash; if (!h.startsWith('#wifi=')) return false; const code = h.slice(6);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    reset(); st.mode = 'join'; S = null; MP.showLobby(); st.name = MP.st.name || (localStorage.getItem('ttg-name') || '') || 'Shareholder';
    say('Making your answer…'); makeAnswer(code, st.name).then(r => { st.answer = r.code; st.hostName = r.host; say(''); }).catch(e => say(why(e), true)); return true; }

  return {decorate, reset, fromLink, makeOffer, takeAnswer, makeAnswer, hostTransport, encode, decode, st};
})();

/* a QR scanned with the camera app opens the game at #wifi=…: once the title is up, go straight to joining */
{ const _showTitle = showTitle; let tried = false; showTitle = function(){ const r = _showTitle.apply(this, arguments);
  if (!tried && location.hash.startsWith('#wifi=')) { tried = true; setTimeout(() => { try { WIFI.fromLink(); } catch (e) { console.warn('wifi link', e); } }, 0); }
  return r; }; }

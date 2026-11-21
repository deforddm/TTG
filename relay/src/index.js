/* Trygalle Run relay (Cloudflare Worker + Durable Object).
   GET /room/CODE with Upgrade: websocket joins room CODE (4 to 8 letters or digits). On joining, the room sends
   {t:'hello', you, peers:[{id,name}]} and tells everyone else {t:'join', id, name}. Every JSON message a player sends is
   passed to the others with {from} added; a message with {to} goes to that player only. Leaving sends {t:'leave', id}.
   The room keeps no game state, so it costs nothing while nobody is connected (WebSocket hibernation). */
const MAX_PEERS = 8, MAX_MSG = 64 * 1024;
const ALLOWED = [/^https:\/\/([a-z0-9-]+\.)*playfromtheranks\.com$/, /^https:\/\/([a-z0-9-]+\.)*fromtherank\.com$/, /^https:\/\/([a-z0-9-]+\.)*pages\.dev$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];

export class Room {
  constructor(state) { this.state = state; }
  async fetch(req) {
    const url = new URL(req.url), live = this.state.getWebSockets();
    if (live.length >= MAX_PEERS) return new Response('This room is full.', { status: 429 });
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    const me = { id: crypto.randomUUID().slice(0, 8), name: (url.searchParams.get('name') || 'Shareholder').slice(0, 18) };
    this.state.acceptWebSocket(server); server.serializeAttachment(me);
    server.send(JSON.stringify({ t: 'hello', you: me.id, peers: live.map(w => w.deserializeAttachment()) }));
    this.send(server, { t: 'join', id: me.id, name: me.name });
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MAX_MSG) return;
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    m.from = ws.deserializeAttachment().id;
    this.send(ws, m, m.to);
  }
  webSocketClose(ws) { const me = ws.deserializeAttachment(); if (me && !me.gone) { me.gone = 1; ws.serializeAttachment(me); this.send(ws, { t: 'leave', id: me.id }); } try { ws.close(); } catch (e) {} }
  webSocketError(ws) { this.webSocketClose(ws); }
  send(except, m, to) {
    const out = JSON.stringify(m);
    for (const w of this.state.getWebSockets()) { if (w === except) continue; if (to && w.deserializeAttachment().id !== to) continue; try { w.send(out); } catch (e) {} }
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), m = url.pathname.match(/^\/room\/([A-Za-z0-9]{4,8})$/);
    if (!m) return new Response('Trygalle Run relay. Rooms live at /room/CODE.', { headers: { 'content-type': 'text/plain' } });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket.', { status: 426 });
    const origin = req.headers.get('Origin') || '';
    if (origin && !ALLOWED.some(r => r.test(origin))) return new Response('Not from the game.', { status: 403 });
    return env.ROOMS.get(env.ROOMS.idFromName(m[1].toUpperCase())).fetch(req);
  },
};

# Trygalle Run

A non-commercial fan game about the Trygalle Trade Guild, the shareholders who drive carriages through warrens to deliver cargo anywhere.
Squad tactics in real time with pause, played in the browser on desktop or phone.

Built on the engine of *From the Ranks* (deforddm/from-the-ranks), with its ten books removed.

## Build

    python3 build.py      # concatenates src/ into index.html

Open `index.html` in a browser.

## Credits

The world of Malaz, the Trygalle Trade Guild and its names belong to Steven Erikson and Ian C. Esslemont.
This is an unofficial fan creation, made for no profit.

## Playing together

`relay/` is a small Cloudflare Worker (a Durable Object per room code) that passes messages between players.
The host's browser runs the fight; the others send orders and draw what the host sends. Deploy it from the
Cloudflare dashboard (Workers, import this repo, root directory `relay`) and give it the custom domain
`relay.playfromtheranks.com`. For a different relay, open the game once with `?relay=wss://your-relay`.

To test locally: `npx wrangler dev --port 8787` in `relay/`, then serve the repo root on localhost.

### On one wifi with no internet

Play together also has **Host on this wifi** and **Join on this wifi**. The browsers connect to each other directly (WebRTC data
channels, no ICE servers), and the host's page does the relay's job. Browsers cannot find each other unaided, so the host and
each player swap one code: the host's QR (a link that opens the game, so a phone's camera app works) and the player's answer
QR. Codes can also be copied and pasted. Everyone must have opened the game once so the service worker has it cached.
`src/045_ttg_wifi.js`; QR drawing `vendor/qrcode.js` (Kazuhiko Arase, MIT), QR reading `vendor/jsQR.js` (Cosmo Wolfe, Apache-2.0).


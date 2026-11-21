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

# whois-proxy

A tiny Cloudflare Worker that proxies WHOIS lookups to
[WhoisJSON](https://whoisjson.com/documentation), keeping the API key
server-side instead of shipping it in the static site's client-side JS.

The site's WHOIS app calls `GET <this worker's URL>/?domain=example.com`
with no key attached; the worker attaches the key (from a Cloudflare
secret, never committed) and forwards the request to WhoisJSON.

## One-time setup

```bash
cd cloudflare-worker/whois-proxy
npx wrangler login          # opens a browser to log into your (free) Cloudflare account
npx wrangler secret put WHOIS_API_KEY
# paste your WhoisJSON API key when prompted — it is stored encrypted on
# Cloudflare and is never written to any file in this repo
npx wrangler deploy
```

`wrangler deploy` prints the worker's URL, something like:

```
https://whois-proxy.<your-subdomain>.workers.dev
```

Copy that URL — you'll need it for the site side (see below).

## Wiring it into the site

Open `quartz/components/frames/DefaultFrame.tsx` and set:

```ts
const WHOIS_PROXY_URL = "https://whois-proxy.<your-subdomain>.workers.dev"
```

(There's a `// TODO: set after `wrangler deploy`` marker on that line —
search for `WHOIS_PROXY_URL`.)

## Local testing

```bash
npx wrangler dev
```

This runs the worker locally (defaults to `http://localhost:8787`). Point
`WHOIS_PROXY_URL` at that during development, and add
`"http://localhost:8123"` (or whatever port you serve Quartz on) to
`ALLOWED_ORIGINS` in `wrangler.toml` so the browser's CORS check passes.

## Updating allowed origins

`ALLOWED_ORIGINS` in `wrangler.toml` is a comma-separated allowlist of
origins permitted to call this worker from browser JS. It already includes
the site's custom domain and its GitHub Pages fallback. Redeploy
(`npx wrangler deploy`) after changing it.

## Rotating the key

If the key ever leaks (e.g. pasted somewhere public), rotate it in your
WhoisJSON dashboard and update it here with the same `secret put` command
— nothing else needs to change.

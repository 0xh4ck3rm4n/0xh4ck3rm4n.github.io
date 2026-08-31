/**
 * WHOIS lookup proxy for ecst4sy.is-a.dev
 *
 * Keeps the WhoisJSON API key server-side (as a Cloudflare secret) instead
 * of shipping it in the static site's client-side JS. The site calls this
 * worker with a domain name; this worker calls WhoisJSON with the key
 * attached and forwards the JSON response back.
 *
 * Set the key with:  wrangler secret put WHOIS_API_KEY
 * Never put the key in wrangler.toml or commit it anywhere.
 */

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const origin = request.headers.get("Origin") || ""
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "null"
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, cors)
    }

    const url = new URL(request.url)
    const domain = (url.searchParams.get("domain") || "").trim().toLowerCase()

    if (!domain) {
      return json({ error: "Missing 'domain' query parameter" }, 400, cors)
    }
    if (!DOMAIN_PATTERN.test(domain)) {
      return json({ error: "Invalid domain format" }, 400, cors)
    }
    if (!env.WHOIS_API_KEY) {
      return json({ error: "Server misconfigured: missing API key" }, 500, cors)
    }

    let upstream
    try {
      upstream = await fetch(
        `https://whoisjson.com/api/v1/whois?domain=${encodeURIComponent(domain)}`,
        { headers: { Authorization: `TOKEN=${env.WHOIS_API_KEY}` } },
      )
    } catch {
      return json({ error: "Upstream WHOIS request failed" }, 502, cors)
    }

    const bodyText = await upstream.text()
    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...cors },
    })
  },
}

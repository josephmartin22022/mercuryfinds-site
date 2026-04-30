/**
 * Mercury Finds — Beehiiv Subscribe Worker
 * Receives POST /api/subscribe from mercuryfinds.com newsletter form
 * Forwards subscription to Beehiiv API with reactivation enabled
 *
 * Required Cloudflare Worker secrets (set in dashboard):
 *   BEEHIIV_API_KEY        — from Beehiiv Settings → Integrations → API
 *   BEEHIIV_PUBLICATION_ID — pub_f5efa9d3-a7cd-40c8-88b9-280cc6d41671
 *
 * Routes:
 *   POST /api/subscribe   — main endpoint
 *   GET  /api/subscribe   — health check ("Mercury subscribe worker OK")
 *
 * Author: Joseph Martin / Mercury Finds
 * Created: 2026-04-30
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://mercuryfinds.com",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check
    if (request.method === "GET" && url.pathname === "/api/subscribe") {
      return jsonResponse({
        status: "ok",
        service: "mercury-subscribe-worker",
        ts: new Date().toISOString(),
      });
    }

    // Main subscribe endpoint
    if (request.method === "POST" && url.pathname === "/api/subscribe") {
      // Parse body
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "invalid JSON" }, 400);
      }

      const email = (body.email || "").trim().toLowerCase();
      const source = (body.source || "homepage").trim();

      if (!isValidEmail(email)) {
        return jsonResponse({ error: "invalid email" }, 400);
      }

      // Confirm secrets are configured
      if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
        return jsonResponse({ error: "worker not configured" }, 500);
      }

      // Call Beehiiv API
      // Docs: https://developers.beehiiv.com/api-reference/subscriptions/post
      const beehiivUrl = `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`;

      let beehiivResponse;
      try {
        beehiivResponse = await fetch(beehiivUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.BEEHIIV_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            utm_source: "mercuryfinds.com",
            utm_medium: "newsletter_form",
            utm_campaign: source,
            referring_site: "mercuryfinds.com",
          }),
        });
      } catch (e) {
        return jsonResponse({ error: "beehiiv unreachable", detail: String(e) }, 502);
      }

      const beehiivBody = await beehiivResponse.text();
      let parsedBody = {};
      try { parsedBody = JSON.parse(beehiivBody); } catch (e) { /* leave as text */ }

      if (beehiivResponse.status >= 200 && beehiivResponse.status < 300) {
        return jsonResponse({
          status: "subscribed",
          email: email,
          source: source,
          beehiiv_status: parsedBody?.data?.status || "unknown",
        }, 200);
      }

      // Beehiiv returned an error
      return jsonResponse({
        error: "beehiiv error",
        beehiiv_status: beehiivResponse.status,
        beehiiv_body: parsedBody || beehiivBody,
      }, beehiivResponse.status);
    }

    // Fallthrough — not a route we handle
    return jsonResponse({ error: "not found" }, 404);
  },
};

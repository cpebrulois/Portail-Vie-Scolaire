/**
 * worker.js — Point d'entrée Cloudflare Worker (modèle « Workers + Assets »).
 *
 * Les fichiers statiques du site sont servis automatiquement via le binding
 * ASSETS (voir wrangler.jsonc). Ce Worker ne reçoit que les chemins qui NE
 * correspondent à aucun fichier — en pratique, l'API. Il gère /api/agora
 * (proxy Mistral) et laisse tout le reste aux assets.
 *
 * La clé Mistral (secret MISTRAL_API_KEY) reste côté serveur : elle ne transite
 * JAMAIS par le navigateur.
 *
 * Garde-fous (un proxy ouvert reste abusable même sans la clé) :
 *  - contrôle d'origine (par défaut : seul le site lui-même peut appeler) ;
 *  - limite de débit par IP (15/min) via un binding KV « RL » optionnel ;
 *  - modèle sur liste blanche + plafonds tokens/historique.
 */

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const ALLOWED_MODELS = new Set(["mistral-small-latest", "mistral-large-latest"]);
const MAX_TOKENS_CAP = 1000;
const MAX_MESSAGES = 20;
const RATE = { windowSec: 60, max: 15 };

function corsHeaders(origin, allowed) {
  const h = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (allowed && origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  let oHost;
  try { oHost = new URL(origin).host; } catch { return false; }
  try { if (new URL(request.url).host === oHost) return true; } catch { /* ignore */ }
  const list = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  return list.some(a => {
    try { return new URL(a).host === oHost; } catch { return a === oHost; }
  });
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

async function handleAgora(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = originAllowed(request, env);
  const cors = corsHeaders(origin, allowed);

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Méthode non autorisée." }, 405, cors);

  if (!allowed) return json({ error: "Origine non autorisée." }, 403, cors);
  if (!env.MISTRAL_API_KEY) return json({ error: "Clé serveur absente (MISTRAL_API_KEY non configurée)." }, 500, cors);

  // Limite de débit par IP — active seulement si le binding KV « RL » existe.
  if (env.RL) {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const bucket = Math.floor(Date.now() / 1000 / RATE.windowSec);
    const key = `rl:${ip}:${bucket}`;
    try {
      const n = parseInt((await env.RL.get(key)) || "0", 10) + 1;
      await env.RL.put(key, String(n), { expirationTtl: RATE.windowSec + 5 });
      if (n > RATE.max) return json({ error: "Trop de requêtes. Réessaie dans une minute." }, 429, cors);
    } catch { /* KV indispo : on ne bloque pas l'utilisateur */ }
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "Corps JSON invalide." }, 400, cors); }

  const model = ALLOWED_MODELS.has(body && body.model) ? body.model : "mistral-small-latest";
  const messages = Array.isArray(body && body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (!messages.length) return json({ error: "Aucun message fourni." }, 400, cors);
  const temperature = Math.max(0, Math.min(1, Number(body.temperature ?? 0.2)));
  const max_tokens = Math.max(1, Math.min(MAX_TOKENS_CAP, Number(body.max_tokens ?? 900)));

  let upstream;
  try {
    upstream = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    });
  } catch {
    return json({ error: "Mistral injoignable." }, 502, cors);
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/agora") {
      return handleAgora(request, env);
    }
    // Filet de sécurité : si le routage envoie autre chose ici, on sert l'asset.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
};

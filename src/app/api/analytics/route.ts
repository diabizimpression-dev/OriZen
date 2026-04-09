// ─── Analytics anonymes — RGPD compliant ────────────────────────────────────
// Zéro cookie · Zéro fingerprinting · Zéro données personnelles
// On stocke uniquement : page, action, timestamp (arrondi à l'heure), compteur
//
// POST /api/analytics  { page, action?, scenario? }
// GET  /api/analytics  → stats (protégé par ANALYTICS_SECRET si défini)

import { NextRequest, NextResponse } from "next/server";

interface AnalyticsEvent {
  page: string;
  action?: string;
  scenario?: string;
  hour: string; // "2024-04-09T14" — arrondi à l'heure
  count: number;
}

// Stockage en mémoire (production → Vercel KV / Redis)
const events = new Map<string, AnalyticsEvent>();
let totalHits = 0;

const MAX_KEYS = 10000; // Limite mémoire

function getKey(page: string, action: string | undefined, scenario: string | undefined, hour: string): string {
  return `${page}|${action ?? ""}|${scenario ?? ""}|${hour}`;
}

function getCurrentHour(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString().slice(0, 13); // "2024-04-09T14"
}

// Nettoyage des vieilles entrées (> 7 jours)
function pruneOld() {
  if (events.size < MAX_KEYS) return;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 13);
  Array.from(events.entries()).forEach(([key, evt]) => {
    if (evt.hour < cutoffStr) events.delete(key);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const page = String(body.page ?? "/").slice(0, 100);
    const action = body.action ? String(body.action).slice(0, 50) : undefined;
    const scenario = body.scenario ? String(body.scenario).slice(0, 50) : undefined;

    // Bloquer les bots évidents
    const ua = req.headers.get("user-agent") ?? "";
    if (/bot|crawler|spider|curl|wget/i.test(ua)) {
      return NextResponse.json({ ok: true }); // Silencieux
    }

    pruneOld();

    const hour = getCurrentHour();
    const key = getKey(page, action, scenario, hour);

    const existing = events.get(key);
    if (existing) {
      existing.count++;
    } else {
      events.set(key, { page, action, scenario, hour, count: 1 });
    }
    totalHits++;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  // Protection optionnelle par secret
  const secret = process.env.ANALYTICS_SECRET;
  if (secret) {
    const token = req.nextUrl.searchParams.get("token");
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Agréger par page
  const pageStats = new Map<string, number>();
  const actionStats = new Map<string, number>();
  const scenarioStats = new Map<string, number>();

  Array.from(events.values()).forEach((evt) => {
    pageStats.set(evt.page, (pageStats.get(evt.page) ?? 0) + evt.count);
    if (evt.action) actionStats.set(evt.action, (actionStats.get(evt.action) ?? 0) + evt.count);
    if (evt.scenario) scenarioStats.set(evt.scenario, (scenarioStats.get(evt.scenario) ?? 0) + evt.count);
  });

  const sortDesc = (m: Map<string, number>) =>
    Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);

  return NextResponse.json({
    ok: true,
    total_hits: totalHits,
    unique_keys: events.size,
    pages: Object.fromEntries(sortDesc(pageStats)),
    actions: Object.fromEntries(sortDesc(actionStats)),
    scenarios: Object.fromEntries(sortDesc(scenarioStats)),
    note: "Données anonymes, aucune donnée personnelle collectée (RGPD).",
  });
}

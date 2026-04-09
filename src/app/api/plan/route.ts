// ─── API Plan partageable ────────────────────────────────────────────────────
// POST /api/plan  → { id }   (stocke un plan en mémoire, 24h TTL)
// GET  /api/plan?id=xxx → plan JSON complet
//
// Note : mémoire vive uniquement. En production → Redis/Postgres.

import { NextRequest, NextResponse } from "next/server";

interface PlanData {
  scenario: string;
  title: string;
  steps: string[];
  contacts: string[];
  structures?: Array<{ name: string; addr: string; phone?: string; lat?: number; lng?: number }>;
  createdAt: number; // timestamp ms
}

const plans = new Map<string, PlanData>();

// Nettoyage TTL 24h
function purgeOld() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, plan] of plans) {
    if (plan.createdAt < cutoff) plans.delete(id);
  }
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<PlanData> = await req.json();

    if (!body.scenario || !body.title || !body.steps) {
      return NextResponse.json({ error: "Champs manquants : scenario, title, steps" }, { status: 400 });
    }

    purgeOld();

    const id = generateId();
    plans.set(id, {
      scenario: body.scenario,
      title: body.title,
      steps: body.steps,
      contacts: body.contacts ?? [],
      structures: body.structures ?? [],
      createdAt: Date.now(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orizen.vercel.app";
    return NextResponse.json({ id, url: `${baseUrl}/plan/${id}` });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  purgeOld();
  const plan = plans.get(id);
  if (!plan) {
    return NextResponse.json({ error: "Plan introuvable ou expiré (24h)" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, plan });
}

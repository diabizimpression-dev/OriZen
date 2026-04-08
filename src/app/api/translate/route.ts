import { NextResponse } from "next/server";

// =====================================================
// MYMEMORY API — Traduction automatique fr/ar/en/es
// Source : mymemory.translated.net (gratuit, sans clé)
// 500 chars/req sans email · 1000 chars/req avec MYMEMORY_EMAIL
// Doc : https://mymemory.translated.net/doc/spec.php
// =====================================================

const SUPPORTED_LANGS = ["fr", "en", "ar", "es"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

// Cache en mémoire pour éviter de retraduire les mêmes chaînes
const translationCache = new Map<string, string>();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text: string   = body.text ?? "";
  const from: Lang     = body.from ?? "fr";
  const to: Lang       = body.to ?? "en";

  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Texte vide" }, { status: 400 });
  }

  if (!SUPPORTED_LANGS.includes(to) || !SUPPORTED_LANGS.includes(from)) {
    return NextResponse.json({ ok: false, error: "Langue non supportée" }, { status: 400 });
  }

  if (from === to) {
    return NextResponse.json({ ok: true, translated: text, from, to, cached: true });
  }

  // Cache key
  const cacheKey = `${from}|${to}|${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return NextResponse.json({
      ok: true,
      translated: translationCache.get(cacheKey),
      from,
      to,
      cached: true,
    });
  }

  try {
    const email = process.env.MYMEMORY_EMAIL ?? "";
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text.slice(0, 500)); // 500 chars max sans email
    url.searchParams.set("langpair", `${from}|${to}`);
    if (email) url.searchParams.set("de", email);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 }, // Cache 24h
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `MyMemory HTTP ${res.status}` });
    }

    const data = await res.json();
    const translated: string = data.responseData?.translatedText ?? text;

    // Mettre en cache (max 1000 entrées)
    if (translationCache.size > 1000) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(cacheKey, translated);

    return NextResponse.json({ ok: true, translated, from, to, cached: false });
  } catch (e) {
    // Fallback : retourner le texte original
    return NextResponse.json({ ok: true, translated: text, from, to, error: String(e) });
  }
}

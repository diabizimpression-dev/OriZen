import { NextResponse } from "next/server";

// =====================================================
// CONTEXT API — Données temps réel pour la homepage
// Agrège : Open-Meteo (météo) + BAN (géocodage FR)
// Toutes ces APIs sont gratuites, sans clé API
// =====================================================

interface WeatherResponse {
  current: {
    temperature_2m: number;
    weathercode: number;
    windspeed_10m?: number;
    apparent_temperature?: number;
  };
}

interface BanFeature {
  properties: {
    city?: string;
    municipality?: string;
    postcode?: string;
    context?: string; // "75, Paris, Île-de-France"
    label?: string;
    name?: string;
  };
}

interface BanResponse {
  features?: BanFeature[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "48.8566");
  const lng = parseFloat(searchParams.get("lng") || "2.3522");

  // Appels parallèles : Open-Meteo + BAN + Vigilance Météo-France
  const [weatherRes, banRes, vigilanceRes] = await Promise.allSettled([
    // Open-Meteo — météo gratuite, sans clé, précision horaire
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,apparent_temperature&timezone=Europe%2FParis&forecast_days=1`,
      { next: { revalidate: 1800 } } // Cache 30 min
    ),
    // BAN — API officielle du gouvernement français, géocodage inverse
    fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}&limit=1`,
      { next: { revalidate: 86400 } } // Cache 24h (la localisation ne change pas souvent)
    ),
    // Vigilance Météo-France — alertes officielles par département
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/vigilance?lat=${lat}&lng=${lng}`,
      { next: { revalidate: 1800 } }
    ),
  ]);

  // --- Météo ---
  let weather: {
    temperature: number;
    apparent_temperature: number | null;
    weathercode: number;
    windspeed: number | null;
    alert: "grand_froid" | "canicule" | "neige" | "vent" | null;
  } | null = null;

  if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
    try {
      const data: WeatherResponse = await weatherRes.value.json();
      const temp = Math.round(data.current.temperature_2m);
      const apparent = data.current.apparent_temperature != null
        ? Math.round(data.current.apparent_temperature)
        : null;
      const code = data.current.weathercode;
      const wind = data.current.windspeed_10m
        ? Math.round(data.current.windspeed_10m)
        : null;

      // Détection alerte Plan gouvernemental
      let alert: "grand_froid" | "canicule" | "neige" | "vent" | null = null;
      if (temp <= 0 || (apparent != null && apparent <= -2)) alert = "grand_froid";
      else if (temp < 5) alert = "grand_froid";
      else if (temp >= 35) alert = "canicule";
      else if (code >= 71 && code <= 77) alert = "neige";
      else if (wind != null && wind >= 80) alert = "vent";

      weather = { temperature: temp, apparent_temperature: apparent, weathercode: code, windspeed: wind, alert };
    } catch {
      // Silently fail — météo non critique
    }
  }

  // --- Localisation (BAN) ---
  let location: {
    commune: string;
    postcode: string;
    context: string;
    departement: string;
    region: string;
  } | null = null;

  if (banRes.status === "fulfilled" && banRes.value.ok) {
    try {
      const data: BanResponse = await banRes.value.json();
      if (data.features?.length) {
        const props = data.features[0].properties;
        const context = props.context || ""; // "75, Paris, Île-de-France"
        const parts = context.split(",").map((s) => s.trim());
        location = {
          commune: props.city || props.municipality || props.name || "",
          postcode: props.postcode || parts[0] || "",
          context,
          departement: parts[1] || "",
          region: parts[2] || "",
        };
      }
    } catch {
      // Silently fail
    }
  }

  // --- Vigilance officielle ---
  let vigilance: { maxLevel: number; maxLevelLabel: string; alerts: unknown[]; source: string } | null = null;
  if (vigilanceRes.status === "fulfilled" && vigilanceRes.value.ok) {
    try {
      const data = await vigilanceRes.value.json();
      if (data.ok && data.alerts != null) {
        vigilance = {
          maxLevel: data.maxLevel,
          maxLevelLabel: data.maxLevelLabel,
          alerts: data.alerts,
          source: data.source,
        };
      }
    } catch {
      // Silently fail
    }
  }

  // Si vigilance indique grand froid ou canicule, ça prime sur la détection Open-Meteo
  if (vigilance && vigilance.alerts.length > 0 && weather) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasGrandFroid = (vigilance.alerts as any[]).some(
      (a) => typeof a === "object" && a !== null && "phenomenon" in a && String((a as {phenomenon: string}).phenomenon).toLowerCase().includes("froid")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasCanicule = (vigilance.alerts as any[]).some(
      (a) => typeof a === "object" && a !== null && "phenomenon" in a && String((a as {phenomenon: string}).phenomenon).toLowerCase().includes("canicule")
    );
    if (hasGrandFroid && weather.alert == null) weather.alert = "grand_froid";
    if (hasCanicule && weather.alert == null) weather.alert = "canicule";
  }

  return NextResponse.json({
    ok: true,
    weather,
    location,
    vigilance,
    sources: {
      weather: weatherRes.status === "fulfilled" ? "open-meteo" : null,
      location: banRes.status === "fulfilled" ? "ban-gouv" : null,
      vigilance: vigilance?.source ?? null,
    },
  });
}

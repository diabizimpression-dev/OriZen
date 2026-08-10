import { NextResponse } from "next/server";

// =====================================================
// NAVITIA API — Itinéraire multimodal (SNCF / RATP / TER…)
// Couvre toute la France : bus, métro, tram, train, marche
// Inscription gratuite : https://navitia.io/inscription/
// Env var : NAVITIA_API_KEY
// Doc : https://doc.navitia.io/#journey-schedules
// =====================================================

interface NavitiaSection {
  type: string;
  duration: number;
  display_informations?: {
    label?: string;
    commercial_mode?: string;
    network?: string;
    direction?: string;
  };
  from?: { name?: string };
  to?: { name?: string };
}

interface NavitiaJourney {
  duration: number;
  nb_transfers: number;
  sections: NavitiaSection[];
  departure_date_time: string;
  arrival_date_time: string;
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h${m % 60 > 0 ? String(m % 60).padStart(2, "0") : ""}`;
}

function summarizeJourney(journey: NavitiaJourney) {
  const walking = journey.sections
    .filter((s) => s.type === "street_network" || s.type === "walking")
    .reduce((sum, s) => sum + s.duration, 0);

  const transit = journey.sections
    .filter((s) => s.type === "public_transport")
    .map((s) => ({
      mode: s.display_informations?.commercial_mode ?? "Transport",
      line: s.display_informations?.label ?? "",
      direction: s.display_informations?.direction ?? "",
      network: s.display_informations?.network ?? "",
      duration: s.duration,
    }));

  return {
    total: formatDuration(journey.duration),
    walking: walking > 0 ? formatDuration(walking) : null,
    transfers: journey.nb_transfers,
    transit,
    departureTime: journey.departure_date_time,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromLat = searchParams.get("from_lat");
  const fromLng = searchParams.get("from_lng");
  const toLat   = searchParams.get("to_lat");
  const toLng   = searchParams.get("to_lng");

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ ok: false, error: "Paramètres manquants (from_lat, from_lng, to_lat, to_lng)" }, { status: 400 });
  }

  const apiKey = process.env.NAVITIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, configured: false, journeys: [] });
  }

  try {
    // Format Navitia : "lon;lat" (attention : longitude en premier)
    const fromCoord = `${fromLng};${fromLat}`;
    const toCoord   = `${toLng};${toLat}`;

    // Datetime au format Navitia : YYYYMMDDTHHmmss
    const now = new Date();
    const datetime = now.toISOString().replace(/[-:]/g, "").slice(0, 15);

    const url = new URL("https://api.navitia.io/v1/journeys");
    url.searchParams.set("from", fromCoord);
    url.searchParams.set("to", toCoord);
    url.searchParams.set("datetime", datetime);
    url.searchParams.set("count", "2");              // 2 itinéraires max
    url.searchParams.set("max_duration", "5400");    // 1h30 max
    url.searchParams.set("min_nb_journeys", "1");
    url.searchParams.set("max_walking_duration_to_pt", "900"); // 15 min à pied max

    const res = await fetch(url.toString(), {
      headers: {
        // Navitia : Basic auth, API key en username, password vide
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Navitia HTTP ${res.status}`, journeys: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json();
    const journeys = (data.journeys ?? [])
      .slice(0, 2)
      .map((j: NavitiaJourney) => summarizeJourney(j));

    // Fallback : calcul à pied si aucun trajet trouvé
    if (journeys.length === 0) {
      const R = 6371000;
      const dLat = ((parseFloat(toLat) - parseFloat(fromLat)) * Math.PI) / 180;
      const dLng = ((parseFloat(toLng) - parseFloat(fromLng)) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((parseFloat(fromLat) * Math.PI) / 180) *
          Math.cos((parseFloat(toLat) * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const walkMin = Math.round(dist / 80); // ~80m/min
      journeys.push({
        total: `${walkMin} min`,
        walking: `${walkMin} min`,
        transfers: 0,
        transit: [],
        departureTime: null,
      });
    }

    return NextResponse.json({ ok: true, journeys });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), journeys: [] });
  }
}

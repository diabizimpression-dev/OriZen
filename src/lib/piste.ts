// OriZen — Gestionnaire de token OAuth PISTE
// PISTE = Plateforme d'Intermédiation des Services pour la Transformation de l'État
// Donne accès à Légifrance API + Judilibre API (toutes deux gratuites)
//
// Inscription gratuite : https://piste.gouv.fr/registration
// Env vars requises : PISTE_CLIENT_ID + PISTE_CLIENT_SECRET

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Cache module-level (survit entre requêtes dans le même process Next.js)
let cachedToken: CachedToken | null = null;

/**
 * Récupère un token OAuth PISTE valide.
 * Retourne null si les variables d'environnement ne sont pas configurées.
 * Met en cache le token jusqu'à 60s avant son expiration.
 */
export async function getPisteToken(): Promise<string | null> {
  const clientId = process.env.PISTE_CLIENT_ID;
  const clientSecret = process.env.PISTE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  // Token encore valide (buffer de 60s)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  try {
    const res = await fetch("https://oauth.piste.gouv.fr/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "openid",
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return cachedToken.token;
  } catch {
    return null;
  }
}

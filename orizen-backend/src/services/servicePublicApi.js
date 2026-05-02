import fetch from "node-fetch";

// Cache mémoire pour éviter le rate-limiting (DuckDuckGo bloque vite si on abuse)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

export const servicePublicApi = {
    /**
     * Recherche des fiches pratiques sur Service-Public.fr via DuckDuckGo HTML
     * @param {string} query La question de l'utilisateur
     * @returns {Promise<Array<{snippet: string, url: string}>>}
     */
    async searchDroits(query) {
        if (!query || query.trim() === "") return [];

        const cacheKey = query.toLowerCase().trim();
        if (cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log("[ServicePublic API] Using cache for:", query);
                return cached.data;
            } else {
                cache.delete(cacheKey);
            }
        }

        try {
            console.log("[ServicePublic API] Fetching new data for:", query);
            const encodedQuery = encodeURIComponent(`site:service-public.fr ${query}`);
            const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                console.error("[ServicePublic API] HTTP Error:", response.status);
                return [];
            }

            const html = await response.text();
            
            // Extraction rudimentaire mais efficace des snippets DuckDuckGo
            const results = [];
            const snippetRegex = /<a class="result__snippet" href="([^"]+)">([\s\S]*?)<\/a>/gi;
            
            let match;
            let count = 0;
            while ((match = snippetRegex.exec(html)) !== null && count < 3) {
                let ddgUrl = match[1];
                let snippetRaw = match[2];

                // Nettoyage du HTML encodé <b>...</b>
                let snippetClean = snippetRaw
                    .replace(/<b>/g, '')
                    .replace(/<\/b>/g, '')
                    .replace(/&#x27;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&');

                // Extraire la vraie URL depuis `//duckduckgo.com/l/?uddg=URL_ENCODED`
                let realUrl = "https://www.service-public.fr/";
                const urlMatch = ddgUrl.match(/uddg=([^&]+)/);
                if (urlMatch && urlMatch[1]) {
                    realUrl = decodeURIComponent(urlMatch[1]);
                    // Clean URL (remove tracking params)
                    if (realUrl.includes('?wpmobileexternal')) {
                        realUrl = realUrl.split('?')[0];
                    }
                }

                results.push({
                    snippet: snippetClean.trim(),
                    url: realUrl
                });
                count++;
            }

            // Cache the result
            cache.set(cacheKey, {
                timestamp: Date.now(),
                data: results
            });

            return results;

        } catch (error) {
            console.error("[ServicePublic API] Fetch error:", error.message);
            return [];
        }
    }
};

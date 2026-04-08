// Page offline — affichée par le service worker sans connexion
// CRITIQUE : doit fonctionner SANS JavaScript (statique pure)
// Contient tous les numéros d'urgence hardcodés

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f1f5f9",
        fontFamily: "system-ui, sans-serif",
        padding: "16px",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ paddingTop: "24px", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>OriZen</h1>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "8px",
            padding: "6px 12px",
            borderRadius: "24px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#fca5a5",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          ⚡ Hors ligne — Numéros d&apos;urgence disponibles
        </div>
      </div>

      {/* Notice */}
      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          background: "rgba(30,41,59,0.8)",
          border: "1px solid rgba(51,65,85,0.6)",
          fontSize: "13px",
          color: "#94a3b8",
          marginBottom: "20px",
          lineHeight: "1.5",
        }}
      >
        Pas de connexion internet détectée. Ces numéros fonctionnent même sans connexion — ils sont gratuits et disponibles 24h/24.
      </div>

      {/* Numéros d'urgence */}
      <h2
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#64748b",
          marginBottom: "12px",
        }}
      >
        Numéros d&apos;urgence gratuits
      </h2>

      {[
        { number: "115", label: "SAMU Social",         desc: "Hébergement d'urgence · 24h/24",    color: "#6366F1" },
        { number: "15",  label: "SAMU",                desc: "Urgence médicale",                   color: "#F59E0B" },
        { number: "17",  label: "Police Secours",      desc: "Danger, agression",                  color: "#EF4444" },
        { number: "18",  label: "Pompiers",            desc: "Incendie, accident",                 color: "#F97316" },
        { number: "112", label: "Toutes urgences",     desc: "Numéro universel européen",          color: "#8B5CF6" },
        { number: "114", label: "SMS Urgences",        desc: "Si vous ne pouvez pas parler",       color: "#06B6D4" },
        { number: "3919",label: "Violences Femmes",    desc: "Violences conjugales · anonyme",     color: "#EC4899" },
        { number: "119", label: "Enfance en Danger",   desc: "Mineurs en danger · 24h/24",         color: "#10B981" },
        { number: "3114",label: "Prévention Suicide",  desc: "Crise psychologique · 24h/24",       color: "#A78BFA" },
        { number: "3977",label: "Maltraitance Adultes",desc: "Personnes âgées/handicapées",        color: "#34D399" },
      ].map((item) => (
        <a
          key={item.number}
          href={`tel:${item.number}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(15,23,42,0.8)",
            border: `1px solid ${item.color}30`,
            marginBottom: "8px",
            textDecoration: "none",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "14px", margin: 0 }}>
              {item.label}
            </p>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>
              {item.desc}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: item.color }}>
            <span style={{ fontSize: "13px" }}>📞</span>
            <span style={{ fontWeight: 800, fontSize: "18px" }}>{item.number}</span>
          </div>
        </a>
      ))}

      {/* Droits essentiels offline */}
      <h2
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#64748b",
          marginTop: "24px",
          marginBottom: "12px",
        }}
      >
        Droits essentiels (sans connexion)
      </h2>

      {[
        "Le 115 ne peut pas vous refuser à cause de votre nationalité (CASF art. L345-2-2)",
        "Tout mineur isolé a droit à la protection immédiate de l'ASE — appeler le 119",
        "La PASS dans chaque hôpital public offre des soins gratuits sans dossier",
        "Toute personne en France a droit à l'aide d'urgence du CCAS de la mairie",
        "Le dépôt de plainte pour violence est possible en ligne (masecurite.fr)",
        "Demande d'asile : droit dès l'arrivée en France, sans condition",
      ].map((droit) => (
        <div
          key={droit}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(51,65,85,0.4)",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "#6366F1", flexShrink: 0, marginTop: "1px" }}>●</span>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{droit}</p>
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(51,65,85,0.4)",
          textAlign: "center",
          color: "#475569",
          fontSize: "11px",
        }}
      >
        OriZen — GPS des droits sociaux · France
        <br />
        Reconnectez-vous pour accéder à toutes les fonctionnalités
      </div>
    </div>
  );
}

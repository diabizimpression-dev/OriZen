export const APP_CONFIG = {
  PORT: process.env.PORT || 8080,
  APIS: {
    GEO: "https://geo.api.gouv.fr/",
    ADRESSE: "https://api-adresse.data.gouv.fr/",
    DATA_GOUV: "https://www.data.gouv.fr/api/1/",
  },
  ASSISTANT: {
    MODEL: "gpt-4o-mini",
    TEMPERATURE: 0.3,
    MAX_TOKENS: 900,
  }
};

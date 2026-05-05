import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  pokemonTcgApi: {
    apiKey: process.env.POKEMON_TCG_API_KEY || '',
    baseUrl: process.env.POKEMON_TCG_API_BASE_URL || 'https://api.pokemontcg.io/v2',
  },

  cache: {
    /** Card text/images rarely change — 24 hours */
    cardTtlMs: 24 * 60 * 60 * 1000,
    /** Sets are static after release — 7 days */
    setTtlMs: 7 * 24 * 60 * 60 * 1000,
    /** Prices fluctuate — 6 hours */
    priceTtlMs: 6 * 60 * 60 * 1000,
  },

  /** Daily API request budget (with key) */
  apiDailyLimit: 20_000,
} as const;

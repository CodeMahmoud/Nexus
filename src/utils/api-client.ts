import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

/**
 * Pre-configured Axios instance for the Pokémon TCG API.
 * Automatically attaches the API key header if available.
 */
export const pokemonTcgClient: AxiosInstance = axios.create({
  baseURL: config.pokemonTcgApi.baseUrl,
  timeout: 15_000,
  headers: {
    ...(config.pokemonTcgApi.apiKey
      ? { 'X-Api-Key': config.pokemonTcgApi.apiKey }
      : {}),
  },
});

// ─── In-memory daily API call counter ──────────────

let dailyCallCount = 0;
let counterResetDate = new Date().toDateString();

/**
 * Increment and check the daily API call counter.
 * Returns true if the call is allowed, false if the limit is exceeded.
 */
export function checkAndIncrementApiCounter(): boolean {
  const today = new Date().toDateString();

  // Reset counter at midnight
  if (today !== counterResetDate) {
    dailyCallCount = 0;
    counterResetDate = today;
  }

  if (dailyCallCount >= config.apiDailyLimit) {
    return false;
  }

  dailyCallCount++;
  return true;
}

/**
 * Get remaining API calls for today.
 */
export function getRemainingApiCalls(): number {
  const today = new Date().toDateString();
  if (today !== counterResetDate) {
    return config.apiDailyLimit;
  }
  return Math.max(0, config.apiDailyLimit - dailyCallCount);
}

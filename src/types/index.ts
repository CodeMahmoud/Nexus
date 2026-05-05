import { Request } from 'express';

// ─── Auth ──────────────────────────────────────────

/** Express Request extended with authenticated user ID */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// ─── API Response Envelope ─────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Pokémon TCG API Types ─────────────────────────

/** Shape of a card returned by api.pokemontcg.io/v2/cards */
export interface PokemonTcgApiCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  attacks?: PokemonTcgAttack[];
  abilities?: PokemonTcgAbility[];
  weaknesses?: PokemonTcgTypeValue[];
  resistances?: PokemonTcgTypeValue[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: PokemonTcgApiSet;
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: Record<string, string>;
  regulationMark?: string;
  images?: {
    small?: string;
    large?: string;
  };
  tcgplayer?: {
    url?: string;
    updatedAt?: string;
    prices?: Record<string, PokemonTcgPriceData>;
  };
  cardmarket?: {
    url?: string;
    updatedAt?: string;
    prices?: Record<string, number>;
  };
}

export interface PokemonTcgApiSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images?: {
    symbol?: string;
    logo?: string;
  };
}

export interface PokemonTcgAttack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text: string;
}

export interface PokemonTcgAbility {
  name: string;
  text: string;
  type: string;
}

export interface PokemonTcgTypeValue {
  type: string;
  value: string;
}

export interface PokemonTcgPriceData {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  directLow?: number;
}

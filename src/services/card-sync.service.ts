import { Supertype, PriceSource, PriceType, Prisma } from '@prisma/client';
import { pokemonTcgClient, checkAndIncrementApiCounter } from '../utils/api-client';
import { Errors } from '../utils/errors';
import { setRepository } from '../repositories/set.repository';
import { cardRepository } from '../repositories/card.repository';
import { priceRepository } from '../repositories/price.repository';
import { PokemonTcgApiCard, PokemonTcgApiSet } from '../types';

/**
 * Maps a supertype string from the API to our Prisma enum.
 */
function mapSupertype(value: string): Supertype {
  const upper = value.toUpperCase();
  if (upper === 'POKÉMON' || upper === 'POKEMON') return Supertype.POKEMON;
  if (upper === 'TRAINER') return Supertype.TRAINER;
  if (upper === 'ENERGY') return Supertype.ENERGY;
  return Supertype.POKEMON; // safe fallback
}

/**
 * Maps a TCGPlayer price key to our PriceType enum.
 */
function mapPriceType(key: string): PriceType | null {
  const map: Record<string, PriceType> = {
    normal: PriceType.NORMAL,
    holofoil: PriceType.HOLOFOIL,
    reverseHolofoil: PriceType.REVERSE_HOLOFOIL,
    '1stEditionHolofoil': PriceType.FIRST_EDITION_HOLOFOIL,
    '1stEditionNormal': PriceType.FIRST_EDITION_NORMAL,
  };
  return map[key] ?? null;
}

export class CardSyncService {
  /** In-flight request deduplication map: cardId → Promise */
  private inFlight = new Map<string, Promise<any>>();

  /**
   * Fetch a single card from the Pokémon TCG API and upsert into DB.
   * Deduplicates concurrent requests for the same card.
   */
  async fetchAndUpsertCard(cardId: string) {
    // Deduplicate: if this card is already being fetched, wait for that promise
    if (this.inFlight.has(cardId)) {
      return this.inFlight.get(cardId);
    }

    const promise = this._doFetchAndUpsert(cardId);
    this.inFlight.set(cardId, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.inFlight.delete(cardId);
    }
  }

  private async _doFetchAndUpsert(cardId: string) {
    if (!checkAndIncrementApiCounter()) {
      throw Errors.tooManyRequests('Daily Pokémon TCG API limit reached. Try again tomorrow.');
    }

    try {
      const response = await pokemonTcgClient.get(`/cards/${cardId}`);
      const apiCard: PokemonTcgApiCard = response.data.data;

      // Upsert the set first (card depends on it)
      await this.upsertSetFromApi(apiCard.set);

      // Upsert the card
      const card = await cardRepository.upsert({
        id: apiCard.id,
        name: apiCard.name,
        supertype: mapSupertype(apiCard.supertype),
        subtypes: apiCard.subtypes ?? [],
        hp: apiCard.hp,
        types: apiCard.types ?? [],
        evolvesFrom: apiCard.evolvesFrom,
        evolvesTo: apiCard.evolvesTo ?? [],
        rarity: apiCard.rarity,
        number: apiCard.number,
        artist: apiCard.artist,
        flavorText: apiCard.flavorText,
        nationalPokedexNumbers: apiCard.nationalPokedexNumbers ?? [],
        regulationMark: apiCard.regulationMark,
        legalities: apiCard.legalities ?? undefined,
        attacks: apiCard.attacks ? JSON.parse(JSON.stringify(apiCard.attacks)) as Prisma.InputJsonValue : undefined,
        abilities: apiCard.abilities ? JSON.parse(JSON.stringify(apiCard.abilities)) as Prisma.InputJsonValue : undefined,
        weaknesses: apiCard.weaknesses ? JSON.parse(JSON.stringify(apiCard.weaknesses)) as Prisma.InputJsonValue : undefined,
        resistances: apiCard.resistances ? JSON.parse(JSON.stringify(apiCard.resistances)) as Prisma.InputJsonValue : undefined,
        retreatCost: apiCard.retreatCost ?? [],
        convertedRetreatCost: apiCard.convertedRetreatCost,
        imageSmall: apiCard.images?.small,
        imageLarge: apiCard.images?.large,
        lastSyncedAt: new Date(),
        set: { connect: { id: apiCard.set.id } },
      });

      // Record price snapshots
      await this.recordPrices(apiCard);

      return card;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw Errors.notFound('Card');
      }
      if (error instanceof Error && 'statusCode' in error) {
        throw error; // re-throw our own errors
      }
      throw Errors.externalApi(`Failed to fetch card from Pokémon TCG API: ${error.message}`);
    }
  }

  /**
   * Upsert a set from API data.
   */
  async upsertSetFromApi(apiSet: PokemonTcgApiSet) {
    return setRepository.upsert({
      id: apiSet.id,
      name: apiSet.name,
      series: apiSet.series,
      printedTotal: apiSet.printedTotal,
      total: apiSet.total,
      ptcgoCode: apiSet.ptcgoCode,
      releaseDate: apiSet.releaseDate,
      symbolUrl: apiSet.images?.symbol,
      logoUrl: apiSet.images?.logo,
      legalities: apiSet.legalities ?? undefined,
      lastSyncedAt: new Date(),
    });
  }

  /**
   * Extract TCGPlayer prices from API card data and write PriceHistory rows.
   */
  private async recordPrices(apiCard: PokemonTcgApiCard) {
    const snapshots: Parameters<typeof priceRepository.createMany>[0] = [];

    // TCGPlayer prices
    if (apiCard.tcgplayer?.prices) {
      for (const [key, priceData] of Object.entries(apiCard.tcgplayer.prices)) {
        const priceType = mapPriceType(key);
        if (!priceType) continue;

        snapshots.push({
          cardId: apiCard.id,
          source: PriceSource.TCGPLAYER,
          priceType,
          low: priceData.low,
          mid: priceData.mid,
          high: priceData.high,
          market: priceData.market,
          directLow: priceData.directLow,
        });
      }
    }

    if (snapshots.length > 0) {
      await priceRepository.createMany(snapshots);
    }
  }

  /**
   * Search cards via the external API and cache them locally.
   * Used when the local DB doesn't have enough results.
   */
  async searchAndCache(query: string, page = 1, pageSize = 20) {
    if (!checkAndIncrementApiCounter()) {
      return []; // gracefully return empty if rate limited
    }

    try {
      const response = await pokemonTcgClient.get('/cards', {
        params: {
          q: `name:"${query}*"`,
          page,
          pageSize,
        },
      });

      const apiCards: PokemonTcgApiCard[] = response.data.data;

      // Upsert all results into DB
      for (const apiCard of apiCards) {
        await this.upsertSetFromApi(apiCard.set);
        await cardRepository.upsert({
          id: apiCard.id,
          name: apiCard.name,
          supertype: mapSupertype(apiCard.supertype),
          subtypes: apiCard.subtypes ?? [],
          hp: apiCard.hp,
          types: apiCard.types ?? [],
          evolvesFrom: apiCard.evolvesFrom,
          evolvesTo: apiCard.evolvesTo ?? [],
          rarity: apiCard.rarity,
          number: apiCard.number,
          artist: apiCard.artist,
          flavorText: apiCard.flavorText,
          nationalPokedexNumbers: apiCard.nationalPokedexNumbers ?? [],
          regulationMark: apiCard.regulationMark,
          legalities: apiCard.legalities ?? undefined,
          attacks: apiCard.attacks ? JSON.parse(JSON.stringify(apiCard.attacks)) as Prisma.InputJsonValue : undefined,
          abilities: apiCard.abilities ? JSON.parse(JSON.stringify(apiCard.abilities)) as Prisma.InputJsonValue : undefined,
          weaknesses: apiCard.weaknesses ? JSON.parse(JSON.stringify(apiCard.weaknesses)) as Prisma.InputJsonValue : undefined,
          resistances: apiCard.resistances ? JSON.parse(JSON.stringify(apiCard.resistances)) as Prisma.InputJsonValue : undefined,
          retreatCost: apiCard.retreatCost ?? [],
          convertedRetreatCost: apiCard.convertedRetreatCost,
          imageSmall: apiCard.images?.small,
          imageLarge: apiCard.images?.large,
          lastSyncedAt: new Date(),
          set: { connect: { id: apiCard.set.id } },
        });
        await this.recordPrices(apiCard);
      }

      return apiCards;
    } catch {
      return []; // fail gracefully
    }
  }
}

export const cardSyncService = new CardSyncService();

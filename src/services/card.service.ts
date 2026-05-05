import { cardRepository, CardFilters } from '../repositories/card.repository';
import { priceRepository } from '../repositories/price.repository';
import { cardSyncService } from './card-sync.service';
import { config } from '../config';
import { Errors } from '../utils/errors';
import { Supertype } from '@prisma/client';

export class CardService {
  /**
   * Get a single card by ID.
   * Uses the cache-aside pattern: check DB first, fetch from API if stale/missing.
   */
  async getCardById(id: string) {
    const card = await cardRepository.findById(id);

    if (card) {
      const age = Date.now() - card.lastSyncedAt.getTime();
      if (age < config.cache.cardTtlMs) {
        // Cache hit — fresh enough
        const prices = await priceRepository.getLatestForCard(id);
        return { ...card, prices };
      }
    }

    // Cache miss or stale — fetch from external API
    const freshCard = await cardSyncService.fetchAndUpsertCard(id);
    const prices = await priceRepository.getLatestForCard(id);
    return { ...freshCard, prices };
  }

  /**
   * List cards with optional filters. Serves from local DB only.
   */
  async getCards(filters: CardFilters, page = 1, limit = 20) {
    const result = await cardRepository.findMany(filters, page, limit);
    return {
      cards: result.cards,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Search cards by name.
   * First searches local DB. If few results, also queries external API
   * to backfill the cache.
   */
  async searchCards(query: string, page = 1, limit = 20) {
    if (!query || query.trim().length < 2) {
      throw Errors.badRequest('Search query must be at least 2 characters');
    }

    const result = await cardRepository.search(query, page, limit);

    // If the local DB has fewer results than expected, try the external API
    if (result.total < limit && page === 1) {
      await cardSyncService.searchAndCache(query);
      // Re-query after backfill
      const refreshed = await cardRepository.search(query, page, limit);
      return {
        cards: refreshed.cards,
        total: refreshed.total,
        page,
        limit,
        totalPages: Math.ceil(refreshed.total / limit),
      };
    }

    return {
      cards: result.cards,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}

export const cardService = new CardService();

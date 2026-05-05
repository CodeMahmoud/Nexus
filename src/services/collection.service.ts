import { collectionRepository } from '../repositories/collection.repository';
import { cardRepository } from '../repositories/card.repository';
import { cardSyncService } from './card-sync.service';
import { Errors } from '../utils/errors';

export class CollectionService {
  /**
   * Get all cards in a user's collection.
   */
  async getUserCollection(userId: string) {
    const items = await collectionRepository.findByUserId(userId);
    return items;
  }

  /**
   * Add a card to the user's collection.
   * If the card doesn't exist in our DB, fetch it from the API first.
   */
  async addCard(userId: string, cardId: string, quantity = 1, notes?: string) {
    // Ensure the card exists in our database
    let card = await cardRepository.findById(cardId);
    if (!card) {
      // Fetch from external API and cache
      card = await cardSyncService.fetchAndUpsertCard(cardId);
      if (!card) {
        throw Errors.notFound('Card');
      }
    }

    // Check if already in collection
    const existing = await collectionRepository.findByUserAndCard(userId, cardId);
    if (existing) {
      // Update quantity (add to existing)
      return collectionRepository.upsert(
        userId,
        cardId,
        existing.quantity + quantity,
        notes ?? existing.notes ?? undefined
      );
    }

    return collectionRepository.upsert(userId, cardId, quantity, notes);
  }

  /**
   * Remove a card from the user's collection entirely.
   */
  async removeCard(userId: string, cardId: string) {
    const existing = await collectionRepository.findByUserAndCard(userId, cardId);
    if (!existing) {
      throw Errors.notFound('Card not found in your collection');
    }

    await collectionRepository.remove(userId, cardId);
    return { removed: true, cardId };
  }
}

export const collectionService = new CollectionService();

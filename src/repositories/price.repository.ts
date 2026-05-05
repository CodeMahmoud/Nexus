import { prisma } from '../config/prisma';
import { PriceSource, PriceType } from '@prisma/client';

export class PriceRepository {
  async createSnapshot(data: {
    cardId: string;
    source: PriceSource;
    priceType: PriceType;
    low?: number;
    mid?: number;
    high?: number;
    market?: number;
    directLow?: number;
  }) {
    return prisma.priceHistory.create({ data });
  }

  async createMany(
    snapshots: {
      cardId: string;
      source: PriceSource;
      priceType: PriceType;
      low?: number;
      mid?: number;
      high?: number;
      market?: number;
      directLow?: number;
    }[]
  ) {
    return prisma.priceHistory.createMany({ data: snapshots });
  }

  async getLatestForCard(cardId: string) {
    return prisma.priceHistory.findMany({
      where: { cardId },
      orderBy: { recordedAt: 'desc' },
      distinct: ['priceType'], // Guarantees the absolute latest snapshot per price type
    });
  }

  async getHistoryForCard(cardId: string, since: Date, priceType?: PriceType) {
    return prisma.priceHistory.findMany({
      where: {
        cardId,
        recordedAt: { gte: since },
        ...(priceType ? { priceType } : {}),
      },
      orderBy: { recordedAt: 'asc' },
    });
  }
}

export const priceRepository = new PriceRepository();

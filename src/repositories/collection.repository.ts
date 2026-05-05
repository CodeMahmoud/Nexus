import { prisma } from '../config/prisma';

export class CollectionRepository {
  async findByUserId(userId: string) {
    return prisma.collection.findMany({
      where: { userId },
      include: {
        card: {
          include: { set: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndCard(userId: string, cardId: string) {
    return prisma.collection.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
  }

  async upsert(userId: string, cardId: string, quantity: number, notes?: string) {
    return prisma.collection.upsert({
      where: { userId_cardId: { userId, cardId } },
      update: {
        quantity,
        ...(notes !== undefined ? { notes } : {}),
      },
      create: {
        userId,
        cardId,
        quantity,
        notes,
      },
      include: {
        card: { include: { set: true } },
      },
    });
  }

  async remove(userId: string, cardId: string) {
    return prisma.collection.delete({
      where: { userId_cardId: { userId, cardId } },
    });
  }
}

export const collectionRepository = new CollectionRepository();

import { prisma } from '../config/prisma';
import { Prisma, Supertype } from '@prisma/client';

export interface CardFilters {
  name?: string;
  setId?: string;
  supertype?: Supertype;
  rarity?: string;
  types?: string;
}

export class CardRepository {
  async findById(id: string) {
    return prisma.card.findUnique({
      where: { id },
      include: { set: true },
    });
  }

  async findMany(filters: CardFilters, page: number, limit: number) {
    const where: Prisma.CardWhereInput = {};

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.setId) {
      where.setId = filters.setId;
    }
    if (filters.supertype) {
      where.supertype = filters.supertype;
    }
    if (filters.rarity) {
      where.rarity = { equals: filters.rarity, mode: 'insensitive' };
    }
    if (filters.types) {
      where.types = { has: filters.types };
    }

    const [cards, total] = await prisma.$transaction([
      prisma.card.findMany({
        where,
        include: { set: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.card.count({ where }),
    ]);

    return { cards, total };
  }

  async search(query: string, page: number, limit: number) {
    return this.findMany({ name: query }, page, limit);
  }

  async upsert(data: Prisma.CardCreateInput) {
    return prisma.card.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        supertype: data.supertype,
        subtypes: data.subtypes,
        hp: data.hp,
        types: data.types,
        evolvesFrom: data.evolvesFrom,
        evolvesTo: data.evolvesTo,
        rarity: data.rarity,
        number: data.number,
        artist: data.artist,
        flavorText: data.flavorText,
        nationalPokedexNumbers: data.nationalPokedexNumbers,
        regulationMark: data.regulationMark,
        legalities: data.legalities ?? Prisma.JsonNull,
        attacks: data.attacks ?? Prisma.JsonNull,
        abilities: data.abilities ?? Prisma.JsonNull,
        weaknesses: data.weaknesses ?? Prisma.JsonNull,
        resistances: data.resistances ?? Prisma.JsonNull,
        retreatCost: data.retreatCost,
        convertedRetreatCost: data.convertedRetreatCost,
        imageSmall: data.imageSmall,
        imageLarge: data.imageLarge,
        lastSyncedAt: new Date(),
      },
      create: data,
    });
  }
}

export const cardRepository = new CardRepository();

import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class SetRepository {
  async findById(id: string) {
    return prisma.set.findUnique({ where: { id } });
  }

  async findAll() {
    return prisma.set.findMany({ orderBy: { releaseDate: 'desc' } });
  }

  async upsert(data: Prisma.SetCreateInput) {
    return prisma.set.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        series: data.series,
        printedTotal: data.printedTotal,
        total: data.total,
        ptcgoCode: data.ptcgoCode,
        releaseDate: data.releaseDate,
        symbolUrl: data.symbolUrl,
        logoUrl: data.logoUrl,
        legalities: data.legalities ?? Prisma.JsonNull,
        lastSyncedAt: new Date(),
      },
      create: data,
    });
  }
}

export const setRepository = new SetRepository();

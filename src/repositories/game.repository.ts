import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import type {
  CreateGameInput,
  ListGamesQuery,
  UpdateGameInput,
} from "../validation/game.validation.js";

export class GameRepository {
  constructor(private readonly database: PrismaClient) {}

  findMany(userId: number, query: ListGamesQuery) {
    const where: Prisma.GameWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.favorite === undefined ? {} : { favorite: query.favorite }),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { genre: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.database.game.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(userId: number, id: number) {
    return this.database.game.findFirst({ where: { id, userId } });
  }

  create(userId: number, input: CreateGameInput) {
    return this.database.game.create({
      data: {
        ...input,
        userId,
        titleKey: input.title.normalize("NFKC").trim().toLocaleLowerCase("en-US"),
      },
    });
  }

  update(userId: number, id: number, input: UpdateGameInput) {
    return this.database.game.updateMany({
      where: { id, userId },
      data: {
        ...input,
        ...(input.title === undefined
          ? {}
          : {
              titleKey: input.title
                .normalize("NFKC")
                .trim()
                .toLocaleLowerCase("en-US"),
            }),
      },
    });
  }

  delete(userId: number, id: number) {
    return this.database.game.deleteMany({ where: { id, userId } });
  }
}

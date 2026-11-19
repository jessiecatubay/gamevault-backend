import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import type {
  CreateWishlistEntryInput,
  UpdateWishlistEntryInput,
} from "../validation/wishlist.validation.js";

export function titleKey(title: string): string {
  return title.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

export class WishlistRepository {
  constructor(private readonly database: PrismaClient) {}

  list(userId: number) {
    return this.database.wishlistEntry.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
    });
  }

  create(userId: number, input: CreateWishlistEntryInput) {
    return this.database.wishlistEntry.create({
      data: { ...input, titleKey: titleKey(input.title), userId },
    });
  }

  findById(userId: number, id: number) {
    return this.database.wishlistEntry.findFirst({ where: { userId, id } });
  }

  update(
    userId: number,
    id: number,
    input: UpdateWishlistEntryInput,
  ) {
    return this.database.wishlistEntry.updateMany({
      where: { userId, id },
      data: {
        ...input,
        ...(input.title === undefined ? {} : { titleKey: titleKey(input.title) }),
      },
    });
  }

  delete(userId: number, id: number) {
    return this.database.wishlistEntry.deleteMany({ where: { userId, id } });
  }

  purchase(userId: number, id: number) {
    return this.database.$transaction(
      async (transaction) => {
        const entry = await transaction.wishlistEntry.findFirst({
          where: { id, userId },
        });
        if (!entry) return null;

        const existingGame = await transaction.game.findFirst({
          where: { userId, titleKey: entry.titleKey },
        });
        const game =
          existingGame ??
          (await transaction.game.create({
            data: {
              userId,
              title: entry.title,
              titleKey: entry.titleKey,
              genre: entry.genre,
              status: "BACKLOG",
              favorite: false,
              image: entry.image,
            },
          }));

        await transaction.wishlistEntry.delete({ where: { id: entry.id } });
        return { game, alreadyInLibrary: existingGame !== null };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

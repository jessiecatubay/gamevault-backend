import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import {
  WishlistRepository,
} from "../repositories/wishlist.repository.js";
import type {
  CreateWishlistEntryInput,
  UpdateWishlistEntryInput,
} from "../validation/wishlist.validation.js";
import { ConflictError, NotFoundError } from "./errors.js";

export class WishlistService {
  private readonly wishlist: WishlistRepository;

  constructor(private readonly database: PrismaClient) {
    this.wishlist = new WishlistRepository(database);
  }

  async list(userId: number) {
    const items = await this.wishlist.list(userId);
    const total = items.reduce(
      (sum, item) => sum.plus(item.price),
      new Prisma.Decimal(0),
    );
    const mostExpensive = items.reduce<
      (typeof items)[number] | null
    >((most, item) => (most === null || item.price.gt(most.price) ? item : most), null);

    return {
      items,
      stats: {
        totalGames: items.length,
        totalEstimatedCost: total.toFixed(2),
        mostExpensive,
        recentlyAdded: items.slice(0, 5),
      },
    };
  }

  async create(userId: number, input: CreateWishlistEntryInput) {
    try {
      return await this.wishlist.create(userId, input);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("This game is already in your wishlist");
      }
      throw error;
    }
  }

  async update(userId: number, id: number, input: UpdateWishlistEntryInput) {
    await this.requireEntry(userId, id);
    try {
      const result = await this.wishlist.update(userId, id, input);
      if (result.count === 0) throw new NotFoundError("Wishlist entry was not found");
      return await this.requireEntry(userId, id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("This game is already in your wishlist");
      }
      throw error;
    }
  }

  async remove(userId: number, id: number) {
    const result = await this.wishlist.delete(userId, id);
    if (result.count === 0) throw new NotFoundError("Wishlist entry was not found");
  }

  async purchase(userId: number, id: number) {
    try {
      const result = await this.wishlist.purchase(userId, id);
      if (!result) throw new NotFoundError("Wishlist entry was not found");
      return result;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "This game is already in your library; the wishlist entry was kept",
        );
      }
      throw error;
    }
  }

  private async requireEntry(userId: number, id: number) {
    const entry = await this.wishlist.findById(userId, id);
    if (!entry) throw new NotFoundError("Wishlist entry was not found");
    return entry;
  }
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

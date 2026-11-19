import { PrismaClient } from "../generated/prisma/client.js";
import { GameRepository } from "../repositories/game.repository.js";
import type {
  CreateGameInput,
  ListGamesQuery,
  UpdateGameInput,
} from "../validation/game.validation.js";
import { NotFoundError } from "./errors.js";

export class GameService {
  private readonly games: GameRepository;

  constructor(database: PrismaClient) {
    this.games = new GameRepository(database);
  }

  list(userId: number, query: ListGamesQuery) {
    return this.games.findMany(userId, query);
  }

  create(userId: number, input: CreateGameInput) {
    return this.games.create(userId, input);
  }

  async update(userId: number, id: number, input: UpdateGameInput) {
    await this.requireGame(userId, id);
    const result = await this.games.update(userId, id, input);
    if (result.count === 0) {
      throw new NotFoundError(`Game with id ${id} was not found`);
    }
    return this.requireGame(userId, id);
  }

  async remove(userId: number, id: number) {
    const result = await this.games.delete(userId, id);
    if (result.count === 0) {
      throw new NotFoundError(`Game with id ${id} was not found`);
    }
  }

  private async requireGame(userId: number, id: number) {
    const game = await this.games.findById(userId, id);
    if (!game) {
      throw new NotFoundError(`Game with id ${id} was not found`);
    }
    return game;
  }
}

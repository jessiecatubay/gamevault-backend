import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { GameService } from "../services/game.service.js";

const gameService = new GameService(prisma);

export const listGames: RequestHandler = async (request, response, next) => {
  try {
    const games = await gameService.list(
      response.locals.userId as number,
      (response.locals.validated?.query ?? request.query) as never,
    );
    response.json({ data: games });
  } catch (error) {
    next(error);
  }
};

export const createGame: RequestHandler = async (request, response, next) => {
  try {
    const game = await gameService.create(
      response.locals.userId as number,
      (response.locals.validated?.body ?? request.body) as never,
    );
    response.status(201).json({ data: game });
  } catch (error) {
    next(error);
  }
};

export const updateGame: RequestHandler = async (request, response, next) => {
  try {
    const game = await gameService.update(
      response.locals.userId as number,
      Number(response.locals.validated?.params?.id ?? request.params.id),
      (response.locals.validated?.body ?? request.body) as never,
    );
    response.json({ data: game });
  } catch (error) {
    next(error);
  }
};

export const deleteGame: RequestHandler = async (request, response, next) => {
  try {
    await gameService.remove(
      response.locals.userId as number,
      Number(response.locals.validated?.params?.id ?? request.params.id),
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

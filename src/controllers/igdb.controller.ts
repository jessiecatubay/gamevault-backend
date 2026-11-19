import type { RequestHandler } from "express";
import { IgdbService } from "../services/igdb.service.js";

const igdbService = new IgdbService();

export const searchIgdb: RequestHandler = async (request, response, next) => {
  try {
    const query = response.locals.validated?.query ?? request.query;
    const results = await igdbService.search(query.query);
    response.json({ data: results });
  } catch (error) {
    next(error);
  }
};

export const getIgdbGame: RequestHandler = async (_request, response, next) => {
  try {
    const id = Number(response.locals.validated?.params?.id);
    const game = await igdbService.getById(id);
    response.json({ data: game });
  } catch (error) {
    next(error);
  }
};

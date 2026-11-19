import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  createGame,
  deleteGame,
  listGames,
  updateGame,
} from "../controllers/game.controller.js";
import { getIgdbGame, searchIgdb } from "../controllers/igdb.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createGameSchema,
  gameIdSchema,
  listGamesQuerySchema,
  updateGameSchema,
} from "../validation/game.validation.js";
import { igdbIdSchema, igdbSearchSchema } from "../validation/igdb.validation.js";

export const gameRouter = Router();

gameRouter.use(authenticate);
gameRouter.get("/search", validate(igdbSearchSchema, "query"), searchIgdb);
gameRouter.get("/igdb/:id", validate(igdbIdSchema, "params"), getIgdbGame);
gameRouter.get("/", validate(listGamesQuerySchema, "query"), listGames);
gameRouter.post("/", validate(createGameSchema, "body"), createGame);
gameRouter.patch(
  "/:id",
  validate(gameIdSchema, "params"),
  validate(updateGameSchema, "body"),
  updateGame,
);
gameRouter.delete("/:id", validate(gameIdSchema, "params"), deleteGame);

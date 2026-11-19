import { Router } from "express";
import { gameRouter } from "./game.routes.js";
import { authRouter } from "./auth.routes.js";
import { wishlistRouter } from "./wishlist.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ data: { status: "ok" } });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/games", gameRouter);
apiRouter.use("/wishlist", wishlistRouter);

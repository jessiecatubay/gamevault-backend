import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      const configuredOrigins = env.CORS_ORIGIN.split(",").map((value) =>
        value.trim(),
      );

      const isLocalFrontend =
        origin === undefined ||
        configuredOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      callback(null, isLocalFrontend);
    },
  }),
);

app.use(express.json({ limit: "6mb" }));

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", apiRouter);

// Error handler should be last
app.use(errorHandler);

import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
} from "../services/errors.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    response
      .status(400)
      .json({
        error: { message: "Validation failed", details: error.flatten() },
      });
    return;
  }

  if (error instanceof NotFoundError) {
    response.status(404).json({ error: { message: error.message } });
    return;
  }

  if (error instanceof ConflictError) {
    response.status(409).json({ error: { message: error.message } });
    return;
  }

  if (error instanceof UnauthorizedError) {
    response.status(401).json({ error: { message: error.message } });
    return;
  }

  if (error instanceof ExternalServiceError) {
    response
      .status(error.statusCode)
      .json({ error: { message: error.message } });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    response.status(404).json({ error: { message: "Resource was not found" } });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    response.status(409).json({ error: { message: "A duplicate entry already exists" } });
    return;
  }

  console.error(error);
  response.status(500).json({ error: { message: "Internal server error" } });
};

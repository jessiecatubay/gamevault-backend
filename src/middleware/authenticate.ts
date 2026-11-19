import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../services/errors.js";

export const authenticate: RequestHandler = async (
  request,
  response,
  next,
) => {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  if (!match) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.delete({ where: { tokenHash } });
      next(new UnauthorizedError("Session is invalid or has expired"));
      return;
    }

    response.locals.userId = session.userId;
    next();
  } catch (error) {
    next(error);
  }
};

import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthService } from "../services/auth.service.js";

const authService = new AuthService(prisma);

export const register: RequestHandler = async (request, response, next) => {
  try {
    const result = await authService.register(
      response.locals.validated?.body ?? request.body,
    );
    response.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (request, response, next) => {
  try {
    const result = await authService.login(
      response.locals.validated?.body ?? request.body,
    );
    response.json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (request, response, next) => {
  try {
    const token = request.header("authorization")?.slice("Bearer ".length);
    if (token) await authService.logout(token);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const currentUser: RequestHandler = async (_request, response, next) => {
  try {
    const user = await authService.currentUser(response.locals.userId as number);
    response.json({ data: user });
  } catch (error) {
    next(error);
  }
};

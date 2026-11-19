import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { WishlistService } from "../services/wishlist.service.js";

const wishlistService = new WishlistService(prisma);

export const listWishlist: RequestHandler = async (_request, response, next) => {
  try {
    const result = await wishlistService.list(response.locals.userId as number);
    response.json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const createWishlistEntry: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const entry = await wishlistService.create(
      response.locals.userId as number,
      response.locals.validated?.body ?? request.body,
    );
    response.status(201).json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const updateWishlistEntry: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const entry = await wishlistService.update(
      response.locals.userId as number,
      Number(response.locals.validated?.params?.id ?? request.params.id),
      response.locals.validated?.body ?? request.body,
    );
    response.json({ data: entry });
  } catch (error) {
    next(error);
  }
};

export const deleteWishlistEntry: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    await wishlistService.remove(
      response.locals.userId as number,
      Number(response.locals.validated?.params?.id ?? request.params.id),
    );
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const purchaseWishlistEntry: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const result = await wishlistService.purchase(
      response.locals.userId as number,
      Number(response.locals.validated?.params?.id ?? request.params.id),
    );
    response.json({ data: result });
  } catch (error) {
    next(error);
  }
};

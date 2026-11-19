import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate =
  <T>(
    schema: ZodType<T>,
    source: "body" | "query" | "params",
  ): RequestHandler =>
  (request, response, next) => {
    const result = schema.safeParse(request[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    response.locals.validated ??= {};
    response.locals.validated[source] = result.data;
    next();
  };

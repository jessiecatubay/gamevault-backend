import { z } from "zod";

export const igdbSearchSchema = z.object({
  query: z.string().trim().min(2).max(80),
});

export const igdbIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type IgdbSearchQuery = z.infer<typeof igdbSearchSchema>;

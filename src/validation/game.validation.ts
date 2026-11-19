import { z } from "zod";

const gameStatus = z.enum(["BACKLOG", "PLAYING", "COMPLETED"]);

export const gameIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listGamesQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: gameStatus.optional(),
  favorite: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

const gameMetadataSchema = z.object({
  igdbId: z.number().int().positive().nullable().optional(),
  description: z.string().trim().max(50_000).nullable().optional(),
  releaseDate: z.iso.datetime().nullable().optional().transform((value) =>
    value ? new Date(value) : value,
  ),
  developer: z.string().trim().max(160).nullable().optional(),
  publisher: z.string().trim().max(160).nullable().optional(),
  platforms: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  rating: z.number().finite().min(0).max(100).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
});

export const createGameSchema = z.object({
  title: z.string().trim().min(1).max(160),
  genre: z.string().trim().min(1).max(100),
  status: gameStatus.optional(),
  favorite: z.boolean().optional(),
  image: z.string().trim().max(5_000_000).nullable().optional(),
}).extend(gameMetadataSchema.shape);

export const updateGameSchema = createGameSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
export type ListGamesQuery = z.infer<typeof listGamesQuerySchema>;

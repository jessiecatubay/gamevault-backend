import { z } from "zod";

const wishlistFields = z.object({
  title: z.string().trim().min(1).max(160),
  image: z.string().trim().max(5_000_000).nullable().optional(),
  price: z
    .number()
    .finite()
    .min(0)
    .max(99_999_999.99)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      "Price supports two decimal places",
    ),
  platform: z.string().trim().min(1).max(80),
  genre: z.string().trim().min(1).max(100),
  releaseDate: z.iso.date().nullable().optional().transform((value) =>
    value ? new Date(`${value}T00:00:00.000Z`) : value,
  ),
  notes: z.string().trim().max(10_000).nullable().optional(),
});

export const wishlistIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createWishlistEntrySchema = wishlistFields;
export const updateWishlistEntrySchema = wishlistFields
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export type CreateWishlistEntryInput = z.infer<
  typeof createWishlistEntrySchema
>;
export type UpdateWishlistEntryInput = z.infer<
  typeof updateWishlistEntrySchema
>;

import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5500"),
  TWITCH_CLIENT_ID: z.string().trim().min(1).optional(),
  TWITCH_CLIENT_SECRET: z.string().trim().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  })
  .superRefine((config, context) => {
    if (Boolean(config.TWITCH_CLIENT_ID) !== Boolean(config.TWITCH_CLIENT_SECRET)) {
      context.addIssue({
        code: "custom",
        message: "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be configured together",
        path: ["TWITCH_CLIENT_ID"],
      });
    }
  });

export const env = envSchema.parse(process.env);

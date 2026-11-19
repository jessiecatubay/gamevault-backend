import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const registerSchema = credentialsSchema;
export const loginSchema = credentialsSchema;

export type CredentialsInput = z.infer<typeof credentialsSchema>;

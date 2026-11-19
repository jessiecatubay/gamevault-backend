import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import type { CredentialsInput } from "../validation/auth.validation.js";
import { ConflictError, UnauthorizedError } from "./errors.js";

const scrypt = promisify(scryptCallback);
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(private readonly database: PrismaClient) {}

  async register(input: CredentialsInput) {
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(input.password, salt, 64)) as Buffer;

    try {
      const user = await this.database.user.create({
        data: {
          email: input.email,
          passwordHash: `${salt}:${passwordHash.toString("hex")}`,
        },
        select: { id: true, email: true },
      });
      return this.createSession(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("An account with this email already exists");
      }
      throw error;
    }
  }

  async login(input: CredentialsInput) {
    const user = await this.database.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedError("Email or password is incorrect");
    }
    return this.createSession({ id: user.id, email: user.email });
  }

  async logout(token: string) {
    const tokenHash = hashToken(token);
    await this.database.session.deleteMany({ where: { tokenHash } });
  }

  async currentUser(userId: number) {
    return this.database.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true },
    });
  }

  private async createSession(user: { id: number; email: string }) {
    const token = randomBytes(32).toString("base64url");
    await this.database.session.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
    return { token, user };
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return timingSafeEqual(actual, expected);
}

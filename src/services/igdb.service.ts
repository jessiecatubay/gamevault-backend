import { env } from "../config/env.js";
import { ExternalServiceError, NotFoundError } from "./errors.js";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const GAMES_URL = "https://api.igdb.com/v4/games";
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const RESPONSE_CACHE_MS = 2 * 60_000;
const MAX_CACHE_ENTRIES = 100;
const REQUEST_TIMEOUT_MS = 10_000;

const categoryNames: Record<number, string> = {
  0: "Main game",
  1: "DLC / Add-on",
  2: "Expansion",
  3: "Bundle",
  4: "Standalone expansion",
  5: "Mod",
  6: "Episode",
  7: "Season",
  8: "Remake",
  9: "Remaster",
  10: "Expanded game",
  11: "Port",
  12: "Fork",
  13: "Pack",
  14: "Update",
};

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface IgdbCompany {
  company?: { name?: string };
  developer?: boolean;
  publisher?: boolean;
}

interface IgdbNamedValue {
  name?: string;
}

interface IgdbCover {
  url?: string;
}

interface IgdbGameRecord {
  id: number;
  name?: string;
  cover?: IgdbCover;
  summary?: string;
  first_release_date?: number;
  involved_companies?: IgdbCompany[];
  genres?: IgdbNamedValue[];
  platforms?: IgdbNamedValue[];
  rating?: number;
  category?: number;
}

export interface IgdbSearchResult {
  id: number;
  title: string;
  image: string | null;
  releaseDate: string | null;
}

export interface IgdbGameDetails extends IgdbSearchResult {
  description: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  platforms: string[];
  rating: number | null;
  category: string | null;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class IgdbService {
  private token: { value: string; expiresAt: number } | null = null;
  private tokenRequest: Promise<string> | null = null;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly pending = new Map<string, Promise<unknown>>();

  async search(query: string): Promise<IgdbSearchResult[]> {
    const normalizedQuery = query.trim();
    const escapedQuery = normalizedQuery.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return this.cached(`search:${normalizedQuery.toLocaleLowerCase()}`, async () => {
      const records = await this.requestGames(
        `search "${escapedQuery}"; fields id,name,cover.url,first_release_date; limit 10;`,
      );
      return records
        .filter((record) => record.name)
        .map((record) => ({
          id: record.id,
          title: record.name!,
          image: coverImage(record.cover?.url),
          releaseDate: releaseDate(record.first_release_date),
        }));
    });
  }

  async getById(id: number): Promise<IgdbGameDetails> {
    return this.cached(`game:${id}`, async () => {
      const records = await this.requestGames(
        `where id = ${id}; fields id,name,cover.url,summary,first_release_date,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,genres.name,platforms.name,rating,category; limit 1;`,
      );
      const record = records[0];
      if (!record?.name) throw new NotFoundError("IGDB game was not found");
      return toDetails(record);
    });
  }

  private async requestGames(
    query: string,
    retryAuthentication = true,
  ): Promise<IgdbGameRecord[]> {
    const accessToken = await this.getAccessToken();
    let response: Response;
    try {
      response = await fetch(GAMES_URL, {
        method: "POST",
        headers: {
          "Client-ID": env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
        },
        body: query,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new ExternalServiceError("IGDB request timed out; please try again", 503);
      }
      throw new ExternalServiceError("Unable to reach IGDB; please try again", 503);
    }

    if (response.status === 401 && retryAuthentication) {
      this.token = null;
      return this.requestGames(query, false);
    }
    if (response.status === 429) {
      throw new ExternalServiceError("IGDB rate limit reached; please try again shortly", 429);
    }
    if (!response.ok) {
      throw new ExternalServiceError("IGDB could not complete the request", 502);
    }

    let records: unknown;
    try {
      records = await response.json();
    } catch {
      throw new ExternalServiceError("IGDB returned an invalid response", 502);
    }
    if (!Array.isArray(records)) {
      throw new ExternalServiceError("IGDB returned an invalid response", 502);
    }
    return records as IgdbGameRecord[];
  }

  private async getAccessToken(): Promise<string> {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
      throw new ExternalServiceError(
        "IGDB is not configured on the backend. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in backend/.env, then restart the backend. You can still add games manually.",
        503,
      );
    }
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    if (this.tokenRequest) return this.tokenRequest;

    this.tokenRequest = this.fetchAccessToken().finally(() => {
      this.tokenRequest = null;
    });
    return this.tokenRequest;
  }

  private async fetchAccessToken(): Promise<string> {
    const params = new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID!,
      client_secret: env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    });
    let response: Response;
    try {
      response = await fetch(`${TOKEN_URL}?${params.toString()}`, {
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new ExternalServiceError("Twitch authentication timed out", 503);
      }
      throw new ExternalServiceError("Unable to reach Twitch authentication", 503);
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new ExternalServiceError(
          "Twitch authentication rate limit reached; please try again shortly",
          429,
        );
      }
      throw new ExternalServiceError(
        "Twitch authentication failed; check the IGDB server credentials",
        503,
      );
    }
    let tokenResponse: unknown;
    try {
      tokenResponse = await response.json();
    } catch {
      throw new ExternalServiceError(
        "Twitch returned an invalid access token",
        502,
      );
    }
    if (
      typeof tokenResponse !== "object" ||
      tokenResponse === null ||
      !("access_token" in tokenResponse) ||
      typeof tokenResponse.access_token !== "string" ||
      !("expires_in" in tokenResponse) ||
      typeof tokenResponse.expires_in !== "number"
    ) {
      throw new ExternalServiceError("Twitch returned an invalid access token", 502);
    }

    const lifetime = Math.max(
      0,
      tokenResponse.expires_in * 1000 - TOKEN_REFRESH_MARGIN_MS,
    );
    this.token = {
      value: tokenResponse.access_token,
      expiresAt: Date.now() + lifetime,
    };
    return this.token.value;
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = this.pending.get(key);
    if (pending) return pending as Promise<T>;

    const request = load()
      .then((value) => {
        if (this.cache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = this.cache.keys().next().value;
          if (oldestKey !== undefined) this.cache.delete(oldestKey);
        }
        this.cache.set(key, {
          value,
          expiresAt: Date.now() + RESPONSE_CACHE_MS,
        });
        return value;
      })
      .finally(() => {
        this.pending.delete(key);
      });
    this.pending.set(key, request);
    return request;
  }
}

function coverImage(path: string | undefined): string | null {
  if (!path) return null;
  const securePath = path.startsWith("//") ? `https:${path}` : path;
  return securePath.replace("/t_thumb/", "/t_cover_big/");
}

function releaseDate(timestamp: number | undefined): string | null {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return null;
  return new Date(timestamp * 1000).toISOString();
}

function toDetails(record: IgdbGameRecord): IgdbGameDetails {
  const companies = record.involved_companies ?? [];
  const developer = companies
    .filter((entry) => entry.developer)
    .map((entry) => entry.company?.name)
    .filter((name): name is string => Boolean(name));
  const publisher = companies
    .filter((entry) => entry.publisher)
    .map((entry) => entry.company?.name)
    .filter((name): name is string => Boolean(name));

  return {
    id: record.id,
    title: record.name!,
    image: coverImage(record.cover?.url),
    releaseDate: releaseDate(record.first_release_date),
    description: record.summary?.trim() || null,
    developer: developer.length ? [...new Set(developer)].join(", ") : null,
    publisher: publisher.length ? [...new Set(publisher)].join(", ") : null,
    genres: uniqueNames(record.genres),
    platforms: uniqueNames(record.platforms),
    rating:
      typeof record.rating === "number" && Number.isFinite(record.rating)
        ? record.rating
        : null,
    category:
      typeof record.category === "number"
        ? categoryNames[record.category] ?? "Other"
        : null,
  };
}

function uniqueNames(values: IgdbNamedValue[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.name).filter(
    (name): name is string => Boolean(name),
  ))];
}

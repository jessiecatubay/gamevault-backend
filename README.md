# GameVault Backend

Express + TypeScript + Prisma API for the GameVault collection, backed by PostgreSQL on Neon.

## Setup

1. Create a PostgreSQL project on Neon and copy its pooled connection string.
2. Set `DATABASE_URL` in `.env` to that connection string. Keep `sslmode=require`.
3. Create a Twitch developer application and set its credentials in the
   backend `.env` file:

```env
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

Keep the client secret server-side; never add these values to the frontend
environment or commit real credentials. IGDB lookup remains optional when the
credentials are not set, and manual game entry continues to work. Use
`.env.example` as the key-name template, enter the credentials in the
backend `.env` file, and restart `npm run dev` after editing it.

4. Install dependencies and generate the Prisma client:

```powershell
npm install
npm run db:generate
```

5. Apply the schema to Neon:

```powershell
npm run db:migrate
```

6. Start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:3000` by default.

## Database migration

After updating the schema, create and apply the migration with:

```powershell
npm run db:generate
npx prisma migrate deploy
```

The migration adds accounts, database-backed sessions, and per-user wishlist
records. Existing `Game` rows are preserved with no owner; they are not exposed
to newly registered users. New library records are scoped to their account.
Register an account, then add any needed legacy games to that account's library.
The `20261118010000_game_igdb_metadata` migration adds optional IGDB identifiers
and game metadata without altering existing game records.

## Authentication

Register with `POST /api/auth/register` or sign in with `POST /api/auth/login`,
using `{ "email": "...", "password": "..." }`. Both return a session bearer
token and user object. Send the token as `Authorization: Bearer <token>` to
protected routes. Sessions expire after 30 days.

## Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/games?search=&status=BACKLOG|PLAYING|COMPLETED&favorite=true|false`
- `GET /api/games/search?query=...` (authenticated IGDB search)
- `GET /api/games/igdb/:id` (authenticated IGDB details)
- `POST /api/games`
- `PATCH /api/games/:id`
- `DELETE /api/games/:id`
- `GET /api/wishlist` (includes per-user totals and dashboard stats)
- `POST /api/wishlist`
- `PATCH /api/wishlist/:id`
- `DELETE /api/wishlist/:id`
- `POST /api/wishlist/:id/purchase` (atomically adds to Backlog and removes the wishlist entry)

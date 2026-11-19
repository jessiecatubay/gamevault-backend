CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WishlistEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "titleKey" VARCHAR(160) NOT NULL,
    "image" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "platform" VARCHAR(80) NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WishlistEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Game" ADD COLUMN "userId" INTEGER;
ALTER TABLE "Game" ADD COLUMN "titleKey" VARCHAR(160);
UPDATE "Game" SET "titleKey" = lower(btrim("title"));
ALTER TABLE "Game" ALTER COLUMN "titleKey" SET NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "WishlistEntry_userId_addedAt_idx" ON "WishlistEntry"("userId", "addedAt");
CREATE INDEX "WishlistEntry_userId_platform_idx" ON "WishlistEntry"("userId", "platform");
CREATE INDEX "WishlistEntry_userId_title_idx" ON "WishlistEntry"("userId", "title");
CREATE INDEX "Game_userId_idx" ON "Game"("userId");
CREATE UNIQUE INDEX "Game_userId_titleKey_key" ON "Game"("userId", "titleKey");
CREATE UNIQUE INDEX "WishlistEntry_userId_titleKey_key" ON "WishlistEntry"("userId", "titleKey");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistEntry" ADD CONSTRAINT "WishlistEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

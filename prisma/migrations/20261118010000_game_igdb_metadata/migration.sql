ALTER TABLE "Game"
    ADD COLUMN "igdbId" INTEGER,
    ADD COLUMN "description" TEXT,
    ADD COLUMN "releaseDate" TIMESTAMP(3),
    ADD COLUMN "developer" VARCHAR(160),
    ADD COLUMN "publisher" VARCHAR(160),
    ADD COLUMN "platforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "rating" DOUBLE PRECISION,
    ADD COLUMN "category" VARCHAR(80);

CREATE UNIQUE INDEX "Game_userId_igdbId_key" ON "Game"("userId", "igdbId");

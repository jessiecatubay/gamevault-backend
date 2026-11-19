-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('BACKLOG', 'PLAYING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'BACKLOG',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_favorite_idx" ON "Game"("favorite");

-- CreateIndex
CREATE INDEX "Game_title_idx" ON "Game"("title");

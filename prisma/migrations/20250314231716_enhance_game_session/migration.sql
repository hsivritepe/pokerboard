/*
  Warnings:

  - You are about to drop the `_participants` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PlayerSessionStatus" AS ENUM ('ACTIVE', 'CASHED_OUT', 'BUSTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'REBUY';
ALTER TYPE "TransactionType" ADD VALUE 'ADD_CHIPS';
ALTER TYPE "TransactionType" ADD VALUE 'REMOVE_CHIPS';

-- DropForeignKey
ALTER TABLE "_participants" DROP CONSTRAINT "_participants_A_fkey";

-- DropForeignKey
ALTER TABLE "_participants" DROP CONSTRAINT "_participants_B_fkey";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "note" TEXT,
ADD COLUMN     "playerSessionId" TEXT;

-- DropTable
DROP TABLE "_participants";

-- CreateTable
CREATE TABLE "PlayerSession" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "initialBuyIn" DOUBLE PRECISION NOT NULL,
    "currentStack" DOUBLE PRECISION NOT NULL,
    "status" "PlayerSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "PlayerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerSession_userId_idx" ON "PlayerSession"("userId");

-- CreateIndex
CREATE INDEX "PlayerSession_sessionId_idx" ON "PlayerSession"("sessionId");

-- CreateIndex
CREATE INDEX "Transaction_playerSessionId_idx" ON "Transaction"("playerSessionId");

-- AddForeignKey
ALTER TABLE "PlayerSession" ADD CONSTRAINT "PlayerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSession" ADD CONSTRAINT "PlayerSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_playerSessionId_fkey" FOREIGN KEY ("playerSessionId") REFERENCES "PlayerSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SessionSettlement" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "originalProfitLoss" DOUBLE PRECISION NOT NULL,
    "sessionCostShare" DOUBLE PRECISION NOT NULL,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionSettlement_sessionId_idx" ON "SessionSettlement"("sessionId");

-- CreateIndex
CREATE INDEX "SessionSettlement_playerId_idx" ON "SessionSettlement"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSettlement_sessionId_playerId_key" ON "SessionSettlement"("sessionId", "playerId");

-- AddForeignKey
ALTER TABLE "SessionSettlement" ADD CONSTRAINT "SessionSettlement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSettlement" ADD CONSTRAINT "SessionSettlement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

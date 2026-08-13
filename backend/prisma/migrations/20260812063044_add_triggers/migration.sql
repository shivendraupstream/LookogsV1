-- CreateTable
CREATE TABLE "triggers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "thresholdCount" INTEGER NOT NULL,
    "windowMinutes" INTEGER NOT NULL DEFAULT 5,
    "webhookUrl" TEXT NOT NULL,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 15,
    "lastNotifiedAt" TIMESTAMP(3),
    "appId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

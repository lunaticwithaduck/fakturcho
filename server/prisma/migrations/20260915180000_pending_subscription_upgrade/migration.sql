-- AlterTable
ALTER TABLE "subscription" ADD COLUMN "pendingPlanId" TEXT,
ADD COLUMN "pendingRevolutSubscriptionId" TEXT,
ADD COLUMN "pendingRevolutSetupOrderId" TEXT,
ADD COLUMN "pendingCheckoutUrl" TEXT,
ADD COLUMN "pendingCheckoutStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_pendingRevolutSubscriptionId_key" ON "subscription"("pendingRevolutSubscriptionId");

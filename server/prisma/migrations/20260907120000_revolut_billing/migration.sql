-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "revolutSubscriptionId" TEXT,
    "revolutCustomerId" TEXT,
    "planId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_accountId_key" ON "subscription"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_revolutSubscriptionId_key" ON "subscription"("revolutSubscriptionId");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "credit_ledger_entry" RENAME COLUMN "wiseTransactionId" TO "revolutOrderId";

-- RenameIndex
ALTER INDEX "credit_ledger_entry_wiseTransactionId_key" RENAME TO "credit_ledger_entry_revolutOrderId_key";

-- DropTable
DROP TABLE "wise_pending_purchase";

-- DropEnum
DROP TYPE "WisePendingPurchaseStatus";

-- CreateEnum
CREATE TYPE "WisePendingPurchaseStatus" AS ENUM ('PENDING', 'FULFILLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "credit_ledger_entry" ADD COLUMN     "wiseTransactionId" TEXT;

-- CreateTable
CREATE TABLE "wise_pending_purchase" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "creditCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "WisePendingPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),

    CONSTRAINT "wise_pending_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wise_pending_purchase_reference_key" ON "wise_pending_purchase"("reference");

-- CreateIndex
CREATE INDEX "wise_pending_purchase_accountId_createdAt_idx" ON "wise_pending_purchase"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledger_entry_wiseTransactionId_key" ON "credit_ledger_entry"("wiseTransactionId");

-- AddForeignKey
ALTER TABLE "wise_pending_purchase" ADD CONSTRAINT "wise_pending_purchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;


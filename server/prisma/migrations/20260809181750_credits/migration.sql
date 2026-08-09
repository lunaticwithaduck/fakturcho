-- CreateEnum
CREATE TYPE "CreditLedgerReason" AS ENUM ('SIGNUP_GRANT', 'PURCHASE', 'ISSUANCE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "creditBalanceCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "credit_ledger_entry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" "CreditLedgerReason" NOT NULL,
    "documentId" TEXT,
    "paddleTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledger_entry_documentId_key" ON "credit_ledger_entry"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledger_entry_paddleTransactionId_key" ON "credit_ledger_entry"("paddleTransactionId");

-- CreateIndex
CREATE INDEX "credit_ledger_entry_accountId_createdAt_idx" ON "credit_ledger_entry"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "credit_ledger_entry" ADD CONSTRAINT "credit_ledger_entry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entry" ADD CONSTRAINT "credit_ledger_entry_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SPEC §11: the balance can never go below zero, enforced at the database
ALTER TABLE "account" ADD CONSTRAINT "account_credit_balance_non_negative"
  CHECK ("creditBalanceCents" >= 0);

-- SPEC §11: existing accounts predate the signup grant; grant it retroactively
INSERT INTO "credit_ledger_entry" ("id", "accountId", "amountCents", "reason")
SELECT 'clg_signup_' || "id", "id", 100, 'SIGNUP_GRANT' FROM "account";

UPDATE "account" SET "creditBalanceCents" = "creditBalanceCents" + 100;

-- RenameColumn
ALTER TABLE "subscription" RENAME COLUMN "paddleSubscriptionId" TO "revolutSubscriptionId";
ALTER TABLE "subscription" RENAME COLUMN "paddleCustomerId" TO "revolutCustomerId";
ALTER TABLE "credit_ledger_entry" RENAME COLUMN "paddleTransactionId" TO "revolutOrderId";

-- RenameIndex
ALTER INDEX "subscription_paddleSubscriptionId_key" RENAME TO "subscription_revolutSubscriptionId_key";
ALTER INDEX "credit_ledger_entry_paddleTransactionId_key" RENAME TO "credit_ledger_entry_revolutOrderId_key";

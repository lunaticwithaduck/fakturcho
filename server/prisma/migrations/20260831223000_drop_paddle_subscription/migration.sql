-- DropForeignKey
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_accountId_fkey";

-- DropIndex
DROP INDEX "credit_ledger_entry_paddleTransactionId_key";

-- AlterTable
ALTER TABLE "credit_ledger_entry" DROP COLUMN "paddleTransactionId";

-- DropTable
DROP TABLE "subscription";

-- DropEnum
DROP TYPE "SubscriptionStatus";


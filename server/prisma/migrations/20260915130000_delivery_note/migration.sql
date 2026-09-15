-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'DELIVERY_NOTE';

-- AlterTable
ALTER TABLE "document" ADD COLUMN "transportReason" TEXT,
ADD COLUMN "transportedAt" TIMESTAMP(3),
ADD COLUMN "carrierName" TEXT,
ADD COLUMN "transportNote" TEXT;

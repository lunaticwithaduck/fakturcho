-- AlterTable
ALTER TABLE "document" ADD COLUMN     "issuerCountyRegion" TEXT,
ADD COLUMN     "recipientCountyRegion" TEXT,
ADD COLUMN     "recipientPec" TEXT,
ADD COLUMN     "recipientSdiRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "countyRegion" TEXT,
ADD COLUMN     "pec" TEXT,
ADD COLUMN     "sdiRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "issuer_profile" ADD COLUMN     "countyRegion" TEXT;

-- AlterTable
ALTER TABLE "issuer_profile" ADD COLUMN     "defaultPaymentTermsDays" INTEGER;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "paymentTermsDays" INTEGER;

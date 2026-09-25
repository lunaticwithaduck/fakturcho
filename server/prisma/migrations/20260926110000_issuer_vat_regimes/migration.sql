-- AlterTable
ALTER TABLE "issuer_profile" ADD COLUMN     "vatOnCashBasis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatOnDebits" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "issuerVatOnCashBasis" BOOLEAN,
ADD COLUMN     "issuerVatOnDebits" BOOLEAN;


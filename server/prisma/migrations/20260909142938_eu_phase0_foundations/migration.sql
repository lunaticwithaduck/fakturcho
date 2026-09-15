-- CreateEnum
CREATE TYPE "VatCategory" AS ENUM ('S', 'Z', 'E', 'AE', 'K', 'G', 'O');

-- AlterTable
ALTER TABLE "catalogue_item" ADD COLUMN     "unitCode" TEXT;

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'BG',
ADD COLUMN     "documentLanguage" TEXT,
ADD COLUMN     "peppolEndpointId" TEXT,
ADD COLUMN     "peppolScheme" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "street" TEXT;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "buyerReference" TEXT,
ADD COLUMN     "deliveryDate" DATE,
ADD COLUMN     "documentLanguage" TEXT,
ADD COLUMN     "issuerCountry" TEXT,
ADD COLUMN     "issuerPostcode" TEXT,
ADD COLUMN     "issuerStreet" TEXT,
ADD COLUMN     "paymentMeansCode" TEXT,
ADD COLUMN     "paymentTermsNote" TEXT,
ADD COLUMN     "recipientCountry" TEXT,
ADD COLUMN     "recipientPostcode" TEXT,
ADD COLUMN     "recipientStreet" TEXT;

-- AlterTable
ALTER TABLE "issuer_profile" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'BG',
ADD COLUMN     "peppolEndpointId" TEXT,
ADD COLUMN     "peppolScheme" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "street" TEXT;

-- AlterTable
ALTER TABLE "line_item" ADD COLUMN     "unitCode" TEXT,
ADD COLUMN     "vatCategory" "VatCategory" NOT NULL DEFAULT 'S',
ADD COLUMN     "vatRateBp" INTEGER NOT NULL DEFAULT 2000;

-- Backfill: existing lines predate per-line VAT, so the S/2000 default above
-- is wrong for a line whose document never charged VAT. Align both columns
-- with the parent document's rate instead.
UPDATE "line_item" AS li
SET "vatRateBp" = d."vatRateBp",
    "vatCategory" = CASE WHEN d."vatRateBp" = 0 THEN 'O' ELSE 'S' END::"VatCategory"
FROM "document" AS d
WHERE li."documentId" = d."id";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'bg';

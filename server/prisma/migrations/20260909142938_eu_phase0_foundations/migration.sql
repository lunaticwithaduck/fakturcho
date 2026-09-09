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

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'bg';

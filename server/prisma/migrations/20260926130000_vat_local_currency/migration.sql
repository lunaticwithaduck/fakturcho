-- AlterTable
ALTER TABLE "document" ADD COLUMN     "exchangeRate" TEXT,
ADD COLUMN     "exchangeRateDate" DATE,
ADD COLUMN     "exchangeRateSource" TEXT,
ADD COLUMN     "exchangeRateTable" TEXT,
ADD COLUMN     "localCurrency" TEXT,
ADD COLUMN     "vatAmountLocal" INTEGER;


-- CreateEnum
CREATE TYPE "EinvoiceTransmissionStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'REJECTED');

-- CreateTable
CREATE TABLE "einvoice_transmission" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "EinvoiceTransmissionStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "receipt" TEXT,
    "errorText" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "einvoice_transmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "einvoice_transmission_documentId_key" ON "einvoice_transmission"("documentId");

-- CreateIndex
CREATE INDEX "einvoice_transmission_status_idx" ON "einvoice_transmission"("status");

-- AddForeignKey
ALTER TABLE "einvoice_transmission" ADD CONSTRAINT "einvoice_transmission_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

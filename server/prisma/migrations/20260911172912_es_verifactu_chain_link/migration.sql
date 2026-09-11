-- CreateTable
CREATE TABLE "es_verifactu_chain_link" (
    "id" TEXT NOT NULL,
    "issuerNif" TEXT NOT NULL,
    "numSerieFactura" TEXT NOT NULL,
    "fechaExpedicion" TEXT NOT NULL,
    "huella" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "es_verifactu_chain_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "es_verifactu_chain_link_issuerNif_key" ON "es_verifactu_chain_link"("issuerNif");

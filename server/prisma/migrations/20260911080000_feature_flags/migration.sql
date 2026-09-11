-- CreateTable
CREATE TABLE "feature_flag" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("key")
);

-- Seed
INSERT INTO "feature_flag" ("key", "enabled", "updatedAt") VALUES
    ('EN_LOCALE', false, CURRENT_TIMESTAMP),
    ('EINVOICE', false, CURRENT_TIMESTAMP),
    ('PEPPOL', false, CURRENT_TIMESTAMP);

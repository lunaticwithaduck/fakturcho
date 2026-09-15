ALTER TABLE "issuer_profile" ADD COLUMN "identifiers" JSONB;
ALTER TABLE "document" ADD COLUMN "issuerIdentifiers" JSONB;

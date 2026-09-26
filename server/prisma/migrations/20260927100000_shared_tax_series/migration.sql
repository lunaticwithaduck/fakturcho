-- AlterTable
ALTER TABLE "number_series" ADD COLUMN     "seriesKey" TEXT;

-- Art. 226(2)+219 EU VAT Directive: an invoice, credit_note and debit_note
-- draw one shared, uniquely-identifying series by default. RD 1619/2012 art.
-- 6.1.a and 15.5: Spain keeps credit and debit notes in their own series,
-- separate from invoices. Every other existing series (proforma, quote,
-- delivery_note) keeps its own counter unchanged.
UPDATE "number_series" SET "seriesKey" = 'proforma' WHERE "documentType" = 'PROFORMA';
UPDATE "number_series" SET "seriesKey" = 'quote' WHERE "documentType" = 'QUOTE';
UPDATE "number_series" SET "seriesKey" = 'delivery_note' WHERE "documentType" = 'DELIVERY_NOTE';

UPDATE "number_series" ns
SET "seriesKey" = 'es_correction'
FROM "issuer_profile" ip
WHERE ns."accountId" = ip."accountId"
  AND ip."country" = 'ES'
  AND ns."documentType" IN ('CREDIT_NOTE', 'DEBIT_NOTE');

UPDATE "number_series" ns
SET "seriesKey" = 'tax'
FROM "issuer_profile" ip
WHERE ns."accountId" = ip."accountId"
  AND ip."country" = 'ES'
  AND ns."documentType" = 'INVOICE';

UPDATE "number_series"
SET "seriesKey" = 'tax'
WHERE "documentType" IN ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE')
  AND "seriesKey" IS NULL;

-- Merge every (account, seriesKey) group down to one row so no future number
-- repeats one already issued: the surviving row keeps the highest
-- "nextNumber" and the combined "issuedCount" of everything it absorbs.
CREATE TEMPORARY TABLE "series_merge_plan" AS
SELECT
  "accountId",
  "seriesKey",
  MAX("nextNumber") AS "next_number",
  SUM("issuedCount") AS "issued_count",
  (ARRAY_AGG("id" ORDER BY "nextNumber" DESC, "id" ASC))[1] AS "survivor_id"
FROM "number_series"
WHERE "seriesKey" IN ('tax', 'es_correction')
GROUP BY "accountId", "seriesKey";

DELETE FROM "number_series" ns
USING "series_merge_plan" p
WHERE ns."accountId" = p."accountId"
  AND ns."seriesKey" = p."seriesKey"
  AND ns."id" <> p."survivor_id";

UPDATE "number_series" ns
SET "nextNumber" = p."next_number",
    "issuedCount" = p."issued_count"
FROM "series_merge_plan" p
WHERE ns."id" = p."survivor_id";

DROP TABLE "series_merge_plan";

-- CreateIndex
CREATE UNIQUE INDEX "number_series_accountId_seriesKey_key" ON "number_series"("accountId", "seriesKey");

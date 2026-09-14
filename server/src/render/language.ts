import { getCountryConfig, isDocumentLanguage } from '@fakturcho/shared-types';
import type { ClassicLanguage } from './templates/classic/labels';

export interface DocumentCountryStatus {
  status: string;
  number: bigint | number | null;
  issuerCountry: string | null;
}

// A draft has no issuer snapshot yet (SPEC §4: snapshots are taken at issuance), so
// document.issuerCountry is still null there and the account's own issuer profile is
// the only source of truth. An ISSUED document with a null issuerCountry predates the
// EU scope (issuerCountry was never backfilled by migration 20260909142938) and must
// never join back to the live profile — it resolves to BG, same as before that scope.
export function resolveDocumentIssuerCountry(
  document: DocumentCountryStatus,
  liveIssuerCountry: string | null,
): string {
  if (document.issuerCountry) return document.issuerCountry;
  const isDraft = document.status === 'DRAFT' || document.number === null;
  if (isDraft) return liveIssuerCountry ?? 'BG';
  return 'BG';
}

export function resolveDocumentLanguage(
  documentLanguage: string | null,
  issuerCountry: string | null,
): ClassicLanguage {
  if (isDocumentLanguage(documentLanguage)) return documentLanguage;
  return getCountryConfig(issuerCountry ?? 'BG').language;
}

export function resolveEffectiveDocumentLanguage(
  document: DocumentCountryStatus & { documentLanguage: string | null },
  liveIssuerCountry: string | null,
): ClassicLanguage {
  const issuerCountry = resolveDocumentIssuerCountry(document, liveIssuerCountry);
  return resolveDocumentLanguage(document.documentLanguage, issuerCountry);
}

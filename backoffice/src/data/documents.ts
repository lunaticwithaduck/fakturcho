import { DOCUMENT_STATUSES, DOCUMENT_TYPES, formatDocumentNumber } from '@fakturcho/shared-types';
import type { AccountDetail, AdminDocumentSummary, DocumentListFilters } from '../types/admin';
import { getAllAccounts } from './accounts';
import { buildCompanyName } from './companyNames';
import { daysAgoIso } from './referenceDate';
import type { Rng } from './seed';
import { createRng, pick, randomInt } from './seed';

const DOCUMENTS_SEED = 20260803171;
const DOCUMENT_COUNT = 200;

function buildDocument(index: number, rng: Rng, accounts: AccountDetail[]): AdminDocumentSummary {
  const account = pick(rng, accounts);
  const documentType = pick(rng, DOCUMENT_TYPES);
  const status = pick(rng, DOCUMENT_STATUSES);
  const amountCents = randomInt(rng, 5000, 500000);
  const issuedDaysAgo = randomInt(rng, 0, 365);

  return {
    id: `doc-${String(index + 1).padStart(4, '0')}`,
    accountId: account.id,
    accountName: account.companyName,
    documentType,
    status,
    number: formatDocumentNumber(index + 1),
    recipientCompanyName: buildCompanyName(rng),
    amount: amountCents,
    currency: 'EUR',
    issuedAt: status === 'draft' ? null : daysAgoIso(issuedDaysAgo),
  };
}

function buildDocuments(): AdminDocumentSummary[] {
  const rng = createRng(DOCUMENTS_SEED);
  const accounts = getAllAccounts();
  return Array.from({ length: DOCUMENT_COUNT }, (_, index) => buildDocument(index, rng, accounts));
}

const DOCUMENTS: AdminDocumentSummary[] = buildDocuments();

export function getAllDocuments(): AdminDocumentSummary[] {
  return DOCUMENTS;
}

function matchesSearch(document: AdminDocumentSummary, search: string): boolean {
  if (!search.trim()) return true;
  const needle = search.trim().toLowerCase();
  return (
    document.accountName.toLowerCase().includes(needle) ||
    document.recipientCompanyName.toLowerCase().includes(needle) ||
    document.number.includes(needle)
  );
}

export function listDocuments(filters: DocumentListFilters): AdminDocumentSummary[] {
  return DOCUMENTS.filter((document) => {
    if (filters.documentType !== 'all' && document.documentType !== filters.documentType)
      return false;
    if (filters.status !== 'all' && document.status !== filters.status) return false;
    return matchesSearch(document, filters.search);
  });
}

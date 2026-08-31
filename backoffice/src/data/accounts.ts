import type { AccountDetail, AccountListFilters, AccountSummary } from '../types/admin';
import {
  buildBic,
  buildCompanyName,
  buildEik,
  buildIban,
  buildPersonName,
  buildPhone,
  buildVatNumber,
  CITIES,
} from './companyNames';
import { daysAgoIso } from './referenceDate';
import type { Rng } from './seed';
import { chance, createRng, pick, randomInt } from './seed';

const ACCOUNTS_SEED = 20260803;
const ACCOUNT_COUNT = 30;

function buildAccount(index: number, rng: Rng): AccountDetail {
  const companyName = buildCompanyName(rng);
  const vatRegistered = chance(rng, 0.6);
  const eik = buildEik(rng);
  const id = `acc-${String(index + 1).padStart(3, '0')}`;

  return {
    id,
    companyName,
    eik,
    city: pick(rng, CITIES),
    vatRegistered,
    documentsIssued: randomInt(rng, 0, 45),
    createdAt: daysAgoIso(randomInt(rng, 30, 900)),
    addressLine: `ул. Примерна ${randomInt(rng, 1, 199)}`,
    vatNumber: vatRegistered ? buildVatNumber(eik) : null,
    mol: buildPersonName(rng),
    phone: buildPhone(rng),
    email: `office${index + 1}@${id}.bg`,
    iban: buildIban(rng),
    bic: buildBic(rng),
  };
}

function buildAccounts(): AccountDetail[] {
  const rng = createRng(ACCOUNTS_SEED);
  return Array.from({ length: ACCOUNT_COUNT }, (_, index) => buildAccount(index, rng));
}

const ACCOUNTS: AccountDetail[] = buildAccounts();

export function getAllAccounts(): AccountDetail[] {
  return ACCOUNTS;
}

function matchesSearch(account: AccountSummary, search: string): boolean {
  if (!search.trim()) return true;
  const needle = search.trim().toLowerCase();
  return (
    account.companyName.toLowerCase().includes(needle) || account.eik.toLowerCase().includes(needle)
  );
}

export function listAccounts(filters: AccountListFilters): AccountSummary[] {
  return ACCOUNTS.filter((account) => matchesSearch(account, filters.search));
}

export function getAccountById(id: string): AccountDetail | undefined {
  return ACCOUNTS.find((account) => account.id === id);
}

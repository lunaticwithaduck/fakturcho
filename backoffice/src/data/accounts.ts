import type { SubscriptionStatus } from '@fakturcho/shared-types';
import { SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
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
import { daysAgoIso, daysAheadIso } from './referenceDate';
import type { Rng } from './seed';
import { chance, createRng, pick, randomInt } from './seed';

const ACCOUNTS_SEED = 20260803;
const ACCOUNT_COUNT = 30;

const PLAN_NAMES = ['Старт', 'Бизнес', 'Про'] as const;
type PlanName = (typeof PLAN_NAMES)[number];

const PLAN_PRICE_CENTS: Record<PlanName, number> = {
  Старт: 990,
  Бизнес: 1990,
  Про: 3990,
};

function buildCurrentPeriodEnd(rng: Rng, status: SubscriptionStatus): string | null {
  if (status === 'canceled') return null;
  return daysAheadIso(randomInt(rng, 1, 30));
}

function buildAccount(index: number, rng: Rng): AccountDetail {
  const companyName = buildCompanyName(rng);
  const status = pick(rng, SUBSCRIPTION_STATUSES);
  const planName = pick(rng, PLAN_NAMES);
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
    subscriptionStatus: status,
    createdAt: daysAgoIso(randomInt(rng, 30, 900)),
    addressLine: `ул. Примерна ${randomInt(rng, 1, 199)}`,
    vatNumber: vatRegistered ? buildVatNumber(eik) : null,
    mol: buildPersonName(rng),
    phone: buildPhone(rng),
    email: `office${index + 1}@${id}.bg`,
    iban: buildIban(rng),
    bic: buildBic(rng),
    planName,
    mrrCents: status === 'active' ? PLAN_PRICE_CENTS[planName] : 0,
    currentPeriodEnd: buildCurrentPeriodEnd(rng, status),
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
  return ACCOUNTS.filter((account) => {
    if (filters.status !== 'all' && account.subscriptionStatus !== filters.status) return false;
    return matchesSearch(account, filters.search);
  });
}

export function getAccountById(id: string): AccountDetail | undefined {
  return ACCOUNTS.find((account) => account.id === id);
}

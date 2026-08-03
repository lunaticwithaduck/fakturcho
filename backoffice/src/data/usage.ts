import type { UsageMonthSummary } from '../types/admin';
import { monthKeyOf, monthsAgoDate } from './referenceDate';
import type { Rng } from './seed';
import { createRng, randomInt } from './seed';

const USAGE_SEED = 20260803911;
const USAGE_MONTHS_COUNT = 12;

function buildUsageMonth(monthsAgo: number, rng: Rng): UsageMonthSummary {
  return {
    month: monthKeyOf(monthsAgoDate(monthsAgo)),
    documentsIssued: randomInt(rng, 90, 260),
    activeAccounts: randomInt(rng, 14, 28),
    emailsSent: randomInt(rng, 60, 220),
  };
}

function buildUsageMonths(): UsageMonthSummary[] {
  const rng = createRng(USAGE_SEED);
  const monthsOldestFirst = Array.from({ length: USAGE_MONTHS_COUNT }, (_, index) => {
    const monthsAgo = USAGE_MONTHS_COUNT - 1 - index;
    return buildUsageMonth(monthsAgo, rng);
  });
  return monthsOldestFirst.reverse();
}

const USAGE_MONTHS: UsageMonthSummary[] = buildUsageMonths();

export function listUsageMonths(): UsageMonthSummary[] {
  return USAGE_MONTHS;
}

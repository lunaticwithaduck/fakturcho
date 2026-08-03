export function isDualDisplayActive(now: Date = new Date()): boolean {
  const configuredUntil = process.env.DUAL_DISPLAY_UNTIL;
  if (!configuredUntil) return false;
  const until = new Date(`${configuredUntil}T23:59:59.999Z`);
  if (Number.isNaN(until.getTime())) return false;
  return now.getTime() <= until.getTime();
}

function tzOffsetMinutes(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return (asUtc - instant.getTime()) / 60_000;
}

// Converts a wall-clock reading ("YYYY-MM-DDTHH:mm", no zone of its own) as seen
// on a clock in timeZone into the UTC instant it refers to. Two passes converge
// across a DST transition; a reading that falls in a spring-forward gap or a
// autumn-overlap resolves to whichever side the converged offset lands on —
// deterministic, not ambiguous, for a given input.
export function zonedWallClockToUtc(wallClock: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wallClock);
  if (!match) throw new Error(`Invalid wall-clock value: ${wallClock}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);

  let instant = naiveUtc;
  for (let i = 0; i < 2; i++) {
    const offset = tzOffsetMinutes(timeZone, new Date(instant));
    instant = naiveUtc - offset * 60_000;
  }
  return new Date(instant);
}

export function parseTransportedAt(
  value: string | null | undefined,
  timeZone: string,
): Date | null {
  if (!value) return null;
  return zonedWallClockToUtc(value, timeZone);
}

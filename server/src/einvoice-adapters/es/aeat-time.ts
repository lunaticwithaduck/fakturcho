// Verifactu timestamps and dates are always expressed in the generating system's own
// timezone; a system operated for a Spanish taxpayer uses Europe/Madrid (CET/CEST).

export function ddmmyyyy(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}-${month}-${year}`;
}

export function madridTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
  const offset = get('timeZoneName').replace('GMT', '') || '+00:00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${offset}`;
}

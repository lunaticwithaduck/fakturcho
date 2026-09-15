import { afterEach, describe, expect, it } from 'vitest';
import { formatDateTimeForLocale } from './format';

describe('formatDateTimeForLocale', () => {
  it('renders the instant in the given timezone, not UTC', () => {
    expect(formatDateTimeForLocale('2026-09-15T07:30:00.000Z', 'it', 'Europe/Rome')).toBe(
      '15/09/2026, 09:30',
    );
    expect(formatDateTimeForLocale('2026-09-15T07:30:00.000Z', 'bg', 'Europe/Sofia')).toBe(
      '15.09.2026, 10:30',
    );
    expect(formatDateTimeForLocale('2026-09-15T07:30:00.000Z', 'en', 'Europe/Berlin')).toBe(
      '15/09/2026, 09:30',
    );
  });

  it('carries the date across midnight when the zoned time rolls to the next day', () => {
    expect(formatDateTimeForLocale('2026-09-15T23:30:00.000Z', 'ro', 'Europe/Bucharest')).toBe(
      '16.09.2026, 02:30',
    );
  });

  describe('is independent of the server process timezone', () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    });

    it('matches under TZ=UTC and TZ=America/New_York', () => {
      process.env.TZ = 'UTC';
      const underUtc = formatDateTimeForLocale('2026-09-15T07:30:00.000Z', 'it', 'Europe/Rome');

      process.env.TZ = 'America/New_York';
      const underNewYork = formatDateTimeForLocale('2026-09-15T07:30:00.000Z', 'it', 'Europe/Rome');

      expect(underUtc).toBe('15/09/2026, 09:30');
      expect(underNewYork).toBe('15/09/2026, 09:30');
    });
  });
});

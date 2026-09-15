import { afterEach, describe, expect, it } from 'vitest';
import { parseTransportedAt, zonedWallClockToUtc } from './timezone.util';

describe('zonedWallClockToUtc', () => {
  it('converts a plain wall-clock reading using the zone offset', () => {
    expect(zonedWallClockToUtc('2026-09-15T09:30', 'Europe/Rome').toISOString()).toBe(
      '2026-09-15T07:30:00.000Z',
    );
    expect(zonedWallClockToUtc('2026-09-15T09:30', 'Europe/Bucharest').toISOString()).toBe(
      '2026-09-15T06:30:00.000Z',
    );
  });

  const dstCases: Array<[string, string, string]> = [
    ['2026-03-29T01:30', 'Europe/Rome', '2026-03-29T00:30:00.000Z'],
    ['2026-03-29T09:30', 'Europe/Rome', '2026-03-29T07:30:00.000Z'],
    ['2026-10-25T01:30', 'Europe/Rome', '2026-10-24T23:30:00.000Z'],
    ['2026-10-25T09:30', 'Europe/Rome', '2026-10-25T08:30:00.000Z'],
    ['2026-03-29T01:30', 'Europe/Bucharest', '2026-03-28T23:30:00.000Z'],
    ['2026-03-29T09:30', 'Europe/Bucharest', '2026-03-29T06:30:00.000Z'],
    ['2026-10-25T01:30', 'Europe/Bucharest', '2026-10-24T22:30:00.000Z'],
    ['2026-10-25T09:30', 'Europe/Bucharest', '2026-10-25T07:30:00.000Z'],
  ];

  it.each(dstCases)(
    'resolves %s in %s to the correct UTC instant across the DST change',
    (wallClock, timeZone, expected) => {
      expect(zonedWallClockToUtc(wallClock, timeZone).toISOString()).toBe(expected);
    },
  );

  describe('is independent of the server process timezone', () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    });

    it.each(dstCases)(
      '%s in %s matches under TZ=UTC and TZ=America/New_York',
      (wallClock, timeZone, expected) => {
        process.env.TZ = 'UTC';
        const underUtc = zonedWallClockToUtc(wallClock, timeZone).toISOString();

        process.env.TZ = 'America/New_York';
        const underNewYork = zonedWallClockToUtc(wallClock, timeZone).toISOString();

        expect(underUtc).toBe(expected);
        expect(underNewYork).toBe(expected);
      },
    );
  });

  it('resolves a spring-forward gap reading deterministically', () => {
    // 02:00-03:00 never happens in Rome on 2026-03-29 — clocks jump straight
    // to 03:00 CEST. The same input must always resolve to the same instant.
    const first = zonedWallClockToUtc('2026-03-29T02:30', 'Europe/Rome').toISOString();
    const second = zonedWallClockToUtc('2026-03-29T02:30', 'Europe/Rome').toISOString();
    expect(first).toBe('2026-03-29T01:30:00.000Z');
    expect(second).toBe(first);
  });

  it('resolves a autumn-overlap reading deterministically', () => {
    // 02:00-03:00 happens twice in Rome on 2026-10-25 — once as CEST, once as
    // CET. The same input must always resolve to the same instant.
    const first = zonedWallClockToUtc('2026-10-25T02:30', 'Europe/Rome').toISOString();
    const second = zonedWallClockToUtc('2026-10-25T02:30', 'Europe/Rome').toISOString();
    expect(first).toBe('2026-10-25T01:30:00.000Z');
    expect(second).toBe(first);
  });

  it('throws on a malformed wall-clock string', () => {
    expect(() => zonedWallClockToUtc('2026-09-15T09:30:00.000Z', 'Europe/Rome')).toThrow();
  });
});

describe('parseTransportedAt', () => {
  it('returns null for null or undefined', () => {
    expect(parseTransportedAt(null, 'Europe/Rome')).toBeNull();
    expect(parseTransportedAt(undefined, 'Europe/Rome')).toBeNull();
  });

  it('converts a wall-clock reading the same way as zonedWallClockToUtc', () => {
    expect(parseTransportedAt('2026-09-15T09:30', 'Europe/Rome')?.toISOString()).toBe(
      '2026-09-15T07:30:00.000Z',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { isoInstantToZonedInputValue } from './timezone';

describe('isoInstantToZonedInputValue', () => {
  it('renders the instant as a datetime-local value in the given zone', () => {
    expect(isoInstantToZonedInputValue('2026-09-15T07:30:00.000Z', 'Europe/Rome')).toBe(
      '2026-09-15T09:30',
    );
    expect(isoInstantToZonedInputValue('2026-09-15T07:30:00.000Z', 'Europe/Sofia')).toBe(
      '2026-09-15T10:30',
    );
  });

  it('carries the date across midnight when the zoned time rolls to the next day', () => {
    expect(isoInstantToZonedInputValue('2026-09-15T23:30:00.000Z', 'Europe/Bucharest')).toBe(
      '2026-09-16T02:30',
    );
  });
});

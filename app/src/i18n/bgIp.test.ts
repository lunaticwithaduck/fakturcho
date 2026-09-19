import { describe, expect, it } from 'vitest';
import { clientIpFromHeaders, isBulgarianIp } from './bgIp';
import ranges from './bgIpRanges.json';

describe('isBulgarianIp', () => {
  it.each([
    '2.56.12.0',
    '2.56.12.1',
    '2.56.15.255',
    '::ffff:2.56.12.1',
    '2001:1ac8::1',
    '2001:1AC8:ffff:ffff:ffff:ffff:ffff:ffff',
    '2001:1ac8:0:0:0:0:0:1',
  ])('%s is Bulgarian', (ip) => {
    expect(isBulgarianIp(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '2.56.11.255',
    '2.56.16.0',
    '2001:4860:4860::8888',
    '2001:1ac7:ffff::1',
    '::1',
    '127.0.0.1',
  ])('%s is not Bulgarian', (ip) => {
    expect(isBulgarianIp(ip)).toBe(false);
  });

  it.each([null, undefined, '', 'unknown', '999.1.1.1', '1.2.3', '1:2:3', ':::', 'g::1'])(
    'rejects %s',
    (ip) => {
      expect(isBulgarianIp(ip)).toBe(false);
    },
  );
});

describe('bgIpRanges.json', () => {
  it.each([
    ['v4', ranges.v4],
    ['v6', ranges.v6],
  ])('%s is a sorted list of disjoint start/end pairs', (_label, flat) => {
    expect(flat.length).toBeGreaterThan(0);
    expect(flat.length % 2).toBe(0);
    for (let i = 0; i < flat.length; i += 2) {
      expect(flat[i]).toBeLessThanOrEqual(flat[i + 1] as number);
      if (i > 0) expect(flat[i]).toBeGreaterThan(flat[i - 1] as number);
    }
  });
});

describe('clientIpFromHeaders', () => {
  it('prefers x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '2.56.12.1', 'x-forwarded-for': '8.8.8.8' });
    expect(clientIpFromHeaders(headers)).toBe('2.56.12.1');
  });

  it('falls back to the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '2.56.12.1, 10.0.0.1' });
    expect(clientIpFromHeaders(headers)).toBe('2.56.12.1');
  });

  it('returns null without either header', () => {
    expect(clientIpFromHeaders(new Headers())).toBeNull();
  });
});

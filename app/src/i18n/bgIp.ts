import ranges from './bgIpRanges.json';

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV4_MAPPED_PREFIX = '::ffff:';
const IPV6_GROUPS = 8;
const IPV6_KEPT_GROUPS = 3;

function ipv4ToNumber(address: string): number | null {
  const match = IPV4_PATTERN.exec(address);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return null;
  return octets.reduce((acc, octet) => acc * 256 + octet, 0);
}

function ipv6ToTopBits(address: string): number | null {
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves[1] ? halves[1].split(':') : [];
  const missing = IPV6_GROUPS - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...new Array<string>(missing).fill('0'), ...tail];
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return null;
  return groups
    .slice(0, IPV6_KEPT_GROUPS)
    .reduce((acc, group) => acc * 65536 + Number.parseInt(group, 16), 0);
}

function inRanges(flatRanges: readonly number[], value: number): boolean {
  let low = 0;
  let high = flatRanges.length / 2 - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = flatRanges[mid * 2] ?? Number.POSITIVE_INFINITY;
    const end = flatRanges[mid * 2 + 1] ?? Number.NEGATIVE_INFINITY;
    if (value < start) high = mid - 1;
    else if (value > end) low = mid + 1;
    else return true;
  }
  return false;
}

export function isBulgarianIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const trimmed = ip.trim().toLowerCase();
  const address = trimmed.startsWith(IPV4_MAPPED_PREFIX)
    ? trimmed.slice(IPV4_MAPPED_PREFIX.length)
    : trimmed;
  const v4 = ipv4ToNumber(address);
  if (v4 !== null) return inRanges(ranges.v4, v4);
  const v6 = ipv6ToTopBits(address);
  return v6 !== null && inRanges(ranges.v6, v6);
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}

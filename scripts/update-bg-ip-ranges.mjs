#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-extended-latest';
const COUNTRY = 'BG';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../app/src/i18n/bgIpRanges.json');

const V6_KEPT_BITS = 48;

function ipv4ToNumber(address) {
  return address.split('.').reduce((acc, octet) => acc * 256 + Number(octet), 0);
}

function ipv6ToTopBits(address) {
  const [head, tail = ''] = address.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const zeros = new Array(8 - headGroups.length - tailGroups.length).fill('0');
  const groups = [...headGroups, ...zeros, ...tailGroups];
  return groups.slice(0, 3).reduce((acc, group) => acc * 65536 + Number.parseInt(group, 16), 0);
}

function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged.flat();
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`RIPE stats fetch failed: ${response.status}`);
const lines = (await response.text()).split('\n');

const snapshot = lines[0]?.split('|')[5] ?? '';
const v4 = [];
const v6 = [];

for (const line of lines) {
  const [, country, type, start, value, , status] = line.split('|');
  if (country !== COUNTRY || (status !== 'allocated' && status !== 'assigned')) continue;
  if (type === 'ipv4') {
    const first = ipv4ToNumber(start);
    v4.push([first, first + Number(value) - 1]);
  }
  if (type === 'ipv6') {
    const prefixLength = Number(value);
    if (prefixLength > V6_KEPT_BITS) throw new Error(`IPv6 prefix longer than /48: ${start}`);
    const first = ipv6ToTopBits(start);
    v6.push([first, first + 2 ** (V6_KEPT_BITS - prefixLength) - 1]);
  }
}

if (v4.length === 0 || v6.length === 0) throw new Error('No ranges parsed, refusing to write');

writeFileSync(
  OUT,
  `${JSON.stringify({ source: SOURCE, snapshot, v4: mergeRanges(v4), v6: mergeRanges(v6) })}\n`,
);
execFileSync('npx', ['biome', 'format', '--write', OUT], { stdio: 'inherit' });
console.log(`snapshot ${snapshot}: ${v4.length} IPv4 and ${v6.length} IPv6 delegations written`);

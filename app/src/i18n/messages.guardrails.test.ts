import enMessages from '@messages/en.json';
import { PUBLISHED_LOCALES } from '@shared/types';
import { describe, expect, it } from 'vitest';

// Every locale a translator adds runs through these unmodified — nothing
// here should ever need editing to onboard a new one.

const CYRILLIC = /[Ѐ-ӿ]/;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function topLevelBraces(text: string): string[] {
  const spans: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        spans.push(text.slice(start, i));
        start = -1;
      }
    }
  }
  return spans;
}

function caseKeys(rest: string): string[] {
  const keys: string[] = [];
  let i = 0;
  for (;;) {
    while (i < rest.length && /\s/.test(rest[i] ?? '')) i++;
    const keyStart = i;
    while (i < rest.length && rest[i] !== '{' && !/\s/.test(rest[i] ?? '')) i++;
    const key = rest.slice(keyStart, i);
    if (key) keys.push(key);
    while (i < rest.length && /\s/.test(rest[i] ?? '')) i++;
    if (rest[i] !== '{') break;
    let depth = 1;
    i++;
    while (i < rest.length && depth > 0) {
      if (rest[i] === '{') depth++;
      else if (rest[i] === '}') depth--;
      i++;
    }
  }
  return keys.sort();
}

// CLDR plural categories, in the one order every plural rule set draws from.
// A translator's plural branches may add categories en doesn't use (PL needs
// few/many, RO needs few) — that's a locale having more grammatical detail
// than English, not a shape mismatch. What must never happen is a locale
// missing a category en relies on, or missing the always-required "other".
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];

function isPluralCaseSet(keys: readonly string[]): boolean {
  return keys.length > 0 && keys.every((key) => PLURAL_CATEGORIES.includes(key));
}

// Case-set comparison for a plural argument: the locale's cases must be a
// valid CLDR superset of en's — every en case present, "other" always
// present, nothing outside the six CLDR categories.
function pluralCasesCoverEn(localeKeys: readonly string[], enKeys: readonly string[]): boolean {
  if (!isPluralCaseSet(localeKeys) || !isPluralCaseSet(enKeys)) return false;
  if (!localeKeys.includes('other')) return false;
  return enKeys.every((key) => localeKeys.includes(key));
}

function shapeOf(value: Json, enValue: Json): unknown {
  if (Array.isArray(value)) {
    const enArray = Array.isArray(enValue) ? enValue : [];
    return value.map((item, index) => shapeOf(item, enArray[index] ?? null));
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, Json>;
    const enRecord =
      enValue !== null && typeof enValue === 'object' && !Array.isArray(enValue)
        ? (enValue as Record<string, Json>)
        : {};
    const keys = Object.keys(record).sort();
    return Object.fromEntries(
      keys.map((key) => [key, shapeOf(record[key] ?? null, enRecord[key] ?? null)]),
    );
  }
  if (typeof value === 'string') {
    const enString = typeof enValue === 'string' ? enValue : '';
    return { icu: icuSignatureRelativeToEn(value, enString) };
  }
  return typeof value;
}

// argName -> plural case keys, read off en's own spans (translators never
// rename an interpolation argument, only reorder it in the sentence).
function enPluralCaseKeysByArg(enValue: string): Map<string, string[]> {
  const byArg = new Map<string, string[]>();
  for (const inner of topLevelBraces(enValue)) {
    const firstComma = inner.indexOf(',');
    if (firstComma === -1) continue;
    const argName = inner.slice(0, firstComma).trim();
    const rest = inner.slice(firstComma + 1);
    const secondComma = rest.indexOf(',');
    if (secondComma === -1) continue;
    const argType = rest.slice(0, secondComma).trim();
    if (argType !== 'plural') continue;
    byArg.set(argName, caseKeys(rest.slice(secondComma + 1)));
  }
  return byArg;
}

// A per-string signature of its ICU structure: argument names, their type
// (plural/select/...) and, for plural/select, the set of case keys. Case
// bodies are deliberately not compared — their words are what translators
// change. A plural argument's case-key list is normalized to "matches en"
// once it's a valid superset, so a richer plural (PL, RO, ...) compares
// equal to en's simpler one instead of failing shape parity.
function icuSignatureRelativeToEn(value: string, enValue: string): string {
  const enPluralKeys = enPluralCaseKeysByArg(enValue);
  return topLevelBraces(value)
    .map((inner) => {
      const firstComma = inner.indexOf(',');
      if (firstComma === -1) return inner.trim();
      const argName = inner.slice(0, firstComma).trim();
      const rest = inner.slice(firstComma + 1);
      const secondComma = rest.indexOf(',');
      if (secondComma === -1) return `${argName}:${rest.trim()}`;
      const argType = rest.slice(0, secondComma).trim();
      const keys = caseKeys(rest.slice(secondComma + 1));
      if (argType === 'plural') {
        const enKeys = enPluralKeys.get(argName) ?? [];
        if (pluralCasesCoverEn(keys, enKeys)) {
          return `${argName}:${argType}:${[...enKeys].sort().join('|')}`;
        }
      }
      return `${argName}:${argType}:${keys.join('|')}`;
    })
    .sort()
    .join(',');
}

function collectStrings(value: Json, path: string, out: Array<[string, string]>): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectStrings(item, `${path}[${index}]`, out);
    });
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectStrings(child, path ? `${path}.${key}` : key, out);
    }
    return;
  }
  if (typeof value === 'string') out.push([path, value]);
}

const NON_BG_PUBLISHED_LOCALES = PUBLISHED_LOCALES.filter((locale) => locale !== 'bg');

describe.each(NON_BG_PUBLISHED_LOCALES)('messages/%s.json — shape vs en.json', (locale) => {
  it('has the exact same key tree, array shape and ICU placeholder structure as en', async () => {
    const messages = (await import(`../../messages/${locale}.json`)).default as Json;
    expect(shapeOf(messages, enMessages as Json)).toEqual(
      shapeOf(enMessages as Json, enMessages as Json),
    );
  });
});

describe.each(PUBLISHED_LOCALES)('messages/%s.json — content sanity', (locale) => {
  it('has no empty strings', async () => {
    const messages = (await import(`../../messages/${locale}.json`)).default as Json;
    const strings: Array<[string, string]> = [];
    collectStrings(messages, '', strings);
    const empty = strings.filter(([, value]) => value.trim() === '');
    expect(empty.map(([path]) => path)).toEqual([]);
  });
});

describe.each(NON_BG_PUBLISHED_LOCALES)('messages/%s.json — no Cyrillic outside bg', (locale) => {
  it('carries zero Cyrillic characters', async () => {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    const text = JSON.stringify(messages);
    const match = text.match(CYRILLIC);
    expect(match, `messages/${locale}.json contains Cyrillic: ${match?.[0]}`).toBeNull();
  });
});

export type BgGender = 'masculine' | 'feminine' | 'neuter';

const ONES: Record<BgGender, readonly string[]> = {
  masculine: ['', 'ЕДИН', 'ДВА', 'ТРИ', 'ЧЕТИРИ', 'ПЕТ', 'ШЕСТ', 'СЕДЕМ', 'ОСЕМ', 'ДЕВЕТ'],
  feminine: ['', 'ЕДНА', 'ДВЕ', 'ТРИ', 'ЧЕТИРИ', 'ПЕТ', 'ШЕСТ', 'СЕДЕМ', 'ОСЕМ', 'ДЕВЕТ'],
  neuter: ['', 'ЕДНО', 'ДВЕ', 'ТРИ', 'ЧЕТИРИ', 'ПЕТ', 'ШЕСТ', 'СЕДЕМ', 'ОСЕМ', 'ДЕВЕТ'],
};

const TEENS = [
  'ДЕСЕТ',
  'ЕДИНАДЕСЕТ',
  'ДВАНАДЕСЕТ',
  'ТРИНАДЕСЕТ',
  'ЧЕТИРИНАДЕСЕТ',
  'ПЕТНАДЕСЕТ',
  'ШЕСТНАДЕСЕТ',
  'СЕДЕМНАДЕСЕТ',
  'ОСЕМНАДЕСЕТ',
  'ДЕВЕТНАДЕСЕТ',
] as const;

const TENS = [
  '',
  '',
  'ДВАДЕСЕТ',
  'ТРИДЕСЕТ',
  'ЧЕТИРИДЕСЕТ',
  'ПЕТДЕСЕТ',
  'ШЕСТДЕСЕТ',
  'СЕДЕМДЕСЕТ',
  'ОСЕМДЕСЕТ',
  'ДЕВЕТДЕСЕТ',
] as const;

const HUNDREDS = [
  '',
  'СТО',
  'ДВЕСТА',
  'ТРИСТА',
  'ЧЕТИРИСТОТИН',
  'ПЕТСТОТИН',
  'ШЕСТСТОТИН',
  'СЕДЕМСТОТИН',
  'ОСЕМСТОТИН',
  'ДЕВЕТСТОТИН',
] as const;

interface ScaleWord {
  gender: BgGender;
  singular: string;
  countPlural: string;
  bareOne: boolean;
}

const SCALE_WORDS: readonly ScaleWord[] = [
  { gender: 'feminine', singular: 'ХИЛЯДА', countPlural: 'ХИЛЯДИ', bareOne: true },
  { gender: 'masculine', singular: 'МИЛИОН', countPlural: 'МИЛИОНА', bareOne: false },
  { gender: 'masculine', singular: 'МИЛИАРД', countPlural: 'МИЛИАРДА', bareOne: false },
];

function chunkTokens(value: number, gender: BgGender): string[] {
  const hundredsDigit = Math.floor(value / 100);
  const remainder = value % 100;
  const tokens: string[] = [];
  const hundredsWord = HUNDREDS[hundredsDigit];
  if (hundredsDigit > 0 && hundredsWord) tokens.push(hundredsWord);
  if (remainder >= 10 && remainder <= 19) {
    const teenWord = TEENS[remainder - 10];
    if (teenWord) tokens.push(teenWord);
    return tokens;
  }
  const tensDigit = Math.floor(remainder / 10);
  const onesDigit = remainder % 10;
  const tensWord = TENS[tensDigit];
  if (tensDigit > 0 && tensWord) tokens.push(tensWord);
  if (onesDigit > 0) tokens.push(ONES[gender][onesDigit] ?? '');
  return tokens;
}

function joinWithAnd(tokens: readonly string[]): string {
  if (tokens.length === 0) return '';
  if (tokens.length === 1) return tokens[0] ?? '';
  const head = tokens.slice(0, -1).join(' ');
  const tail = tokens[tokens.length - 1] ?? '';
  return `${head} И ${tail}`;
}

function chunkToWords(value: number, gender: BgGender): string {
  return joinWithAnd(chunkTokens(value, gender));
}

function scalePhrase(chunk: number, scale: ScaleWord): string | null {
  if (chunk === 0) return null;
  if (chunk === 1 && scale.bareOne) return scale.singular;
  const endsInOneNotEleven = chunk % 10 === 1 && chunk % 100 !== 11;
  const noun = endsInOneNotEleven ? scale.singular : scale.countPlural;
  return `${chunkToWords(chunk, scale.gender)} ${noun}`;
}

function splitIntoGroups(value: number): number[] {
  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }
  return groups;
}

export function integerToBgWords(value: number, unitsGender: BgGender = 'masculine'): string {
  const rounded = Math.floor(Math.abs(value));
  if (rounded === 0) return 'НУЛА';
  const groups = splitIntoGroups(rounded);
  const tokens: string[] = [];
  for (let scaleIndex = SCALE_WORDS.length; scaleIndex >= 1; scaleIndex--) {
    const chunk = groups[scaleIndex];
    const scale = SCALE_WORDS[scaleIndex - 1];
    if (chunk !== undefined && scale) {
      const phrase = scalePhrase(chunk, scale);
      if (phrase) tokens.push(phrase);
    }
  }
  tokens.push(...chunkTokens(groups[0] ?? 0, unitsGender));
  return joinWithAnd(tokens);
}

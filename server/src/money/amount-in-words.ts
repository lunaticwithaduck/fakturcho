import type { Cents } from '@fakturcho/shared-types';
import { integerToBgWords } from './bg-numerals';

export function amountInWords(cents: Cents): string {
  const negative = cents < 0;
  const absoluteCents = Math.round(Math.abs(cents));
  const eurWhole = Math.floor(absoluteCents / 100);
  const centsRemainder = absoluteCents % 100;
  const eurWords = integerToBgWords(eurWhole, 'neuter');
  const centsText = String(centsRemainder).padStart(2, '0');
  const sign = negative ? 'МИНУС ' : '';
  return `${sign}${eurWords} EUR И ${centsText} ЦЕНТА`;
}

import type { Document, LineItem } from '@prisma/client';
import type { ClassicLocaleContext } from '../locale';
import { atMentions } from './at';
import { deMentions } from './de';
import { frMentions } from './fr';
import { genericMentions } from './generic';
import { itMentions } from './it';
import { plMentions } from './pl';
import { roMentions } from './ro';

export interface MentionsInput {
  document: Document;
  lineItems: readonly LineItem[];
  locale: ClassicLocaleContext;
  // PL art. 108a ust. 1a: a credit_note/debit_note's MPP threshold check
  // compares the corrected (post-correction) gross total, which needs the
  // corrected invoice's own gross amount alongside this document's delta.
  originalDocumentAmount?: number | null;
}

export type MentionsBuilder = (input: MentionsInput) => string[];

const BY_COUNTRY: Record<string, MentionsBuilder> = {
  AT: atMentions,
  DE: deMentions,
  FR: frMentions,
  IT: itMentions,
  PL: plMentions,
  RO: roMentions,
};

export function buildStatutoryMentions(input: MentionsInput): string[] {
  const builder = BY_COUNTRY[input.locale.issuerCountry];
  return (builder ?? genericMentions)(input);
}

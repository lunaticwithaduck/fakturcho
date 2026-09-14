import type { Document, LineItem } from '@prisma/client';
import type { ClassicLocaleContext } from '../locale';
import { deMentions } from './de';
import { esMentions } from './es';
import { frMentions } from './fr';
import { itMentions } from './it';
import { plMentions } from './pl';
import { roMentions } from './ro';

export interface MentionsInput {
  document: Document;
  lineItems: readonly LineItem[];
  locale: ClassicLocaleContext;
}

export type MentionsBuilder = (input: MentionsInput) => string[];

const BY_COUNTRY: Record<string, MentionsBuilder> = {
  DE: deMentions,
  FR: frMentions,
  IT: itMentions,
  PL: plMentions,
  RO: roMentions,
  ES: esMentions,
};

export function buildStatutoryMentions(input: MentionsInput): string[] {
  const builder = BY_COUNTRY[input.locale.issuerCountry];
  return builder ? builder(input) : [];
}

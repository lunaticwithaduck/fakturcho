import type { MentionsBuilder } from './index';

export const genericMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const note = locale.labels.reverseChargeNote;
  if (
    lineItems.some((line) => line.vatCategory === 'AE') &&
    !(document.vatExemptionGround ?? '').includes(note)
  ) {
    mentions.push(note);
  }
  return mentions;
};

import type { MentionsBuilder } from './index';

// AE lines are only ever the cross-border EU B2B reverse charge (see
// server/src/vat-eu/reverse-charge.ts): the client is VAT-registered in
// another EU country, so art. 196 of the directive is the right citation.
// Art. 319 alin. (20) lit. m) of the Codul fiscal only requires the words
// "taxare inversă" to appear, not a specific article.
export const roMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const note = locale.labels.reverseChargeNote;
  const ground = document.vatExemptionGround ?? '';
  const notSubjectService = ground.includes('art. 278 alin. (2)');
  if (
    (lineItems.some((line) => line.vatCategory === 'AE') || notSubjectService) &&
    !ground.includes('Taxare inversă')
  ) {
    mentions.push(note);
  }
  return mentions;
};

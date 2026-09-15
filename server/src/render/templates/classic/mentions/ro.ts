import type { MentionsBuilder } from './index';

export const roMentions: MentionsBuilder = ({ lineItems }) => {
  const mentions: string[] = [];
  if (lineItems.some((line) => line.vatCategory === 'AE')) {
    mentions.push('Taxare inversă conform art. 307 alin. (2) din Codul fiscal');
  }
  return mentions;
};

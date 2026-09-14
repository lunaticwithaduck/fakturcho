import type { MentionsBuilder } from './index';

export const plMentions: MentionsBuilder = ({ lineItems }) => {
  const mentions: string[] = [];
  if (lineItems.some((line) => line.vatCategory === 'AE')) {
    mentions.push('odwrotne obciążenie');
  }
  if (lineItems.some((line) => line.vatCategory === 'K')) {
    mentions.push(
      'Wewnątrzwspólnotowa dostawa towarów – art. 42 ustawy o podatku od towarów i usług.',
    );
  }
  return mentions;
};

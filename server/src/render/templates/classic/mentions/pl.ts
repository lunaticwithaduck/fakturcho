import type { MentionsBuilder } from './index';

const NOT_SUBJECT_EU_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';
const INTRA_EU_SUPPLY_NOTE =
  'Wewnątrzwspólnotowa dostawa towarów – art. 42 ustawy o podatku od towarów i usług.';

export const plMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  const ground = document.vatExemptionGround ?? '';
  if (
    lineItems.some((line) => line.vatCategory === 'AE') ||
    ground === NOT_SUBJECT_EU_SERVICES_GROUND
  ) {
    mentions.push('odwrotne obciążenie');
  }
  if (lineItems.some((line) => line.vatCategory === 'K') && !ground.includes('art. 42')) {
    mentions.push(INTRA_EU_SUPPLY_NOTE);
  }
  return mentions;
};

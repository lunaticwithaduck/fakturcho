import { getLegalDoc } from './legalContent';

const doc = getLegalDoc('refunds', 'bg');

export const REFUND_INTRO = doc.intro;
export const REFUND_SECTIONS = doc.sections;

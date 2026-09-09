import { getLegalDoc } from './legalContent';

const doc = getLegalDoc('privacy', 'bg');

export const PRIVACY_INTRO = doc.intro;
export const PRIVACY_SECTIONS = doc.sections;

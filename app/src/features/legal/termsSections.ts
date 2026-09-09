import { getLegalDoc } from './legalContent';

const doc = getLegalDoc('terms', 'bg');

export const TERMS_INTRO = doc.intro;
export const TERMS_SECTIONS = doc.sections;

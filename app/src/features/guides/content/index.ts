import type { GuideContent } from '../types';
import atBg from './at-bg.json';
// AT is the first country published in every app language rather than just
// its own (see the m-at follow-up): at-de.json is listed first among these
// so it stays the canonical AT entry for guideForTargetCountry/
// guideForIssuerCountry, without disturbing any existing guide above.
import atDe from './at-de.json';
import atEn from './at-en.json';
import atFr from './at-fr.json';
import atIt from './at-it.json';
import atPl from './at-pl.json';
import atRo from './at-ro.json';
import guide0 from './bg.json';
import guide1 from './de.json';
import guide2 from './eu.json';
import guide3 from './fr.json';
import guide4 from './it.json';
import guide5 from './pl.json';
import guide6 from './ro.json';

export const GUIDE_MODULES: GuideContent[] = [
  guide0,
  guide1,
  guide2,
  guide3,
  guide4,
  guide5,
  guide6,
  atDe,
  atBg,
  atEn,
  atFr,
  atIt,
  atPl,
  atRo,
] as GuideContent[];

import type { ClassicLabels } from './index';

// AT overrides on top of labels/de.ts (see AT-SPEC.md §6): the administrative
// terms differ even though the document language is the same German.
export const atLabelOverrides: Partial<ClassicLabels> = {
  companyIdLabel: 'Firmenbuchnummer',
  vatNumberPrefix: 'UID-Nr.: ',
};

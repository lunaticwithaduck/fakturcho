import { CLASSIC_LABELS, type ClassicLabels, type ClassicLanguage } from './labels';

export interface ClassicLocaleContext {
  language: ClassicLanguage;
  labels: ClassicLabels;
  showMol: boolean;
  showSignatureRow: boolean;
  showDualDisplay: boolean;
  showOriginalStamp: boolean;
}

export function resolveClassicLocale(language: ClassicLanguage): ClassicLocaleContext {
  const isBg = language === 'bg';
  return {
    language,
    labels: CLASSIC_LABELS[language],
    showMol: isBg,
    showSignatureRow: isBg,
    showDualDisplay: isBg,
    showOriginalStamp: isBg,
  };
}

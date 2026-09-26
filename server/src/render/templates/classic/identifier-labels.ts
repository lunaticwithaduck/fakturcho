import { getCountryConfig } from '@fakturcho/shared-types';
import type { ClassicLabels, ClassicLanguage } from './labels';

// An issuer identifier field's label (CountryConfig.identifiers[].label) is
// written once, in the issuer country's own language — correct as long as the
// document language matches it, wrong once the document is issued in another
// of the app's 7 languages (e.g. a DE issuer's "Steuernummer"/"Registergericht"
// printed unchanged on an English document). These are the translated
// stand-ins, keyed by issuer country and identifier key; a language with no
// entry here falls back to the field's own native label. A specific local
// register/court name that has no exact equivalent elsewhere keeps the
// original term in brackets after a generic translated headword (matches the
// existing companyRegisterLabel pattern for CZ's free-text register field).
type LangMap = Partial<Record<ClassicLanguage, string>>;

const TAX_NUMBER: LangMap = {
  en: 'Tax number',
  de: 'Steuernummer',
  fr: 'Numéro fiscal',
  it: 'Numero fiscale',
  pl: 'Numer podatkowy',
  ro: 'Număr fiscal',
  bg: 'Данъчен номер',
};
const REGISTERED_SEAT: LangMap = {
  en: 'Registered seat',
  de: 'Sitz',
  fr: 'Siège social',
  it: 'Sede legale',
  pl: 'Siedziba',
  ro: 'Sediul social',
  bg: 'Седалище',
};
const MANAGING_DIRECTOR: LangMap = {
  en: 'Managing director',
  de: 'Geschäftsführer',
  fr: 'Gérant',
  it: 'Amministratore',
  pl: 'Prezes zarządu',
  ro: 'Administrator',
  bg: 'Управител',
};
const LEGAL_FORM: LangMap = {
  en: 'Legal form',
  de: 'Rechtsform',
  fr: 'Forme juridique',
  it: 'Forma giuridica',
  pl: 'Forma prawna',
  ro: 'Formă juridică',
  bg: 'Правна форма',
};
const SHARE_CAPITAL: LangMap = {
  en: 'Share capital',
  de: 'Stammkapital',
  fr: 'Capital social',
  it: 'Capitale sociale',
  pl: 'Kapitał zakładowy',
  ro: 'Capital social',
  bg: 'Капитал',
};

function registerCourtLabel(nativeTerm: string): LangMap {
  return {
    en: `Register court (${nativeTerm})`,
    de: `Registergericht (${nativeTerm})`,
    fr: `Tribunal du registre (${nativeTerm})`,
    it: `Tribunale del registro (${nativeTerm})`,
    pl: `Sąd rejestrowy (${nativeTerm})`,
    ro: `Instanța de înregistrare (${nativeTerm})`,
    bg: `Регистърен съд (${nativeTerm})`,
  };
}
function registerNumberLabel(nativeTerm: string): LangMap {
  return {
    en: `Register no. (${nativeTerm})`,
    de: `Registernummer (${nativeTerm})`,
    fr: `Numéro de registre (${nativeTerm})`,
    it: `Numero di registro (${nativeTerm})`,
    pl: `Numer rejestrowy (${nativeTerm})`,
    ro: `Număr de registru (${nativeTerm})`,
    bg: `Регистрационен номер (${nativeTerm})`,
  };
}
function tradeRegisterLabel(nativeTerm: string): LangMap {
  return {
    en: `Trade register (${nativeTerm})`,
    de: `Handelsregister (${nativeTerm})`,
    fr: `Registre du commerce (${nativeTerm})`,
    it: `Registro delle imprese (${nativeTerm})`,
    pl: `Rejestr handlowy (${nativeTerm})`,
    ro: `Registrul comerțului (${nativeTerm})`,
    bg: `Търговски регистър (${nativeTerm})`,
  };
}
function statisticalIdLabel(nativeTerm: string): LangMap {
  return {
    en: `Statistical no. (${nativeTerm})`,
    de: `Statistiknummer (${nativeTerm})`,
    fr: `Numéro statistique (${nativeTerm})`,
    it: `Numero statistico (${nativeTerm})`,
    pl: `Numer statystyczny (${nativeTerm})`,
    ro: `Număr statistic (${nativeTerm})`,
    bg: `Статистически номер (${nativeTerm})`,
  };
}

const IDENTIFIER_LABEL_OVERRIDES: Partial<Record<string, Record<string, LangMap>>> = {
  DE: {
    steuernummer: TAX_NUMBER,
    registergericht: registerCourtLabel('Registergericht'),
    sitz: REGISTERED_SEAT,
    geschaeftsfuehrer: MANAGING_DIRECTOR,
  },
  AT: {
    firmenbuchgericht: registerCourtLabel('Firmenbuchgericht'),
    sitz: REGISTERED_SEAT,
    rechtsform: LEGAL_FORM,
    steuernummer: TAX_NUMBER,
  },
  FR: {
    siret: registerNumberLabel('SIRET'),
    rcs: tradeRegisterLabel('RCS'),
    legalForm: LEGAL_FORM,
    shareCapital: SHARE_CAPITAL,
  },
  IT: {
    rea: registerNumberLabel('REA'),
    shareCapital: SHARE_CAPITAL,
  },
  PL: {
    krs: registerNumberLabel('KRS'),
    regon: statisticalIdLabel('REGON'),
    sadRejestrowy: registerCourtLabel('Sąd rejestrowy'),
    kapitalZakladowy: SHARE_CAPITAL,
  },
  RO: {
    regCom: tradeRegisterLabel('Nr. Reg. Com.'),
    capitalSocial: SHARE_CAPITAL,
  },
};

export function resolveIdentifierLabel(
  issuerCountry: string,
  key: string,
  language: ClassicLanguage,
  fallbackLabel: string,
  labels: ClassicLabels,
): string {
  // NOZ § 435 odst. 1 sets no language for this entry: the printed label
  // follows the document language, not the CZ profile form's own (Czech)
  // label. GENERIC_EU_CONFIG's own companyRegister field is a distinct,
  // free-standing English label an issuer types in themselves (not a fixed
  // per-country term to translate), so it is left as entered.
  if (issuerCountry === 'CZ' && key === 'companyRegister' && labels.companyRegisterLabel) {
    return labels.companyRegisterLabel;
  }
  // The field's own label is already written in the issuer country's own
  // language (CountryConfig.language) — only a document issued in a
  // different one of the app's 7 languages needs the translated stand-in.
  if (language === getCountryConfig(issuerCountry).language) return fallbackLabel;
  return IDENTIFIER_LABEL_OVERRIDES[issuerCountry]?.[key]?.[language] ?? fallbackLabel;
}

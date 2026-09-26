import { type DocumentType, isEuVatAreaCountry } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import {
  addressContainsCity,
  appendCountyRegionSuffix,
  cityWithCountyRegion,
  countryName,
  escapeHtml,
  identifierLine,
  keepAbbreviationsWithNextWord,
  line,
} from './html-utils';
import type { ClassicLabels, ClassicLanguage } from './labels';
import type { ClassicLocaleContext } from './locale';

// Mirrors formatIssuerAddress in footer-blocks.ts: a legacy client row stores the
// whole address in recipientAddress (with city, if any, folded into that text); a
// client with structured fields keeps recipientAddress as the line before the city
// and prints street, then postcode/city on the same line.
function formatRecipientAddress(document: Document): string {
  const country = document.recipientCountry;
  const city = cityWithCountyRegion(
    document.recipientCity,
    document.recipientCountyRegion,
    country,
  );
  const cityWithPostcode = [document.recipientPostcode, city].filter(Boolean).join(' ');
  const addressHasCity = addressContainsCity(document.recipientAddress, document.recipientCity);
  const address = document.recipientStreet
    ? [document.recipientStreet, cityWithPostcode].filter(Boolean).join(', ')
    : [document.recipientAddress, addressHasCity ? '' : cityWithPostcode]
        .filter(Boolean)
        .join(', ');
  return appendCountyRegionSuffix(
    address,
    document.recipientCity,
    document.recipientCountyRegion,
    country,
  );
}

// A foreign client's registration number must not borrow the issuer
// document's own scheme label (e.g. a Polish document printing "NIP:" next
// to a German client's Handelsregister number). A same-country client keeps
// today's per-document-language label unchanged. A few internationally
// recognisable schemes print as-is, like IBAN/BIC do; everyone else falls
// back to a generic, translated label.
const CLIENT_REGISTRATION_ID_OVERRIDES: Partial<Record<string, string>> = {
  US: 'EIN',
  CH: 'UID',
};
// Printed via line(), which unlike identifierLine() adds no separator of its
// own — the label must carry its own trailing ": ", same as vatNumberPrefix.
// Keyed by document language, not client country: a Swiss VAT number is a
// German "MWST-Nr." only on a German-language document — an English or
// French document must name it in that document's own language.
const CLIENT_VAT_ID_OVERRIDES: Partial<Record<string, Partial<Record<ClassicLanguage, string>>>> = {
  CH: {
    en: 'VAT no.: ',
    de: 'MWST-Nr.: ',
    fr: 'N° TVA : ',
    it: 'N. IVA: ',
    pl: 'Nr VAT: ',
    ro: 'Nr. TVA: ',
    bg: 'ДДС №: ',
  },
};

function resolveClientRegistrationIdLabel(
  clientCountry: string | null,
  issuerCountry: string,
  labels: ClassicLabels,
): string {
  if (!clientCountry || clientCountry === issuerCountry) return labels.companyIdLabel;
  return CLIENT_REGISTRATION_ID_OVERRIDES[clientCountry] ?? labels.foreignRegistrationIdFallback;
}

function resolveVatNumberLabel(
  document: Document,
  issuerCountry: string,
  language: ClassicLanguage,
  labels: ClassicLabels,
): string {
  const clientCountry = document.recipientCountry;
  // A same-country client keeps the ordinary domestic VAT label regardless of
  // whether the issuer's own country happens to be inside or outside the EU
  // VAT area — the branch below is only for a client foreign to the issuer.
  if (!clientCountry || clientCountry === issuerCountry) return labels.vatNumberPrefix;
  if (!isEuVatAreaCountry(clientCountry)) {
    return CLIENT_VAT_ID_OVERRIDES[clientCountry]?.[language] ?? labels.foreignTaxIdFallback;
  }
  // IT: art. 21 c.2 lett. f D.P.R. 633/1972 calls a foreign EU client's VAT
  // number this rather than "P. IVA", which denotes the Italian national scheme.
  return clientCountry !== 'IT' && labels.foreignVatNumberPrefix
    ? labels.foreignVatNumberPrefix
    : labels.vatNumberPrefix;
}

// Codul fiscal art. 316/317: the "RO" prefix denotes VAT registration, so a
// non-VAT-registered party's bare CUI must print without it. Mirrors
// stripUnregisteredRoCuiPrefix in footer-blocks.ts for the recipient side.
function stripUnregisteredRoCuiPrefix(
  eik: string | null,
  issuerCountry: string,
  vatRegistered: boolean,
): string | null {
  if (issuerCountry !== 'RO' || vatRegistered || !eik) return eik;
  const stripped = eik.replace(/^ro/i, '').trim();
  return stripped || eik;
}

function withForeignCountry(
  address: string,
  country: string | null,
  locale: ClassicLocaleContext,
): string {
  if (!address || !country || country === locale.issuerCountry) return address;
  const name = countryName(country, locale.language);
  if (address.toLowerCase().includes(name.toLowerCase())) return address;
  return `${address}, ${name}`;
}

export function buildRecipientBlock(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  const recipientAddress = withForeignCountry(
    formatRecipientAddress(document),
    document.recipientCountry,
    locale,
  );
  const vatNumberPrefix = resolveVatNumberLabel(
    document,
    locale.issuerCountry,
    locale.language,
    labels,
  );
  const rows = [
    document.recipientCompanyName
      ? `<div class="no-break">${escapeHtml(document.recipientCompanyName)}</div>`
      : '',
    recipientAddress
      ? `<div>${keepAbbreviationsWithNextWord(escapeHtml(recipientAddress), locale.language)}</div>`
      : '',
    identifierLine(
      resolveClientRegistrationIdLabel(document.recipientCountry, locale.issuerCountry, labels),
      stripUnregisteredRoCuiPrefix(
        document.recipientEik,
        locale.issuerCountry,
        Boolean(document.recipientVatNumber),
      ),
      locale.language,
    ),
    line(vatNumberPrefix, document.recipientVatNumber),
    locale.showMol ? line(labels.molPrefix, document.recipientMol) : '',
  ]
    .filter(Boolean)
    .join('');
  return `<div class="recipient"><div class="block-title">${labels.recipientTitle(documentType)}</div>${rows}</div>`;
}

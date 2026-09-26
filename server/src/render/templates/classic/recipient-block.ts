import type { DocumentType } from '@fakturcho/shared-types';
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
  const address = document.recipientStreet
    ? [document.recipientStreet, [document.recipientPostcode, city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ')
    : [
        document.recipientAddress,
        addressContainsCity(document.recipientAddress, document.recipientCity) ? '' : city,
      ]
        .filter(Boolean)
        .join(', ');
  return appendCountyRegionSuffix(
    address,
    document.recipientCity,
    document.recipientCountyRegion,
    country,
  );
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
  const isForeignEuVatNumber =
    Boolean(document.recipientCountry) && document.recipientCountry !== 'IT';
  const vatNumberPrefix =
    isForeignEuVatNumber && labels.foreignVatNumberPrefix
      ? labels.foreignVatNumberPrefix
      : labels.vatNumberPrefix;
  const rows = [
    document.recipientCompanyName
      ? `<div class="no-break">${escapeHtml(document.recipientCompanyName)}</div>`
      : '',
    recipientAddress
      ? `<div>${keepAbbreviationsWithNextWord(escapeHtml(recipientAddress), locale.language)}</div>`
      : '',
    identifierLine(
      labels.companyIdLabel,
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
